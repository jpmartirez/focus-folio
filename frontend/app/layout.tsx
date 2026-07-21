import { ClerkProvider, UserButton, Show, SignUpButton } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist_Mono, Geist } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { cn } from "@/lib/utils";
import ConditionalFooter from "./components/ConditionalFooter";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "FocusFolio — AI-Powered Study Rooms",
	description:
		"FocusFolio helps you study smarter with AI-powered chat, auto-generated quizzes, and flashcards — all grounded in your own documents.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={cn("h-full", geistMono.variable, "font-sans", geist.variable)}>
			<body className="min-h-full flex flex-col">
				<ClerkProvider>
					{/* ── Navbar ── */}
					<nav className="navbar">
						<div className="navbar-inner">
							{/* Logo */}
							<Link
								href="/"
								className="logo-text"
								style={{ textDecoration: "none" }}
							>
								FocusFolio
							</Link>

							{/* Nav Actions */}
							<div className="navbar-actions">
								<Show when="signed-out">
									<SignUpButton mode="modal">
										<button className="btn btn-primary">Get started</button>
									</SignUpButton>
								</Show>

								<Show when="signed-in">
									<Link
										href="/"
										className="btn btn-ghost"
										style={{ textDecoration: "none" }}
									>
										Dashboard
									</Link>
									<UserButton />
								</Show>
							</div>
						</div>
					</nav>

					{/* ── Page Content ── */}
					<main className="flex flex-col flex-1">{children}</main>

					{/* ── Footer (hidden on /room/* pages) ── */}
					<ConditionalFooter />
				</ClerkProvider>
			</body>
		</html>
	);
}
