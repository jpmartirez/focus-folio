import { Show } from "@clerk/nextjs";
import LandingPage from "./components/LandingPage";

export default function Home() {
	return (
		<>
			<Show when="signed-out">
				<LandingPage />
			</Show>
		</>
	);
}
