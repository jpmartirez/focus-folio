import { Show } from "@clerk/nextjs";
import LandingPage from "./components/LandingPage";
import SignedInHome from "./components/SignedInHome";

export default function Home() {
	return (
		<>
			<Show when="signed-out">
				<LandingPage />
			</Show>

			<Show when="signed-in">
				<SignedInHome />
			</Show>
		</>
	);
}
