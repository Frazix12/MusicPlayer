"use client";

import { motion } from "framer-motion";
import { TopBar } from "@/components/top-bar";
import { Player } from "@/components/player";
import { ProgressBar } from "@/components/progress-bar";
import { Controls } from "@/components/controls";
import { Lyrics } from "@/components/lyrics";
import { UploadDialog } from "@/components/upload-dialog";
import { QueueDrawer } from "@/components/queue-drawer";
import { MusicFeed } from "@/components/music-feed";
import { useKeyboardControls } from "@/hooks/use-keyboard-controls";
import { usePlayerStore } from "@/lib/store";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Music, Home, Headphones } from "lucide-react";

export default function Home() {
    const { currentSong } = usePlayerStore();
    const [currentView, setCurrentView] = useState<"feed" | "player">("feed");
    
    // Initialize keyboard controls
    useKeyboardControls();

    // Auto-switch to player view when a song is playing
    const showPlayer = currentSong && currentView === "player";

    return (
        <div className="min-h-screen bg-background">
            <TopBar />

            {/* Navigation Tabs */}
            <div className="border-b bg-background/80 backdrop-blur-md sticky top-16 z-40">
                <div className="container mx-auto max-w-7xl px-6">
                    <div className="flex items-center gap-1">
                        <Button
                            variant={currentView === "feed" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setCurrentView("feed")}
                            className="flex items-center gap-2"
                        >
                            <Home className="h-4 w-4" />
                            Discover
                        </Button>
                        <Button
                            variant={currentView === "player" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setCurrentView("player")}
                            className="flex items-center gap-2"
                            disabled={!currentSong}
                        >
                            <Headphones className="h-4 w-4" />
                            Now Playing
                        </Button>
                    </div>
                </div>
            </div>

            <main className="container mx-auto max-w-7xl">
                {currentView === "feed" ? (
                    <MusicFeed />
                ) : (
                    <motion.div
                        className="flex flex-col lg:flex-row gap-6 p-6 h-[calc(100vh-128px)]"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        {/* Left column - Player and Controls */}
                        <div className="flex-1 flex flex-col space-y-4">
                            <Player />
                            <ProgressBar />
                            <Controls />
                        </div>
                        {/* Right column - Lyrics */}
                        <div className="flex-1 flex flex-col">
                            <Lyrics />
                        </div>
                    </motion.div>
                )}
            </main>

            {/* Dialogs and Drawers */}
            <UploadDialog />
            <QueueDrawer />
        </div>
    );
}