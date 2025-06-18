"use client"

import { 
  SkipBack, 
  Play, 
  Pause, 
  SkipForward, 
  Repeat, 
  Repeat1, 
  Shuffle, 
  Volume2,
  VolumeX 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { usePlayerStore } from '@/lib/store'
import { motion } from 'framer-motion'

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
    toggleShuffle
  } = usePlayerStore()
  
  const toggleRepeat = () => {
    const modes: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all']
    const currentIndex = modes.indexOf(repeat)
    const nextMode = modes[(currentIndex + 1) % modes.length]
    setRepeat(nextMode)
  }
  
  const RepeatIcon = repeat === 'one' ? Repeat1 : Repeat
  
  return (
    <motion.div
      className="flex items-center justify-center gap-6 px-6 py-4"
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      {/* Secondary controls - Left */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleRepeat}
          className={`hover:bg-primary/10 transition-colors ${
            repeat !== 'none' ? 'text-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <RepeatIcon className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleShuffle}
          className={`hover:bg-primary/10 transition-colors ${
            shuffle ? 'text-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Shuffle className="h-4 w-4" />
        </Button>
      </div>

      {/* Main controls - Center */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={prevSong}
          className="hover:bg-primary/10 transition-colors text-foreground hover:text-primary"
        >
          <SkipBack className="h-5 w-5" />
        </Button>
        
        <Button
          variant="default"
          size="lg"
          onClick={togglePlay}
          className="rounded-full w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 border-0 relative overflow-hidden flex items-center justify-center"
        >
          {/* Background overlay for better contrast */}
          <div className="absolute inset-0 bg-black/20 rounded-full" />
          
          {/* Icon with maximum visibility */}
          <div className="relative z-20 flex items-center justify-center">
            {isPlaying ? (
              <Pause 
                className="h-8 w-8 text-white" 
                fill="white" 
                stroke="white" 
                strokeWidth={0}
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
              />
            ) : (
              <Play 
                className="h-8 w-8 ml-1 text-white" 
                fill="white" 
                stroke="white" 
                strokeWidth={0}
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
              />
            )}
          </div>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={nextSong}
          className="hover:bg-primary/10 transition-colors text-foreground hover:text-primary"
        >
          <SkipForward className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Volume control - Right */}
      <div className="flex items-center gap-3">
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
  )
}