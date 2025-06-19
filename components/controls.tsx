"use client";

import {
    SkipBack,
    Play,
    Pause,
    SkipForward,
    Repeat,
    Repeat1,
    Shuffle,
    Volume2,
    VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { usePlayerStore } from "@/lib/store";
import { motion } from "framer-motion";

export function Controls() {
    const {
        isPlaying,
        volume,
        repeat,
        shuffle,
        togglePlay,
        nextSong,
        prevSong,
        setVolume,
        setRepeat,
        toggleShuffle,
    } = usePlayerStore();

    const toggleRepeat = () => {
        const modes: Array<"none" | "one" | "all"> = ["none", "one", "all"];
        const currentIndex = modes.indexOf(repeat);
        const nextMode = modes[(currentIndex + 1) % modes.length];
        setRepeat(nextMode);
    };

    const RepeatIcon = repeat === "one" ? Repeat1 : Repeat;

    return (
        <motion.div
            className="flex flex-wrap items-center justify-center gap-2 sm:gap-6 px-1 py-2 sm:px-6 sm:py-4"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
        >
            {/* Repeat button - Left */}
            <div className="flex items-center gap-1 sm:gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 sm:h-10 sm:w-10 border-primary text-primary transition-colors p-0"
                    onClick={toggleRepeat}
                >
                    <RepeatIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
            </div>

            {/* Main controls - Center */}
            <div className="flex items-center gap-1 sm:gap-3">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={prevSong}
                    className="h-8 w-8 sm:h-10 sm:w-10 border-primary text-primary transition-colors bg-transparent hover:bg-primary-300 p-0"
                >
                    <SkipBack className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <Button
                    variant="default"
                    size="icon"
                    onClick={togglePlay}
                    className="bg-primary-300 text-primary-foreground shadow-lg border-0 hover:bg-primary-400 transition-all duration-200 w-12 h-12 sm:w-16 sm:h-16 p-0 flex items-center justify-center rounded-full text-2xl sm:text-3xl"
                >
                    <div className="relative z-20 flex items-center justify-center">
                        {isPlaying ? (
                            <Pause className="h-6 w-6 sm:h-8 sm:w-8" />
                        ) : (
                            <Play className="h-6 w-6 ml-1 sm:h-8 sm:w-8" />
                        )}
                    </div>
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={nextSong}
                    className="h-8 w-8 sm:h-10 sm:w-10 border-primary text-primary transition-colors bg-transparent hover:bg-primary-300 p-0"
                >
                    <SkipForward className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
            </div>

            {/* Shuffle button - Right */}
            <div className="flex items-center gap-1 sm:gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleShuffle}
                    className="h-8 w-8 sm:h-10 sm:w-10 border-primary text-primary transition-colors p-0"
                >
                    <Shuffle className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
            </div>

            {/* Volume control - Right (hidden on mobile) */}
            <div className="hidden sm:flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setVolume(volume > 0 ? 0 : 1)}
                    className="hover:bg-primary/10 transition-colors text-muted-foreground hover:text-foreground"
                >
                    {volume > 0 ? (
                        <Volume2 className="h-4 w-4" />
                    ) : (
                        <VolumeX className="h-4 w-4" />
                    )}
                </Button>

                <div className="w-24">
                    <Slider
                        value={[volume]}
                        max={1}
                        step={0.01}
                        onValueChange={(value) => setVolume(value[0])}
                        className="w-full cursor-pointer"
                    />
                </div>
            </div>
        </motion.div>
    );
}
