"use client";

import { Trash2, Loader2 } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteConfirmDialogProps {
	open: boolean;
	roomTitle: string;
	deleting: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

export default function DeleteConfirmDialog({
	open,
	roomTitle,
	deleting,
	onConfirm,
	onCancel,
}: DeleteConfirmDialogProps) {
	return (
		<Dialog open={open} onOpenChange={(o) => !o && !deleting && onCancel()}>
			<DialogContent
				className="w-full max-w-sm rounded-xl p-7"
				showCloseButton={false}
			>
				<DialogHeader>
					{/* Danger icon */}
					<div className="mb-3 flex h-11 w-11 items-center justify-center rounded-md border border-red-200 bg-red-50">
						<Trash2 className="h-5 w-5 text-red-600" />
					</div>

					<DialogTitle className="text-[1rem] font-bold tracking-tight text-text-primary">
						Delete room?
					</DialogTitle>
					<DialogDescription className="text-[0.875rem] leading-relaxed text-text-secondary">
						<strong className="font-semibold text-text-primary">
							&ldquo;{roomTitle}&rdquo;
						</strong>{" "}
						will be permanently deleted — including its PDF file and all
						associated data. This cannot be undone.
					</DialogDescription>
				</DialogHeader>

				<DialogFooter className="-mx-7 -mb-7 px-7 py-4 rounded-b-xl">
					<Button
						variant="outline"
						onClick={onCancel}
						disabled={deleting}
						className="rounded-md"
					>
						Cancel
					</Button>
					<Button
						onClick={onConfirm}
						disabled={deleting}
						id="confirm-delete-btn"
						className="min-w-30 rounded-md bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500/30"
					>
						{deleting ? (
							<>
								<Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
								Deleting…
							</>
						) : (
							<>
								<Trash2 className="mr-1.5 h-4 w-4" />
								Delete Room
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
