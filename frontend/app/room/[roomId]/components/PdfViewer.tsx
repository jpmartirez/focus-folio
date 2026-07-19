"use client";

interface PdfViewerProps {
	pdfUrl: string;
}

export default function PdfViewer({ pdfUrl }: PdfViewerProps) {
	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center justify-between border-b border-border bg-white px-4 py-2.5">
				<span className="text-[0.8125rem] font-medium text-text-secondary">
					Lesson Document
				</span>
				<a
					href={pdfUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="text-[0.75rem] font-medium text-brand-600 transition-colors hover:text-brand-700"
				>
					Open in new tab ↗
				</a>
			</div>
			<div className="relative flex-1 bg-neutral-100">
				<iframe
					src={`${pdfUrl}#toolbar=1&navpanes=0`}
					className="h-full w-full border-0"
					title="Lesson PDF"
				/>
			</div>
		</div>
	);
}
