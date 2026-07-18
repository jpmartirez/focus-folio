"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, FileText, Trash2, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate, pdfFilename } from "@/app/lib/utils";
import type { Room } from "@/app/lib/types";

interface RoomCardProps {
	room: Room;
	onDeleteRequest: (room: Room) => void;
}

export default function RoomCard({ room, onDeleteRequest }: RoomCardProps) {
	const [hovered, setHovered] = useState(false);

	return (
		<div
			className="relative"
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
		>
			{/* Clickable area — whole card navigates to room */}
			<Link
				href={`/room/${room.id}`}
				id={`room-card-${room.id}`}
				className="block no-underline"
			>
				<div
					className={cn(
						"card flex flex-col gap-4 p-6 cursor-pointer transition-all duration-250",
						hovered && "shadow-md translate-y-[-3px]"
					)}
				>
					{/* Icon */}
					<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-brand-50">
						<BookOpen className="h-5 w-5 text-brand-600" />
					</div>

					{/* Title */}
					<div className="min-w-0 flex-1">
						<h3 className="mb-2 truncate pr-6 text-[0.9375rem] font-bold leading-snug tracking-tight text-text-primary">
							{room.title}
						</h3>

						{/* PDF chip */}
						<Badge
							variant="secondary"
							className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full bg-neutral-100 px-2.5 py-0.5 text-[0.72rem] font-medium text-text-secondary"
						>
							<FileText className="h-3 w-3 shrink-0" />
							<span className="truncate">{pdfFilename(room.pdf_url)}</span>
						</Badge>
					</div>

					{/* Footer */}
					<div className="flex items-center justify-between">
						<span className="text-xs text-text-muted">
							{formatDate(room.created_at)}
						</span>
						<span
							className={cn(
								"flex items-center gap-1 text-xs font-semibold transition-colors duration-150",
								hovered ? "text-brand-600" : "text-text-muted"
							)}
						>
							Open
							<ArrowRight className="h-3 w-3" />
						</span>
					</div>
				</div>
			</Link>

			{/* Delete button — floats over top-right, only clickable on hover */}
			<button
				type="button"
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					onDeleteRequest(room);
				}}
				aria-label={`Delete room "${room.title}"`}
				id={`delete-room-${room.id}`}
				className={cn(
					"absolute right-3.5 top-3.5 flex h-7 w-7 items-center justify-center rounded-sm",
					"border border-border bg-neutral-0 text-text-muted",
					"transition-all duration-150",
					"hover:border-red-200 hover:bg-red-50 hover:text-red-600",
					hovered
						? "pointer-events-auto scale-100 opacity-100"
						: "pointer-events-none scale-85 opacity-0"
				)}
			>
				<Trash2 className="h-3.5 w-3.5" />
			</button>
		</div>
	);
}
