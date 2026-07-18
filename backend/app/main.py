import os
import uuid
from pathlib import Path

from fastapi import FastAPI, Depends, Request, HTTPException, UploadFile, File, Form, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from svix.webhooks import Webhook
from supabase import create_client, Client

from .database import engine, Base, get_db
from . import models

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Study Room API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#  Supabase Storage client (singleton)
def get_supabase() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    if not url or not key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env"
        )
    return create_client(url, key)


STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "study_lessons")


def get_current_user_id(x_clerk_user_id: str = Header(None)) -> str:
    """
    The Next.js frontend sends the Clerk user ID in the
    X-Clerk-User-Id custom header with every authenticated request.
    """
    if not x_clerk_user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return x_clerk_user_id


#  Root / Health
@app.get("/")
def read_root():
    return {"status": "Backend is running!"}


# CLERK WEBHOOK ENDPOINT
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
                print(f"- New user inserted: {email}")
            else:
                print(f"User {email} already exists.")

    return {"status": "success"}


@app.get("/rooms")
def get_rooms(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Return all rooms belonging to the authenticated user."""
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
    """Create a new study room. Uploads the PDF to Supabase Storage."""
    # Validate PDF
    if not pdf_file.filename or not pdf_file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    # Auto-create user record if needed
    ensure_user_exists(user_id, db)

    # Build a unique storage path: pdfs/<user_id>/<uuid>.pdf
    file_ext = Path(pdf_file.filename).suffix.lower() or ".pdf"
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    storage_path = f"pdfs/{user_id}/{unique_filename}"

    # Read file bytes
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
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload PDF to Supabase Storage: {str(e)}",
        )

    # Build the public URL
    supabase = get_supabase()
    public_url_response = supabase.storage.from_(STORAGE_BUCKET).get_public_url(storage_path)
    pdf_public_url = public_url_response  # returns a string directly

    # Store room in database
    new_room = models.Room(
        user_id=user_id,
        title=title.strip(),
        pdf_url=pdf_public_url,
    )
    db.add(new_room)
    db.commit()
    db.refresh(new_room)

    return {
        "id": str(new_room.id),
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
    """Return a single room (must belong to the authenticated user)."""
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
    """Delete a room and remove its PDF from Supabase Storage."""
    room = db.query(models.Room).filter(
        models.Room.id == room_id,
        models.Room.user_id == user_id,
    ).first()

    if not room:
        raise HTTPException(status_code=404, detail="Room not found.")

    # Remove the file from Supabase Storage
    if room.pdf_url:
        try:
            supabase = get_supabase()
            # Extract the storage path from the public URL
            # Public URL format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
            marker = f"/object/public/{STORAGE_BUCKET}/"
            if marker in room.pdf_url:
                storage_path = room.pdf_url.split(marker, 1)[1]
                supabase.storage.from_(STORAGE_BUCKET).remove([storage_path])
        except Exception as e:
            
            print(f"Warning: could not remove file from storage: {e}")

    db.delete(room)
    db.commit()
    return None



def ensure_user_exists(user_id: str, db: Session):
    """
    Ensure a User row exists for this Clerk user_id.
    Fallback for when the Clerk webhook hasn't fired yet.
    """
    existing = db.query(models.User).filter(models.User.id == user_id).first()
    if not existing:
        new_user = models.User(id=user_id, email=f"{user_id}@placeholder.local")
        db.add(new_user)
        db.commit()


@app.get("/test-db")
def test_db_connection(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1")).scalar()
        return {"status": "success", "message": "Successfully connected to Supabase PostgreSQL!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")