# 🎧 StudyVibe — Study Mood Music Generator

A modern, dark-themed web application that generates study music playlists based on your **mood** and **task**. Features a stunning animated particle background, glassmorphism UI, and embedded music players.

![StudyVibe Screenshot](screenshot.png)

---

## ✨ Features

- **Mood Selection** — Focus, Chill, Deep Work, Late Night  
- **Task Selection** — Coding, Studying, Reading, Writing  
- **16 unique playlists** — one for every mood × task combination  
- **Embedded YouTube player** with autoplay  
- **Spotify API support** (optional, see below)  
- **Animated particle background** with connection lines  
- **localStorage persistence** — remembers your last mood & task  
- **Loading animation** with equalizer bars  
- **Fully responsive** — works on mobile, tablet, desktop  

---

## 🚀 How to Run Locally

### Option 1: Just open the file
1. Navigate to the `study-mood-music` folder  
2. Double-click `index.html` to open in your browser  

### Option 2: Use a local server (recommended for best experience)
```bash
# Using Python
cd study-mood-music
python -m http.server 8000
# Open http://localhost:8000

# Using Node.js (npx)
cd study-mood-music
npx serve .
# Open the URL shown in terminal

# Using VS Code
# Install "Live Server" extension, then right-click index.html → "Open with Live Server"
```

---

## 🎵 Adding Spotify API Keys (Optional)

By default, the app uses **YouTube embeds** for music playback. To enable **Spotify embeds**:

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in and click **Create App**
3. Fill in app details (any name/description, set redirect URI to `http://localhost:8000`)
4. Copy your **Client ID**
5. Open `script.js` and find the `SPOTIFY_CONFIG` object (around line 340)
6. Paste your Client ID:
   ```js
   const SPOTIFY_CONFIG = {
       clientId: 'YOUR_CLIENT_ID_HERE',
       ...
   };
   ```
7. Optionally replace the playlist IDs in `playlistIds` with your own Spotify playlist IDs

---

## 📁 Project Structure

```
study-mood-music/
├── index.html      # Main HTML — layout, selectors, player
├── style.css       # Dark theme, animations, responsive design
├── script.js       # App logic, particles, playlist data
└── README.md       # This file
```

---

## 🛠 Tech Stack

- **HTML5** — Semantic markup  
- **CSS3** — Custom properties, glassmorphism, keyframe animations  
- **Vanilla JavaScript** — No frameworks or dependencies  
- **YouTube IFrame API** — Embedded music player  
- **Spotify Embed API** — Optional alternative player  

---

## 📝 License

MIT — Free for personal and commercial use.
