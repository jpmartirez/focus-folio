export interface Room {
	id: string;
	title: string;
	pdf_url: string;
	created_at: string;
}

export interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	created_at: string;
}

export interface ExamQuestion {
	question: string;
	options: string[];
	answer: string;
}

export interface Exam {
	id: string;
	questions: ExamQuestion[];
	created_at: string;
}

export interface Flashcard {
	id: string;
	front: string;
	back: string;
	created_at: string;
}

