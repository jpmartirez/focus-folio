"use client";

// The room workspace is a full-screen layout.
// We override the root layout by providing a custom layout here that
// wraps only with ClerkProvider (auth still works) but without
// the shared navbar and footer — the room has its own top bar.

export default function RoomLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
