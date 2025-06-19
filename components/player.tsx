"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { usePlayerStore } from "@/lib/store";
import { Music } from "lucide-react";

export function Player() {
    const { currentSong } = usePlayerStore();

    if (!currentSong) {
        return (
            <motion.div
                className="flex flex-col items-center justify-center p-8 text-center"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="w-64 h-64 mb-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 flex items-center justify-center">
                    <Music className="h-20 w-20 text-purple-400/60" />
                </div>
                <p className="text-lg text-muted-foreground">
                    Upload some music to get started
                </p>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="flex flex-col items-center p-2 sm:p-6"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="w-44 h-44 sm:w-64 sm:h-64 mb-4 sm:mb-6 overflow-hidden bg-gradient-to-br from-primary-300 to-primary-100 border-primary-300 rounded-2xl shadow-2xl">
                {currentSong.albumArt ? (
                    <motion.img
                        src={currentSong.albumArt}
                        alt={`${currentSong.title} album art`}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-300 to-primary-100">
                        <Music className="h-20 w-20 text-primary-200" />
                    </div>
                )}
            </Card>

            <motion.div
                className="text-center max-w-xs sm:max-w-sm"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
            >
                <h2 className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2 truncate">
                    {currentSong.title}
                </h2>
                <p className="text-lg text-muted-foreground truncate">
                    {currentSong.artist}
                </p>
                {currentSong.album && (
                    <p className="text-sm text-muted-foreground/80 mt-1 truncate">
                        {currentSong.album}
                    </p>
                )}
            </motion.div>
        </motion.div>
    );
}
