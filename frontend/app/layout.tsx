import { ClerkProvider, UserButton, Show, SignUpButton } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

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
		<html lang="en" className={`${geistMono.variable} h-full`}>
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

					{/* ── Footer ── */}
					<footer className="footer">
						<div
							className="container"
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								flexWrap: "wrap",
								gap: "0.5rem",
							}}
						>
							<span className="logo-text" style={{ fontSize: "1rem" }}>
								FocusFolio
							</span>
							<p
								style={{
									fontSize: "0.8125rem",
									color: "var(--text-muted)",
									margin: 0,
								}}
							>
								© {new Date().getFullYear()} FocusFolio · Built by John Paul R.
								Martirez
							</p>
						</div>
					</footer>
				</ClerkProvider>
			</body>
		</html>
	);
}
