# System Architecture & Project Information

This document provides a comprehensive breakdown of the AI-Powered Study Room Platform. It details the complete feature set, user and data flows, technology stack, frontend page structure, and all required dependencies.

---

## 1. Complete Feature Set

### User & Authentication
- **Secure Account Creation:** Users can register and log in using OAuth (Google/GitHub) or magic links.
- **Session Management:** Secure token-based sessions handled by a third-party identity provider.

### Room Management
- **Study Environment Creation:** Users can create isolated study rooms dedicated to specific topics.
- **Room Navigation:** A central dashboard allows users to switch between different active study rooms.
- **Room Deletion:** Users can securely delete a room, which cascades to delete all associated chat history and vector data.

### Document Integration
- **PDF Upload:** Users can upload a PDF lesson/document that serves as the foundation for the room.
- **In-App PDF Reader:** A side-by-side split view allowing users to read the document while utilizing study tools.

### AI & Chat Features
- **Context-Restricted Chat:** Users can chat with an AI assistant that strictly bases its answers on the uploaded PDF.
- **Irrelevance Filtering:** The AI actively disregards and declines to answer questions unrelated to the lesson material.
- **Memory/History:** The chat log retains previous messages for continuous, contextual conversation within that session.

### Study Tool Generation
- **Automated Exams:** The system can generate interactive multiple-choice quizzes based on the PDF content.
- **Flashcards:** The system can generate dynamic front/back flashcards for rapid memorization of key concepts.

---

## 2. System Flow Diagrams

### A. Authentication & User Sync Flow
1. User authenticates via frontend UI.
2. Identity Provider issues a JWT to the frontend.
3. Identity Provider fires a `user.created` Webhook to the backend.
4. Backend verifies the Webhook signature.
5. Backend creates a corresponding user record in the PostgreSQL database.

### B. Document Ingestion Flow
1. User inside `/room/[id]` uploads a PDF file.
2. Frontend sends multipart/form-data to Backend API.
3. Backend processes PDF via Document Loader.
4. Text is split into overlapping chunks (e.g., 1000 characters).
5. Chunks are embedded into vector representations.
6. Vectors are saved to the Vector Database with metadata: `{"room_id": "<UUID>"}`.

### C. Guardrailed Chat Flow (RAG)
1. User submits a question in the chat interface.
2. Backend receives query + `room_id`.
3. Backend embeds the query and searches the Vector DB using the `room_id` metadata filter.
4. Retrieved text chunks are injected into a strict System Prompt.
5. LLM evaluates context. If relevant, it answers. If irrelevant, it triggers the fallback response.
6. Backend streams response back to the UI.

### D. Exam/Flashcard Generation Flow
1. User clicks "Generate Exam".
2. Backend queries Vector DB for key concepts within that `room_id`.
3. Backend prompts LLM using Structured Output capabilities to enforce a strict JSON schema (e.g., `[{"question": "...", "options": [...], "answer": "..."}]`).
4. JSON payload is saved to PostgreSQL and returned to the Frontend.
5. Frontend renders interactive React components for the quiz/flashcards.

---

## 3. Technology Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS
- **Backend:** FastAPI (Python)
- **Relational Database:** PostgreSQL
- **Vector Database:** ChromaDB
- **AI / LLM Orchestration:** LangChain
- **Identity Provider:** Clerk

---

## 4. Frontend Page Architecture

| Route | Description |
| :--- | :--- |
| `/` | Landing page outlining app features with a Call to Action (CTA) to log in. |
| `/sign-in` | Hosted/embedded authentication page for existing users. |
| `/sign-up` | Hosted/embedded registration page for new users. |
| `/dashboard` | The main user hub displaying a grid/list of all created study rooms and a "Create Room" modal. |
| `/room/[roomId]` | The core workspace. A complex split-screen layout containing: <br/>- **Left Panel:** Native PDF Viewer.<br/>- **Right Panel (Tabs):** Chat Interface, Quiz Mode, and Flashcard Mode. |

---

## 5. Modules, Tools & Dependencies

### Frontend Dependencies (package.json)
- **Core:** `next`, `react`, `react-dom`
- **Authentication:** `@clerk/nextjs`
- **State Management:** `zustand` (for handling active room state, chat history locally)
- **Data Fetching:** `@tanstack/react-query`, `axios`
- **PDF Rendering:** `react-pdf`
- **Styling & UI:** `tailwindcss`, `postcss`, `autoprefixer`, `lucide-react` (icons), `clsx`, `tailwind-merge` (for shadcn/ui)
- **Components:** `shadcn/ui` (Radix UI primitives for tabs, modals, buttons, forms)

### Backend Dependencies (requirements.txt)
- **Core Framework:** `fastapi`, `uvicorn[standard]` (ASGI server)
- **AI & RAG:** `langchain`, `langchain-core`, `langchain-community`, `langchain-openai` (or anthropic equivalent)
- **Vector Database:** `chromadb`, `tiktoken` (for token counting)
- **Relational Database & ORM:** `sqlalchemy`, `alembic` (for migrations), `psycopg2-binary` (PostgreSQL driver)
- **Document Processing:** `pypdf` (for LangChain PDFLoader)
- **Security & Webhooks:** `svix` (for verifying Clerk webhooks), `python-jose`, `passlib`
- **Environment:** `python-dotenv`, `pydantic`, `pydantic-settings`

---

## 👤 Author & Environment Note
**John Paul R. Martirez**  
*BS Computer Science, Software Engineering*

*Note: Backend setup and commands are fully compatible with standard Linux development environments (e.g., Fedora).*
