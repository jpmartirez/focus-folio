import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
	return (
		<div
			style={{
				flex: 1,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: "3rem 1.5rem",
				minHeight: "calc(100vh - 64px - 73px)",
				background: "var(--neutral-50)",
			}}
		>
			<SignUp path="/sign-up" />
		</div>
	);
}
