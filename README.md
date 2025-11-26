# MonkeySee / TypeMaster Pro

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Vite](https://img.shields.io/badge/Vite-5-646CFF)
![Gemini AI](https://img.shields.io/badge/Powered%20by-Gemini%20AI-8E75B2)

A high-performance, minimalist speed typing competition platform. Inspired by Monkeytype, this application features a sleek, distraction-free interface, real-time analytics, and infinite AI-generated typing prompts powered by the Google Gemini API.

## 🌟 Features

### 🎮 Gameplay Modes
- **Casual Mode**: Infinite stream of lowercase, random common English words. No punctuation, no capitalization—pure speed.
- **Competition Mode**: Complex sentence structures, proper punctuation, and capitalization. Generated dynamically by AI to ensure unique tests every time.

### ⚡ Core Mechanics
- **Infinite Scroll**: The typing area automatically scrolls as you type, providing an endless stream of text until the timer runs out.
- **Smart Input**: "No-space" input logic. The user types words continuously; the system handles visual spacing and validation automatically.
- **Timers**: 15s, 30s, 60s, and 120s test durations.
- **Instant Restart**: `Tab` + `Enter` hotkey to quickly restart a test.

### 🎨 Visuals & Theming
- **Minimalist UI**: Distraction-free design with smooth caret animations and fade transitions.
- **Dynamic Themes**: Switch instantly between 6 presets:
  - *Serika Dark* (Default)
  - *One Dark*
  - *Carbon*
  - *Oceanic*
  - *Dracula*
  - *Miami*

### 📊 Analytics
- **Real-time Stats**: WPM (Words Per Minute), Raw WPM, and Accuracy calculated live.
- **Detailed Results**: 
  - Interactive WPM over time graph.
  - Consistency percentage.
  - Character breakdown (Correct/Incorrect/Extra/Missed).
- **Live Leaderboard**: Tracks session rankings with username identification.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS (with CSS Variables for theming)
- **AI Integration**: Google GenAI SDK (`@google/genai`) - Gemini 2.5 Flash
- **Charts**: Recharts
- **Build Tool**: Vite

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- A Google Cloud Project with the **Gemini API** enabled (get an API key from [Google AI Studio](https://aistudio.google.com/)).

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/monkeysee.git
   cd monkeysee
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   # .env
   API_KEY=your_google_gemini_api_key_here
   ```
   > **Note**: The application is configured to automatically inject this key into the build via `vite.config.ts`.

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

## 📦 Building & Deployment

The project is optimized for deployment on Vercel, Netlify, or any static hosting provider.

### Vercel Deployment (Recommended)

1. Push your code to a GitHub repository.
2. Log in to [Vercel](https://vercel.com) and "Add New Project".
3. Import your repository.
4. **Important**: In the "Environment Variables" section of the deployment setup, add:
   - Key: `API_KEY`
   - Value: `Your Actual Gemini API Key`
5. Click **Deploy**.

### Manual Build
To create a production build locally:

```bash
npm run build
```
The output files will be in the `dist/` directory.

## 📂 Project Structure

```
monkeysee/
├── src/
│   ├── components/
│   │   ├── ResultChart.tsx    # WPM graph using Recharts
│   │   └── TypingArea.tsx     # Core engine: input handling, rendering, scrolling
│   ├── services/
│   │   └── geminiService.ts   # Interfacing with Google GenAI SDK
│   ├── types.ts               # TypeScript interfaces (Stats, Themes, Modes)
│   ├── App.tsx                # Main controller, state management, routing
│   └── index.tsx              # Entry point
├── index.html                 # HTML root & Tailwind config
├── vite.config.ts             # Vite build & Env var configuration
├── tailwind.config.js         # (Injected in index.html for this specific setup)
└── package.json
```

## 🧩 Key Logic Explained

### Infinite Text Generation
To prevent API rate limits while maintaining an "infinite" feel:
1. The app fetches a large batch of text (~300 words) from Gemini 2.5 Flash at the start.
2. As the user types and the remaining text buffer drops below 50 characters, the app strictly repeats the initial batch (or appends logic) to ensure the user never runs out of words during a test.

### Visual Scrolling
The `TypingArea` component renders 3 lines of text:
1. **History**: The line you just finished.
2. **Active**: The line you are typing on.
3. **Future**: The next line coming up.
As the cursor moves to the 3rd visual line, the container translates upwards (`margin-top`), creating a smooth scrolling effect that keeps the active line centered.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
