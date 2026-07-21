import os
import uuid
import tempfile
import logging
from pathlib import Path

from fastapi import FastAPI, Depends, Request, HTTPException, UploadFile, File, Form, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
from svix.webhooks import Webhook
from supabase import create_client, Client

from .database import engine, Base, get_db
from . import models

logger = logging.getLogger(__name__)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="FocusFolio Study Room API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Supabase Storage client ──────────────────────────────────────────────────
def get_supabase() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")
    return create_client(url, key)


STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "study_lessons")


# ── Auth helper ──────────────────────────────────────────────────────────────
def get_current_user_id(x_clerk_user_id: str = Header(None)) -> str:
    if not x_clerk_user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return x_clerk_user_id


def ensure_user_exists(user_id: str, db: Session):
    existing = db.query(models.User).filter(models.User.id == user_id).first()
    if not existing:
        new_user = models.User(id=user_id, email=f"{user_id}@placeholder.local")
        db.add(new_user)
        db.commit()


# ── Health ───────────────────────────────────────────────────────────────────
@app.get("/")
def read_root():
    return {"status": "FocusFolio backend is running!"}


@app.get("/test-db")
def test_db_connection(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1")).scalar()
        return {"status": "success", "message": "Connected to Supabase PostgreSQL!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")


# ── Clerk Webhook ─────────────────────────────────────────────────────────────
@app.post("/webhooks/clerk")
async def clerk_webhook(request: Request, db: Session = Depends(get_db)):
    headers = request.headers
    payload = await request.body()

    webhook_secret = os.getenv("CLERK_WEBHOOK_SECRET")
    if not webhook_secret:
        raise HTTPException(status_code=500, detail="Missing CLERK_WEBHOOK_SECRET")

    try:
        wh = Webhook(webhook_secret)
        event = wh.verify(payload, headers)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    event_type = event.get("type")
    data = event.get("data", {})

    if event_type == "user.created":
        user_id = data.get("id")
        email_addresses = data.get("email_addresses", [])
        email = email_addresses[0].get("email_address") if email_addresses else None

        if user_id and email:
            existing_user = db.query(models.User).filter(models.User.id == user_id).first()
            if not existing_user:
                new_user = models.User(id=user_id, email=email)
                db.add(new_user)
                db.commit()
                print(f"New user inserted: {email}")

    return {"status": "success"}


# ══════════════════════════════════════════════════════════════════════════════
# ROOMS
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/rooms")
def get_rooms(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    ensure_user_exists(user_id, db)
    rooms = (
        db.query(models.Room)
        .filter(models.Room.user_id == user_id)
        .order_by(models.Room.created_at.desc())
        .all()
    )
    return [
        {
            "id": str(room.id),
            "title": room.title,
            "pdf_url": room.pdf_url,
            "created_at": room.created_at.isoformat(),
        }
        for room in rooms
    ]


@app.post("/rooms", status_code=201)
async def create_room(
    title: str = Form(...),
    pdf_file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Create a new study room. Uploads the PDF to Supabase Storage and ingests into Pinecone."""
    if not pdf_file.filename or not pdf_file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    ensure_user_exists(user_id, db)

    file_ext = Path(pdf_file.filename).suffix.lower() or ".pdf"
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    storage_path = f"pdfs/{user_id}/{unique_filename}"

    file_bytes = await pdf_file.read()

    # Upload to Supabase Storage
    try:
        supabase = get_supabase()
        supabase.storage.from_(STORAGE_BUCKET).upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": "application/pdf"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload PDF: {str(e)}")

    supabase = get_supabase()
    pdf_public_url = supabase.storage.from_(STORAGE_BUCKET).get_public_url(storage_path)

    # Save room to DB
    new_room = models.Room(
        user_id=user_id,
        title=title.strip(),
        pdf_url=pdf_public_url,
    )
    db.add(new_room)
    db.commit()
    db.refresh(new_room)

    room_id_str = str(new_room.id)

    # Ingest PDF into Pinecone (write to temp file for PyPDFLoader)
    try:
        from . import rag
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name
        chunk_count = rag.ingest_pdf(room_id_str, tmp_path)
        logger.info(f"Ingested {chunk_count} chunks for room {room_id_str}")
    except Exception as e:
        logger.error(f"RAG ingestion failed for room {room_id_str}: {e}")
        # Don't block room creation if ingestion fails
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass

    return {
        "id": room_id_str,
        "title": new_room.title,
        "pdf_url": new_room.pdf_url,
        "created_at": new_room.created_at.isoformat(),
    }


@app.get("/rooms/{room_id}")
def get_room(
    room_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    room = db.query(models.Room).filter(
        models.Room.id == room_id,
        models.Room.user_id == user_id,
    ).first()

    if not room:
        raise HTTPException(status_code=404, detail="Room not found.")

    return {
        "id": str(room.id),
        "title": room.title,
        "pdf_url": room.pdf_url,
        "created_at": room.created_at.isoformat(),
    }


@app.delete("/rooms/{room_id}", status_code=204)
def delete_room(
    room_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Delete a room and cascade-delete all messages, exams, flashcards, and vectors."""
    room = db.query(models.Room).filter(
        models.Room.id == room_id,
        models.Room.user_id == user_id,
    ).first()

    if not room:
        raise HTTPException(status_code=404, detail="Room not found.")

    # Remove PDF from Supabase Storage — extract path from URL
    if room.pdf_url:
        try:
            supabase = get_supabase()
            marker = f"/object/public/{STORAGE_BUCKET}/"
            if marker in room.pdf_url:
                storage_path = room.pdf_url.split(marker, 1)[1]
                supabase.storage.from_(STORAGE_BUCKET).remove([storage_path])
        except Exception as e:
            logger.warning(f"Could not remove file from Supabase Storage: {e}")

    # Remove Pinecone vectors (deletes the entire namespace for this room)
    try:
        from . import rag
        rag.delete_room_vectors(room_id)
    except Exception as e:
        logger.warning(f"Could not delete Pinecone vectors for room {room_id}: {e}")

    # DB cascade handles ChatMessage, Exam, Flashcard via ondelete=CASCADE
    db.delete(room)
    db.commit()
    return None


# ══════════════════════════════════════════════════════════════════════════════
# CHAT
# ══════════════════════════════════════════════════════════════════════════════

class ChatRequest(BaseModel):
    question: str


@app.get("/rooms/{room_id}/messages")
def get_messages(
    room_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Return all chat messages for a room (must belong to the user)."""
    room = _get_room_or_404(room_id, user_id, db)
    messages = (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.room_id == room.id)
        .order_by(models.ChatMessage.created_at.asc())
        .all()
    )
    return [
        {
            "id": str(m.id),
            "role": m.role,
            "content": m.content,
            "created_at": m.created_at.isoformat(),
        }
        for m in messages
    ]


@app.post("/rooms/{room_id}/chat")
def chat_with_room(
    room_id: str,
    body: ChatRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Send a question, get a RAG-grounded answer, and persist both to DB."""
    room = _get_room_or_404(room_id, user_id, db)

    # Load existing history for context
    history_rows = (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.room_id == room.id)
        .order_by(models.ChatMessage.created_at.asc())
        .all()
    )
    history = [{"role": m.role, "content": m.content} for m in history_rows]

    # Run RAG chat
    try:
        from . import rag
        answer = rag.chat(room_id, body.question, history)
    except Exception as e:
        logger.error(f"RAG chat error for room {room_id}: {e}")
        raise HTTPException(status_code=500, detail=f"AI chat failed: {str(e)}")

    # Persist user message and AI response
    user_msg = models.ChatMessage(room_id=room.id, role="user", content=body.question)
    ai_msg = models.ChatMessage(room_id=room.id, role="assistant", content=answer)
    db.add(user_msg)
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)

    return {
        "answer": answer,
        "message_id": str(ai_msg.id),
    }


# ══════════════════════════════════════════════════════════════════════════════
# EXAM
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/rooms/{room_id}/exam")
def get_exam(
    room_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Return the latest exam for a room, or null if none exists."""
    room = _get_room_or_404(room_id, user_id, db)
    exam = (
        db.query(models.Exam)
        .filter(models.Exam.room_id == room.id)
        .order_by(models.Exam.created_at.desc())
        .first()
    )
    if not exam:
        return {"exam": None}
    return {
        "exam": {
            "id": str(exam.id),
            "questions": exam.questions,
            "created_at": exam.created_at.isoformat(),
        }
    }


@app.post("/rooms/{room_id}/exam/generate", status_code=201)
def generate_exam(
    room_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Generate a new exam (overwrites any existing one)."""
    room = _get_room_or_404(room_id, user_id, db)

    try:
        from . import rag
        questions = rag.generate_exam(room_id)
    except Exception as e:
        logger.error(f"Exam generation error for room {room_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Exam generation failed: {str(e)}")

    # Delete all previous exams for this room
    db.query(models.Exam).filter(models.Exam.room_id == room.id).delete()

    new_exam = models.Exam(room_id=room.id, questions=questions)
    db.add(new_exam)
    db.commit()
    db.refresh(new_exam)

    return {
        "id": str(new_exam.id),
        "questions": new_exam.questions,
        "created_at": new_exam.created_at.isoformat(),
    }


# ══════════════════════════════════════════════════════════════════════════════
# FLASHCARDS
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/rooms/{room_id}/flashcards")
def get_flashcards(
    room_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Return all flashcards for a room."""
    room = _get_room_or_404(room_id, user_id, db)
    cards = (
        db.query(models.Flashcard)
        .filter(models.Flashcard.room_id == room.id)
        .order_by(models.Flashcard.created_at.asc())
        .all()
    )
    return {
        "flashcards": [
            {
                "id": str(c.id),
                "front": c.front,
                "back": c.back,
                "created_at": c.created_at.isoformat(),
            }
            for c in cards
        ]
    }


@app.post("/rooms/{room_id}/flashcards/generate", status_code=201)
def generate_flashcards(
    room_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Generate flashcards for a room (one-time; does not replace existing)."""
    room = _get_room_or_404(room_id, user_id, db)

    # Check if flashcards already exist
    existing = db.query(models.Flashcard).filter(models.Flashcard.room_id == room.id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Flashcards already generated for this room.")

    try:
        from . import rag
        cards = rag.generate_flashcards(room_id)
    except Exception as e:
        logger.error(f"Flashcard generation error for room {room_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Flashcard generation failed: {str(e)}")

    new_cards = [
        models.Flashcard(room_id=room.id, front=c["front"], back=c["back"])
        for c in cards
    ]
    db.add_all(new_cards)
    db.commit()

    return {
        "flashcards": [
            {
                "id": str(c.id),
                "front": c.front,
                "back": c.back,
                "created_at": c.created_at.isoformat(),
            }
            for c in new_cards
        ]
    }


# ── Shared helper ─────────────────────────────────────────────────────────────
def _get_room_or_404(room_id: str, user_id: str, db: Session) -> models.Room:
    room = db.query(models.Room).filter(
        models.Room.id == room_id,
        models.Room.user_id == user_id,
    ).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found.")
    return room