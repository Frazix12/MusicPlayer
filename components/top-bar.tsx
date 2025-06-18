"use client"

import { Music, Upload, ListMusic, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { motion } from 'framer-motion'
import { usePlayerStore } from '@/lib/store'

export function TopBar() {
  const { theme, setTheme } = useTheme()
  const { setShowUpload, setShowQueue, queue } = usePlayerStore()
  
  return (
    <motion.header 
      className="flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-md"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-2">
        <Music className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
          MyMusic
        </h1>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowUpload(true)}
          className="hover:bg-primary/10 transition-colors"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowQueue(true)}
          className="hover:bg-primary/10 transition-colors"
        >
          <ListMusic className="h-4 w-4 mr-2" />
          Queue ({queue.length})
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="hover:bg-primary/10 transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      </div>
    </motion.header>
  )
}