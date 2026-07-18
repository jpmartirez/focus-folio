from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from .database import engine, Base, get_db
from . import models

# This safely verifies your tables exist in Supabase and binds them
Base.metadata.create_all(bind=engine)

app = FastAPI(title="FocusFolio API")

@app.get("/")
def read_root():
    return {"status": "Backend is running!"}

# --- TEMPORARY TEST ENDPOINT ---
@app.get("/test-db")
def test_db_connection(db: Session = Depends(get_db)):
    try:
        # Execute a simple raw SQL query to test the connection
        result = db.execute(text("SELECT 1")).scalar()
        return {
            "status": "success", 
            "message": "Successfully connected to Supabase PostgreSQL!",
            "result": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")