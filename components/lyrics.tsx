"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/lib/store";
import { fetchLyrics, getCurrentLyricIndex, detectTimingIssues, adjustLyricTiming, formatTime } from "@/lib/audio-utils";
import { Music, Settings, RefreshCw, Clock, Play } from "lucide-react";
import type { LyricLine } from "@/lib/store";

export function Lyrics() {
    const { currentSong, currentTime, showLyrics, seekToTime } = usePlayerStore();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [userScrolled, setUserScrolled] = useState(false);
    const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
    const [lyrics, setLyrics] = useState<LyricLine[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showTimingTools, setShowTimingTools] = useState(false);
    const [hoveredLine, setHoveredLine] = useState<number | null>(null);
    const [clickedLine, setClickedLine] = useState<number | null>(null);
    const [timingIssues, setTimingIssues] = useState<{
        issues: string[];
        suggestions: { index: number; currentTime: number; suggestedTime: number; reason: string }[];
    }>({ issues: [], suggestions: [] });

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

    // Fetch lyrics when song changes
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
                    
                    // Analyze timing issues
                    if (lines.length > 0) {
                        const analysis = detectTimingIssues(lines, currentSong.duration);
                        setTimingIssues(analysis);
                        if (analysis.issues.length > 0) {
                            console.log("Timing issues detected:", analysis.issues);
                        }
                    }
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

    // Auto-scroll to current lyric
    useEffect(() => {
        if (userScrolled) return;
        if (scrollRef.current && currentLyricIndex >= 0) {
            const element = scrollRef.current.querySelector(
                `[data-index="${currentLyricIndex}"]`
            );
            if (element) {
                element.scrollIntoView({ 
                    behavior: "smooth", 
                    block: "center",
                    inline: "nearest"
                });
            }
        }
    }, [currentLyricIndex, userScrolled]);

    // Handle lyric line click for seeking
    const handleLyricClick = (line: LyricLine, index: number) => {
        console.log("Seeking to time:", line.time);
        setClickedLine(index);
        seekToTime(line.time);
        
        // Visual feedback - remove clicked state after animation
        setTimeout(() => setClickedLine(null), 1000);
    };

    // Handle manual timing adjustments
    const handleApplyTimingSuggestions = () => {
        if (timingIssues.suggestions.length === 0) return;
        
        const adjustments = timingIssues.suggestions.map(suggestion => ({
            index: suggestion.index,
            newTime: suggestion.suggestedTime
        }));
        
        const adjustedLyrics = adjustLyricTiming(lyrics, adjustments);
        setLyrics(adjustedLyrics);
        
        // Re-analyze after adjustments
        const newAnalysis = detectTimingIssues(adjustedLyrics, currentSong?.duration || 240);
        setTimingIssues(newAnalysis);
    };

    // Refresh lyrics with different search strategy
    const handleRefreshLyrics = async () => {
        if (!currentSong) return;
        
        setLoading(true);
        setError(null);
        
        try {
            // Try with modified search terms
            const alternativeTitle = currentSong.title
                .replace(/\(.*?\)/g, '') // Remove parentheses
                .replace(/\[.*?\]/g, '') // Remove brackets
                .replace(/feat\..*$/i, '') // Remove featuring
                .trim();
                
            const lines = await fetchLyrics(
                alternativeTitle,
                currentSong.artist?.split(',')[0], // Use only first artist
                currentSong.duration
            );
            
            setLyrics(lines);
            
            if (lines.length > 0) {
                const analysis = detectTimingIssues(lines, currentSong.duration);
                setTimingIssues(analysis);
            }
        } catch (e) {
            console.error("Error refreshing lyrics:", e);
            setError("Could not refresh lyrics.");
        } finally {
            setLoading(false);
        }
    };

    // Early returns after all hooks
    if (!showLyrics || !currentSong) return null;
    
    if (loading) {
        return (
            <motion.div
                className="flex items-center justify-center h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading lyrics...</p>
                </div>
            </motion.div>
        );
    }
    
    if (error) {
        return (
            <motion.div
                className="flex items-center justify-center h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <div className="text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <Button onClick={handleRefreshLyrics} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                    </Button>
                </div>
            </motion.div>
        );
    }
    
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
                    <p className="text-muted-foreground mb-4">No lyrics available</p>
                    <Button onClick={handleRefreshLyrics} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Search Again
                    </Button>
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
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Music className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Interactive Lyrics</h3>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                            Click to jump
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {timingIssues.issues.length > 0 && (
                            <Button
                                onClick={() => setShowTimingTools(!showTimingTools)}
                                variant="outline"
                                size="sm"
                                className="text-xs"
                            >
                                <Settings className="h-3 w-3 mr-1" />
                                Timing ({timingIssues.issues.length})
                            </Button>
                        )}
                        
                        <Button
                            onClick={handleRefreshLyrics}
                            variant="ghost"
                            size="sm"
                            disabled={loading}
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                {/* Timing Issues Panel */}
                <AnimatePresence>
                    {showTimingTools && timingIssues.issues.length > 0 && (
                        <motion.div
                            className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <h4 className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-2">
                                Timing Issues Detected
                            </h4>
                            <ul className="text-xs text-muted-foreground space-y-1 mb-3">
                                {timingIssues.issues.map((issue, index) => (
                                    <li key={index}>• {issue}</li>
                                ))}
                            </ul>
                            {timingIssues.suggestions.length > 0 && (
                                <Button
                                    onClick={handleApplyTimingSuggestions}
                                    size="sm"
                                    variant="outline"
                                    className="text-xs"
                                >
                                    Apply Suggested Fixes ({timingIssues.suggestions.length})
                                </Button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                <ScrollArea
                    className="flex-1 h-full w-full flex items-center justify-center"
                    ref={scrollRef}
                >
                    <div className="flex flex-col items-center justify-center w-full h-full space-y-1">
                        {lyrics.map((line, index) => {
                            const isCurrentLine = index === currentLyricIndex;
                            const isPastLine = index < currentLyricIndex;
                            const isUpcomingLine = index > currentLyricIndex;
                            const isHovered = hoveredLine === index;
                            const isClicked = clickedLine === index;
                            
                            return (
                                <motion.div
                                    key={index}
                                    data-index={index}
                                    className={`group relative text-lg md:text-2xl text-center leading-relaxed transition-all duration-500 w-full py-3 px-4 rounded-lg cursor-pointer select-none
                                        ${isCurrentLine
                                            ? "text-primary font-bold scale-110 shadow-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20"
                                            : isPastLine
                                            ? "text-muted-foreground/40 scale-95 hover:text-muted-foreground/70 hover:scale-100"
                                            : isUpcomingLine
                                            ? "text-foreground/70 scale-100 hover:text-foreground hover:scale-105"
                                            : "text-foreground/70 hover:text-foreground hover:scale-105"
                                        }
                                        ${isHovered ? "bg-muted/30" : ""}
                                        ${isClicked ? "bg-primary/30 scale-105" : ""}
                                    `}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{
                                        opacity: isCurrentLine ? 1 : isPastLine ? 0.4 : 0.7,
                                        y: 0,
                                        scale: isCurrentLine ? 1.05 : isPastLine ? 0.95 : isHovered ? 1.02 : 1,
                                    }}
                                    transition={{ 
                                        duration: 0.4, 
                                        type: "spring",
                                        stiffness: 100,
                                        damping: 15
                                    }}
                                    style={{
                                        filter: isCurrentLine
                                            ? "drop-shadow(0 0 12px #e879f9) drop-shadow(0 0 24px #a21caf)"
                                            : undefined,
                                        textShadow: isCurrentLine
                                            ? "0 0 16px #e879f9, 0 0 32px #a21caf"
                                            : undefined,
                                    }}
                                    onClick={() => handleLyricClick(line, index)}
                                    onMouseEnter={() => setHoveredLine(index)}
                                    onMouseLeave={() => setHoveredLine(null)}
                                    whileHover={{ scale: isCurrentLine ? 1.05 : 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {line.text}
                                    
                                    {/* Hover timestamp indicator */}
                                    <AnimatePresence>
                                        {(isHovered || showTimingTools) && (
                                            <motion.div
                                                className="absolute -right-2 -top-2 flex items-center gap-1 bg-black/80 text-white text-xs px-2 py-1 rounded-full shadow-lg"
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <Clock className="h-3 w-3" />
                                                {formatTime(line.time)}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Click to play indicator */}
                                    <AnimatePresence>
                                        {isHovered && !isCurrentLine && (
                                            <motion.div
                                                className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-primary/80 text-primary-foreground text-xs px-2 py-1 rounded-full shadow-lg"
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <Play className="h-3 w-3" />
                                                Jump
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Click feedback animation */}
                                    <AnimatePresence>
                                        {isClicked && (
                                            <motion.div
                                                className="absolute inset-0 border-2 border-primary rounded-lg"
                                                initial={{ opacity: 1, scale: 1 }}
                                                animate={{ opacity: 0, scale: 1.1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.6 }}
                                            />
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                </ScrollArea>

                {/* Instructions footer */}
                <motion.div
                    className="mt-4 text-center text-xs text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 0.5 }}
                >
                    <p>💡 Click any lyric line to jump to that moment in the song</p>
                </motion.div>
            </Card>
        </motion.div>
    );
}