import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

//Merge Tailwind classes safely (shadcn cn utility).
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

//Format ISO date string to readable form: "Jul 18, 2026"
export function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

//Format file size in bytes to human-readable string.
export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

//Extract a short display name from a Supabase Storage PDF URL.
// The URL ends with a UUID filename — return "document.pdf" for those.
export function pdfFilename(url: string): string {
	const raw = url.split("/").pop() ?? "";
	// UUID filenames are 36+ chars; show a friendly fallback
	if (raw.length > 40) return "document.pdf";
	return raw || "document.pdf";
}
