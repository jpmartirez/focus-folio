"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Loader2, Bot, User } from "lucide-react";
import { getMessages, sendMessage } from "@/app/lib/api";
import type { ChatMessage } from "@/app/lib/types";

interface ChatPanelProps {
	userId: string;
	roomId: string;
}

export default function ChatPanel({ userId, roomId }: ChatPanelProps) {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [initialLoading, setInitialLoading] = useState(true);
	const bottomRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// Load existing messages on mount
	useEffect(() => {
		const load = async () => {
			try {
				const data = await getMessages(userId, roomId);
				setMessages(data);
			} catch {
				// Silent fail — empty chat is fine
			} finally {
				setInitialLoading(false);
			}
		};
		load();
	}, [userId, roomId]);

	// Auto-scroll to bottom when messages change
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, loading]);

	const handleSend = async () => {
		const question = input.trim();
		if (!question || loading) return;

		// Optimistically add the user message to the UI
		const tempUserMsg: ChatMessage = {
			id: `temp-${Date.now()}`,
			role: "user",
			content: question,
			created_at: new Date().toISOString(),
		};
		setMessages((prev) => [...prev, tempUserMsg]);
		setInput("");
		setLoading(true);

		try {
			const { answer } = await sendMessage(userId, roomId, question);
			const aiMsg: ChatMessage = {
				id: `ai-${Date.now()}`,
				role: "assistant",
				content: answer,
				created_at: new Date().toISOString(),
			};
			setMessages((prev) => [...prev, aiMsg]);
		} catch {
			const errMsg: ChatMessage = {
				id: `err-${Date.now()}`,
				role: "assistant",
				content: "Something went wrong. Please try again.",
				created_at: new Date().toISOString(),
			};
			setMessages((prev) => [...prev, errMsg]);
		} finally {
			setLoading(false);
			textareaRef.current?.focus();
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	return (
		<div className="flex h-full flex-col">
			{/* Messages */}
			<div className="flex-1 overflow-y-auto p-4 space-y-4">
				{initialLoading ? (
					<div className="flex items-center justify-center h-full">
						<Loader2 className="h-5 w-5 animate-spin text-text-muted" />
					</div>
				) : messages.length === 0 ? (
					<div className="flex h-full flex-col items-center justify-center gap-3 text-center px-6">
						<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 border border-brand-100">
							<Bot className="h-6 w-6 text-brand-600" />
						</div>
						<div>
							<p className="text-[0.9375rem] font-medium text-text-primary">
								Ask me anything about the lesson
							</p>
							<p className="mt-1 text-[0.8125rem] text-text-muted">
								I&apos;ll only answer based on the uploaded document.
							</p>
						</div>
					</div>
				) : (
					<>
						{messages.map((msg) => (
							<MessageBubble key={msg.id} message={msg} />
						))}
						{loading && <TypingIndicator />}
					</>
				)}
				<div ref={bottomRef} />
			</div>

			{/* Input */}
			<div className="border-t border-border bg-white p-3">
				<div className="flex items-end gap-2 rounded-xl border border-border bg-neutral-50 px-3 py-2 focus-within:border-brand-400 focus-within:ring-1 focus-within:ring-brand-400 transition-all">
					<textarea
						ref={textareaRef}
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="Ask about the lesson… (Enter to send)"
						rows={1}
						className="flex-1 resize-none bg-transparent text-[0.9375rem] text-text-primary placeholder:text-text-muted outline-none"
						style={{ maxHeight: "120px" }}
					/>
					<button
						onClick={handleSend}
						disabled={loading || !input.trim()}
						className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white transition-all hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed"
						aria-label="Send message"
					>
						{loading ? (
							<Loader2 className="h-3.5 w-3.5 animate-spin" />
						) : (
							<Send className="h-3.5 w-3.5" />
						)}
					</button>
				</div>
				<p className="mt-1.5 text-center text-[0.7rem] text-text-muted">
					Answers are grounded in your uploaded lesson document.
				</p>
			</div>
		</div>
	);
}

function MessageBubble({ message }: { message: ChatMessage }) {
	const isUser = message.role === "user";
	return (
		<div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
			{/* Avatar */}
			<div
				className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-white ${
					isUser ? "bg-brand-600" : "bg-neutral-200"
				}`}
			>
				{isUser ? (
					<User className="h-3.5 w-3.5" />
				) : (
					<Bot className="h-3.5 w-3.5 text-text-secondary" />
				)}
			</div>

			{/* Bubble */}
			<div
				className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[0.9rem] leading-relaxed ${
					isUser
						? "rounded-tr-sm bg-brand-600 text-white"
						: "rounded-tl-sm bg-neutral-100 text-text-primary"
				}`}
			>
				{message.content}
			</div>
		</div>
	);
}

function TypingIndicator() {
	return (
		<div className="flex gap-2.5">
			<div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-neutral-200">
				<Bot className="h-3.5 w-3.5 text-text-secondary" />
			</div>
			<div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-neutral-100 px-4 py-3">
				<span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:0ms]" />
				<span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:150ms]" />
				<span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:300ms]" />
			</div>
		</div>
	);
}
