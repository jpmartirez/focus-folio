"use client";

import { useState, useRef, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { UploadCloud, FileText, X, Loader2 } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createRoom } from "@/app/lib/api";
import { formatBytes } from "@/app/lib/utils";
import { cn } from "@/app/lib/utils";

interface CreateRoomModalProps {
	open: boolean;
	onClose: () => void;
	onRoomCreated: () => void;
}

export default function CreateRoomModal({
	open,
	onClose,
	onRoomCreated,
}: CreateRoomModalProps) {
	const { userId } = useAuth();

	const [title, setTitle] = useState("");
	const [pdfFile, setPdfFile] = useState<File | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fileInputRef = useRef<HTMLInputElement>(null);

	// ── Reset form on close ──────────────────────────────────────────────────
	const handleClose = () => {
		if (loading) return;
		setTitle("");
		setPdfFile(null);
		setError(null);
		setIsDragging(false);
		onClose();
	};

	// ── Drag & Drop ──────────────────────────────────────────────────────────
	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback(() => setIsDragging(false), []);

	const handleDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		const file = e.dataTransfer.files[0];
		if (file?.type === "application/pdf") {
			setPdfFile(file);
			setError(null);
		} else {
			setError("Please drop a valid PDF file.");
		}
	}, []);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0] ?? null;
		if (file?.type === "application/pdf") {
			setPdfFile(file);
			setError(null);
		} else if (file) {
			setError("Only PDF files are accepted.");
			setPdfFile(null);
		}
	};

	// ── Submit ───────────────────────────────────────────────────────────────
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!title.trim()) return setError("Room title is required.");
		if (!pdfFile) return setError("Please select a PDF file.");
		if (!userId) return setError("You must be signed in.");

		setLoading(true);
		try {
			await createRoom(userId, title.trim(), pdfFile);
			onRoomCreated();
			handleClose();
		} catch (err: unknown) {
			const msg =
				(err as { response?: { data?: { detail?: string } } })?.response?.data
					?.detail ??
				(err instanceof Error ? err.message : "Failed to create room.");
			setError(msg);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
			<DialogContent
				className="w-full max-w-md rounded-xl p-8"
				showCloseButton={false}
			>
				<DialogHeader className="mb-2">
					<DialogTitle className="text-[1.125rem] font-bold tracking-tight text-text-primary">
						New Study Room
					</DialogTitle>
					<DialogDescription className="text-[0.8125rem] text-text-muted">
						Give it a name and upload your PDF to get started.
					</DialogDescription>
				</DialogHeader>

				<form
					onSubmit={handleSubmit}
					noValidate
					className="flex flex-col gap-5"
				>
					{/* Room Title */}
					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="room-title"
							className="text-[0.8125rem] font-semibold text-text-primary"
						>
							Room Title
						</label>
						<Input
							id="room-title"
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="e.g. Biochemistry Chapter 4"
							maxLength={255}
							className="rounded-md focus-visible:border-brand-500 focus-visible:ring-brand-500/20 text-[0.9375rem]"
						/>
					</div>

					{/* PDF Upload */}
					<div className="flex flex-col gap-1.5">
						<span className="text-[0.8125rem] font-semibold text-text-primary">
							PDF Document
						</span>

						{pdfFile ? (
							/* Selected file preview */
							<div className="flex items-center gap-3 rounded-md border border-brand-200 bg-brand-50 p-3.5">
								<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-brand-100">
									<FileText className="h-4 w-4 text-brand-600" />
								</div>
								<div className="min-w-0 flex-1 overflow-hidden flex flex-wrap">
									<p className="text-[0.875rem] font-semibold text-brand-800">
										{pdfFile.name}
									</p>
									<p className="text-xs text-brand-600">
										{formatBytes(pdfFile.size)}
									</p>
								</div>
								<button
									type="button"
									onClick={() => setPdfFile(null)}
									aria-label="Remove file"
									className="shrink-0 rounded-sm p-1 text-brand-600 hover:text-brand-800 transition-colors"
								>
									<X className="h-4 w-4" />
								</button>
							</div>
						) : (
							/* Drop zone */
							<div
								onDragOver={handleDragOver}
								onDragLeave={handleDragLeave}
								onDrop={handleDrop}
								onClick={() => fileInputRef.current?.click()}
								role="button"
								tabIndex={0}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ")
										fileInputRef.current?.click();
								}}
								className={cn(
									"flex cursor-pointer flex-col items-center gap-2 rounded-md border-[1.5px] border-dashed py-7 px-5 transition-all duration-150",
									isDragging
										? "border-brand-400 bg-brand-50"
										: "border-border-strong bg-surface hover:bg-neutral-100",
								)}
							>
								<UploadCloud
									className={cn(
										"h-7 w-7 transition-colors",
										isDragging ? "text-brand-500" : "text-text-muted",
									)}
								/>
								<p className="text-center text-[0.875rem] text-text-secondary">
									<span className="font-semibold text-brand-600">
										Click to upload
									</span>{" "}
									or drag &amp; drop
								</p>
								<p className="text-xs text-text-muted">PDF only</p>
							</div>
						)}

						<input
							ref={fileInputRef}
							type="file"
							accept=".pdf,application/pdf"
							onChange={handleFileChange}
							className="hidden"
							id="pdf-upload-input"
						/>
					</div>

					{/* Error */}
					{error && (
						<Alert variant="destructive" className="py-2.5">
							<AlertDescription className="text-[0.8125rem]">
								{error}
							</AlertDescription>
						</Alert>
					)}

					{/* Actions */}
					<DialogFooter className="-mx-8 -mb-8 px-8 py-4 rounded-b-xl">
						<Button
							type="button"
							variant="outline"
							onClick={handleClose}
							disabled={loading}
							className="rounded-md"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={loading}
							id="create-room-submit"
							className="btn btn-primary min-w-[120px] rounded-md"
						>
							{loading ? (
								<>
									<Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
									Creating…
								</>
							) : (
								"Create Room"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
