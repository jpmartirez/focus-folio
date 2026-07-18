"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import RoomGrid, { RoomGridSkeleton } from "./dashboard/RoomGrid";
import EmptyState from "./dashboard/EmptyState";
import CreateRoomModal from "./modals/CreateRoomModal";
import DeleteConfirmDialog from "./modals/DeleteConfirmDialog";
import { getRooms, deleteRoom } from "@/app/lib/api";
import type { Room } from "@/app/lib/types";

export default function SignedInHome() {
	const { userId } = useAuth();

	// ── Data state ────────────────────────────────────────────────────────────
	const [rooms, setRooms] = useState<Room[]>([]);
	const [loading, setLoading] = useState(true);
	const [fetchError, setFetchError] = useState<string | null>(null);

	// ── Modal state ───────────────────────────────────────────────────────────
	const [showCreate, setShowCreate] = useState(false);
	const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState<string | null>(null);

	// ── Fetch rooms ───────────────────────────────────────────────────────────
	const fetchRooms = useCallback(async () => {
		if (!userId) return;
		setLoading(true);
		setFetchError(null);
		try {
			const data = await getRooms(userId);
			setRooms(data);
		} catch {
			setFetchError("Failed to load rooms. Please try again.");
		} finally {
			setLoading(false);
		}
	}, [userId]);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		fetchRooms();
	}, [fetchRooms]);

	// ── Delete ────────────────────────────────────────────────────────────────
	const handleDeleteConfirm = async () => {
		if (!roomToDelete || !userId) return;
		setDeleting(true);
		setDeleteError(null);
		try {
			await deleteRoom(userId, roomToDelete.id);
			// Optimistically remove from list
			setRooms((prev) => prev.filter((r) => r.id !== roomToDelete.id));
			setRoomToDelete(null);
		} catch {
			setDeleteError("Failed to delete the room. Please try again.");
		} finally {
			setDeleting(false);
		}
	};

	return (
		<>
			<div className="flex flex-1 flex-col bg-background px-6 py-10" style={{ minHeight: "calc(100vh - 64px - 73px)" }}>
				<div className="container">

					{/* ── Header ── */}
					<div className="mb-10 flex flex-wrap items-center justify-between gap-4">
						<div>
							<h1 className="text-heading-1 m-0 text-text-primary">
								My Study Rooms
							</h1>
							<p className="mt-1.5 text-[0.9375rem] text-text-secondary">
								{loading
									? "Loading…"
									: rooms.length === 0
									? "No rooms yet — create your first one."
									: `${rooms.length} room${rooms.length !== 1 ? "s" : ""}`}
							</p>
						</div>

						<Button
							onClick={() => setShowCreate(true)}
							id="new-room-btn"
							className="btn btn-primary rounded-md px-5 py-2.5 text-[0.875rem]"
						>
							<Plus className="mr-1.5 h-4 w-4" />
							New Room
						</Button>
					</div>

					{/* ── Delete error banner ── */}
					{deleteError && (
						<Alert variant="destructive" className="mb-5">
							<AlertDescription className="flex items-center justify-between">
								<span>{deleteError}</span>
								<button
									onClick={() => setDeleteError(null)}
									className="ml-3 text-red-600 hover:text-red-800 transition-colors"
									aria-label="Dismiss"
								>
									✕
								</button>
							</AlertDescription>
						</Alert>
					)}

					{/* ── Body ── */}
					{loading ? (
						<RoomGridSkeleton />
					) : fetchError ? (
						<div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-border p-10 text-center">
							<p className="text-[0.9375rem] text-red-600">{fetchError}</p>
							<Button
								variant="outline"
								onClick={fetchRooms}
								className="rounded-md"
							>
								<RotateCcw className="mr-1.5 h-4 w-4" />
								Retry
							</Button>
						</div>
					) : rooms.length === 0 ? (
						<EmptyState onNewRoom={() => setShowCreate(true)} />
					) : (
						<RoomGrid
							rooms={rooms}
							onDeleteRequest={setRoomToDelete}
						/>
					)}
				</div>
			</div>

			{/* ── Modals ── */}
			<CreateRoomModal
				open={showCreate}
				onClose={() => setShowCreate(false)}
				onRoomCreated={fetchRooms}
			/>

			<DeleteConfirmDialog
				open={!!roomToDelete}
				roomTitle={roomToDelete?.title ?? ""}
				deleting={deleting}
				onConfirm={handleDeleteConfirm}
				onCancel={() => !deleting && setRoomToDelete(null)}
			/>
		</>
	);
}
