/* ═══════════════════════════════════════════
   audio.js — shared audio manager
   Handles all sound across all pages
═══════════════════════════════════════════ */

/* ── AUDIO FILES ── */
const AUDIO = {
  menu:        new Audio('Audio/Backgroundmenu.mp3'),
  battle:      new Audio('Audio/Battlemusic.mp3'),
  interaction: new Audio('Audio/Interaction-soundeffect.mp3'),
  hit:         new Audio('Audio/Hit_sound.mp3'),
  death:       new Audio('Audio/Death_sound.mp3'),
  victory:     new Audio('Audio/Victory.mp3'),
  defeat:      new Audio('Audio/Defeat.mp3'),
};

/* ── LOOPING TRACKS ── */
AUDIO.menu.loop   = true;
AUDIO.battle.loop = true;
AUDIO.victory.loop = true;
AUDIO.defeat.loop  = true;

/* ── VOLUME DEFAULTS ── */
AUDIO.menu.volume        = 0.2;
AUDIO.battle.volume      = 0.2;
AUDIO.interaction.volume = 1;
AUDIO.hit.volume         = 1;
AUDIO.death.volume       = 1;
AUDIO.victory.volume     = 0.2;
AUDIO.defeat.volume      = 0.2;

/* ── PAGE DETECTION ── */
function getPageType() {
  const path = window.location.pathname.toLowerCase();
  if (path.includes('victory'))    return 'victory';
  if (path.includes('defeat'))     return 'defeat';
  if (path.includes('battle'))     return 'battle';
  if (path.includes('choosing'))   return 'menu';
  if (path.includes('pikachu'))    return 'menu';
  if (path.includes('charmander')) return 'menu';
  if (path.includes('gible'))      return 'menu';
  return 'menu'; // index.html
}

/* ── SAVE MENU POSITION BEFORE LEAVING ── */
function saveMenuPosition() {
  if (!AUDIO.menu.paused) {
    localStorage.setItem('menuAudioTime', AUDIO.menu.currentTime);
  }
}

/* ── PLAY MENU MUSIC (resuming from saved position) ── */
function startMenuMusic() {
  const savedTime = parseFloat(localStorage.getItem('menuAudioTime') || '0');
  AUDIO.menu.currentTime = savedTime;
  AUDIO.menu.play().catch(() => {
    // Autoplay blocked — play on first interaction
    document.addEventListener('click', () => AUDIO.menu.play(), { once: true });
    document.addEventListener('keydown', () => AUDIO.menu.play(), { once: true });
  });
}

/* ── PLAY BATTLE MUSIC ── */
function startBattleMusic() {
  AUDIO.battle.currentTime = 0;
  AUDIO.battle.play().catch(() => {
    document.addEventListener('click', () => AUDIO.battle.play(), { once: true });
  });
}

/* ── PLAY VICTORY MUSIC ── */
function startVictoryMusic() {
  AUDIO.victory.currentTime = 0;
  AUDIO.victory.play().catch(() => {
    document.addEventListener('click', () => AUDIO.victory.play(), { once: true });
  });
}

/* ── PLAY DEFEAT MUSIC ── */
function startDefeatMusic() {
  AUDIO.defeat.currentTime = 0;
  AUDIO.defeat.play().catch(() => {
    document.addEventListener('click', () => AUDIO.defeat.play(), { once: true });
  });
}

/* ── SFX HELPERS ── */
function playInteraction() {
  AUDIO.interaction.currentTime = 0;
  AUDIO.interaction.play().catch(() => {});
}

function playHit() {
  AUDIO.hit.currentTime = 0;
  AUDIO.hit.play().catch(() => {});
}

function playDeath() {
  AUDIO.death.currentTime = 0;
  AUDIO.death.play().catch(() => {});
}

/* ── NAVIGATE WITH INTERACTION SOUND ── */
// Call this instead of window.location.href for menu pages
function navigateTo(url) {
  playInteraction();
  saveMenuPosition();
  setTimeout(() => { window.location.href = url; }, 250);
}

/* ── INIT AUDIO FOR CURRENT PAGE ── */
function initAudio() {
  const page = getPageType();

  if (page === 'menu') {
    startMenuMusic();
  } else if (page === 'battle') {
    // Clear saved menu position so it restarts fresh after battle
    localStorage.removeItem('menuAudioTime');
    startBattleMusic();
  } else if (page === 'victory') {
    startVictoryMusic();
  } else if (page === 'defeat') {
    startDefeatMusic();
  }

  // Save menu position any time user leaves a menu page
  if (page === 'menu') {
    window.addEventListener('beforeunload', saveMenuPosition);
    window.addEventListener('pagehide',     saveMenuPosition);
  }
}

/* ── AUTO INIT ── */
document.addEventListener('DOMContentLoaded', initAudio);

/* ── EXPOSE GLOBALLY ── */
window.audioManager = {
  playInteraction,
  playHit,
  playDeath,
  navigateTo,
  saveMenuPosition,
  AUDIO
};