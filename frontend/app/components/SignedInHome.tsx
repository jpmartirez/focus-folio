export default function SignedInHome() {
	return (
		<div
			style={{
				flex: 1,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				minHeight: "calc(100vh - 64px - 73px)",
			}}
		>
			<p
				style={{
					fontSize: "1.125rem",
					fontWeight: 500,
					color: "var(--text-secondary)",
					letterSpacing: "-0.01em",
				}}
			>
				Home Page
			</p>
		</div>
	);
}
