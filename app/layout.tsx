"use client";

import "./globals.css";
import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { useState, useEffect } from "react";

const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"] });

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={
                    jetBrainsMono.className +
                    " bg-background-50 text-text-900 dark:bg-background-900 dark:text-text-50"
                }
                suppressHydrationWarning
            >
                {mounted ? (
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="dark"
                        enableSystem
                        disableTransitionOnChange
                    >
                        {children}
                        <Toaster />
                    </ThemeProvider>
                ) : (
                    <div className="min-h-screen bg-background">{children}</div>
                )}
            </body>
        </html>
    );
}
