import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
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
			<SignIn path="/sign-in" />
		</div>
	);
}
