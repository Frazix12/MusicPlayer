import { useEffect } from "react";
import { usePlayerStore } from "@/lib/store";

type MediaSessionAction =
    | "play"
    | "pause"
    | "previoustrack"
    | "nexttrack"
    | "seekbackward"
    | "seekforward";

export function useKeyboardControls() {
    const {
        togglePlay,
        nextSong,
        prevSong,
        setVolume,
        volume,
        currentTime,
        currentSong,
        setCurrentTime,
        isPlaying,
        showLyrics,
        setShowLyrics,
        showQueue,
        setShowQueue,
    } = usePlayerStore();

    useEffect(() => {
        function handleKeyPress(event: KeyboardEvent) {
            // Ignore if user is typing in an input or textarea
            if (
                event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement
            ) {
                return;
            }

            // Handle key combinations
            switch (event.key.toLowerCase()) {
                // Playback controls
                case " ":
                    event.preventDefault();
                    togglePlay();
                    break;
                case "k":
                    if (!event.ctrlKey && !event.metaKey) {
                        event.preventDefault();
                        togglePlay();
                    }
                    break;
                case "arrowright":
                    if (event.shiftKey) {
                        nextSong();
                    } else {
                        const newTime = Math.min(
                            currentSong?.duration || 0,
                            currentTime + 5
                        );
                        setCurrentTime(newTime);
                    }
                    break;
                case "arrowleft":
                    if (event.shiftKey) {
                        prevSong();
                    } else {
                        const newTime = Math.max(0, currentTime - 5);
                        setCurrentTime(newTime);
                    }
                    break;
                case "j":
                    if (!event.ctrlKey && !event.metaKey) {
                        const newTime = Math.max(0, currentTime - 10);
                        setCurrentTime(newTime);
                    }
                    break;
                case "l":
                    if (event.ctrlKey || event.metaKey) {
                        return; // Don't handle browser shortcuts
                    }
                    const newTime = Math.min(
                        currentSong?.duration || 0,
                        currentTime + 10
                    );
                    setCurrentTime(newTime);
                    break;

                // Volume controls
                case "arrowup":
                    event.preventDefault();
                    setVolume(Math.min(1, volume + 0.05));
                    break;
                case "arrowdown":
                    event.preventDefault();
                    setVolume(Math.max(0, volume - 0.05));
                    break;
                case "m":
                    if (!event.ctrlKey && !event.metaKey) {
                        setVolume(volume === 0 ? 1 : 0);
                    }
                    break;

                // UI controls
                case "q":
                    if (!event.ctrlKey && !event.metaKey) {
                        setShowQueue(!showQueue);
                    }
                    break;
                case "y":
                    if (!event.ctrlKey && !event.metaKey) {
                        setShowLyrics(!showLyrics);
                    }
                    break;

                // Numeric seek
                default:
                    if (
                        /^[0-9]$/.test(event.key) &&
                        !event.ctrlKey &&
                        !event.metaKey
                    ) {
                        const percent = parseInt(event.key) / 10;
                        if (currentSong) {
                            const newTimePercent =
                                currentSong.duration * percent;
                            setCurrentTime(newTimePercent);
                        }
                    }
            }
        }

        // Set up media session handlers
        if ("mediaSession" in navigator) {
            navigator.mediaSession.setActionHandler(
                "play",
                () => !isPlaying && togglePlay()
            );
            navigator.mediaSession.setActionHandler(
                "pause",
                () => isPlaying && togglePlay()
            );
            navigator.mediaSession.setActionHandler("previoustrack", () =>
                prevSong()
            );
            navigator.mediaSession.setActionHandler("nexttrack", () =>
                nextSong()
            );
            navigator.mediaSession.setActionHandler("seekbackward", () => {
                const newTime = Math.max(0, currentTime - 10);
                setCurrentTime(newTime);
            });
            navigator.mediaSession.setActionHandler("seekforward", () => {
                const newTime = Math.min(
                    currentSong?.duration || 0,
                    currentTime + 10
                );
                setCurrentTime(newTime);
            });
        }

        window.addEventListener("keydown", handleKeyPress);
        return () => {
            window.removeEventListener("keydown", handleKeyPress);
            if ("mediaSession" in navigator) {
                navigator.mediaSession.setActionHandler("play", null);
                navigator.mediaSession.setActionHandler("pause", null);
                navigator.mediaSession.setActionHandler("previoustrack", null);
                navigator.mediaSession.setActionHandler("nexttrack", null);
                navigator.mediaSession.setActionHandler("seekbackward", null);
                navigator.mediaSession.setActionHandler("seekforward", null);
            }
        };
    }, [
        togglePlay,
        nextSong,
        prevSong,
        setVolume,
        volume,
        currentTime,
        currentSong,
        setCurrentTime,
        isPlaying,
        showLyrics,
        setShowLyrics,
        showQueue,
        setShowQueue,
    ]);
}
