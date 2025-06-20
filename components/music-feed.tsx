"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { usePlayerStore } from "@/lib/store";
import { 
    Play, 
    Plus, 
    Music, 
    TrendingUp, 
    Clock, 
    User,
    RefreshCw,
    Heart,
    Share2,
    ExternalLink
} from "lucide-react";
import { formatTime } from "@/lib/audio-utils";
import { useToast } from "@/hooks/use-toast";

interface AudiusTrack {
    id: string;
    title: string;
    user: {
        name: string;
        handle: string;
        id: string;
    };
    duration: number;
    genre: string;
    mood?: string;
    play_count: number;
    favorite_count: number;
    repost_count: number;
    artwork?: {
        "150x150"?: string;
        "480x480"?: string;
        "1000x1000"?: string;
    };
    stream_url?: string;
    permalink: string;
    created_at: string;
    tags?: string;
}

interface AudiusResponse {
    data: AudiusTrack[];
}

export function MusicFeed() {
    const [tracks, setTracks] = useState<AudiusTrack[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedGenre, setSelectedGenre] = useState<string>("all");
    const { addToQueue, setCurrentSong, currentSong, togglePlay, isPlaying } = usePlayerStore();
    const { toast } = useToast();

    const genres = [
        "all", "Electronic", "Hip-Hop/Rap", "Alternative", "Pop", 
        "R&B/Soul", "Ambient", "House", "Techno", "Trap", "Dubstep"
    ];

    const fetchTrendingTracks = async (genre?: string) => {
        setLoading(true);
        setError(null);
        
        try {
            const genreParam = genre && genre !== "all" ? `&genre=${encodeURIComponent(genre)}` : "";
            const response = await fetch(
                `https://discoveryprovider.audius.co/v1/tracks/trending?app_name=MyMusicApp&limit=50${genreParam}`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data: AudiusResponse = await response.json();
            setTracks(data.data || []);
        } catch (err) {
            console.error("Error fetching tracks:", err);
            setError("Failed to load trending tracks. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrendingTracks(selectedGenre);
    }, [selectedGenre]);

    const handleAddToQueue = async (track: AudiusTrack) => {
        try {
            // Create a song object compatible with our player
            const song = {
                id: `audius-${track.id}`,
                title: track.title,
                artist: track.user.name,
                album: track.genre,
                duration: track.duration,
                file: new File([], track.title), // Placeholder file
                audioUrl: `https://discoveryprovider.audius.co/v1/tracks/${track.id}/stream?app_name=MyMusicApp`,
                albumArt: track.artwork?.["480x480"] || track.artwork?.["1000x1000"],
                lyrics: [], // Will be fetched when played
            };

            addToQueue([song]);
            
            toast({
                title: "Added to queue",
                description: `${track.title} by ${track.user.name}`,
            });
        } catch (err) {
            console.error("Error adding track to queue:", err);
            toast({
                title: "Error",
                description: "Failed to add track to queue",
                variant: "destructive",
            });
        }
    };

    const handlePlayNow = async (track: AudiusTrack) => {
        try {
            const song = {
                id: `audius-${track.id}`,
                title: track.title,
                artist: track.user.name,
                album: track.genre,
                duration: track.duration,
                file: new File([], track.title),
                audioUrl: `https://discoveryprovider.audius.co/v1/tracks/${track.id}/stream?app_name=MyMusicApp`,
                albumArt: track.artwork?.["480x480"] || track.artwork?.["1000x1000"],
                lyrics: [],
            };

            // Add to queue and play immediately
            addToQueue([song]);
            setCurrentSong(song);
            
            toast({
                title: "Now playing",
                description: `${track.title} by ${track.user.name}`,
            });
        } catch (err) {
            console.error("Error playing track:", err);
            toast({
                title: "Error",
                description: "Failed to play track",
                variant: "destructive",
            });
        }
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading trending tracks...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-red-500 mb-4">{error}</p>
                        <Button onClick={() => fetchTrendingTracks(selectedGenre)} variant="outline">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try Again
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    <h1 className="text-2xl font-bold">Trending Music</h1>
                    <Badge variant="secondary" className="ml-2">
                        {tracks.length} tracks
                    </Badge>
                </div>
                <Button 
                    onClick={() => fetchTrendingTracks(selectedGenre)} 
                    variant="outline" 
                    size="sm"
                    disabled={loading}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Genre Filter */}
            <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                    <Button
                        key={genre}
                        variant={selectedGenre === genre ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedGenre(genre)}
                        className="capitalize"
                    >
                        {genre}
                    </Button>
                ))}
            </div>

            {/* Tracks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence>
                    {tracks.map((track, index) => (
                        <motion.div
                            key={track.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                        >
                            <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                                {/* Album Art */}
                                <div className="relative aspect-square overflow-hidden">
                                    {track.artwork?.["480x480"] ? (
                                        <img
                                            src={track.artwork["480x480"]}
                                            alt={`${track.title} artwork`}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-primary-300 to-primary-100 flex items-center justify-center">
                                            <Music className="h-12 w-12 text-primary-200" />
                                        </div>
                                    )}
                                    
                                    {/* Play Overlay */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => handlePlayNow(track)}
                                                className="bg-primary hover:bg-primary/90"
                                            >
                                                <Play className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => handleAddToQueue(track)}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Track Info */}
                                <div className="p-4 space-y-3">
                                    <div>
                                        <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                                            {track.title}
                                        </h3>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <User className="h-3 w-3" />
                                            <span className="truncate">{track.user.name}</span>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1">
                                                <Play className="h-3 w-3" />
                                                <span>{formatNumber(track.play_count)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Heart className="h-3 w-3" />
                                                <span>{formatNumber(track.favorite_count)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            <span>{formatTime(track.duration)}</span>
                                        </div>
                                    </div>

                                    {/* Genre Badge */}
                                    {track.genre && (
                                        <Badge variant="outline" className="text-xs">
                                            {track.genre}
                                        </Badge>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            size="sm"
                                            onClick={() => handlePlayNow(track)}
                                            className="flex-1"
                                        >
                                            <Play className="h-3 w-3 mr-1" />
                                            Play
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleAddToQueue(track)}
                                            className="flex-1"
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Queue
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {tracks.length === 0 && !loading && (
                <div className="text-center py-12">
                    <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No tracks found for this genre.</p>
                </div>
            )}
        </div>
    );
}