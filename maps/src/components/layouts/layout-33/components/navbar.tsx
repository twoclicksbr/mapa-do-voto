import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2 } from "lucide-react";
import { UserDropdownMenu } from "./user-dropdown-menu";

export function Navbar() {
	const [isFullscreen, setIsFullscreen] = useState(false);

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
			<Button mode="icon" variant="outline" onClick={toggleFullscreen}>
				{isFullscreen ? <Minimize2 /> : <Maximize2 />}
			</Button>
			<UserDropdownMenu />
		</>
	);
}
