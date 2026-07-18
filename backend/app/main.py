from fastapi import FastAPI
from .database import engine, Base
from . import models

Base.metadata.create_all(bind=engine)

app = FastAPI(title="FocusFolio API", version="0.0.1")

@app.get("/")
def read_root():
    return {"status": "Backend is running"}