"""
rag.py — Core RAG module for FocusFolio.

Handles:
- PDF ingestion → ChromaDB vector store
- Context-restricted chat chain (LangChain + Gemma via Google AI Studio)
- Structured exam generation (MCQ)
- Structured flashcard generation
"""

import os
import json
import re
import logging
from pathlib import Path


from dotenv import load_dotenv

load_dotenv()

# ── LangChain imports ───────────────────────────────────────────────────────
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_google_genai import (
    ChatGoogleGenerativeAI,
    GoogleGenerativeAIEmbeddings,
)
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

logger = logging.getLogger(__name__)

CHROMA_PERSIST_DIR = str(Path(__file__).parent.parent / "chroma_db")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

EMBEDDING_MODEL = "models/gemini-embedding-2"
# Model name for Google AI Studio — user specified gemma-4-31b-it
# If that exact name is not yet available via the API, try: "gemma-2-9b-it" or "gemini-2.0-flash"
CHAT_MODEL = os.getenv("GOOGLE_CHAT_MODEL", "gemma-4-31b-it")

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


def _get_vectorstore() -> Chroma:
    return Chroma(
        collection_name="focusfolio_lessons",
        persist_directory=CHROMA_PERSIST_DIR,
        embedding_function=_get_embeddings(),
    )


# ── Ingestion ────────────────────────────────────────────────────────────────
def ingest_pdf(room_id: str, pdf_path: str) -> int:
    """
    Load a PDF from disk, split into chunks, embed, and store in ChromaDB.
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

    # Tag every chunk with the room_id so we can filter later
    for chunk in chunks:
        chunk.metadata["room_id"] = str(room_id)

    if not chunks:
        logger.warning(f"No chunks extracted for room {room_id}")
        return 0

    vectorstore = _get_vectorstore()
    vectorstore.add_documents(chunks)

    logger.info(f"Ingested {len(chunks)} chunks for room {room_id}")
    return len(chunks)


def delete_room_vectors(room_id: str) -> None:
    """Remove all ChromaDB documents tagged with the given room_id."""
    try:
        vectorstore = _get_vectorstore()
        results = vectorstore.get(where={"room_id": room_id})
        ids = results.get("ids", [])
        if ids:
            vectorstore.delete(ids=ids)
            logger.info(f"Deleted {len(ids)} vectors for room {room_id}")
    except Exception as e:
        logger.error(f"Failed to delete vectors for room {room_id}: {e}")


# ── Retriever ────────────────────────────────────────────────────────────────
def _get_retriever(room_id: str):
    vectorstore = _get_vectorstore()
    return vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={
            "k": 6,
            "filter": {"room_id": str(room_id)}, 
        },
    )


def _format_docs(docs) -> str:
    return "\n\n---\n\n".join(doc.page_content for doc in docs)


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
    """
    Run a RAG-grounded chat query for the given room.
    history: list of {{"role": "user"|"assistant", "content": str}}
    Returns the assistant's reply as a string.
    """
    retriever = _get_retriever(room_id)
    llm = _get_llm()

    # Retrieve relevant context
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
    """
    Generate 10 MCQ questions using all document chunks belonging to the room.
    """
    vectorstore = _get_vectorstore()
    llm = _get_llm()

    # FIX: Bypass broken similarity search; pull raw chunks assigned to this room
    db_results = vectorstore.get(where={"room_id": str(room_id)})
    page_contents = db_results.get("documents", [])
    
    if not page_contents:
        logger.error(f"Cannot generate exam: No content found in Chroma for room {room_id}")
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
    """
    Generate 15 flashcards using all document chunks belonging to the room.
    """
    vectorstore = _get_vectorstore()
    llm = _get_llm()

    # FIX: Pull chunks directly via metadata filter matching
    db_results = vectorstore.get(where={"room_id": str(room_id)})
    page_contents = db_results.get("documents", [])
    
    if not page_contents:
        logger.error(f"Cannot generate flashcards: No content found in Chroma for room {room_id}")
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