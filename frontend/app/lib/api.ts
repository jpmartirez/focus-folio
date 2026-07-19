import axios from "axios";
import type { Room, ChatMessage, Exam, Flashcard } from "./types";

const api = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
});

// Helper: build auth headers
function authHeaders(userId: string) {
	return { "X-Clerk-User-Id": userId };
}

// ── Rooms ────────────────────────────────────────────────────────────────────

export async function getRooms(userId: string): Promise<Room[]> {
	const { data } = await api.get<Room[]>("/rooms", {
		headers: authHeaders(userId),
	});
	return data;
}

export async function getRoom(userId: string, roomId: string): Promise<Room> {
	const { data } = await api.get<Room>(`/rooms/${roomId}`, {
		headers: authHeaders(userId),
	});
	return data;
}

export async function createRoom(
	userId: string,
	title: string,
	pdfFile: File
): Promise<Room> {
	const formData = new FormData();
	formData.append("title", title);
	formData.append("pdf_file", pdfFile);

	const { data } = await api.post<Room>("/rooms", formData, {
		headers: authHeaders(userId),
	});
	return data;
}

export async function deleteRoom(userId: string, roomId: string): Promise<void> {
	await api.delete(`/rooms/${roomId}`, {
		headers: authHeaders(userId),
	});
}

// ── Chat ─────────────────────────────────────────────────────────────────────

export async function getMessages(
	userId: string,
	roomId: string
): Promise<ChatMessage[]> {
	const { data } = await api.get<ChatMessage[]>(`/rooms/${roomId}/messages`, {
		headers: authHeaders(userId),
	});
	return data;
}

export async function sendMessage(
	userId: string,
	roomId: string,
	question: string
): Promise<{ answer: string; message_id: string }> {
	const { data } = await api.post(
		`/rooms/${roomId}/chat`,
		{ question },
		{ headers: authHeaders(userId) }
	);
	return data;
}

// ── Exam ─────────────────────────────────────────────────────────────────────

export async function getExam(
	userId: string,
	roomId: string
): Promise<{ exam: Exam | null }> {
	const { data } = await api.get(`/rooms/${roomId}/exam`, {
		headers: authHeaders(userId),
	});
	return data;
}

export async function generateExam(userId: string, roomId: string): Promise<Exam> {
	const { data } = await api.post(`/rooms/${roomId}/exam/generate`, {}, {
		headers: authHeaders(userId),
	});
	return data;
}

// ── Flashcards ────────────────────────────────────────────────────────────────

export async function getFlashcards(
	userId: string,
	roomId: string
): Promise<{ flashcards: Flashcard[] }> {
	const { data } = await api.get(`/rooms/${roomId}/flashcards`, {
		headers: authHeaders(userId),
	});
	return data;
}

export async function generateFlashcards(
	userId: string,
	roomId: string
): Promise<{ flashcards: Flashcard[] }> {
	const { data } = await api.post(`/rooms/${roomId}/flashcards/generate`, {}, {
		headers: authHeaders(userId),
	});
	return data;
}

export default api;
