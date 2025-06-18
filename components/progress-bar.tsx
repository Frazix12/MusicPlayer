"use client";

import { useEffect, useRef, useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import { usePlayerStore } from "@/lib/store";
import { formatTime } from "@/lib/audio-utils";
import { motion } from "framer-motion";

export function ProgressBar() {
    const {
        currentSong,
        isPlaying,
        currentTime,
        setCurrentTime,
        setIsPlaying,
        volume,
        nextSong,
        repeat,
    } = usePlayerStore();

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const currentSongIdRef = useRef<string | null>(null);

    // Define stable function references using useCallback
    const updateTime = useCallback(() => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    }, [setCurrentTime]);

    const handleEnded = useCallback(() => {
        if (repeat === "one") {
            // Repeat current song
            setCurrentTime(0);
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play();
            }
        } else {
            // Always try to go to next song
            nextSong();
            setIsPlaying(true);
        }
    }, [setCurrentTime, setIsPlaying, nextSong, repeat]);

    // Only create new audio element when song changes
    useEffect(() => {
        if (!currentSong || currentSong.id === currentSongIdRef.current) return;

        // Clean up previous audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.removeEventListener("timeupdate", updateTime);
            audioRef.current.removeEventListener("loadedmetadata", updateTime);
            audioRef.current.removeEventListener("ended", handleEnded);
        }

        // Create new audio element
        audioRef.current = new Audio(currentSong.audioUrl);
        currentSongIdRef.current = currentSong.id;

        const audio = audioRef.current;

        audio.addEventListener("timeupdate", updateTime);
        audio.addEventListener("loadedmetadata", updateTime);
        audio.addEventListener("ended", handleEnded);

        // Set volume
        audio.volume = volume;

        return () => {
            if (audio) {
                audio.removeEventListener("timeupdate", updateTime);
                audio.removeEventListener("loadedmetadata", updateTime);
                audio.removeEventListener("ended", handleEnded);
            }
        };
    }, [currentSong, currentSong?.id, volume, updateTime, handleEnded]);

    // Handle play/pause state changes and song changes
    useEffect(() => {
        if (!audioRef.current) return;

        if (isPlaying) {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch((error) => {
                    console.error("Error playing audio:", error);
                    setIsPlaying(false); // Update state if play fails
                });
            }
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying, setIsPlaying, currentSong]);

    // Handle volume changes
    useEffect(() => {
        if (!audioRef.current) return;
        audioRef.current.volume = volume;
    }, [volume]);

    // Handle seeking
    useEffect(() => {
        if (!audioRef.current) return;

        // Only update audio time if there's a significant difference
        // This prevents feedback loops
        const timeDiff = Math.abs(audioRef.current.currentTime - currentTime);
        if (timeDiff > 0.5) {
            audioRef.current.currentTime = currentTime;
        }
    }, [currentTime]);

    const handleSeek = (value: number[]) => {
        const newTime = value[0];
        setCurrentTime(newTime);
    };

    if (!currentSong) return null;

    // Use the actual audio duration if available, fallback to song.duration
    const duration = audioRef.current?.duration || currentSong.duration || 0;

    return (
        <motion.div
            className="w-full px-6 py-4"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="mb-3">
                <Slider
                    value={[currentTime]}
                    max={duration}
                    step={0.1}
                    onValueChange={handleSeek}
                    className="w-full cursor-pointer [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-purple-500 [&_[role=slider]]:to-pink-500 [&_[role=slider]]:border-0 [&_[role=slider]]:shadow-lg [&_[role=slider]]:cursor-pointer [&_[role=slider]]:w-5 [&_[role=slider]]:h-5 [&_.relative]:cursor-pointer [&_[data-orientation=horizontal]]:cursor-pointer hover:[&_[role=slider]]:scale-110 [&_[role=slider]]:transition-transform"
                />
            </div>

            <div className="flex justify-between text-sm text-muted-foreground">
                <span className="font-medium">{formatTime(currentTime)}</span>
                <span className="font-medium">{formatTime(duration)}</span>
            </div>
        </motion.div>
    );
}
