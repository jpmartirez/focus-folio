"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Wrench, Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getRoom } from "@/app/lib/api";
import type { Room } from "@/app/lib/types";

export default function RoomPage() {
	const { userId } = useAuth();
	const params = useParams();
	const roomId = params?.roomId as string;

	const [room, setRoom] = useState<Room | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!userId || !roomId) return;
		const fetch = async () => {
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
		fetch();
	}, [userId, roomId]);

	return (
		<div className="flex flex-1 flex-col bg-background" style={{ minHeight: "calc(100vh - 64px - 73px)" }}>

			{/* ── Top bar ── */}
			<div className="flex items-center gap-3 border-b border-border bg-neutral-0 px-6 py-3.5">
				<Link
					href="/"
					className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-text-muted no-underline transition-colors duration-150 hover:text-text-primary"
				>
					<ArrowLeft className="h-3.5 w-3.5" />
					Dashboard
				</Link>

				<div className="h-4 w-px bg-border" />

				{loading ? (
					<div className="h-4 w-40 animate-pulse rounded bg-neutral-100" />
				) : (
					<span className="text-[0.9375rem] font-semibold tracking-tight text-text-primary">
						{room?.title ?? "—"}
					</span>
				)}
			</div>

			{/* ── Content ── */}
			<div className="flex flex-1 items-center justify-center px-6 py-16">
				{loading ? (
					<div className="flex items-center gap-2 text-text-muted">
						<Loader2 className="h-4 w-4 animate-spin" />
						<span className="text-[0.9375rem]">Loading room…</span>
					</div>
				) : error ? (
					<div className="flex flex-col items-center gap-4 text-center">
						<p className="text-[0.9375rem] text-red-600">{error}</p>
						<Link
							href="/"
							className={buttonVariants({ variant: "outline", className: "rounded-md" })}
						>
							Back to Dashboard
						</Link>
					</div>
				) : (
					<div className="max-w-sm text-center">
						<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl border border-brand-100 bg-brand-50">
							<Wrench className="h-7 w-7 text-brand-500" />
						</div>
						<h2 className="text-heading-2 mb-2 text-text-primary">
							Coming Soon
						</h2>
						<p className="mb-3 text-[0.9375rem] leading-relaxed text-text-secondary">
							The workspace for{" "}
							<strong className="font-semibold text-text-primary">
								{room?.title}
							</strong>{" "}
							is being built. PDF viewer, AI chat, quizzes, and flashcards are
							coming next.
						</p>
						<p className="text-[0.8125rem] text-text-muted">
							Room ID:{" "}
							<code className="font-mono text-[0.8125rem]">{roomId}</code>
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
