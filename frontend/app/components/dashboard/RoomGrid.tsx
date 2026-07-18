import RoomCard from "./RoomCard";
import type { Room } from "@/app/lib/types";

interface RoomGridProps {
	rooms: Room[];
	onDeleteRequest: (room: Room) => void;
}

/** Loading skeleton placeholder for a single room card. */
function SkeletonCard() {
	return (
		<div className="h-44 animate-pulse rounded-lg bg-neutral-100" />
	);
}

/** Renders the grid of room cards, or skeletons while loading. */
export default function RoomGrid({ rooms, onDeleteRequest }: RoomGridProps) {
	return (
		<div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
			{rooms.map((room) => (
				<RoomCard
					key={room.id}
					room={room}
					onDeleteRequest={onDeleteRequest}
				/>
			))}
		</div>
	);
}

/** Skeleton version shown while fetching. */
export function RoomGridSkeleton() {
	return (
		<div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
			{[1, 2, 3].map((i) => (
				<SkeletonCard key={i} />
			))}
		</div>
	);
}
