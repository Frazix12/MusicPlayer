import * as musicMetadata from "music-metadata-browser";
import { Song, LyricLine } from "./store";
// @ts-ignore
import { SyncLyrics } from "@stef-0012/synclyrics";

// Configure SyncLyrics with CORS proxy
const corsProxy = "https://corsproxy.io/?";
const lyricsManager = new SyncLyrics({
    cache: new Map(),
    logLevel: "none",
    sources: ["lrclib", "netease"], // Temporarily remove musixmatch due to CORS
    instrumentalLyricsIndicator: "",
});

// Add custom fetch function to handle CORS
const fetchWithCORS = async (url: string, options: RequestInit = {}) => {
    try {
        const proxyUrl = `${corsProxy}${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl, {
            ...options,
            headers: {
                ...options.headers,
                Origin: window.location.origin,
            },
        });
        return response;
    } catch (error) {
        console.error("Error with CORS proxy:", error);
        throw error;
    }
};

// Initialize lyrics manager with token persistence
let mxmToken: any = null;
// const lyricsManager = new SyncLyrics({
//     cache: new Map(),
//     logLevel: "none",
//     sources: ["musixmatch", "lrclib", "netease"],
//     saveMusixmatchToken: (tokenData: any) => {
//         mxmToken = tokenData;
//         // Optionally persist to localStorage
//         try {
//             localStorage.setItem("mxm_token", JSON.stringify(tokenData));
//         } catch (e) {
//             console.warn("Failed to save Musixmatch token:", e);
//         }
//     },
//     getMusixmatchToken: () => {
//         if (mxmToken) return mxmToken;
//         // Try to restore from localStorage
//         try {
//             const saved = localStorage.getItem("mxm_token");
//             if (saved) {
//                 mxmToken = JSON.parse(saved);
//                 return mxmToken;
//             }
//         } catch (e) {
//             console.warn("Failed to restore Musixmatch token:", e);
//         }
//         return null;
//     },
// });

export interface ParsedMetadata {
    title?: string;
    artist?: string;
    album?: string;
    duration?: number;
    picture?: Uint8Array;
}

export async function parseAudioMetadata(file: File): Promise<ParsedMetadata> {
    try {
        const metadata = await musicMetadata.parseBlob(file);

        return {
            title: metadata.common.title,
            artist: metadata.common.artist,
            album: metadata.common.album,
            duration: metadata.format.duration,
            picture: (() => {
                const data = metadata.common.picture?.[0]?.data;
                if (!data) return undefined;
                if (typeof Buffer !== "undefined" && data instanceof Buffer) {
                    return new Uint8Array(
                        data.buffer,
                        data.byteOffset,
                        data.byteLength
                    );
                }
                if (data instanceof Uint8Array) return data;
                return undefined;
            })(),
        };
    } catch (error) {
        console.error("Error parsing metadata:", error);
        return {};
    }
}

export function createSongFromFile(file: File, metadata: ParsedMetadata): Song {
    const audioUrl = URL.createObjectURL(file);
    const id = `${file.name}-${Date.now()}`;

    let albumArt: string | undefined;
    if (metadata.picture) {
        const blob = new Blob([metadata.picture], { type: "image/jpeg" });
        albumArt = URL.createObjectURL(blob);
    }

    return {
        id,
        title: metadata.title || file.name.replace(/\.[^/.]+$/, ""),
        artist: metadata.artist || "Unknown Artist",
        album: metadata.album,
        duration: metadata.duration || 0,
        file,
        audioUrl,
        albumArt,
        lyrics: generateSampleLyrics(metadata.title || file.name), // Placeholder for demo
    };
}

// Sample lyrics generator for demo purposes
function generateSampleLyrics(title: string): LyricLine[] {
    const sampleLyrics = [
        "Music fills the silence",
        "When words are not enough",
        "Let the rhythm guide you",
        "Through the harmony of life",
        "Every beat tells a story",
        "Every note holds a dream",
        "In this moment we are free",
        "Dancing to our own melody",
    ];

    return sampleLyrics.map((text, index) => ({
        time: index * 8, // 8 seconds apart for demo
        text,
    }));
}

export function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Add this helper function to parse LRC time format
function parseLRCTime(timeStr: string): number {
    // Format: [mm:ss.xx] or [mm:ss]
    const match = timeStr.match(/\[(\d{2}):(\d{2})\.?(\d{2})?\]/);
    if (!match) return 0;

    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    const centiseconds = parseInt(match[3] || "0", 10);

    return minutes * 60 + seconds + centiseconds / 100;
}

function distributeLyricTiming(
    lyrics: LyricLine[],
    totalDuration: number = 240
): LyricLine[] {
    // If all times are 0 or very close to 0, redistribute them
    const hasValidTiming = lyrics.some((line) => line.time > 1);
    if (!hasValidTiming) {
        console.log(
            "Redistributing lyric timing over duration:",
            totalDuration
        );
        return lyrics.map((line, index) => ({
            text: line.text,
            // Leave small gaps at start and end
            time:
                totalDuration * 0.1 +
                (index * (totalDuration * 0.8)) / lyrics.length,
        }));
    }
    return lyrics;
}

// Modify fetchLyrics to use alternative sources first
export async function fetchLyrics(
    title: string,
    artist?: string,
    songDuration?: number
) {
    try {
        console.log("Fetching lyrics for:", { title, artist, songDuration });

        // First try with lrclib and netease
        let result = await lyricsManager.getLyrics({
            track: title,
            artist,
            length: songDuration ? songDuration * 1000 : undefined,
        });

        // If no result, try with a basic LRC search
        if (
            !result?.lyrics?.lineSynced?.lyrics &&
            !result?.lyrics?.plain?.lyrics
        ) {
            try {
                const searchUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(
                    title
                )}&artist_name=${encodeURIComponent(artist || "")}`;
                const response = await fetchWithCORS(searchUrl);
                const searchResult = await response.json();

                if (searchResult?.[0]?.syncedLyrics) {
                    result = {
                        artist: artist || "",
                        track: title,
                        album: "",
                        trackId: searchResult[0].id || "",
                        cached: false,
                        lyrics: {
                            lineSynced: {
                                lyrics: searchResult[0].syncedLyrics,
                                source: "lrclib",
                                parse: () =>
                                    parseLRCFormat(
                                        searchResult[0].syncedLyrics
                                    ),
                            },
                            wordSynced: {
                                source: null,
                                lyrics: null,
                            },
                            plain: {
                                source: null,
                                lyrics: null,
                            },
                        },
                    };
                }
            } catch (e) {
                console.warn("Failed to fetch from lrclib:", e);
            }
        }

        // Continue with the rest of the function as before
        if (result?.lyrics?.lineSynced?.lyrics) {
            // Parse the LRC format lyrics manually to ensure correct timing
            const lrcLines = result.lyrics.lineSynced.lyrics.split("\n");
            let parsedLines = lrcLines
                .map((line) => {
                    const timeMatch = line.match(
                        /^\[(\d{2}:\d{2}\.\d{2})\](.*)/
                    );
                    if (!timeMatch) return null;
                    return {
                        time: parseLRCTime(timeMatch[1]),
                        text: timeMatch[2].trim(),
                    };
                })
                .filter(
                    (line): line is LyricLine =>
                        line !== null && line.text !== ""
                );

            console.log("Manual parsed line-synced lyrics:", parsedLines);

            if (parsedLines.length > 0) {
                // Check if timing needs redistribution
                parsedLines = distributeLyricTiming(
                    parsedLines,
                    songDuration || 240
                );
                return parsedLines;
            }
        }

        // Fallback to word-synced lyrics
        if (result?.lyrics?.wordSynced?.lyrics?.length) {
            console.log("Using word-synced lyrics");
            let wordSyncedLines = result.lyrics.wordSynced.lyrics
                .map((line) => ({
                    time: line.start,
                    text: line.lyric.trim(),
                }))
                .filter((line) => line.text);

            // Check if timing needs redistribution
            wordSyncedLines = distributeLyricTiming(
                wordSyncedLines,
                songDuration || 240
            );
            console.log("Processed word-synced lyrics:", wordSyncedLines);
            return wordSyncedLines;
        }

        // Final fallback to plain lyrics
        if (result?.lyrics?.plain?.lyrics) {
            console.log("Using plain lyrics");
            const lines = result.lyrics.plain.lyrics
                .split("\n")
                .filter((text) => text.trim());

            // Distribute plain lyrics over song duration
            const duration = songDuration || 240; // default 4 minutes if duration unknown
            const lyricsWithTiming = lines.map((text, i) => ({
                time: duration * 0.1 + (i * (duration * 0.8)) / lines.length, // Leave gaps at start/end
                text: text.trim(),
            }));

            console.log("Generated timing for plain lyrics:", lyricsWithTiming);
            return lyricsWithTiming;
        }

        console.log("No lyrics found");
        return [];
    } catch (e) {
        console.error("Error fetching lyrics:", e);
        return [];
    }
}

export function getCurrentLyricIndex(
    lyrics: LyricLine[],
    currentTime: number
): number {
    if (!lyrics.length) return -1;

    console.log(
        "Current time:",
        currentTime,
        "Checking against lyrics:",
        lyrics
    );

    // Find the current lyric - the last one that started before or at current time
    for (let i = lyrics.length - 1; i >= 0; i--) {
        if (currentTime >= lyrics[i].time) {
            // For the last lyric, keep it visible until 30 seconds after it starts
            if (i === lyrics.length - 1) {
                if (currentTime <= lyrics[i].time + 30) {
                    console.log("Showing last lyric at index:", i);
                    return i;
                }
                break;
            }

            // For other lyrics, show until the next lyric starts
            if (i < lyrics.length - 1) {
                if (currentTime < lyrics[i + 1].time) {
                    console.log("Showing lyric index:", i);
                    return i;
                }
            }
        }
    }

    // If we're before the first lyric
    if (lyrics[0] && currentTime < lyrics[0].time) {
        console.log("Before first lyric");
        return -1;
    }

    // Keep showing the last lyric if we're near the end of the song
    const lastLyricIndex = lyrics.length - 1;
    if (lastLyricIndex >= 0 && currentTime >= lyrics[lastLyricIndex].time) {
        console.log("Keeping last lyric visible");
        return lastLyricIndex;
    }

    console.log("No matching lyric found");
    return -1;
}

// Fetch additional metadata from external APIs (placeholder implementation)
export async function fetchEnhancedMetadata(
    song: Song
): Promise<Partial<Song>> {
    // In a real implementation, you would call MusicBrainz API, Cover Art Archive, etc.
    // For now, return empty object as this requires CORS setup and API keys
    return {};
}

// Helper function to parse LRC format
function parseLRCFormat(lrcText: string) {
    return lrcText
        .split("\n")
        .map((line) => {
            const timeMatch = line.match(/^\[(\d{2}:\d{2}\.\d{2})\](.*)/);
            if (!timeMatch) return null;
            return {
                time: parseLRCTime(timeMatch[1]),
                text: timeMatch[2].trim(),
            };
        })
        .filter((line): line is LyricLine => line !== null && line.text !== "");
}
