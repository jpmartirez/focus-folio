"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
	ArrowLeft,
	MessageSquare,
	ClipboardList,
	Layers,
	Loader2,
	AlertCircle,
	FileText,
	BookOpen,
} from "lucide-react";
import { getRoom } from "@/app/lib/api";
import type { Room } from "@/app/lib/types";
import PdfViewer from "./components/PdfViewer";
import ChatPanel from "./components/ChatPanel";
import ExamPanel from "./components/ExamPanel";
import FlashcardsPanel from "./components/FlashcardsPanel";

type StudyTab = "chat" | "exam" | "flashcards";
type MobilePanel = "document" | "tools";

const STUDY_TABS: { id: StudyTab; label: string; Icon: React.ElementType }[] = [
	{ id: "chat", label: "Chat", Icon: MessageSquare },
	{ id: "exam", label: "Exam", Icon: ClipboardList },
	{ id: "flashcards", label: "Flashcards", Icon: Layers },
];

const MOBILE_PANELS: { id: MobilePanel; label: string; Icon: React.ElementType }[] = [
	{ id: "document", label: "Document", Icon: FileText },
	{ id: "tools", label: "Study Tools", Icon: BookOpen },
];

export default function RoomPage() {
	const { userId } = useAuth();
	const params = useParams();
	const roomId = params?.roomId as string;

	const [room, setRoom] = useState<Room | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [activeStudyTab, setActiveStudyTab] = useState<StudyTab>("chat");
	const [activeMobilePanel, setActiveMobilePanel] = useState<MobilePanel>("document");

	useEffect(() => {
		if (!userId || !roomId) return;
		const fetchRoom = async () => {
			setLoading(true);
			try {
				const data = await getRoom(userId, roomId);
				setRoom(data);
			} catch {
				setError("Room not found or you don't have access.");
			} finally {
				setLoading(false);
			}
		};
		fetchRoom();
	}, [userId, roomId]);

	// ── Loading state ────────────────────────────────────────────────────────
	if (loading) {
		return (
			<div className="flex flex-1 items-center justify-center">
				<div className="flex flex-col items-center gap-3">
					<Loader2 className="h-6 w-6 animate-spin text-brand-600" />
					<p className="text-[0.875rem] text-text-muted">Loading your study room…</p>
				</div>
			</div>
		);
	}

	// ── Error state ──────────────────────────────────────────────────────────
	if (error || !room) {
		return (
			<div className="flex flex-1 items-center justify-center">
				<div className="flex flex-col items-center gap-4 text-center">
					<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 border border-red-100">
						<AlertCircle className="h-6 w-6 text-red-500" />
					</div>
					<div>
						<p className="text-[0.9375rem] font-semibold text-text-primary">
							Room not found
						</p>
						<p className="mt-1 text-[0.8125rem] text-text-muted">
							{error ?? "Something went wrong."}
						</p>
					</div>
					<Link
						href="/"
						className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-[0.875rem] font-medium text-text-secondary transition-all hover:border-neutral-400 hover:text-text-primary no-underline"
					>
						<ArrowLeft className="h-3.5 w-3.5" />
						Back to Dashboard
					</Link>
				</div>
			</div>
		);
	}

	// ── Shared top bar ───────────────────────────────────────────────────────
	const TopBar = (
		<div className="flex flex-shrink-0 items-center gap-3 border-b border-border bg-white px-4 py-2.5">
			<Link
				href="/"
				className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-text-muted no-underline transition-colors duration-150 hover:text-text-primary"
			>
				<ArrowLeft className="h-3.5 w-3.5" />
				Dashboard
			</Link>
			<div className="h-4 w-px bg-border" />
			<span className="text-[0.9375rem] font-semibold text-text-primary tracking-tight truncate">
				{room.title}
			</span>
		</div>
	);

	// ── Study tools panel (shared between desktop right panel and mobile) ────
	const StudyToolsContent = (
		<div className="flex flex-1 flex-col overflow-hidden">
			{/* Study tab bar */}
			<div className="flex flex-shrink-0 border-b border-border bg-white px-3">
				{STUDY_TABS.map(({ id, label, Icon }) => (
					<button
						key={id}
						onClick={() => setActiveStudyTab(id)}
						className={`relative flex items-center gap-1.5 px-4 py-3 text-[0.8125rem] font-medium transition-colors ${
							activeStudyTab === id
								? "text-brand-600"
								: "text-text-muted hover:text-text-secondary"
						}`}
					>
						<Icon className="h-3.5 w-3.5" />
						{label}
						{activeStudyTab === id && (
							<span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-brand-600" />
						)}
					</button>
				))}
			</div>

			{/* Study tab content */}
			<div className="flex-1 overflow-hidden">
				{activeStudyTab === "chat" && userId && (
					<ChatPanel userId={userId} roomId={roomId} />
				)}
				{activeStudyTab === "exam" && userId && (
					<ExamPanel userId={userId} roomId={roomId} />
				)}
				{activeStudyTab === "flashcards" && userId && (
					<FlashcardsPanel userId={userId} roomId={roomId} />
				)}
			</div>
		</div>
	);

	// ── Main workspace ───────────────────────────────────────────────────────
	return (
		<div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
			{TopBar}

			{/* ── DESKTOP layout (lg+): side-by-side ─────────────────────── */}
			<div className="hidden lg:flex flex-1 overflow-hidden">
				{/* Left panel — PDF viewer */}
				<div
					className="flex flex-col border-r border-border"
					style={{ width: "55%" }}
				>
					<PdfViewer pdfUrl={room.pdf_url} />
				</div>

				{/* Right panel — Study tools */}
				{StudyToolsContent}
			</div>

			{/* ── MOBILE / TABLET layout (< lg): tabbed panels ───────────── */}
			<div className="flex lg:hidden flex-col flex-1 overflow-hidden">
				{/* Mobile panel switcher tab bar */}
				<div className="flex flex-shrink-0 border-b border-border bg-white">
					{MOBILE_PANELS.map(({ id, label, Icon }) => (
						<button
							key={id}
							onClick={() => setActiveMobilePanel(id)}
							className={`relative flex flex-1 items-center justify-center gap-2 py-3 text-[0.8125rem] font-semibold transition-colors ${
								activeMobilePanel === id
									? "text-brand-600"
									: "text-text-muted hover:text-text-secondary"
							}`}
						>
							<Icon className="h-4 w-4" />
							{label}
							{activeMobilePanel === id && (
								<span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-brand-600" />
							)}
						</button>
					))}
				</div>

				{/* Mobile panel content */}
				<div className="flex flex-1 overflow-hidden">
					{activeMobilePanel === "document" ? (
						<div className="flex flex-1 flex-col">
							<PdfViewer pdfUrl={room.pdf_url} />
						</div>
					) : (
						StudyToolsContent
					)}
				</div>
			</div>
		</div>
	);
}
