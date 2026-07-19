"use client";

import { useState, useEffect } from "react";
import { Loader2, Layers, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { getFlashcards, generateFlashcards } from "@/app/lib/api";
import type { Flashcard } from "@/app/lib/types";

interface FlashcardsProps {
	userId: string;
	roomId: string;
}

export default function FlashcardsPanel({ userId, roomId }: FlashcardsProps) {
	const [cards, setCards] = useState<Flashcard[]>([]);
	const [loading, setLoading] = useState(true);
	const [generating, setGenerating] = useState(false);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [flipped, setFlipped] = useState(false);

	useEffect(() => {
		const load = async () => {
			try {
				const { flashcards } = await getFlashcards(userId, roomId);
				setCards(flashcards);
			} catch {
				// Silent fail
			} finally {
				setLoading(false);
			}
		};
		load();
	}, [userId, roomId]);

	const handleGenerate = async () => {
		setGenerating(true);
		try {
			const { flashcards } = await generateFlashcards(userId, roomId);
			setCards(flashcards);
			setCurrentIndex(0);
			setFlipped(false);
		} catch {
			// Silent fail
		} finally {
			setGenerating(false);
		}
	};

	const goNext = () => {
		setFlipped(false);
		setTimeout(() => setCurrentIndex((i) => Math.min(i + 1, cards.length - 1)), 100);
	};

	const goPrev = () => {
		setFlipped(false);
		setTimeout(() => setCurrentIndex((i) => Math.max(i - 1, 0)), 100);
	};

	const handleFlip = () => setFlipped((f) => !f);

	const handleReset = () => {
		setCurrentIndex(0);
		setFlipped(false);
	};

	// ── Loading ──────────────────────────────────────────────────────────────
	if (loading) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader2 className="h-5 w-5 animate-spin text-text-muted" />
			</div>
		);
	}

	// ── Empty state ──────────────────────────────────────────────────────────
	if (cards.length === 0) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
				<div className="flex h-14 w-14 items-center justify-center rounded-xl border border-brand-100 bg-brand-50">
					<Layers className="h-7 w-7 text-brand-600" />
				</div>
				<div>
					<p className="text-[0.9375rem] font-semibold text-text-primary">
						No flashcards yet
					</p>
					<p className="mt-1 text-[0.8125rem] text-text-muted">
						Generate flashcards from the key concepts in your lesson.
					</p>
				</div>
				<button
					onClick={handleGenerate}
					disabled={generating}
					className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2 text-[0.875rem] font-semibold text-white transition-all hover:bg-brand-700 disabled:opacity-50"
				>
					{generating ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin" />
							Generating…
						</>
					) : (
						<>
							<Layers className="h-4 w-4" />
							Generate Flashcards
						</>
					)}
				</button>
			</div>
		);
	}

	const current = cards[currentIndex];

	// ── Flashcard view ───────────────────────────────────────────────────────
	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-border bg-white px-4 py-3">
				<div className="flex items-center gap-2">
					<Layers className="h-4 w-4 text-brand-600" />
					<span className="text-[0.875rem] font-semibold text-text-primary">
						Flashcards
					</span>
				</div>
				<div className="flex items-center gap-2">
					<span className="text-[0.75rem] text-text-muted">
						{currentIndex + 1} / {cards.length}
					</span>
					<button
						onClick={handleReset}
						className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[0.75rem] text-text-muted transition-all hover:border-neutral-300 hover:text-text-primary"
						title="Reset to first card"
					>
						<RotateCcw className="h-3 w-3" />
						Reset
					</button>
				</div>
			</div>

			{/* Card area */}
			<div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-4">
				{/* Progress dots */}
				<div className="flex gap-1">
					{cards.map((_, i) => (
						<button
							key={i}
							onClick={() => {
								setFlipped(false);
								setCurrentIndex(i);
							}}
							className={`h-1.5 rounded-full transition-all ${
								i === currentIndex
									? "w-5 bg-brand-600"
									: "w-1.5 bg-neutral-200 hover:bg-neutral-300"
							}`}
						/>
					))}
				</div>

				{/* Flip card */}
				<div
					className="flashcard-container w-full max-w-sm cursor-pointer"
					onClick={handleFlip}
					style={{ perspective: "1000px" }}
				>
					<div
						className="flashcard-inner relative"
						style={{
							transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
							transformStyle: "preserve-3d",
							transition: "transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
							height: "240px",
						}}
					>
						{/* Front */}
						<div
							className="flashcard-face absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-border bg-white p-6 shadow-md"
							style={{ backfaceVisibility: "hidden" }}
						>
							<span className="mb-3 inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-widest text-brand-700">
								Term
							</span>
							<p className="text-center text-[1rem] font-semibold leading-snug text-text-primary">
								{current.front}
							</p>
							<p className="mt-4 text-[0.75rem] text-text-muted">Tap to reveal answer</p>
						</div>

						{/* Back */}
						<div
							className="flashcard-face absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-brand-200 bg-brand-50 p-6 shadow-md"
							style={{
								backfaceVisibility: "hidden",
								transform: "rotateY(180deg)",
							}}
						>
							<span className="mb-3 inline-block rounded-full bg-brand-100 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-widest text-brand-700">
								Answer
							</span>
							<p className="text-center text-[0.95rem] leading-relaxed text-text-primary">
								{current.back}
							</p>
							<p className="mt-4 text-[0.75rem] text-brand-600">Tap to flip back</p>
						</div>
					</div>
				</div>

				{/* Navigation */}
				<div className="flex items-center gap-4">
					<button
						onClick={goPrev}
						disabled={currentIndex === 0}
						className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-text-secondary shadow-sm transition-all hover:border-brand-300 hover:text-brand-600 disabled:opacity-30 disabled:cursor-not-allowed"
					>
						<ChevronLeft className="h-4 w-4" />
					</button>
					<button
						onClick={handleFlip}
						className="rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-[0.8125rem] font-medium text-brand-700 transition-all hover:bg-brand-100"
					>
						{flipped ? "Hide Answer" : "Reveal Answer"}
					</button>
					<button
						onClick={goNext}
						disabled={currentIndex === cards.length - 1}
						className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-text-secondary shadow-sm transition-all hover:border-brand-300 hover:text-brand-600 disabled:opacity-30 disabled:cursor-not-allowed"
					>
						<ChevronRight className="h-4 w-4" />
					</button>
				</div>
			</div>
		</div>
	);
}
