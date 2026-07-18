import axios from "axios";
import type { Room } from "./types";

const api = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
});

// Helper: build auth headers
function authHeaders(userId: string) {
	return { "X-Clerk-User-Id": userId };
}


//Fetch all rooms belonging to the authenticated user.
export async function getRooms(userId: string): Promise<Room[]> {
	const { data } = await api.get<Room[]>("/rooms", {
		headers: authHeaders(userId),
	});
	return data;
}

//Fetch a single room by ID (must belong to the user).
export async function getRoom(userId: string, roomId: string): Promise<Room> {
	const { data } = await api.get<Room>(`/rooms/${roomId}`, {
		headers: authHeaders(userId),
	});
	return data;
}

//Create a new study room with a PDF upload.
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

//Delete a room and its associated PDF from Supabase Storage.
export async function deleteRoom(
	userId: string,
	roomId: string
): Promise<void> {
	await api.delete(`/rooms/${roomId}`, {
		headers: authHeaders(userId),
	});
}

export default api;
