"use client";

import { FolderOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
	onNewRoom: () => void;
}

export default function EmptyState({ onNewRoom }: EmptyStateProps) {
	return (
		<div className="flex flex-1 flex-col items-center justify-center py-20 px-6 text-center">
			<div className="mb-6 flex h-18 w-18 items-center justify-center rounded-2xl border border-brand-100 bg-brand-50">
				<FolderOpen className="h-8 w-8 text-brand-500" />
			</div>

			<h2 className="text-heading-2 mb-2 text-text-primary">
				No study rooms yet
			</h2>

			<p className="mb-8 max-w-sm text-[0.9375rem] leading-relaxed text-text-secondary">
				Create your first room by uploading a PDF — your AI study environment
				will be ready in seconds.
			</p>

			<Button
				onClick={onNewRoom}
				id="empty-state-new-room-btn"
				className="btn btn-primary rounded-md px-6 py-2.5"
			>
				<Plus className="mr-1.5 h-4 w-4" />
				New Room
			</Button>
		</div>
	);
}
