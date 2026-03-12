import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, MessageSquareCode, Pin, NotebookText, Plus } from "lucide-react";
import { useLayout } from "./context";

export function Navbar() {
	const { isMobile } = useLayout();
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
			<Button mode="icon" variant="outline"><MessageSquareCode /></Button>
			<Button mode="icon" variant="outline"><Pin /></Button>
			{!isMobile ? <Button variant="outline"><NotebookText />Reports</Button> : <Button variant="outline" mode="icon"><NotebookText/></Button>}
			<Button variant="mono"><Plus /> Add</Button>
		</>
  );
}
