import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, Eye, EyeOff } from "lucide-react";
import { UserDropdownMenu } from "./user-dropdown-menu";
import { useActiveCandidate } from "@/components/map/active-candidate-context";

export function Navbar() {
	const [isFullscreen, setIsFullscreen] = useState(false);
	const { showCard, setShowCard } = useActiveCandidate();

	useEffect(() => {
		const handler = () => setIsFullscreen(!!document.fullscreenElement);
		document.addEventListener('fullscreenchange', handler);
		return () => document.removeEventListener('fullscreenchange', handler);
	}, []);

	const toggleFullscreen = () => {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen();
		} else {
			document.exitFullscreen();
		}
	};

	return (
		<>
			<Button mode="icon" variant="outline" onClick={() => setShowCard(!showCard)} title={showCard ? 'Ocultar card' : 'Exibir card'}>
				{showCard ? <Eye /> : <EyeOff />}
			</Button>
			<Button mode="icon" variant="outline" onClick={toggleFullscreen}>
				{isFullscreen ? <Minimize2 /> : <Maximize2 />}
			</Button>
			<UserDropdownMenu />
		</>
	);
}
