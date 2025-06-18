"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePlayerStore } from "@/lib/store";
import { fetchLyrics, getCurrentLyricIndex } from "@/lib/audio-utils";
import { Music } from "lucide-react";
import type { LyricLine } from "@/lib/store";

export function Lyrics() {
    const { currentSong, currentTime, showLyrics } = usePlayerStore();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [userScrolled, setUserScrolled] = useState(false);
    const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
    const [lyrics, setLyrics] = useState<LyricLine[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Detect user scroll
    useEffect(() => {
        const scrollArea = scrollRef.current;
        if (!scrollArea) return;
        const handleScroll = () => {
            setUserScrolled(true);
            if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
            scrollTimeout.current = setTimeout(
                () => setUserScrolled(false),
                3000
            );
        };
        scrollArea.addEventListener("scroll", handleScroll);
        return () => {
            scrollArea.removeEventListener("scroll", handleScroll);
            if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        };
    }, []);

    useEffect(() => {
        if (!currentSong) return;

        let cancelled = false;

        const fetchSongLyrics = async () => {
            setLoading(true);
            setError(null);
            try {
                const lines = await fetchLyrics(
                    currentSong.title,
                    currentSong.artist,
                    currentSong.duration
                );
                if (!cancelled) {
                    console.log("Setting lyrics:", lines);
                    setLyrics(lines);
                }
            } catch (e) {
                if (!cancelled) {
                    console.error("Error loading lyrics:", e);
                    setError("Could not fetch lyrics.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchSongLyrics();
        return () => {
            cancelled = true;
        };
    }, [currentSong]);

    const currentLyricIndex = getCurrentLyricIndex(lyrics, currentTime);

    useEffect(() => {
        if (userScrolled) return;
        if (scrollRef.current && currentLyricIndex >= 0) {
            const element = scrollRef.current.querySelector(
                `[data-index="${currentLyricIndex}"]`
            );
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }
    }, [currentLyricIndex, userScrolled]);

    // Now we can safely return early after all hooks have been called
    if (!showLyrics || !currentSong) return null;
    if (loading)
        return (
            <div className="flex items-center justify-center h-full">
                Loading lyrics...
            </div>
        );
    if (error)
        return (
            <div className="flex items-center justify-center h-full text-red-500">
                {error}
            </div>
        );
    if (lyrics.length === 0) {
        return (
            <motion.div
                className="p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="p-8 text-center">
                    <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No lyrics available</p>
                </Card>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="flex-1 p-6 h-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="p-4 h-full w-full flex flex-col bg-transparent shadow-none">
                <div className="flex items-center gap-2 mb-4 justify-center">
                    <Music className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Lyrics</h3>
                </div>
                <ScrollArea
                    className="flex-1 h-full w-full flex items-center justify-center"
                    ref={scrollRef}
                >
                    <div className="flex flex-col items-center justify-center w-full h-full">
                        {lyrics.map((line, index) => (
                            <motion.p
                                key={index}
                                data-index={index}
                                className={`text-lg md:text-2xl text-center leading-relaxed transition-all duration-300 w-full py-1 px-2 rounded-lg
                                    ${
                                        index === currentLyricIndex
                                            ? "text-primary font-bold scale-110 shadow-lg animate-glow bg-gradient-to-r from-purple-500/30 to-pink-500/30"
                                            : index < currentLyricIndex
                                            ? "text-muted-foreground/60"
                                            : "text-foreground"
                                    }`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{
                                    opacity:
                                        index === currentLyricIndex ? 1 : 0.7,
                                    y: 0,
                                }}
                                transition={{ duration: 0.4, type: "spring" }}
                                style={{
                                    filter:
                                        index === currentLyricIndex
                                            ? "drop-shadow(0 0 12px #e879f9) drop-shadow(0 0 24px #a21caf)"
                                            : undefined,
                                    textShadow:
                                        index === currentLyricIndex
                                            ? "0 0 16px #e879f9, 0 0 32px #a21caf"
                                            : undefined,
                                }}
                            >
                                {line.text}
                            </motion.p>
                        ))}
                    </div>
                </ScrollArea>
            </Card>
        </motion.div>
    );
}
