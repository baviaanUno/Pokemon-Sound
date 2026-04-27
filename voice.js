/* ═══════════════════════════════════════════
   voice.js — shared across all pages
   Handles Teachable Machine audio + routing
═══════════════════════════════════════════ */

/* ── STORAGE ERROR HANDLING ── */
// Handle Tracking Prevention blocking localStorage
const storage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('[Storage] Blocked:', e.message);
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('[Storage] Blocked:', e.message);
    }
  }
};

/* ── POKEMON DATA ── */
const POKEDEX = {
  pikachu: {
    name: 'Pikachu',
    sprite: 'images/pikachu.gif',
    icon: 'images/image_6_4x.webp',
    enemyName: 'Charmander',
    enemySprite: 'images/charmander.gif',
    enemyIcon: 'images/image_13_4x.webp',
    color: '#BDBD0C',
    border: '#6B6E0D',
    textColor: 'black',
    confirmCmd: 'blow',
    moves: [
      { name: 'Clap',  cmd: 'clap',  dmg: 15, effect: 'paralyze', effectChance: 0.4,  desc: 'Deals 15 damage, 40% chance to paralyze', icon: 'images/Clapwhite.svg' },
      { name: 'Growl', cmd: 'growl', dmg: 0,  effect: 'lowerAtk', effectChance: 1.0,  desc: 'Lowers opponent\'s attack',              icon: 'images/Growlwhite.svg' },
      { name: 'Knock', cmd: 'knock', dmg: 20, effect: null,        effectChance: 0,    desc: 'Deals 20 damage',                        icon: 'images/Knockwhite.svg' }
    ]
  },
  charmander: {
    name: 'Charmander',
    sprite: 'images/charmander.gif',
    icon: 'images/image_13_4x.webp',
    enemyName: 'Pikachu',
    enemySprite: 'images/pikachu.gif',
    enemyIcon: 'images/image_6_4x.webp',
    color: '#760C0C',
    border: '#9F0F0F',
    textColor: 'white',
    confirmCmd: 'clap',
    moves: [
      { name: 'Blow',  cmd: 'blow',  dmg: 15, effect: 'burn',     effectChance: 0.4,  desc: 'Deals 15 damage, 40% chance to burn',   icon: 'images/Blowwhite.svg' },
      { name: 'Growl', cmd: 'growl', dmg: 0,  effect: 'lowerAtk', effectChance: 1.0,  desc: 'Lowers opponent\'s attack',             icon: 'images/Growlwhite.svg' },
      { name: 'Knock', cmd: 'knock', dmg: 20, effect: null,        effectChance: 0,    desc: 'Deals 20 damage',                       icon: 'images/Knockwhite.svg' }
    ]
  },
  gible: {
    name: 'Gible',
    sprite: 'images/gible.gif',
    icon: 'images/image_15_4x.webp',
    enemyName: 'Pikachu',
    enemySprite: 'images/pikachu.gif',
    enemyIcon: 'images/image_6_4x.webp',
    color: '#9507CD',
    border: '#2e093f',
    textColor: 'white',
    confirmCmd: 'clap',
    moves: [
      { name: 'Blow',  cmd: 'blow',  dmg: 15, effect: 'lowerAtk', effectChance: 1.0,  desc: 'Deals 15 damage and lowers opponent\'s attack', icon: 'images/Blowwhite.svg' },
      { name: 'Howl',  cmd: 'howl',  dmg: 0,  effect: 'lowerDef', effectChance: 1.0,  desc: 'Lowers opponent\'s defense',                   icon: 'images/Growlwhite.svg' },
      { name: 'Knock', cmd: 'knock', dmg: 20, effect: null,        effectChance: 0,    desc: 'Deals 20 damage',                              icon: 'images/Knockwhite.svg' }
    ]
  }
};

/* ── SAVE / LOAD CHOSEN POKEMON ── */
function saveChoice(pokemonKey) {
  storage.setItem('chosenPokemon', pokemonKey);
}
function loadChoice() {
  return storage.getItem('chosenPokemon') || 'charmander';
}

/* ── DETECT CURRENT PAGE ── */
function currentPage() {
  const path = window.location.pathname.toLowerCase();
  if (path.includes('choosing'))   return 'choosing';
  if (path.includes('pikachu'))    return 'pikachu';
  if (path.includes('charmander')) return 'charmander';
  if (path.includes('gible'))      return 'gible';
  if (path.includes('battle'))     return 'battle';
  if (path.includes('index') || path === '/' || path.endsWith('/')) return 'index';
  return 'unknown';
}

/* ── VOICE COMMAND ROUTER ── */
function handleVoiceCommand(cmd) {
  cmd = cmd.toLowerCase().trim();
  const page = currentPage();
  console.log('[Voice]', cmd, '| Page:', page);

  if (page === 'index') {
    if (cmd === 'clap') {
      window.location.href = 'Choosing.html';
    }
  }

  else if (page === 'choosing') {
    if (cmd === 'clap')  { saveChoice('pikachu');    window.location.href = 'pikachu.html'; }
    if (cmd === 'blow')  { saveChoice('charmander'); window.location.href = 'charmander.html'; }
    if (cmd === 'knock') { saveChoice('gible');      window.location.href = 'Gible.html'; }
  }

  else if (page === 'pikachu') {
    if (cmd === 'clap') { saveChoice('pikachu'); window.location.href = 'battle.html'; }
    if (cmd === 'knock') { window.location.href = 'Choosing.html'; }
  }

  else if (page === 'charmander') {
    if (cmd === 'blow') { saveChoice('charmander'); window.location.href = 'battle.html'; }
    if (cmd === 'knock') { window.location.href = 'Choosing.html'; }
  }

  else if (page === 'gible') {
    if (cmd === 'knock') { saveChoice('gible'); window.location.href = 'battle.html'; }
    if (cmd === 'blow') { window.location.href = 'Choosing.html'; }
  }

  else if (page === 'battle') {
    // Delegate to battle.js
    if (window.battleVoiceCommand) window.battleVoiceCommand(cmd);
  }
}

/* ── TEACHABLE MACHINE SETUP ── */
// Replace this URL with your actual Teachable Machine model URL
const MODEL_URL = './';

let recognizer;

async function initVoice() {
  try {
    const baseURL = window.location.href.split('/').slice(0, -1).join('/') + '/';
    const checkpointURL = baseURL + 'model.json';
    const metadataURL   = baseURL + 'metadata.json';

    // Try with forced 44.1kHz sample rate to match Teachable Machine model
    let audioConfig = { sampleRateHz: 44100 };
    try {
      recognizer = speechCommands.create('BROWSER_FFT', audioConfig, checkpointURL, metadataURL);
    } catch (rateErr) {
      // If 44.1kHz fails, try default (handles sampling rate mismatch)
      console.warn('[Voice] Sample rate 44100 failed, trying default:', rateErr.message);
      recognizer = speechCommands.create('BROWSER_FFT', undefined, checkpointURL, metadataURL);
    }
    
    await recognizer.ensureModelLoaded();

    const labels = recognizer.wordLabels();
    console.log('[Voice] Model loaded. Labels:', labels);

    setListeningUI(true);

    recognizer.listen(result => {
      const scores  = result.scores;
      const topIdx  = scores.indexOf(Math.max(...scores));
      const topScore = scores[topIdx];
      const topLabel = labels[topIdx];

      if (topScore > 0.80) {
        handleVoiceCommand(topLabel);
      }
    }, {
      includeSpectrogram: true,
      probabilityThreshold: 0.75,
      invokeCallbackOnNoiseAndUnknown: true,
      overlapFactor: 0.50
    });

  } catch (e) {
    console.warn('[Voice] Model not loaded yet. Using manual triggers.', e);
  }
}

/* ── LISTENING UI INDICATOR ── */
function setListeningUI(on) {
  const el = document.getElementById('listen-badge');
  if (el) el.style.display = on ? 'block' : 'none';
}

/* ── MANUAL TRIGGER (for testing without mic) ── */
window.triggerVoice = handleVoiceCommand;

/* ── AUTO-INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  initVoice();
});
