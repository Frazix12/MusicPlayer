import { create } from "zustand";

export interface Song {
    id: string;
    title: string;
    artist: string;
    album?: string;
    duration: number;
    file: File;
    audioUrl: string;
    albumArt?: string;
    lyrics?: LyricLine[];
}

export interface LyricLine {
    time: number;
    text: string;
}

interface PlayerState {
    // Current playback state
    currentSong: Song | null;
    isPlaying: boolean;
    currentTime: number;
    volume: number;

    // Playlist state
    queue: Song[];
    currentIndex: number;

    // Player modes
    repeat: "none" | "one" | "all";
    shuffle: boolean;

    // UI state
    showQueue: boolean;
    showUpload: boolean;
    showLyrics: boolean;

    // Actions
    setCurrentSong: (song: Song | null) => void;
    togglePlay: () => void;
    setCurrentTime: (time: number) => void;
    setVolume: (volume: number) => void;
    addToQueue: (songs: Song[]) => void;
    removeFromQueue: (songId: string) => void;
    nextSong: () => void;
    prevSong: () => void;
    setRepeat: (repeat: "none" | "one" | "all") => void;
    toggleShuffle: () => void;
    setShowQueue: (show: boolean) => void;
    setShowUpload: (show: boolean) => void;
    setShowLyrics: (show: boolean) => void;
    playFromQueue: (index: number) => void;
    setIsPlaying: (playing: boolean) => void;
    seekToTime: (time: number) => void; // New action for seeking
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
    // Initial state
    currentSong: null,
    isPlaying: false,
    currentTime: 0,
    volume: 1,
    queue: [],
    currentIndex: -1,
    repeat: "none",
    shuffle: false,
    showQueue: false,
    showUpload: false,
    showLyrics: true,

    // Actions
    setCurrentSong: (song) =>
        set({
            currentSong: song,
            currentTime: 0, // Reset time when changing songs
            isPlaying: false, // Don't auto-play new songs
        }),

    togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

    setCurrentTime: (time) => set({ currentTime: time }),

    setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),

    setIsPlaying: (playing) => set({ isPlaying: playing }),

    // New seek action for lyrics interaction
    seekToTime: (time) => set({ 
        currentTime: time,
        isPlaying: true // Auto-play when seeking from lyrics
    }),

    addToQueue: (songs) =>
        set((state) => {
            const newQueue = [...state.queue, ...songs];
            return {
                queue: newQueue,
                currentSong: state.currentSong || songs[0] || null,
                currentIndex:
                    state.currentIndex === -1 ? 0 : state.currentIndex,
            };
        }),

    removeFromQueue: (songId) =>
        set((state) => {
            const newQueue = state.queue.filter((song) => song.id !== songId);
            const currentSongIndex = newQueue.findIndex(
                (song) => song.id === state.currentSong?.id
            );

            return {
                queue: newQueue,
                currentIndex: currentSongIndex,
                currentSong:
                    currentSongIndex >= 0 ? newQueue[currentSongIndex] : null,
            };
        }),

    nextSong: () =>
        set((state) => {
            if (state.queue.length === 0) return state;

            let nextIndex: number;

            if (state.shuffle) {
                // Random next song (avoid current)
                const availableIndices = state.queue
                    .map((_, i) => i)
                    .filter((i) => i !== state.currentIndex);
                nextIndex =
                    availableIndices[
                        Math.floor(Math.random() * availableIndices.length)
                    ] || 0;
            } else {
                nextIndex = (state.currentIndex + 1) % state.queue.length;
            }

            return {
                currentIndex: nextIndex,
                currentSong: state.queue[nextIndex] || null,
                currentTime: 0,
                isPlaying: !!state.queue[nextIndex], // Always play if there is a next song
            };
        }),

    prevSong: () =>
        set((state) => {
            if (state.queue.length === 0) return state;

            let prevIndex: number;

            if (state.shuffle) {
                // Random previous song (avoid current)
                const availableIndices = state.queue
                    .map((_, i) => i)
                    .filter((i) => i !== state.currentIndex);
                prevIndex =
                    availableIndices[
                        Math.floor(Math.random() * availableIndices.length)
                    ] || 0;
            } else {
                prevIndex =
                    state.currentIndex - 1 < 0
                        ? state.queue.length - 1
                        : state.currentIndex - 1;
            }

            return {
                currentIndex: prevIndex,
                currentSong: state.queue[prevIndex] || null,
                currentTime: 0,
                isPlaying:
                    state.isPlaying && state.queue[prevIndex] ? true : false, // Only keep playing if there's a prev song and we were playing
            };
        }),

    setRepeat: (repeat) => set({ repeat }),

    toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),

    setShowQueue: (show) => set({ showQueue: show }),

    setShowUpload: (show) => set({ showUpload: show }),

    setShowLyrics: (show) => set({ showLyrics: show }),

    playFromQueue: (index) =>
        set((state) => ({
            currentIndex: index,
            currentSong: state.queue[index] || null,
            currentTime: 0,
            isPlaying: true, // Auto-play when selecting from queue
        })),
}));