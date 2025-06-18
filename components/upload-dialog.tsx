"use client"

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Music, FileAudio } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { usePlayerStore } from '@/lib/store'
import { parseAudioMetadata, createSongFromFile } from '@/lib/audio-utils'
import { useToast } from '@/hooks/use-toast'

export function UploadDialog() {
  const { showUpload, setShowUpload, addToQueue } = usePlayerStore()
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()
  
  const handleFileUpload = useCallback(async (files: FileList) => {
    setUploading(true)
    
    try {
      const audioFiles = Array.from(files).filter(file => 
        file.type.startsWith('audio/') || file.name.endsWith('.mp3')
      )
      
      if (audioFiles.length === 0) {
        toast({
          title: "No audio files found",
          description: "Please upload MP3 or other audio files.",
          variant: "destructive"
        })
        return
      }
      
      const newSongs = []
      
      for (const file of audioFiles) {
        try {
          const metadata = await parseAudioMetadata(file)
          const song = createSongFromFile(file, metadata)
          newSongs.push(song)
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error)
          toast({
            title: "Processing error",
            description: `Could not process ${file.name}`,
            variant: "destructive"
          })
        }
      }
      
      if (newSongs.length > 0) {
        addToQueue(newSongs)
        toast({
          title: "Upload successful",
          description: `Added ${newSongs.length} song(s) to your library.`
        })
        setShowUpload(false)
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your files.",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }, [addToQueue, setShowUpload, toast])
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files)
    }
  }, [handleFileUpload])
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])
  
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files)
    }
  }, [handleFileUpload])
  
  return (
    <Dialog open={showUpload} onOpenChange={setShowUpload}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Music
          </DialogTitle>
        </DialogHeader>
        
        <motion.div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <AnimatePresence mode="wait">
            {uploading ? (
              <motion.div
                key="uploading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="space-y-4"
              >
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Processing your music...</p>
              </motion.div>
            ) : (
              <motion.div
                key="upload"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="space-y-4"
              >
                <div className="mx-auto">
                  {dragOver ? (
                    <FileAudio className="h-12 w-12 text-primary" />
                  ) : (
                    <Upload className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                
                <div>
                  <p className="text-lg font-medium text-primary">
                    Drop MP3 files here or click to upload
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Supports MP3 format with automatic metadata detection
                  </p>
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('file-input')?.click()}
                  className="mt-4"
                >
                  Choose Files
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          
          <input
            id="file-input"
            type="file"
            multiple
            accept="audio/*,.mp3"
            onChange={handleFileSelect}
            className="hidden"
          />
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}