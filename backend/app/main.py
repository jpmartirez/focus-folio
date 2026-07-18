from fastapi import FastAPI, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from svix.webhooks import Webhook
import os

from .database import engine, Base, get_db
from . import models

# Safely verify tables exist in Supabase
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Study Room API")

@app.get("/")
def read_root():
    return {"status": "Backend is running!"}

# --- CLERK WEBHOOK ENDPOINT ---
@app.post("/webhooks/clerk")
async def clerk_webhook(request: Request, db: Session = Depends(get_db)):
    # 1. Get headers and raw body
    headers = request.headers
    payload = await request.body()
    
    # 2. Get the Secret from .env
    webhook_secret = os.getenv("CLERK_WEBHOOK_SECRET")
    if not webhook_secret:
        raise HTTPException(status_code=500, detail="Missing CLERK_WEBHOOK_SECRET")
        
    # 3. Verify the webhook came from Clerk using Svix
    try:
        wh = Webhook(webhook_secret)
        event = wh.verify(payload, headers)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")
        
    event_type = event.get("type")
    data = event.get("data", {})
    
    # 4. Save the new user to Supabase
    if event_type == "user.created":
        user_id = data.get("id")
        
        # Clerk stores emails in an array; extract the primary email
        email_addresses = data.get("email_addresses", [])
        email = email_addresses[0].get("email_address") if email_addresses else None
        
        if user_id and email:
            # Check if user already exists to prevent duplicate key crashes
            existing_user = db.query(models.User).filter(models.User.id == user_id).first()
            if not existing_user:
                new_user = models.User(id=user_id, email=email)
                db.add(new_user)
                db.commit()
                print(f"✅ New user inserted into Supabase: {email}")
            else:
                print(f"User {email} already exists.")
            
    return {"status": "success"}

# --- TEMPORARY TEST ENDPOINT ---
@app.get("/test-db")
def test_db_connection(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("SELECT 1")).scalar()
        return {"status": "success", "message": "Successfully connected to Supabase PostgreSQL!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")