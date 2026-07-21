"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Loader2, ClipboardList, CheckCircle, XCircle } from "lucide-react";
import { getExam, generateExam } from "@/app/lib/api";
import type { Exam, ExamQuestion } from "@/app/lib/types";

interface ExamPanelProps {
	userId: string;
	roomId: string;
}

type AnswerMap = Record<number, string>;

export default function ExamPanel({ userId, roomId }: ExamPanelProps) {
	const [exam, setExam] = useState<Exam | null>(null);
	const [loading, setLoading] = useState(true);
	const [generating, setGenerating] = useState(false);
	const [answers, setAnswers] = useState<AnswerMap>({});
	const [submitted, setSubmitted] = useState(false);
	const [score, setScore] = useState(0);

	useEffect(() => {
		const load = async () => {
			try {
				const { exam: data } = await getExam(userId, roomId);
				setExam(data);
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
		setAnswers({});
		setSubmitted(false);
		try {
			const data = await generateExam(userId, roomId);
			setExam(data);
		} catch {
			// TODO: show toast
		} finally {
			setGenerating(false);
		}
	};

	const handleSelect = (idx: number, option: string) => {
		if (submitted) return;
		setAnswers((prev) => ({ ...prev, [idx]: option }));
	};

	const handleSubmit = () => {
		if (!exam) return;
		let correct = 0;
		exam.questions.forEach((q, i) => {
			if (answers[i] === q.answer) correct++;
		});
		setScore(correct);
		setSubmitted(true);
	};

	const handleRetry = () => {
		setAnswers({});
		setSubmitted(false);
	};

	// ── Loading state ────────────────────────────────────────────────────────
	if (loading) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader2 className="h-5 w-5 animate-spin text-text-muted" />
			</div>
		);
	}

	// ── Empty state — no exam yet ────────────────────────────────────────────
	if (!exam) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
				<div className="flex h-14 w-14 items-center justify-center rounded-xl border border-brand-100 bg-brand-50">
					<ClipboardList className="h-7 w-7 text-brand-600" />
				</div>
				<div>
					<p className="text-[0.9375rem] font-semibold text-text-primary">
						No exam yet
					</p>
					<p className="mt-1 text-[0.8125rem] text-text-muted">
						Generate a multiple-choice exam based on your lesson document.
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
							<ClipboardList className="h-4 w-4" />
							Generate Exam
						</>
					)}
				</button>
			</div>
		);
	}

	const totalQuestions = exam.questions.length;
	const answeredCount = Object.keys(answers).length;

	// ── Score result ─────────────────────────────────────────────────────────
	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-border bg-white px-4 py-3">
				<div className="flex items-center gap-2">
					<ClipboardList className="h-4 w-4 text-brand-600" />
					<span className="text-[0.875rem] font-semibold text-text-primary">
						Exam — {totalQuestions} Questions
					</span>
				</div>
				<button
					onClick={handleGenerate}
					disabled={generating}
					className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[0.75rem] font-medium text-text-secondary transition-all hover:border-brand-300 hover:text-brand-600 disabled:opacity-50"
				>
					{generating ? (
						<Loader2 className="h-3.5 w-3.5 animate-spin" />
					) : (
						<RefreshCw className="h-3.5 w-3.5" />
					)}
					Generate Again
				</button>
			</div>

			{/* Score banner */}
			{submitted && (
				<div
					className={`flex items-center justify-between px-4 py-3 text-[0.875rem] font-medium ${
						score / totalQuestions >= 0.7
							? "bg-green-50 text-green-800 border-b border-green-200"
							: "bg-red-50 text-red-800 border-b border-red-200"
					}`}
				>
					<span>
						Your score:{" "}
						<strong>
							{score} / {totalQuestions}
						</strong>{" "}
						({Math.round((score / totalQuestions) * 100)}%)
					</span>
					<button
						onClick={handleRetry}
						className="text-[0.75rem] font-semibold underline underline-offset-2 hover:opacity-70"
					>
						Retry
					</button>
				</div>
			)}

			{/* Questions */}
			<div className="flex-1 overflow-y-auto p-4 space-y-5">
				{exam.questions.map((q, idx) => (
					<QuestionCard
						key={idx}
						index={idx}
						question={q}
						selected={answers[idx]}
						submitted={submitted}
						onSelect={(opt) => handleSelect(idx, opt)}
					/>
				))}

				{/* Submit / Retry button at bottom */}
				{!submitted ? (
					<button
						onClick={handleSubmit}
						disabled={answeredCount < totalQuestions}
						className="w-full rounded-xl bg-brand-600 py-3 text-[0.9rem] font-semibold text-white transition-all hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed"
					>
						Submit Exam ({answeredCount}/{totalQuestions} answered)
					</button>
				) : (
					<button
						onClick={handleRetry}
						className="w-full rounded-xl border border-border py-3 text-[0.9rem] font-semibold text-text-primary transition-all hover:bg-neutral-50"
					>
						Retry Exam
					</button>
				)}
			</div>
		</div>
	);
}

interface QuestionCardProps {
	index: number;
	question: ExamQuestion;
	selected?: string;
	submitted: boolean;
	onSelect: (option: string) => void;
}

function QuestionCard({ index, question, selected, submitted, onSelect }: QuestionCardProps) {
	return (
		<div className="rounded-xl border border-border bg-white p-4 shadow-sm">
			<p className="mb-3 text-[0.9rem] font-medium text-text-primary leading-snug">
				<span className="mr-1.5 text-text-muted">{index + 1}.</span>
				{question.question}
			</p>
			<div className="space-y-2">
				{question.options.map((option) => {
					const isSelected = selected === option;
					const isCorrect = option === question.answer;
					const isWrong = submitted && isSelected && !isCorrect;
					const showCorrect = submitted && isCorrect;

					let optionClass =
						"flex items-center gap-3 w-full rounded-lg border px-3 py-2.5 text-left text-[0.875rem] transition-all cursor-pointer ";

					if (showCorrect) {
						optionClass += "border-green-400 bg-green-50 text-green-800";
					} else if (isWrong) {
						optionClass += "border-red-400 bg-red-50 text-red-800";
					} else if (isSelected) {
						optionClass += "border-brand-400 bg-brand-50 text-brand-800";
					} else {
						optionClass +=
							"border-border text-text-secondary hover:border-brand-300 hover:bg-brand-50";
					}

					return (
						<button
							key={option}
							onClick={() => onSelect(option)}
							className={optionClass}
						>
							{submitted && showCorrect && (
								<CheckCircle className="h-4 w-4 shrink-0 text-green-600" />
							)}
							{submitted && isWrong && (
								<XCircle className="h-4 w-4 shrink-0 text-red-500" />
							)}
							{!submitted && (
								<span
									className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[0.65rem] font-semibold ${
										isSelected
											? "border-brand-500 bg-brand-500 text-white"
											: "border-neutral-300 text-neutral-400"
									}`}
								/>
							)}
							<span className="flex-1">{option}</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}
