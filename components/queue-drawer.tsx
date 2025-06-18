"use client";

import { motion } from "framer-motion";
import { Music, Play, X, Trash2 } from "lucide-react";
import Image from "next/image";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePlayerStore } from "@/lib/store";
import { formatTime } from "@/lib/audio-utils";

export function QueueDrawer() {
    const {
        showQueue,
        setShowQueue,
        queue,
        currentSong,
        playFromQueue,
        removeFromQueue,
    } = usePlayerStore();

    return (
        <Sheet open={showQueue} onOpenChange={setShowQueue}>
            <SheetContent side="right" className="w-80">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <Music className="h-5 w-5" />
                        Playlist ({queue.length})
                    </SheetTitle>
                </SheetHeader>

                <ScrollArea className="h-full mt-6 pr-4">
                    {queue.length === 0 ? (
                        <div className="text-center py-8">
                            <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground">
                                No songs in queue
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {queue.map((song, index) => {
                                const isCurrentSong =
                                    currentSong?.id === song.id;

                                return (
                                    <motion.div
                                        key={song.id}
                                        className={`group flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                                            isCurrentSong
                                                ? "bg-primary/10 border-primary/30"
                                                : "hover:bg-muted/50 border-transparent"
                                        }`}
                                        onClick={() => playFromQueue(index)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{
                                            delay: index * 0.05,
                                            duration: 0.3,
                                        }}
                                    >
                                        <div className="relative flex-shrink-0">
                                            {song.albumArt ? (
                                                <div className="relative w-12 h-12">
                                                    <Image
                                                        src={song.albumArt}
                                                        alt={`${song.title} album art`}
                                                        fill
                                                        className="rounded object-cover"
                                                        sizes="48px"
                                                        priority={index < 3} // Prioritize loading first few images
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                                                    <Music className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                            )}

                                            {isCurrentSong && (
                                                <div className="absolute inset-0 bg-primary/20 rounded flex items-center justify-center">
                                                    <Play className="h-4 w-4 text-primary" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p
                                                className={`font-medium truncate ${
                                                    isCurrentSong
                                                        ? "text-primary"
                                                        : "text-foreground"
                                                }`}
                                            >
                                                {song.title}
                                            </p>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {song.artist}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatTime(song.duration)}
                                            </p>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFromQueue(song.id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
