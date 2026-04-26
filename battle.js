/* ═══════════════════════════════
   battle.js — battle screen logic
   Reads chosen Pokémon from localStorage
═══════════════════════════════ */

/* ── LOAD CHOSEN POKEMON ── */
const chosenKey = localStorage.getItem('chosenPokemon') || 'charmander';
const player    = POKEDEX[chosenKey];

/* ── SPRITE URLS ── */
const SPRITES = {
  pikachu: {
    back: 'https://img.pokemondb.net/sprites/black-white/anim/back-normal/pikachu.gif',
    front: 'https://img.pokemondb.net/sprites/black-white/anim/normal/pikachu.gif'
  },
  charmander: {
    back: 'https://img.pokemondb.net/sprites/black-white/anim/back-normal/charmander.gif',
    front: 'https://img.pokemondb.net/sprites/black-white/anim/normal/charmander.gif'
  },
  gible: {
    back: 'https://img.pokemondb.net/sprites/black-white/anim/back-normal/gible.gif',
    front: 'https://img.pokemondb.net/sprites/black-white/anim/normal/gible.gif'
  }
};

/* ── RANDOM ENEMY SELECTION ── */
let enemyKey; // Global to store the random enemy
let enemyName; // Global to store enemy name
function getRandomEnemy() {
  const options = ['pikachu', 'charmander', 'gible'].filter(key => key !== chosenKey);
  enemyKey = options[Math.floor(Math.random() * options.length)];
  enemyName = POKEDEX[enemyKey].name;
  return { key: enemyKey, data: POKEDEX[enemyKey] };
}

/* ── GAME STATE ── */
const S = {
  php: 100,
  ehp: 100,
  max: 100,
  busy: false,
  atkMod: 1.0,   // player attack modifier
  defMod: 1.0,   // enemy defense modifier
  eAtkMod: 1.0,  // enemy attack modifier
  eDefMod: 1.0,   // player defense modifier (enemy lowers this)
  enemyParalyzed: false,
  enemyBurned: false
};

let secs = 0;
let timerInterval = null;
const $ = id => document.getElementById(id);

/* ── INIT BATTLE UI WITH CHOSEN POKEMON ── */
function initBattleUI() {
  // Get random enemy
  const enemy = getRandomEnemy();

  // Player sprite
  const sprP = $('spr-player');
  sprP.querySelector('img').src = SPRITES[chosenKey].back;
  sprP.querySelector('img').alt = player.name;

  // Enemy sprite
  const sprE = $('spr-enemy');
  sprE.querySelector('img').src = SPRITES[enemy.key].front;
  sprE.querySelector('img').alt = enemy.data.name;

  // Player HUD
  $('hud-player-icon').src = player.icon;
  $('hud-player-name').textContent = player.name;

  // Enemy HUD
  $('hud-enemy-icon').src = enemy.data.icon;
  $('hud-enemy-name').textContent = enemy.data.name;

  // Build move buttons - commented out since buttons are removed
  // buildMoveButtons();

  // Set move list image based on chosen Pokemon
  const moveListImg = $('move-list-img');
  if (chosenKey === 'pikachu') {
    moveListImg.src = 'images/Pikachu.png';
  } else if (chosenKey === 'charmander') {
    moveListImg.src = 'images/Charmander.png';
  } else if (chosenKey === 'gible') {
    moveListImg.src = 'images/Gible.png';
  }
}

/* ── BUILD MOVE BUTTONS FROM PLAYER DATA ── */
function buildMoveButtons() {
  const grid = $('moves');
  grid.innerHTML = '';

  player.moves.forEach(move => {
    const btn = document.createElement('button');
    btn.className = 'move-btn';
    btn.setAttribute('data-cmd', move.cmd);
    btn.innerHTML = `
      <img src="${move.icon}" alt="${move.name}"
        onerror="this.style.display='none';this.insertAdjacentHTML('afterend','<div class=\\'fallback move-fallback\\'>${move.name.toUpperCase()}</div>')">
      <span class="move-label">${move.name}</span>
    `;
    btn.addEventListener('click', () => executeMove(move));
    grid.appendChild(btn);
  });
}

/* ── TIMER ── */
function startTimer() {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    secs++;
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    $('timer').textContent = m + ':' + s;
  }, 1000);
}

/* ── HP BAR ── */
function setHP(who, val) {
  val = Math.max(0, Math.min(S.max, val));
  const pct   = (val / S.max) * 100;
  const barId = who === 'p' ? 'hp-p' : 'hp-e';
  const numId = who === 'p' ? 'nums-p' : 'nums-e';

  const bar = $(barId);
  bar.style.width = pct + '%';
  bar.style.background =
    pct > 50 ? '#4cff4c' :
    pct > 25 ? '#f4e030' : '#e24b4a';

  $(numId).textContent = Math.round(val) + '/100';
  if (who === 'p') S.php = val;
  else             S.ehp = val;
}

/* ── FLASH ── */
function flash(id) {
  const el = $(id);
  el.classList.add('flash');
  el.addEventListener('animationend', () => el.classList.remove('flash'), { once: true });
}

/* ── DIALOG ── */
function say(msg, ms = 2000) {
  return new Promise(resolve => {
    const d = $('dialog');
    d.textContent = msg;
    d.classList.add('on');
    setTimeout(() => {
      d.classList.remove('on');
      resolve();
    }, ms);
  });
}

/* ── STATUS EFFECTS ── */
function applyEffect(effect, target) {
  if (!effect) return null;
  if (effect === 'burn')     { S.enemyBurned = true; return `It burns! ${enemyName} will lose HP each turn.`; }
  if (effect === 'paralyze') { S.enemyParalyzed = true; return `${enemyName} is paralyzed!`; }
  if (effect === 'lowerAtk') { S.eAtkMod = Math.max(0.5, S.eAtkMod - 0.25); return `${enemyName}'s attack fell!`; }
  if (effect === 'lowerDef') { S.eDefMod = Math.max(0.5, S.eDefMod - 0.25); return `${enemyName}'s defense fell!`; }
  return null;
}

/* ── EXECUTE PLAYER MOVE ── */
async function executeMove(move) {
  if (S.busy || S.ehp <= 0 || S.php <= 0) return;
  S.busy = true;
  startTimer();

  await say(`${player.name} used ${move.name}!`);

  // Apply damage
  const dmg = Math.round(move.dmg * S.atkMod);
  if (dmg > 0) {
    setHP('e', S.ehp - dmg);
    flash('spr-enemy');
  }

  // Apply effect
  if (move.effect && Math.random() < move.effectChance) {
    const msg = applyEffect(move.effect, 'enemy');
    if (msg) await say(msg);
  }

  if (S.ehp <= 0) {
    await say(`${enemyName} fainted! You win! 🎉`, 2000);
    S.busy = false;
    setTimeout(() => { window.location.href = 'Victory.html'; }, 800);
    return;
  }

  await enemyTurn();
  S.busy = false;
}

/* ── ENEMY AI ── */
async function enemyTurn() {
  // Check for paralyze
  if (S.enemyParalyzed) {
    await say(`${enemyName} is paralyzed and can't move!`);
    S.enemyParalyzed = false;
  } else {
    // Enemy uses random moves based on chosen pokemon's enemy
    const enemyMoves = getEnemyMoves();
    const picked = enemyMoves[Math.floor(Math.random() * enemyMoves.length)];

    await say(`${enemyName} used ${picked.name}!`);

    const dmg = Math.round(picked.dmg * S.eAtkMod);
    if (dmg > 0) {
      setHP('p', S.php - dmg);
      flash('spr-player');
    }

    if (picked.effect === 'lowerAtk') {
      S.atkMod = Math.max(0.5, S.atkMod - 0.25);
      await say(`${player.name}'s attack fell!`);
    }
  }

  // Apply burn damage
  if (S.enemyBurned) {
    setHP('e', S.ehp - 5);
    await say(`${enemyName} is hurt by burn!`);
    flash('spr-enemy');
  }

  if (S.ehp <= 0) {
    await say(`${enemyName} fainted! You win! 🎉`, 2000);
    setTimeout(() => { window.location.href = 'Victory.html'; }, 800);
    return;
  }

  if (S.php <= 0) {
    await say(`${player.name} fainted! Game over.`, 2000);
    setTimeout(() => { window.location.href = 'Defeat.html'; }, 800);
    return;
  }
}

/* ── ENEMY MOVE SETS ── */
function getEnemyMoves() {
  // Each enemy has a fixed move pool regardless of chosen pokemon
  const pools = {
    pikachu:    [{ name: 'Thundershock', dmg: 20, effect: null }, { name: 'Quick Attack', dmg: 15, effect: null }, { name: 'Growl', dmg: 0, effect: 'lowerAtk' }],
    charmander: [{ name: 'Ember',        dmg: 18, effect: null }, { name: 'Scratch',      dmg: 14, effect: null }, { name: 'Growl', dmg: 0, effect: 'lowerAtk' }],
    gible:      [{ name: 'Sand Attack',  dmg: 12, effect: null }, { name: 'Dragon Rage',  dmg: 20, effect: null }, { name: 'Bite',  dmg: 16, effect: null }]
  };
  return pools[enemyKey] || pools.pikachu;
}

/* ── VOICE COMMAND HANDLER (called by voice.js) ── */
window.battleVoiceCommand = function(cmd) {
  if (cmd === player.confirmCmd) {
    window.location.href = 'index.html';
    return;
  }
  const move = player.moves.find(m => m.cmd === cmd);
  if (move) executeMove(move);
};

/* ── INIT ON LOAD ── */
document.addEventListener('DOMContentLoaded', initBattleUI);
