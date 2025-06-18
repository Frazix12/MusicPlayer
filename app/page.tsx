"use client";

import { motion } from "framer-motion";
import { TopBar } from "@/components/top-bar";
import { Player } from "@/components/player";
import { ProgressBar } from "@/components/progress-bar";
import { Controls } from "@/components/controls";
import { Lyrics } from "@/components/lyrics";
import { UploadDialog } from "@/components/upload-dialog";
import { QueueDrawer } from "@/components/queue-drawer";

export default function Home() {
    return (
        <div className="min-h-screen bg-background">
            <TopBar />

            <main className="container mx-auto max-w-7xl">
                <motion.div
                    className="flex flex-col lg:flex-row gap-6 p-6 h-[calc(100vh-64px)]"
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
            </main>

            {/* Dialogs and Drawers */}
            <UploadDialog />
            <QueueDrawer />
        </div>
    );
}
