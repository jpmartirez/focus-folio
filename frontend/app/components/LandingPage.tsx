"use client";

const features = [
	{
		icon: "📄",
		label: "PDF Study Rooms",
		description:
			"Each room is a focused environment tied to one document. Upload your PDF and everything — chat, quizzes, flashcards — stays scoped to that material.",
	},
	{
		icon: "🤖",
		label: "Context-Aware AI Chat",
		description:
			"Ask anything about your document. The AI answers strictly from your uploaded content and declines questions that fall outside the material.",
	},
	{
		icon: "📝",
		label: "Auto-Generated Exams",
		description:
			"Generate multiple-choice quizzes with a single click. Questions and answers are extracted directly from your document using structured AI output.",
	},
	{
		icon: "🃏",
		label: "Instant Flashcards",
		description:
			"Turn key concepts into front/back flashcards automatically. Review and memorize without ever leaving your study room.",
	},
];

const stats = [
	{ value: "1 PDF", label: "per room, fully scoped" },
	{ value: "3 tools", label: "Chat · Quiz · Flashcards" },
	{ value: "0 drift", label: "AI stays on topic" },
];

export default function LandingPage() {
	return (
		<>
			{/* ── Hero ── */}
			<section className="hero-bg" style={{ padding: "6rem 1.5rem 5rem" }}>
				<div className="container-narrow" style={{ textAlign: "center" }}>

					{/* Eyebrow */}
					<p
						style={{
							fontSize: "0.75rem",
							fontWeight: 700,
							letterSpacing: "0.12em",
							textTransform: "uppercase",
							color: "var(--brand-600)",
							marginBottom: "1.5rem",
						}}
						className="animate-fade-up"
					>
						AI-Powered Study Platform
					</p>

					{/* Headline */}
					<h1
						className="text-display animate-fade-up-delay-1"
						style={{ color: "var(--text-primary)", marginBottom: "1.5rem" }}
					>
						Your documents,{" "}
						<span className="gradient-text">understood.</span>
					</h1>

					{/* Description */}
					<p
						className="text-body-lg animate-fade-up-delay-2"
						style={{
							color: "var(--text-secondary)",
							maxWidth: "560px",
							margin: "0 auto 3.5rem",
						}}
					>
						FocusFolio turns any PDF into an interactive study room — with an AI
						that only knows your material, plus auto-generated quizzes and
						flashcards to accelerate retention.
					</p>

					{/* Stats row */}
					<div
						className="animate-fade-up-delay-3"
						style={{
							display: "flex",
							justifyContent: "center",
							gap: "0",
							flexWrap: "wrap",
						}}
					>
						{stats.map((stat, i) => (
							<div
								key={stat.label}
								style={{
									padding: "0 2.5rem",
									borderRight:
										i < stats.length - 1
											? "1px solid var(--border)"
											: "none",
									textAlign: "center",
								}}
							>
								<p
									style={{
										fontSize: "1.5rem",
										fontWeight: 800,
										letterSpacing: "-0.03em",
										color: "var(--text-primary)",
										margin: "0 0 0.2rem",
									}}
								>
									{stat.value}
								</p>
								<p
									style={{
										fontSize: "0.8125rem",
										color: "var(--text-muted)",
										margin: 0,
									}}
								>
									{stat.label}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ── Divider ── */}
			<div className="divider" />

			{/* ── Workspace Preview ── */}
			<section style={{ padding: "5rem 1.5rem", background: "var(--neutral-50)" }}>
				<div className="container">
					{/* Section label */}
					<p
						style={{
							fontSize: "0.75rem",
							fontWeight: 700,
							letterSpacing: "0.1em",
							textTransform: "uppercase",
							color: "var(--text-muted)",
							marginBottom: "1rem",
							textAlign: "center",
						}}
					>
						Inside a Study Room
					</p>
					<h2
						className="text-heading-1"
						style={{
							textAlign: "center",
							marginBottom: "3.5rem",
							color: "var(--text-primary)",
						}}
					>
						A split workspace built for focus
					</h2>

					{/* Workspace mockup */}
					<div
						style={{
							border: "1px solid var(--border)",
							borderRadius: "var(--radius-xl)",
							overflow: "hidden",
							boxShadow: "var(--shadow-xl)",
							background: "var(--neutral-0)",
							maxWidth: "900px",
							margin: "0 auto",
						}}
					>
						{/* Window chrome */}
						<div
							style={{
								padding: "0.875rem 1.25rem",
								borderBottom: "1px solid var(--border)",
								display: "flex",
								alignItems: "center",
								gap: "0.5rem",
								background: "var(--neutral-50)",
							}}
						>
							<span style={{ width: 10, height: 10, borderRadius: "50%", background: "#fca5a5", display: "inline-block" }} />
							<span style={{ width: 10, height: 10, borderRadius: "50%", background: "#fcd34d", display: "inline-block" }} />
							<span style={{ width: 10, height: 10, borderRadius: "50%", background: "#86efac", display: "inline-block" }} />
							<span
								style={{
									flex: 1,
									textAlign: "center",
									fontSize: "0.75rem",
									color: "var(--text-muted)",
									fontFamily: "monospace",
								}}
							>
								focusfolio.app/room/biochem-ch4
							</span>
						</div>

						{/* ── Mobile panel switcher (visible only on small screens) ── */}
						<div className="flex md:hidden border-b border-border bg-white">
							{[
								{ label: "📄 Document", active: false },
								{ label: "📖 Study Tools", active: true },
							].map(({ label, active }) => (
								<div
									key={label}
									style={{
										flex: 1,
										padding: "0.75rem 0.5rem",
										textAlign: "center",
										fontSize: "0.8125rem",
										fontWeight: active ? 600 : 400,
										color: active ? "var(--brand-600)" : "var(--text-muted)",
										borderBottom: active ? "2px solid var(--brand-500)" : "2px solid transparent",
										cursor: "default",
									}}
								>
									{label}
								</div>
							))}
						</div>

						{/* Split layout preview */}
						<div className="flex flex-col md:flex-row" style={{ minHeight: "320px" }}>

							{/* Left: PDF panel — hidden on mobile, visible on md+ */}
							<div
								className="hidden md:flex flex-col"
								style={{
									flex: "0 0 42%",
									borderRight: "1px solid var(--border)",
									padding: "1.25rem",
									gap: "0.5rem",
								}}
							>
								<p
									style={{
										fontSize: "0.6875rem",
										fontWeight: 600,
										textTransform: "uppercase",
										letterSpacing: "0.08em",
										color: "var(--text-muted)",
										margin: "0 0 0.75rem",
									}}
								>
									PDF Viewer
								</p>
								{/* Fake PDF lines */}
								{[100, 85, 92, 60, 80, 70, 90, 55, 78, 65, 88, 50].map((w, i) => (
									<div
										key={i}
										style={{
											height: "8px",
											width: `${w}%`,
											background: i % 5 === 0 ? "var(--brand-100)" : "var(--neutral-100)",
											borderRadius: "4px",
										}}
									/>
								))}
							</div>

							{/* Right: Tools panel — full width on mobile, 58% on desktop */}
							<div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
								{/* Tabs */}
								<div
									style={{
										display: "flex",
										borderBottom: "1px solid var(--border)",
										padding: "0 1.25rem",
									}}
								>
									{["Chat", "Quiz", "Flashcards"].map((tab, i) => (
										<div
											key={tab}
											style={{
												padding: "0.75rem 1rem",
												fontSize: "0.8125rem",
												fontWeight: i === 0 ? 600 : 400,
												color: i === 0 ? "var(--brand-600)" : "var(--text-muted)",
												borderBottom: i === 0 ? "2px solid var(--brand-500)" : "2px solid transparent",
												cursor: "default",
											}}
										>
											{tab}
										</div>
									))}
								</div>

								{/* Chat messages */}
								<div
									style={{
										flex: 1,
										padding: "1.25rem",
										display: "flex",
										flexDirection: "column",
										gap: "0.75rem",
									}}
								>
									{/* User message */}
									<div style={{ display: "flex", justifyContent: "flex-end" }}>
										<div
											style={{
												background: "var(--brand-500)",
												color: "#fff",
												borderRadius: "12px 12px 2px 12px",
												padding: "0.5rem 0.875rem",
												fontSize: "0.8125rem",
												maxWidth: "75%",
											}}
										>
											What is the role of ATP synthase?
										</div>
									</div>
									{/* AI message */}
									<div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
										<div
											style={{
												width: 26,
												height: 26,
												borderRadius: "50%",
												background: "var(--brand-50)",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												fontSize: "0.75rem",
												flexShrink: 0,
											}}
										>
											✦
										</div>
										<div
											style={{
												background: "var(--neutral-100)",
												borderRadius: "2px 12px 12px 12px",
												padding: "0.5rem 0.875rem",
												fontSize: "0.8125rem",
												color: "var(--text-primary)",
												maxWidth: "80%",
												lineHeight: 1.5,
											}}
										>
											Based on your document, ATP synthase is an enzyme located in the inner mitochondrial membrane that synthesizes ATP from ADP and Pi using the proton gradient...
										</div>
									</div>
									{/* Input area */}
									<div
										style={{
											marginTop: "auto",
											display: "flex",
											gap: "0.5rem",
											padding: "0.625rem 0.75rem",
											border: "1px solid var(--border)",
											borderRadius: "var(--radius-full)",
											background: "var(--neutral-50)",
										}}
									>
										<span style={{ flex: 1, fontSize: "0.8125rem", color: "var(--text-muted)" }}>
											Ask about this document…
										</span>
										<span
											style={{
												width: 24,
												height: 24,
												background: "var(--brand-500)",
												borderRadius: "50%",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												color: "#fff",
												fontSize: "0.75rem",
											}}
										>
											↑
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ── Divider ── */}
			<div className="divider" />

			{/* ── Features ── */}
			<section style={{ padding: "5rem 1.5rem" }}>
				<div className="container">
					<p
						style={{
							fontSize: "0.75rem",
							fontWeight: 700,
							letterSpacing: "0.1em",
							textTransform: "uppercase",
							color: "var(--text-muted)",
							marginBottom: "1rem",
							textAlign: "center",
						}}
					>
						What&apos;s included
					</p>
					<h2
						className="text-heading-1"
						style={{
							textAlign: "center",
							marginBottom: "3rem",
							color: "var(--text-primary)",
						}}
					>
						Built around how you actually study
					</h2>

					<div className="features-grid">
						{features.map((feature) => (
							<div
								key={feature.label}
								style={{
									padding: "1.75rem",
									borderRadius: "var(--radius-lg)",
									border: "1px solid var(--border)",
									background: "var(--neutral-0)",
									display: "flex",
									flexDirection: "column",
									gap: "0.75rem",
									transition: "box-shadow 0.2s, transform 0.2s",
								}}
								className="card"
							>
								<span style={{ fontSize: "1.375rem", lineHeight: 1 }}>{feature.icon}</span>
								<h3
									style={{
										fontSize: "0.9375rem",
										fontWeight: 600,
										color: "var(--text-primary)",
										margin: 0,
									}}
								>
									{feature.label}
								</h3>
								<p
									style={{
										fontSize: "0.875rem",
										color: "var(--text-secondary)",
										lineHeight: 1.6,
										margin: 0,
									}}
								>
									{feature.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ── Divider ── */}
			<div className="divider" />

			{/* ── How it works ── */}
			<section style={{ padding: "5rem 1.5rem", background: "var(--neutral-50)" }}>
				<div className="container-narrow">
					<p
						style={{
							fontSize: "0.75rem",
							fontWeight: 700,
							letterSpacing: "0.1em",
							textTransform: "uppercase",
							color: "var(--text-muted)",
							marginBottom: "1rem",
							textAlign: "center",
						}}
					>
						How it works
					</p>
					<h2
						className="text-heading-1"
						style={{
							textAlign: "center",
							marginBottom: "3rem",
							color: "var(--text-primary)",
						}}
					>
						From document to exam-ready in minutes
					</h2>

					<div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border)" }}>
						{[
							{
								step: "01",
								title: "Create a Study Room",
								desc: "Name it after your topic. Each room is completely isolated — its AI only knows what you upload.",
							},
							{
								step: "02",
								title: "Upload your PDF",
								desc: "Drop in your lecture notes, textbook chapter, or research paper. The system processes and indexes it automatically.",
							},
							{
								step: "03",
								title: "Read, Chat & Generate",
								desc: "Use the side-by-side reader while chatting with the AI. Generate a quiz or flashcard deck whenever you're ready to test yourself.",
							},
						].map((item) => (
							<div
								key={item.step}
								style={{
									display: "flex",
									gap: "1.5rem",
									padding: "1.75rem 2rem",
									background: "var(--neutral-0)",
									alignItems: "flex-start",
								}}
							>
								<span
									style={{
										fontSize: "0.75rem",
										fontWeight: 700,
										color: "var(--brand-500)",
										letterSpacing: "0.05em",
										minWidth: "2rem",
										paddingTop: "0.125rem",
									}}
								>
									{item.step}
								</span>
								<div>
									<h3
										style={{
											fontSize: "0.9375rem",
											fontWeight: 600,
											color: "var(--text-primary)",
											marginBottom: "0.375rem",
										}}
									>
										{item.title}
									</h3>
									<p
										style={{
											fontSize: "0.875rem",
											color: "var(--text-secondary)",
											lineHeight: 1.6,
											margin: 0,
										}}
									>
										{item.desc}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>
		</>
	);
}
