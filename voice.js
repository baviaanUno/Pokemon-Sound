/* ═══════════════════════════════════════════
   voice.js — shared across all pages
   Handles Teachable Machine audio + routing
═══════════════════════════════════════════ */

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
  localStorage.setItem('chosenPokemon', pokemonKey);
}
function loadChoice() {
  return localStorage.getItem('chosenPokemon') || 'charmander';
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

    recognizer = speechCommands.create(
      'BROWSER_FFT', undefined, checkpointURL, metadataURL
    );
    await recognizer.ensureModelLoaded();

    const labels = recognizer.wordLabels();
    console.log('[Voice] Model loaded. Labels:', labels);

    setListeningUI(true);

const HOLD_DURATION_MS = 0; // must be detected for 1 seconds
let holdLabel = null;
let holdStart = null;

recognizer.listen(result => {
  const scores   = result.scores;
  const topIdx   = scores.indexOf(Math.max(...scores));
  const topScore = scores[topIdx];
  const topLabel = labels[topIdx];

  if (topScore > 0.80) {
    if (topLabel === holdLabel) {
      // Same label still going — check if 2s have elapsed
      if (holdStart && (Date.now() - holdStart >= HOLD_DURATION_MS)) {
        handleVoiceCommand(topLabel);
        holdLabel = null; // reset so it doesn't keep firing
        holdStart = null;
      }
    } else {
      // New label detected — start the clock
      holdLabel = topLabel;
      holdStart = Date.now();
    }
  } else {
    // Confidence dropped — reset everything
    holdLabel = null;
    holdStart = null;
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
