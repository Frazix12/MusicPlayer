# AI-Powered Music Player

A modern, feature-rich music player web application built using cutting-edge technologies and developed primarily through AI pair programming tools.

![Music Player Screenshot](public/image.png)

## 🤖 AI-Driven Development

This project showcases the power of AI-assisted development, being built entirely through prompting and pair programming with various AI tools:

- **GitHub Copilot** - AI pair programming assistant
- **bolt.new** - Rapid prototyping and component generation
- **Other AI Tools** - Various AI tools for code generation, debugging, and optimization

## ✨ Features

### Music Playback

- Audio file upload and playback
- Play/Pause/Skip controls
- Progress bar with seek functionality
- Volume control
- Shuffle and repeat modes (none/one/all)
- Queue management

### Lyrics

- Automatic lyrics fetching from multiple sources
- Line-synced lyrics display
- Smooth animations and highlighting
- Fallback to plain lyrics when sync not available
- Auto-scroll with manual scroll override

### UI/UX

- Modern, clean interface
- Dark/Light theme support
- Responsive design
- Beautiful transitions and animations
- Album art display
- Queue drawer
- Upload dialog
- Toast notifications

## 🛠 Tech Stack

### Frontend Framework

- Next.js 13 (App Router)
- React 18
- TypeScript

### State Management

- Zustand

### Styling

- Tailwind CSS
- Shadcn/ui
- CSS Variables for theming
- Framer Motion for animations

### Audio Processing

- Web Audio API
- music-metadata-browser
- @stef-0012/synclyrics

### UI Components

- Radix UI primitives
- Lucide icons
- Sonner for toasts

### Development Tools

- Bun as package manager
- ESLint
- Prettier
- TypeScript

## 📦 Key Dependencies

```json
{
    "@radix-ui/react-*": "Latest versions of all Radix UI components",
    "@stef-0012/synclyrics": "^2.5.102",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "framer-motion": "^10.12.18",
    "lucide-react": "^0.259.0",
    "music-metadata-browser": "^2.5.10",
    "next": "13.4.9",
    "next-themes": "^0.2.1",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "sonner": "^0.6.2",
    "tailwind-merge": "^1.13.2",
    "tailwindcss-animate": "^1.0.6",
    "zustand": "^4.3.9"
}
```

## 🚀 Getting Started

```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
bun install

# Run the development server
bun dev
```

## 🎵 Supported Audio Formats

- MP3
- WAV
- OGG
- M4A
- And other browser-supported audio formats

## 🌟 Features in Detail

### Audio Player

- Real-time audio visualization
- Precise seeking with preview
- Smooth volume transitions
- Cross-fade between tracks
- Queue management with drag-and-drop

### Lyrics System

- Multiple lyrics providers (Musixmatch, LRCLib, Netease)
- Automatic lyrics synchronization
- Manual timing adjustment
- Lyrics search and correction
- Support for multiple languages

### User Interface

- Gesture controls
- Keyboard shortcuts
- Customizable themes
- Responsive layout
- Accessible design

## 🧪 Built with AI Assistance

This project demonstrates the capabilities of AI-assisted development. Every aspect of the application, from architecture decisions to implementation details, was developed through conversation with AI tools. This includes:

- Architecture planning
- Component design
- Feature implementation
- Bug fixing
- Code optimization
- Documentation

The development process showcases how AI tools can be used effectively to build complex applications while maintaining high code quality and following best practices.

## 📝 License

MIT License - feel free to use this project for learning, modification, or as a base for your own applications.

## 🙏 Acknowledgments

- Thanks to all the amazing open-source projects that made this possible
- Special thanks to the AI tools that assisted in development
- Shadcn/ui for the beautiful component system
- The Next.js team for the fantastic framework
