

import os
import json
import re
import logging

from dotenv import load_dotenv

load_dotenv()

# ── LangChain imports ───────────────────────────────────────────────────────
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import (
    ChatGoogleGenerativeAI,
    GoogleGenerativeAIEmbeddings,
)
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_pinecone import PineconeVectorStore

# ── Pinecone imports ────────────────────────────────────────────────────────
from pinecone import Pinecone, ServerlessSpec

logger = logging.getLogger(__name__)

# ── Configuration ────────────────────────────────────────────────────────────
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")

EMBEDDING_MODEL = "models/gemini-embedding-2"
# gemini-embedding-2 outputs 3072-dimensional vectors
EMBEDDING_DIMENSION = 3072
PINECONE_INDEX_NAME = "focusfolio-lessons"

# Model name for Google AI Studio — user specified gemma-4-31b-it
# If that exact name is not yet available via the API, try: "gemma-2-9b-it" or "gemini-2.0-flash"
CHAT_MODEL = os.getenv("GOOGLE_CHAT_MODEL", "gemma-4-31b-it")


# ── Pinecone client & index ──────────────────────────────────────────────────
def _get_pinecone_client() -> Pinecone:
    """Return an authenticated Pinecone client."""
    if not PINECONE_API_KEY:
        raise ValueError("PINECONE_API_KEY environment variable is missing!")
    return Pinecone(api_key=PINECONE_API_KEY)


def _ensure_pinecone_index() -> None:
    """
    Create the Pinecone index if it does not already exist, then wait
    until the index is fully ready before returning.
    Uses cosine similarity with the dimension of gemini-embedding-2 (3072).
    This function is idempotent — safe to call on every startup.
    """
    import time
    pc = _get_pinecone_client()
    if not pc.has_index(PINECONE_INDEX_NAME):
        logger.info(f"Creating Pinecone index '{PINECONE_INDEX_NAME}'...")
        pc.create_index(
            name=PINECONE_INDEX_NAME,
            dimension=EMBEDDING_DIMENSION,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        )
        # Serverless indexes take a few seconds to initialize.
        # Poll until the index reports ready=True before returning.
        logger.info(f"Waiting for Pinecone index '{PINECONE_INDEX_NAME}' to be ready...")
        while not pc.describe_index(PINECONE_INDEX_NAME).status.get("ready", False):
            time.sleep(1)
        logger.info(f"Pinecone index '{PINECONE_INDEX_NAME}' is ready.")
    else:
        logger.debug(f"Pinecone index '{PINECONE_INDEX_NAME}' already exists and is ready.")


# ── Shared model helpers ─────────────────────────────────────────────────────
def _get_embeddings() -> GoogleGenerativeAIEmbeddings:
    return GoogleGenerativeAIEmbeddings(
        model=EMBEDDING_MODEL,
        google_api_key=GOOGLE_API_KEY,
    )


def _get_llm() -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(
        model=CHAT_MODEL,
        google_api_key=GOOGLE_API_KEY,
        temperature=0.3,
    )


def _get_vectorstore(namespace: str) -> PineconeVectorStore:
    """
    Return a PineconeVectorStore scoped to the given namespace (room_id).
    Each room is fully isolated within its own Pinecone namespace.
    """
    _ensure_pinecone_index()
    pc = _get_pinecone_client()
    index = pc.Index(PINECONE_INDEX_NAME)
    return PineconeVectorStore(
        index=index,
        embedding=_get_embeddings(),
        namespace=namespace,
    )


# ── Ingestion ────────────────────────────────────────────────────────────────
def ingest_pdf(room_id: str, pdf_path: str) -> int:
    """
    Load a PDF from disk, split into chunks, embed, and store in Pinecone.
    Each room uses its own Pinecone namespace (namespace = room_id).
    Returns the number of chunks stored.
    """
    loader = PyPDFLoader(pdf_path)
    pages = loader.load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=150,
        separators=["\n\n", "\n", ".", " ", ""],
    )
    chunks = splitter.split_documents(pages)

    # Tag every chunk with the room_id for reference (also isolated via namespace)
    for chunk in chunks:
        chunk.metadata["room_id"] = str(room_id)

    if not chunks:
        logger.warning(f"No chunks extracted for room {room_id}")
        return 0

    vectorstore = _get_vectorstore(namespace=str(room_id))
    vectorstore.add_documents(chunks)

    logger.info(f"Ingested {len(chunks)} chunks into Pinecone namespace '{room_id}'")
    return len(chunks)


def delete_room_vectors(room_id: str) -> None:
    try:
        _ensure_pinecone_index()
        pc = _get_pinecone_client()
        index = pc.Index(PINECONE_INDEX_NAME)
        # Delete all vectors in the namespace belonging to this room
        index.delete(delete_all=True, namespace=str(room_id))
        logger.info(f"Deleted all Pinecone vectors for namespace (room) '{room_id}'")
    except Exception as e:
        logger.error(f"Failed to delete Pinecone vectors for room {room_id}: {e}")


# ── Retriever ────────────────────────────────────────────────────────────────
def _get_retriever(room_id: str):
    
    vectorstore = _get_vectorstore(namespace=str(room_id))
    return vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 6},
    )


def _format_docs(docs) -> str:
    return "\n\n---\n\n".join(doc.page_content for doc in docs)


def _fetch_all_chunks_for_room(room_id: str, limit: int = 15) -> list[str]:
    try:
        _ensure_pinecone_index()
        pc = _get_pinecone_client()
        index = pc.Index(PINECONE_INDEX_NAME)

        # index.list() yields PAGES of IDs (each page is a list of str).
        # Flatten pages until we have enough IDs.
        id_list: list[str] = []
        for page in index.list(namespace=str(room_id)):
            if isinstance(page, list):
                # Each page is already a list of string IDs
                id_list.extend(page)
            elif isinstance(page, str):
                id_list.append(page)
            elif hasattr(page, "id"):
                id_list.append(page.id)
            if len(id_list) >= limit:
                break

        id_list = id_list[:limit]

        if not id_list:
            logger.warning(f"No vectors found in Pinecone namespace '{room_id}'")
            return []

        # Pinecone SDK v7: fetch() returns a FetchResponse object, NOT a dict.
        # Access vectors via attribute: fetch_response.vectors (dict[str, Vector])
        fetch_response = index.fetch(ids=id_list, namespace=str(room_id))
        vectors = fetch_response.vectors  # FetchResponse attribute, not .get()

        # Extract text — LangChain stores page_content under the "text" metadata key.
        # Vector.metadata is a plain dict, so .get() is valid there.
        chunks = []
        for vec_id, vec_data in vectors.items():
            metadata = vec_data.metadata or {}
            text = metadata.get("text", "")
            if text:
                chunks.append(text)

        logger.info(f"Fetched {len(chunks)} chunks from Pinecone namespace '{room_id}'")
        return chunks

    except Exception as e:
        logger.error(f"Failed to fetch chunks for room {room_id} from Pinecone: {e}")
        return []



# ── Chat ─────────────────────────────────────────────────────────────────────
CHAT_SYSTEM_PROMPT = """You are a focused study assistant. Your ONLY job is to answer questions about the lesson document provided below.

STRICT RULES:
1. Answer ONLY using information from the provided context.
2. If the question is unrelated to the document, respond with: "I can only answer questions about the lesson material."
3. Be concise, clear, and educational.
4. Do not make up information beyond what the context provides.

Context from lesson document:
{context}"""


def chat(room_id: str, question: str, history: list[dict]) -> str:
   
    retriever = _get_retriever(room_id)
    llm = _get_llm()

    # Retrieve relevant context from Pinecone
    docs = retriever.invoke(question)
    context = _format_docs(docs)

    # Build message history for the prompt
    messages = [("system", CHAT_SYSTEM_PROMPT)]

    for msg in history[-10:]:  # Last 10 messages for context window management
        role = "human" if msg["role"] == "user" else "ai"
        messages.append((role, msg["content"]))

    messages.append(("human", "{question}"))

    prompt = ChatPromptTemplate.from_messages(messages)
    chain = prompt | llm | StrOutputParser()

    response = chain.invoke({"context": context, "question": question})
    return response


# ── Exam Generation ──────────────────────────────────────────────────────────
EXAM_SYSTEM_PROMPT = """You are an expert educator creating a multiple-choice exam based on the provided lesson material.

Generate exactly 10 multiple-choice questions based on the content below.
Each question must have 4 options (A, B, C, D) and one correct answer.

IMPORTANT: Respond with ONLY a valid JSON array. No markdown, no explanation, just the JSON.
Format:
[
  {{
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option A"
  }}
]

Lesson content:
{context}"""


def generate_exam(room_id: str) -> list[dict]:
   
    llm = _get_llm()

    page_contents = _fetch_all_chunks_for_room(room_id, limit=15)

    if not page_contents:
        logger.error(f"Cannot generate exam: No content found in Pinecone for room {room_id}")
        return []

    # Join up to a safe threshold of text chunks to fit context limits
    context = "\n\n---\n\n".join(page_contents[:15])

    prompt = ChatPromptTemplate.from_messages([
        ("system", EXAM_SYSTEM_PROMPT),
        ("human", "Generate the exam questions now."),
    ])

    chain = prompt | llm | StrOutputParser()
    raw = chain.invoke({"context": context})

    cleaned = re.sub(r"```(?:json)?\s*|\s*```", "", raw).strip()
    questions = json.loads(cleaned)

    validated = []
    for q in questions:
        if all(k in q for k in ("question", "options", "answer")):
            validated.append({
                "question": q["question"],
                "options": q["options"],
                "answer": q["answer"],
            })

    return validated


# ── Flashcard Generation ─────────────────────────────────────────────────────
FLASHCARD_SYSTEM_PROMPT = """You are an expert educator creating study flashcards based on the provided lesson material.

Generate exactly 15 flashcards covering key concepts, definitions, and important facts from the content below.

IMPORTANT: Respond with ONLY a valid JSON array. No markdown, no explanation, just the JSON.
Format:
[
  {{
    "front": "Term or question on the front of the card",
    "back": "Definition or answer on the back of the card"
  }}
]

Lesson content:
{context}"""


def generate_flashcards(room_id: str) -> list[dict]:
    
    llm = _get_llm()

    page_contents = _fetch_all_chunks_for_room(room_id, limit=15)

    if not page_contents:
        logger.error(f"Cannot generate flashcards: No content found in Pinecone for room {room_id}")
        return []

    context = "\n\n---\n\n".join(page_contents[:15])

    prompt = ChatPromptTemplate.from_messages([
        ("system", FLASHCARD_SYSTEM_PROMPT),
        ("human", "Generate the flashcards now."),
    ])

    chain = prompt | llm | StrOutputParser()
    raw = chain.invoke({"context": context})

    cleaned = re.sub(r"```(?:json)?\s*|\s*```", "", raw).strip()
    cards = json.loads(cleaned)

    validated = []
    for card in cards:
        if "front" in card and "back" in card:
            validated.append({"front": card["front"], "back": card["back"]})

    return validated