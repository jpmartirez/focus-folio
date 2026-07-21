# FocusFolio

FocusFolio is an AI-powered study room platform that transforms static PDF documents into interactive learning environments. By uploading a lesson or document, users can automatically generate study materials and query the text using strict, context-restricted AI.

## Core Concept

The platform is designed to eliminate distractions and provide a focused, document-grounded study experience:

- **Isolated Study Rooms**: Users create dedicated workspaces around specific topics by uploading PDF files.
- **Context-Restricted Chat**: An integrated AI assistant strictly bases its answers on the uploaded document, actively declining to answer unrelated queries to maintain study focus.
- **Automated Study Tools**: The system dynamically extracts key concepts from the document to generate interactive multiple-choice exams and front-to-back flashcards for rapid memorization.
- **Split-Screen Interface**: A side-by-side workspace allows users to read the source document natively while simultaneously interacting with the chat, quizzes, or flashcards.

## System Architecture

FocusFolio implements a Retrieval-Augmented Generation (RAG) pipeline to process, embed, and query document chunks securely per user session. When a PDF is uploaded, it is split into overlapping chunks, embedded into vector representations, and stored with room-specific metadata to ensure data isolation.

### Technology Stack

- **Frontend**: Next.js (App Router), React, Tailwind CSS
- **Backend**: FastAPI (Python)
- **Vector Database**: Pinecone (for high-dimensional document embeddings and similarity search)
- **Database & Storage**: Supabase (PostgreSQL for structured relational data, Supabase Storage for raw PDF housing)
- **Authentication**: Clerk (with secure webhook synchronization)
- **AI Orchestration**: LangChain

## Getting Started

Refer to the `.env.example` files located in both the `frontend` and `backend` directories for the required environment variables needed to configure this project locally.

### Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

### Backend Setup
1. Navigate to the `backend` directory.
2. Install dependencies: `pip install -r requirements.txt`
3. Start the FastAPI server: `uv run fastapi dev app/main.py`
