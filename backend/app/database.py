import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is missing!")

# Create the SQLAlchemy engine. 
# We use pool_pre_ping to check if the connection is still alive before using it.
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# Create a Session Factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

# FastAPI Dependency: This creates a unique database session per request 
# and automatically closes it when the request finishes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
