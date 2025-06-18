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
        lyrics: [], // Start with empty lyrics, will be fetched separately
    };
}

export function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Enhanced LRC time parsing with better precision
function parseLRCTime(timeStr: string): number {
    // Support multiple formats: [mm:ss.xx], [mm:ss.xxx], [mm:ss]
    const match = timeStr.match(/\[(\d{1,2}):(\d{2})\.?(\d{1,3})?\]/);
    if (!match) return 0;

    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    const milliseconds = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0;

    return minutes * 60 + seconds + milliseconds / 1000;
}

// Enhanced timing validation and correction
function validateAndCorrectTiming(lyrics: LyricLine[], songDuration: number): LyricLine[] {
    if (!lyrics.length) return lyrics;

    // Sort by time to ensure proper order
    const sortedLyrics = [...lyrics].sort((a, b) => a.time - b.time);
    
    // Remove duplicates and empty lines
    const cleanedLyrics = sortedLyrics.filter((line, index, arr) => {
        if (!line.text.trim()) return false;
        if (index > 0 && Math.abs(line.time - arr[index - 1].time) < 0.1) return false;
        return true;
    });

    // Validate timing bounds
    const validatedLyrics = cleanedLyrics.map(line => ({
        ...line,
        time: Math.max(0, Math.min(line.time, songDuration))
    }));

    // Check for timing gaps and adjust if necessary
    const adjustedLyrics = validatedLyrics.map((line, index, arr) => {
        // If there's a large gap between lines, check if timing seems off
        if (index > 0) {
            const prevLine = arr[index - 1];
            const gap = line.time - prevLine.time;
            
            // If gap is too small (less than 1 second), adjust slightly
            if (gap < 1 && gap > 0) {
                return {
                    ...line,
                    time: prevLine.time + 1
                };
            }
        }
        return line;
    });

    return adjustedLyrics;
}

// Improved timing distribution for plain lyrics
function distributeLyricTiming(lyrics: LyricLine[], totalDuration: number = 240): LyricLine[] {
    if (!lyrics.length) return lyrics;

    // Check if lyrics already have good timing
    const hasValidTiming = lyrics.some((line) => line.time > 1);
    const hasVariedTiming = lyrics.length > 1 && 
        Math.max(...lyrics.map(l => l.time)) - Math.min(...lyrics.map(l => l.time)) > 10;

    if (hasValidTiming && hasVariedTiming) {
        return validateAndCorrectTiming(lyrics, totalDuration);
    }

    console.log("Redistributing lyric timing over duration:", totalDuration);
    
    // More sophisticated distribution
    const startTime = totalDuration * 0.05; // Start at 5% of song
    const endTime = totalDuration * 0.9;    // End at 90% of song
    const availableTime = endTime - startTime;
    
    return lyrics.map((line, index) => {
        // Use exponential distribution for more natural spacing
        const progress = index / (lyrics.length - 1 || 1);
        const adjustedProgress = Math.pow(progress, 0.8); // Slight curve for more natural feel
        
        return {
            text: line.text,
            time: startTime + (adjustedProgress * availableTime),
        };
    });
}

// Enhanced lyrics fetching with better error handling and timing correction
export async function fetchLyrics(
    title: string,
    artist?: string,
    songDuration?: number
): Promise<LyricLine[]> {
    try {
        console.log("Fetching lyrics for:", { title, artist, songDuration });

        // Try multiple search strategies
        const searchStrategies = [
            { track: title, artist },
            { track: title.split('(')[0].trim(), artist }, // Remove parenthetical info
            { track: title.split('-')[0].trim(), artist }, // Remove dash info
            { track: title, artist: artist?.split('feat')[0].trim() }, // Remove featuring info
        ];

        let result = null;

        for (const strategy of searchStrategies) {
            try {
                result = await lyricsManager.getLyrics({
                    ...strategy,
                    length: songDuration ? songDuration * 1000 : undefined,
                });

                if (result?.lyrics?.lineSynced?.lyrics || result?.lyrics?.plain?.lyrics) {
                    console.log("Found lyrics with strategy:", strategy);
                    break;
                }
            } catch (e) {
                console.warn("Strategy failed:", strategy, e);
                continue;
            }
        }

        // Fallback to direct API search
        if (!result?.lyrics?.lineSynced?.lyrics && !result?.lyrics?.plain?.lyrics) {
            try {
                const searchUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(
                    title
                )}&artist_name=${encodeURIComponent(artist || "")}`;
                const response = await fetchWithCORS(searchUrl);
                const searchResults = await response.json();

                if (Array.isArray(searchResults) && searchResults.length > 0) {
                    // Find best match based on duration if available
                    let bestMatch = searchResults[0];
                    if (songDuration) {
                        bestMatch = searchResults.find(r => 
                            Math.abs(r.duration - songDuration) < 10
                        ) || searchResults[0];
                    }

                    if (bestMatch.syncedLyrics) {
                        result = {
                            artist: artist || "",
                            track: title,
                            album: "",
                            trackId: bestMatch.id || "",
                            cached: false,
                            lyrics: {
                                lineSynced: {
                                    lyrics: bestMatch.syncedLyrics,
                                    source: "lrclib",
                                },
                                wordSynced: { source: null, lyrics: null },
                                plain: { source: null, lyrics: null },
                            },
                        };
                    } else if (bestMatch.plainLyrics) {
                        result = {
                            artist: artist || "",
                            track: title,
                            album: "",
                            trackId: bestMatch.id || "",
                            cached: false,
                            lyrics: {
                                lineSynced: { source: null, lyrics: null },
                                wordSynced: { source: null, lyrics: null },
                                plain: {
                                    lyrics: bestMatch.plainLyrics,
                                    source: "lrclib",
                                },
                            },
                        };
                    }
                }
            } catch (e) {
                console.warn("Failed to fetch from lrclib:", e);
            }
        }

        // Process line-synced lyrics with enhanced timing
        if (result?.lyrics?.lineSynced?.lyrics) {
            const lrcLines = result.lyrics.lineSynced.lyrics.split("\n");
            let parsedLines = lrcLines
                .map((line) => {
                    // Support multiple time formats
                    const timeMatch = line.match(/^\[(\d{1,2}:\d{2}\.?\d{0,3})\](.*)/);
                    if (!timeMatch) return null;
                    
                    const text = timeMatch[2].trim();
                    if (!text) return null;
                    
                    return {
                        time: parseLRCTime(`[${timeMatch[1]}]`),
                        text,
                    };
                })
                .filter((line): line is LyricLine => line !== null);

            console.log("Parsed line-synced lyrics:", parsedLines);

            if (parsedLines.length > 0) {
                const validatedLyrics = validateAndCorrectTiming(parsedLines, songDuration || 300);
                return validatedLyrics;
            }
        }

        // Process word-synced lyrics
        if (result?.lyrics?.wordSynced?.lyrics?.length) {
            console.log("Using word-synced lyrics");
            let wordSyncedLines = result.lyrics.wordSynced.lyrics
                .map((line) => ({
                    time: line.start / 1000, // Convert from ms to seconds
                    text: line.lyric.trim(),
                }))
                .filter((line) => line.text);

            const validatedLyrics = validateAndCorrectTiming(wordSyncedLines, songDuration || 300);
            console.log("Processed word-synced lyrics:", validatedLyrics);
            return validatedLyrics;
        }

        // Process plain lyrics with smart timing distribution
        if (result?.lyrics?.plain?.lyrics) {
            console.log("Using plain lyrics");
            const lines = result.lyrics.plain.lyrics
                .split("\n")
                .filter((text) => text.trim())
                .map((text, i) => ({
                    time: 0, // Will be distributed
                    text: text.trim(),
                }));

            const distributedLyrics = distributeLyricTiming(lines, songDuration || 240);
            console.log("Generated timing for plain lyrics:", distributedLyrics);
            return distributedLyrics;
        }

        console.log("No lyrics found");
        return [];
    } catch (e) {
        console.error("Error fetching lyrics:", e);
        return [];
    }
}

// Enhanced current lyric detection with better timing windows
export function getCurrentLyricIndex(
    lyrics: LyricLine[],
    currentTime: number
): number {
    if (!lyrics.length) return -1;

    // Add small buffer for timing precision
    const timeBuffer = 0.2;
    const adjustedTime = currentTime + timeBuffer;

    console.log("Current time:", currentTime, "Adjusted:", adjustedTime);

    // Find the current lyric with improved logic
    for (let i = lyrics.length - 1; i >= 0; i--) {
        const currentLine = lyrics[i];
        const nextLine = lyrics[i + 1];
        
        // Check if we're in the time window for this lyric
        if (adjustedTime >= currentLine.time) {
            // If this is the last lyric, show it for a reasonable duration
            if (!nextLine) {
                const showDuration = Math.min(30, (lyrics[i].text.length / 10) + 5);
                if (currentTime <= currentLine.time + showDuration) {
                    console.log("Showing last lyric at index:", i);
                    return i;
                }
                break;
            }
            
            // Show this lyric until the next one starts (with small overlap)
            if (adjustedTime < nextLine.time + 0.5) {
                console.log("Showing lyric index:", i);
                return i;
            }
        }
    }

    // Special handling for the very beginning
    if (lyrics[0] && currentTime < lyrics[0].time - 2) {
        console.log("Before first lyric");
        return -1;
    }

    // If we're past all lyrics but close to the end, keep showing the last one
    const lastLyric = lyrics[lyrics.length - 1];
    if (lastLyric && currentTime >= lastLyric.time) {
        console.log("Keeping last lyric visible");
        return lyrics.length - 1;
    }

    console.log("No matching lyric found");
    return -1;
}

// Utility function to manually adjust lyric timing
export function adjustLyricTiming(
    lyrics: LyricLine[],
    adjustments: { index: number; newTime: number }[]
): LyricLine[] {
    const adjustedLyrics = [...lyrics];
    
    adjustments.forEach(({ index, newTime }) => {
        if (index >= 0 && index < adjustedLyrics.length) {
            adjustedLyrics[index] = {
                ...adjustedLyrics[index],
                time: Math.max(0, newTime)
            };
        }
    });
    
    // Re-sort and validate after manual adjustments
    return adjustedLyrics.sort((a, b) => a.time - b.time);
}

// Utility to detect and fix common timing issues
export function detectTimingIssues(lyrics: LyricLine[], songDuration: number): {
    issues: string[];
    suggestions: { index: number; currentTime: number; suggestedTime: number; reason: string }[];
} {
    const issues: string[] = [];
    const suggestions: { index: number; currentTime: number; suggestedTime: number; reason: string }[] = [];
    
    if (!lyrics.length) return { issues, suggestions };
    
    // Check for lyrics starting too early
    if (lyrics[0].time < 5) {
        issues.push("First lyric starts very early - might be before vocals begin");
        suggestions.push({
            index: 0,
            currentTime: lyrics[0].time,
            suggestedTime: 8,
            reason: "Move first lyric to after typical intro"
        });
    }
    
    // Check for lyrics ending too early
    const lastLyric = lyrics[lyrics.length - 1];
    if (lastLyric.time < songDuration * 0.7) {
        issues.push("Lyrics end much earlier than song - might be missing verses");
    }
    
    // Check for timing gaps that are too large or too small
    for (let i = 1; i < lyrics.length; i++) {
        const gap = lyrics[i].time - lyrics[i - 1].time;
        
        if (gap < 0.5) {
            issues.push(`Lines ${i - 1} and ${i} are too close together`);
            suggestions.push({
                index: i,
                currentTime: lyrics[i].time,
                suggestedTime: lyrics[i - 1].time + 2,
                reason: "Add minimum gap between lines"
            });
        } else if (gap > 30) {
            issues.push(`Large gap between lines ${i - 1} and ${i} - might be missing lyrics`);
        }
    }
    
    return { issues, suggestions };
}

// Fetch additional metadata from external APIs (placeholder implementation)
export async function fetchEnhancedMetadata(
    song: Song
): Promise<Partial<Song>> {
    // In a real implementation, you would call MusicBrainz API, Cover Art Archive, etc.
    // For now, return empty object as this requires CORS setup and API keys
    return {};
}