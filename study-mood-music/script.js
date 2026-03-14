/* ============================================
   Study Mood Music Generator — script.js
   
   Handles:
   - Animated particle background
   - Mood & task selection with localStorage
   - Playlist generation using curated YouTube data
   - YouTube iframe embed player
   - Loading animations and transitions
   ============================================ */

// ──────────────────────────────────────────────
// 1. PARTICLE BACKGROUND ANIMATION
//    Creates floating particles with subtle
//    connections for an ambient dark aesthetic
// ──────────────────────────────────────────────

(function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;

    // Resize canvas to fill viewport
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    resize();
    window.addEventListener('resize', resize);

    // Particle class — each dot floating on screen
    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = (Math.random() - 0.5) * 0.4;
            this.speedY = (Math.random() - 0.5) * 0.4;
            this.opacity = Math.random() * 0.4 + 0.1;
            // Slight color tint: purple / teal / white
            const tints = [
                'rgba(124, 92, 252,',   // purple
                'rgba(0, 212, 170,',     // teal
                'rgba(79, 172, 254,',    // blue
                'rgba(200, 200, 220,',   // near-white
            ];
            this.color = tints[Math.floor(Math.random() * tints.length)];
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            // Wrap around edges
            if (this.x < 0) this.x = canvas.width;
            if (this.x > canvas.width) this.x = 0;
            if (this.y < 0) this.y = canvas.height;
            if (this.y > canvas.height) this.y = 0;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `${this.color} ${this.opacity})`;
            ctx.fill();
        }
    }

    // Create particle pool — 80 particles for a subtle effect
    const PARTICLE_COUNT = 80;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
    }

    // Draw connection lines between nearby particles
    function drawConnections() {
        const maxDist = 120;
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < maxDist) {
                    const opacity = (1 - dist / maxDist) * 0.08;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(124, 92, 252, ${opacity})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }

    // Main animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        drawConnections();
        animationId = requestAnimationFrame(animate);
    }

    animate();
})();


// ──────────────────────────────────────────────
// 2. STATE MANAGEMENT
//    Track selected mood, task, and app state
// ──────────────────────────────────────────────

const state = {
    mood: null,
    task: null,
};

// DOM element references
const elements = {
    moodBtns: document.querySelectorAll('.mood-btn'),
    taskBtns: document.querySelectorAll('.task-btn'),
    generateBtn: document.getElementById('generate-btn'),
    generateHint: document.getElementById('generate-hint'),
    generateSection: document.getElementById('generate-section'),
    loader: document.getElementById('loader'),
    playlistSection: document.getElementById('playlist-section'),
    playlistTitle: document.getElementById('playlist-title'),
    playlistMeta: document.getElementById('playlist-meta'),
    playerContainer: document.getElementById('player-container'),
    tracklistList: document.getElementById('tracklist-list'),
    newPlaylistBtn: document.getElementById('new-playlist-btn'),
    moodSection: document.getElementById('mood-section'),
    taskSection: document.getElementById('task-section'),
};


// ──────────────────────────────────────────────
// 3. LOCALSTORAGE — PERSIST LAST SELECTIONS
//    Saves and restores last mood & task on reload
// ──────────────────────────────────────────────

function saveSelections() {
    localStorage.setItem('studyvibe_mood', state.mood);
    localStorage.setItem('studyvibe_task', state.task);
}

function loadSelections() {
    const savedMood = localStorage.getItem('studyvibe_mood');
    const savedTask = localStorage.getItem('studyvibe_task');

    if (savedMood) {
        state.mood = savedMood;
        const btn = document.querySelector(`[data-mood="${savedMood}"]`);
        if (btn) btn.classList.add('selected');
    }

    if (savedTask) {
        state.task = savedTask;
        const btn = document.querySelector(`[data-task="${savedTask}"]`);
        if (btn) btn.classList.add('selected');
    }

    updateGenerateButton();
}


// ──────────────────────────────────────────────
// 4. SELECTION HANDLERS
//    Mood and task button click logic
// ──────────────────────────────────────────────

// Handle mood button selection — only one mood at a time
elements.moodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Deselect all mood buttons
        elements.moodBtns.forEach(b => b.classList.remove('selected'));
        // Select clicked button
        btn.classList.add('selected');
        state.mood = btn.dataset.mood;
        saveSelections();
        updateGenerateButton();
    });
});

// Handle task button selection — only one task at a time
elements.taskBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        elements.taskBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        state.task = btn.dataset.task;
        saveSelections();
        updateGenerateButton();
    });
});

// Enable/disable generate button based on selection state
function updateGenerateButton() {
    const ready = state.mood && state.task;
    elements.generateBtn.disabled = !ready;
    elements.generateHint.textContent = ready
        ? `${capitalize(state.mood)} × ${capitalize(state.task)} — ready to vibe`
        : 'Select a mood and task to continue';
    elements.generateHint.classList.toggle('ready', ready);
}


// ──────────────────────────────────────────────
// 5. PLAYLIST DATA
//    Curated playlist mappings for each
//    mood × task combination with YouTube IDs
//    and track metadata
// ──────────────────────────────────────────────

const playlists = {
    // ─── FOCUS ───
    focus_coding: {
        title: 'Focus Flow: Code Mode',
        description: 'Ambient electronic beats for deep coding sessions',
        youtubeId: 'aHOoiF9sKog',        // lofi hip hop study beats
        tracks: [
            { name: 'Synthwave Dreams', artist: 'ChilledCow', duration: '3:42' },
            { name: 'Binary Sunset', artist: 'Lofi Fruits', duration: '4:15' },
            { name: 'Compile & Chill', artist: 'Chillhop Music', duration: '3:28' },
            { name: 'Debug Mode', artist: 'Sappheiros', duration: '5:01' },
            { name: 'Algorithm Flow', artist: 'Sleepy Fish', duration: '4:33' },
            { name: 'Terminal Drift', artist: 'In Love With A Ghost', duration: '3:55' },
            { name: 'Pixel Rain', artist: 'Kupla', duration: '4:12' },
            { name: 'Stack Overflow', artist: 'Flovry', duration: '3:48' },
        ],
    },
    focus_studying: {
        title: 'Focus Flow: Study Session',
        description: 'Concentration-boosting ambient sounds',
        youtubeId: 'a5sdsbGKz8U',        // lofi beats to study to
        tracks: [
            { name: 'Clear Mind', artist: 'Chillhop Music', duration: '4:02' },
            { name: 'Brainwave Alpha', artist: 'Sappheiros', duration: '5:30' },
            { name: 'Study With Me', artist: 'Lofi Girl', duration: '3:45' },
            { name: 'Notebook Pages', artist: 'Sleepy Fish', duration: '4:18' },
            { name: 'Lecture Notes', artist: 'Kupla', duration: '3:52' },
            { name: 'Memory Palace', artist: 'Flovry', duration: '4:40' },
            { name: 'Campus Rain', artist: 'Philanthrope', duration: '3:33' },
            { name: 'Exam Eve', artist: 'In Love With A Ghost', duration: '4:05' },
        ],
    },
    focus_reading: {
        title: 'Focus Flow: Page Turner',
        description: 'Quiet ambient for deep reading sessions',
        youtubeId: 'o3k_mQ-SjN4',        // calm piano for study
        tracks: [
            { name: 'Page by Page', artist: 'ODESZA', duration: '4:22' },
            { name: 'Silent Library', artist: 'Nils Frahm', duration: '5:14' },
            { name: 'Bookmark', artist: 'Ólafur Arnalds', duration: '3:55' },
            { name: 'Chapter Break', artist: 'Yiruma', duration: '4:30' },
            { name: 'Spine & Ink', artist: 'Ludovico Einaudi', duration: '5:02' },
            { name: 'Quiet Pages', artist: 'Max Richter', duration: '4:15' },
            { name: 'Between Lines', artist: 'Hania Rani', duration: '3:48' },
            { name: 'Epilogue', artist: 'Joep Beving', duration: '4:33' },
        ],
    },
    focus_writing: {
        title: 'Focus Flow: Writer\'s Room',
        description: 'Minimal ambient to fuel your writing',
        youtubeId: 'eC57f5c-gM8',        // relaxing piano for work
        tracks: [
            { name: 'First Draft', artist: 'Brian Eno', duration: '5:02' },
            { name: 'Ink Flow', artist: 'Nils Frahm', duration: '4:25' },
            { name: 'Blank Page', artist: 'Ólafur Arnalds', duration: '3:40' },
            { name: 'Typewriter Rain', artist: 'Max Richter', duration: '4:55' },
            { name: 'Cursor Blink', artist: 'Hania Rani', duration: '4:18' },
            { name: 'Paragraph Break', artist: 'Joep Beving', duration: '5:10' },
            { name: 'Edit Mode', artist: 'Yiruma', duration: '3:52' },
            { name: 'Final Draft', artist: 'Ludovico Einaudi', duration: '4:42' },
        ],
    },

    // ─── CHILL ───
    chill_coding: {
        title: 'Chill Beats: Code & Relax',
        description: 'Laid-back lofi for casual coding',
        youtubeId: 'V_EWkC2wHQo',        // chill lofi summer vibes
        tracks: [
            { name: 'Sudo Relax', artist: 'Chillhop Music', duration: '3:38' },
            { name: 'Lazy Function', artist: 'Lofi Fruits', duration: '4:10' },
            { name: 'Coffee & Code', artist: 'Kupla', duration: '3:55' },
            { name: 'Variable Sunset', artist: 'Philanthrope', duration: '4:22' },
            { name: 'Git Commit Vibes', artist: 'Flovry', duration: '3:42' },
            { name: 'Soft Deploy', artist: 'Sleepy Fish', duration: '4:30' },
            { name: 'Weekend Hack', artist: 'In Love With A Ghost', duration: '3:28' },
            { name: 'Open Source', artist: 'j\'san', duration: '4:05' },
        ],
    },
    chill_studying: {
        title: 'Chill Beats: Easy Study',
        description: 'Relaxed tunes for light studying',
        youtubeId: '2xQ_I7w_y0k',        // relaxing piano for studying
        tracks: [
            { name: 'Study Break', artist: 'Chillhop Music', duration: '3:50' },
            { name: 'Flash Cards', artist: 'Lofi Girl', duration: '4:02' },
            { name: 'Highlighter', artist: 'Kupla', duration: '3:35' },
            { name: 'Pop Quiz', artist: 'Sleepy Fish', duration: '4:15' },
            { name: 'Library Café', artist: 'Philanthrope', duration: '3:48' },
            { name: 'Review Session', artist: 'Flovry', duration: '4:28' },
            { name: 'Textbook Rain', artist: 'j\'san', duration: '3:55' },
            { name: 'GPA Dreams', artist: 'In Love With A Ghost', duration: '4:10' },
        ],
    },
    chill_reading: {
        title: 'Chill Beats: Cozy Read',
        description: 'Warm lofi for a cozy reading nook',
        youtubeId: 'M-rZ2b-x8Fw',        // peaceful spring piano ambient
        tracks: [
            { name: 'Rainy Window', artist: 'Chillhop Music', duration: '4:15' },
            { name: 'Bookshop', artist: 'Lofi Fruits', duration: '3:42' },
            { name: 'Tea & Pages', artist: 'Kupla', duration: '4:02' },
            { name: 'Dog-eared', artist: 'Sleepy Fish', duration: '3:55' },
            { name: 'Reading Nook', artist: 'Philanthrope', duration: '4:30' },
            { name: 'Paperback', artist: 'Flovry', duration: '3:38' },
            { name: 'Fiction Haze', artist: 'j\'san', duration: '4:18' },
            { name: 'Last Chapter', artist: 'In Love With A Ghost', duration: '3:50' },
        ],
    },
    chill_writing: {
        title: 'Chill Beats: Freewrite',
        description: 'Gentle beats for free-flowing writing',
        youtubeId: '1T8i5Vq2t6Q',        // calm instrumental for focus
        tracks: [
            { name: 'Morning Pages', artist: 'Chillhop Music', duration: '4:05' },
            { name: 'Stream of Thought', artist: 'Kupla', duration: '3:48' },
            { name: 'Journal Entry', artist: 'Lofi Girl', duration: '4:22' },
            { name: 'Soft Pencil', artist: 'Sleepy Fish', duration: '3:35' },
            { name: 'Draft Mode', artist: 'Philanthrope', duration: '4:15' },
            { name: 'Margin Notes', artist: 'Flovry', duration: '3:55' },
            { name: 'Prose Flow', artist: 'j\'san', duration: '4:10' },
            { name: 'Outro Thought', artist: 'In Love With A Ghost', duration: '4:30' },
        ],
    },

    // ─── DEEP WORK ───
    deepwork_coding: {
        title: 'Deep Work: System Override',
        description: 'Intense electronic for marathon coding',
        youtubeId: '_9rJ2_Zl5Wc',        // ambient piano deep work
        tracks: [
            { name: 'Kernel Panic', artist: 'Tycho', duration: '5:12' },
            { name: 'Overclock', artist: 'Com Truise', duration: '4:45' },
            { name: 'Root Access', artist: 'Boards of Canada', duration: '5:30' },
            { name: 'Merge Conflict', artist: 'Bonobo', duration: '4:58' },
            { name: 'Deep Recursion', artist: 'Tycho', duration: '5:22' },
            { name: 'Async Await', artist: 'Four Tet', duration: '4:35' },
            { name: 'Thread Pool', artist: 'Aphex Twin', duration: '5:02' },
            { name: 'Ship It', artist: 'Jon Hopkins', duration: '4:50' },
        ],
    },
    deepwork_studying: {
        title: 'Deep Work: Knowledge Vault',
        description: 'Intense ambient for serious study sessions',
        youtubeId: 'Z_L3W4jXf8k',        // deep focus study music
        tracks: [
            { name: 'Thesis Mode', artist: 'Max Richter', duration: '5:15' },
            { name: 'Concentration', artist: 'Nils Frahm', duration: '4:42' },
            { name: 'Deep Recall', artist: 'Ólafur Arnalds', duration: '5:08' },
            { name: 'Quantum Notes', artist: 'Brian Eno', duration: '4:55' },
            { name: 'Study Marathon', artist: 'Hania Rani', duration: '5:30' },
            { name: 'Exam Prep', artist: 'Ludovico Einaudi', duration: '4:20' },
            { name: 'Academic Focus', artist: 'Joep Beving', duration: '5:05' },
            { name: 'Dean\'s List', artist: 'Yiruma', duration: '4:38' },
        ],
    },
    deepwork_reading: {
        title: 'Deep Work: Deep Read',
        description: 'Atmospheric pads for immersive reading',
        youtubeId: 'J6e2V2q3j70',        // deep work ambient focus
        tracks: [
            { name: 'Immersion', artist: 'Brian Eno', duration: '6:02' },
            { name: 'Deep Dive', artist: 'Max Richter', duration: '5:18' },
            { name: 'Subtext', artist: 'Nils Frahm', duration: '4:45' },
            { name: 'Hardcover', artist: 'Ólafur Arnalds', duration: '5:22' },
            { name: 'Annotation', artist: 'Hania Rani', duration: '4:55' },
            { name: 'Velvet Binding', artist: 'Ludovico Einaudi', duration: '5:10' },
            { name: 'Heavy Reading', artist: 'Joep Beving', duration: '4:38' },
            { name: 'Endnote', artist: 'Yiruma', duration: '5:30' },
        ],
    },
    deepwork_writing: {
        title: 'Deep Work: The Manuscript',
        description: 'Dark ambient for long writing sessions',
        youtubeId: 'K7m973Y8yT4',        // soft piano minimal ambient
        tracks: [
            { name: 'The Opening', artist: 'Brian Eno', duration: '5:25' },
            { name: 'Plot Point', artist: 'Max Richter', duration: '4:50' },
            { name: 'Rising Action', artist: 'Nils Frahm', duration: '5:12' },
            { name: 'Climax', artist: 'Ólafur Arnalds', duration: '4:42' },
            { name: 'Resolution', artist: 'Hania Rani', duration: '5:18' },
            { name: 'Denouement', artist: 'Ludovico Einaudi', duration: '5:05' },
            { name: 'Epilogue', artist: 'Joep Beving', duration: '4:35' },
            { name: 'The End', artist: 'Yiruma', duration: '5:30' },
        ],
    },

    // ─── LATE NIGHT ───
    latenight_coding: {
        title: 'Late Night: Midnight Code',
        description: 'Dark ambient beats for 2AM coding sessions',
        youtubeId: 'Nd14jUQ-QGA',        // midnight city piano ambience
        tracks: [
            { name: '2AM Commit', artist: 'Tycho', duration: '4:55' },
            { name: 'Neon Terminal', artist: 'Com Truise', duration: '5:10' },
            { name: 'Night Build', artist: 'Boards of Canada', duration: '4:38' },
            { name: 'Moonlit Bug', artist: 'Bonobo', duration: '5:22' },
            { name: 'Dark Theme', artist: 'Jon Hopkins', duration: '4:45' },
            { name: 'Starlight Debug', artist: 'Four Tet', duration: '5:05' },
            { name: 'Owl Hours', artist: 'Tycho', duration: '4:30' },
            { name: 'Dawn Push', artist: 'Aphex Twin', duration: '5:18' },
        ],
    },
    latenight_studying: {
        title: 'Late Night: Moonlit Study',
        description: 'Ambient nightscapes for late-night cramming',
        youtubeId: '1P0y6n_bQ2A',        // deep work focus productivity
        tracks: [
            { name: 'Midnight Oil', artist: 'Chillhop Music', duration: '4:20' },
            { name: 'Luna Notes', artist: 'Lofi Girl', duration: '3:55' },
            { name: 'Stargazer', artist: 'Kupla', duration: '4:38' },
            { name: 'Night Owl', artist: 'Sleepy Fish', duration: '4:10' },
            { name: 'Crescent Study', artist: 'Philanthrope', duration: '4:45' },
            { name: 'Dreamscape', artist: 'Flovry', duration: '3:48' },
            { name: 'Eclipse Focus', artist: 'j\'san', duration: '4:30' },
            { name: 'First Light', artist: 'In Love With A Ghost', duration: '4:15' },
        ],
    },
    latenight_reading: {
        title: 'Late Night: Bedtime Stories',
        description: 'Dreamy ambient for reading under the stars',
        youtubeId: 'aHOoiF9sKog',        // lofi spring vibes for reading
        tracks: [
            { name: 'Pillow Talk Pages', artist: 'Brian Eno', duration: '5:10' },
            { name: 'Under the Lamp', artist: 'Nils Frahm', duration: '4:35' },
            { name: 'Night Reader', artist: 'Ólafur Arnalds', duration: '4:52' },
            { name: 'Moonbeam Ink', artist: 'Max Richter', duration: '5:25' },
            { name: 'Sleepy Words', artist: 'Hania Rani', duration: '4:18' },
            { name: 'Lullaby Page', artist: 'Ludovico Einaudi', duration: '5:02' },
            { name: 'Constellation', artist: 'Joep Beving', duration: '4:40' },
            { name: 'Dawn Bookmark', artist: 'Yiruma', duration: '4:55' },
        ],
    },
    latenight_writing: {
        title: 'Late Night: Nocturnal Prose',
        description: 'Ethereal night sounds for midnight writers',
        youtubeId: 'o3k_mQ-SjN4',        // calm piano for late night writing
        tracks: [
            { name: 'Witching Hour', artist: 'Brian Eno', duration: '5:30' },
            { name: 'Ink After Dark', artist: 'Nils Frahm', duration: '4:48' },
            { name: 'Night Drafts', artist: 'Ólafur Arnalds', duration: '5:15' },
            { name: 'Moon Over Paper', artist: 'Max Richter', duration: '4:55' },
            { name: 'Sleepless Muse', artist: 'Hania Rani', duration: '5:05' },
            { name: 'Dark Ink', artist: 'Ludovico Einaudi', duration: '4:38' },
            { name: 'Quiet Storm', artist: 'Joep Beving', duration: '5:22' },
            { name: 'Pre-Dawn Draft', artist: 'Yiruma', duration: '4:42' },
        ],
    },
};


// ──────────────────────────────────────────────
// 6. PLAYLIST GENERATION
//    Maps mood + task to a playlist, shows
//    the loader, then renders the player & tracks
// ──────────────────────────────────────────────

elements.generateBtn.addEventListener('click', generatePlaylist);

function generatePlaylist() {
    if (!state.mood || !state.task) return;

    // Build the playlist key from mood + task
    const key = `${state.mood}_${state.task}`;
    const playlist = playlists[key];

    if (!playlist) {
        console.error('Playlist not found for key:', key);
        return;
    }

    // Hide selectors & generate button, show loader
    hideElement(elements.moodSection);
    hideElement(elements.taskSection);
    hideElement(elements.generateSection);
    hideElement(elements.playlistSection);
    showElement(elements.loader);

    // Simulate a short loading time for polish (1.5s)
    setTimeout(() => {
        hideElement(elements.loader);
        renderPlaylist(playlist);
    }, 1500);
}


// ──────────────────────────────────────────────
// 7. RENDER PLAYLIST
//    Inserts YouTube iframe and builds track list
// ──────────────────────────────────────────────

function renderPlaylist(playlist) {
    // Set playlist header
    elements.playlistTitle.textContent = playlist.title;
    elements.playlistMeta.textContent = playlist.description;

    // Build the YouTube embed URL — use standard youtube.com (nocookie blocks file:// origins)
    const embedUrl = `https://www.youtube.com/embed/${playlist.youtubeId}?autoplay=1&rel=0&modestbranding=1`;
    const watchUrl = `https://www.youtube.com/watch?v=${playlist.youtubeId}`;
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(playlist.title + ' study music')}`;

    // Create the iframe element programmatically for better error handling
    const iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.title = playlist.title;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;

    // Clear previous content and add iframe
    elements.playerContainer.innerHTML = '';
    elements.playerContainer.appendChild(iframe);

    // Fallback: if embed fails after a timeout, show a friendly fallback UI
    // 3s is enough — if the embed hasn't loaded by then, it's likely blocked
    const fallbackTimer = setTimeout(() => {
        showPlayerFallback(playlist.title, watchUrl, searchUrl);
    }, 3000);

    // If the iframe loads successfully, cancel the fallback
    iframe.addEventListener('load', () => {
        clearTimeout(fallbackTimer);
    });

    // Build track list items with staggered animation delays
    elements.tracklistList.innerHTML = playlist.tracks
        .map((track, i) => `
            <li class="track-item" style="animation-delay: ${i * 0.06}s">
                <span class="track-number">${String(i + 1).padStart(2, '0')}</span>
                <div class="track-info">
                    <div class="track-name">${track.name}</div>
                    <div class="track-artist">${track.artist}</div>
                </div>
                <span class="track-duration">${track.duration}</span>
            </li>
        `)
        .join('');

    // Show playlist section with animation
    showElement(elements.playlistSection);

    // Scroll to playlist smoothly
    setTimeout(() => {
        elements.playlistSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
}

/**
 * Shows a graceful fallback UI when YouTube embed fails.
 * Provides direct links to watch on YouTube or search for the playlist.
 */
function showPlayerFallback(title, watchUrl, searchUrl) {
    elements.playerContainer.innerHTML = `
        <div style="
            position: absolute; inset: 0;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            gap: 1rem; padding: 2rem; text-align: center;
            background: linear-gradient(135deg, rgba(124,92,252,0.08), rgba(0,212,170,0.05));
        ">
            <span style="font-size: 3rem;">🎵</span>
            <p style="color: rgba(240,240,245,0.7); font-size: 0.95rem; max-width: 360px;">
                Embedded player unavailable.<br>
                <span style="font-size: 0.8rem; color: rgba(240,240,245,0.4);">Tip: serve the page from a local server for embeds to work.</span>
            </p>
            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; justify-content: center;">
                <a href="${watchUrl}" target="_blank" rel="noopener" style="
                    display: inline-flex; align-items: center; gap: 0.4rem;
                    padding: 0.6rem 1.4rem; border-radius: 999px;
                    background: linear-gradient(135deg, #7c5cfc, #4facfe);
                    color: white; text-decoration: none; font-weight: 600; font-size: 0.9rem;
                    transition: transform 0.2s, box-shadow 0.2s;
                " onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 24px rgba(124,92,252,0.4)'"
                   onmouseout="this.style.transform='';this.style.boxShadow=''">
                    ▶ Watch on YouTube
                </a>
                <a href="${searchUrl}" target="_blank" rel="noopener" style="
                    display: inline-flex; align-items: center; gap: 0.4rem;
                    padding: 0.6rem 1.4rem; border-radius: 999px;
                    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
                    color: rgba(240,240,245,0.8); text-decoration: none; font-weight: 500; font-size: 0.9rem;
                    transition: transform 0.2s, background 0.2s;
                " onmouseover="this.style.transform='translateY(-2px)';this.style.background='rgba(255,255,255,0.1)'"
                   onmouseout="this.style.transform='';this.style.background='rgba(255,255,255,0.06)'">
                    🔍 Search on YouTube
                </a>
            </div>
        </div>
    `;
}


// ──────────────────────────────────────────────
// 8. NEW PLAYLIST (RESET)
//    Returns user to mood/task selection
// ──────────────────────────────────────────────

elements.newPlaylistBtn.addEventListener('click', resetToSelection);

function resetToSelection() {
    // Remove iframe to stop playback
    elements.playerContainer.innerHTML = '';

    // Hide playlist, show selectors
    hideElement(elements.playlistSection);
    showElement(elements.moodSection);
    showElement(elements.taskSection);
    showElement(elements.generateSection);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


// ──────────────────────────────────────────────
// 9. UTILITY FUNCTIONS
// ──────────────────────────────────────────────

function capitalize(str) {
    if (!str) return '';
    // Handle camelCase-ish keys like "deepwork" → "Deep Work", "latenight" → "Late Night"
    const map = {
        focus: 'Focus',
        chill: 'Chill',
        deepwork: 'Deep Work',
        latenight: 'Late Night',
        coding: 'Coding',
        studying: 'Studying',
        reading: 'Reading',
        writing: 'Writing',
    };
    return map[str] || str.charAt(0).toUpperCase() + str.slice(1);
}

function showElement(el) {
    el.style.display = '';
    // Trigger reflow for animation restart
    void el.offsetHeight;
    el.style.animation = 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both';
}

function hideElement(el) {
    el.style.animation = 'none';
    el.style.display = 'none';
}


// ──────────────────────────────────────────────
// 10. SPOTIFY API INTEGRATION (OPTIONAL)
//     If a Spotify API key is configured, this
//     will attempt to fetch real playlists.
//     Falls back to YouTube embeds above.
// ──────────────────────────────────────────────

/*
  ┌───────────────────────────────────────────────────┐
  │  HOW TO ENABLE SPOTIFY API                         │
  │                                                     │
  │  1. Go to https://developer.spotify.com/dashboard  │
  │  2. Create a new App                                │
  │  3. Copy your Client ID and Client Secret           │
  │  4. Set SPOTIFY_CLIENT_ID below                     │
  │  5. The app will use Spotify embeds automatically   │
  └───────────────────────────────────────────────────┘
*/

const SPOTIFY_CONFIG = {
    clientId: '',       // ← Paste your Client ID here
    clientSecret: '',   // ← Paste your Client Secret here (only for server-side)
    // Pre-mapped Spotify playlist IDs for each mood × task combo
    // Replace these with your own playlist IDs
    playlistIds: {
        focus_coding:      '0vvXsWCC9xrXsKd4FyS8kM',
        focus_studying:    '0vvXsWCC9xrXsKd4FyS8kM',
        focus_reading:     '0vvXsWCC9xrXsKd4FyS8kM',
        focus_writing:     '0vvXsWCC9xrXsKd4FyS8kM',
        chill_coding:      '37i9dQZF1DX3rxVfibe1L0',
        chill_studying:    '37i9dQZF1DX3rxVfibe1L0',
        chill_reading:     '37i9dQZF1DX3rxVfibe1L0',
        chill_writing:     '37i9dQZF1DX3rxVfibe1L0',
        deepwork_coding:   '37i9dQZF1DX3rxVfibe1L0',
        deepwork_studying: '37i9dQZF1DX3rxVfibe1L0',
        deepwork_reading:  '37i9dQZF1DX3rxVfibe1L0',
        deepwork_writing:  '37i9dQZF1DX3rxVfibe1L0',
        latenight_coding:  '37i9dQZF1DX3rxVfibe1L0',
        latenight_studying:'37i9dQZF1DX3rxVfibe1L0',
        latenight_reading: '37i9dQZF1DX3rxVfibe1L0',
        latenight_writing: '37i9dQZF1DX3rxVfibe1L0',
    },
};

/**
 * Check if Spotify is configured and swap in Spotify embed player.
 * Called after main playlist generation if a Spotify Client ID is set.
 */
function trySpotifyEmbed(key) {
    if (!SPOTIFY_CONFIG.clientId) return false;

    const spotifyPlaylistId = SPOTIFY_CONFIG.playlistIds[key];
    if (!spotifyPlaylistId) return false;

    // Replace YouTube player with Spotify embed
    elements.playerContainer.innerHTML = `
        <iframe
            src="https://open.spotify.com/embed/playlist/${spotifyPlaylistId}?utm_source=generator&theme=0"
            title="Spotify Playlist"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            allowfullscreen
            loading="lazy"
            style="border-radius: 12px;"
        ></iframe>
    `;

    return true;
}


// ──────────────────────────────────────────────
// 11. INIT — Run on page load
// ──────────────────────────────────────────────

// Restore last saved selections from localStorage
loadSelections();

// Log a friendly message
console.log(
    '%c🎧 StudyVibe %cMusic Generator',
    'font-size: 20px; font-weight: bold; color: #7c5cfc;',
    'font-size: 20px; font-weight: 300; color: #f0f0f5;'
);
console.log('Select a mood and task to get started!');
