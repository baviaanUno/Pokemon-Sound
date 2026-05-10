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
const MOVE_TIME_LIMIT = 120; // 2 minutes in seconds
let secs = MOVE_TIME_LIMIT;

function startTimer() {
  if (timerInterval) return;
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    secs--;
    updateTimerDisplay();
    if (secs <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      confirmExitToIndex();
    }
  }, 1000);
}

function resetTimer() {
  secs = MOVE_TIME_LIMIT;
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  $('timer').textContent = m + ':' + s;
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

/* ════════════════════════════════════════════════════════
   MOVE ANIMATIONS
   ════════════════════════════════════════════════════════ */

/* ── ANIMATE RED BEAM (BLOW) ── */
function animateRedBeam() {
  return new Promise(resolve => {
    const battle = $('battle');
    const beam = document.createElement('div');
    beam.className = 'move-beam-red';
    battle.appendChild(beam);
    beam.addEventListener('animationend', () => {
      beam.remove();
      resolve();
    }, { once: true });
  });
}

/* ── ANIMATE YELLOW/WHITE LIGHTNING BEAM (CLAP) ── */
function animateYellowBeam() {
  return new Promise(resolve => {
    const battle = $('battle');
    const beam = document.createElement('div');
    beam.className = 'move-beam-yellow';
    battle.appendChild(beam);
    beam.addEventListener('animationend', () => {
      beam.remove();
      resolve();
    }, { once: true });
  });
}

/* ── ANIMATE FALLING ORBS (HOWL, GROWL) ── */
function animateFallingOrbs() {
  return new Promise(resolve => {
    const battle = $('battle');
    const enemy = $('spr-enemy');
    
    if (!enemy) {
      resolve();
      return;
    }
    
    // Get enemy sprite position
    const rect = enemy.getBoundingClientRect();
    const battleRect = battle.getBoundingClientRect();
    
    // Calculate relative position within battle container
    const relX = rect.left - battleRect.left;
    const relY = rect.top - battleRect.top;
    
    // Create 3-4 orbs
    const orbCount = Math.random() > 0.5 ? 3 : 4;
    let orbsCreated = 0;
    let orbsFinished = 0;
    
    for (let i = 0; i < orbCount; i++) {
      const orb = document.createElement('div');
      orb.className = 'move-orb';
      
      // Random horizontal offset around the enemy sprite
      const offsetX = (Math.random() - 0.5) * 60;
      const startY = relY + 10;
      const startX = relX + 40 + offsetX; // Center on sprite (sprite is ~80px wide)
      
      orb.style.left = startX + 'px';
      orb.style.top = startY + 'px';
      orb.style.animationDelay = (i * 0.15) + 's'; // Stagger animation
      
      battle.appendChild(orb);
      orbsCreated++;
      
      orb.addEventListener('animationend', () => {
        orb.remove();
        orbsFinished++;
        if (orbsFinished === orbsCreated) {
          resolve();
        }
      }, { once: true });
    }
  });
}

/* ── ANIMATE FIST PUNCH (KNOCK) ── */
function animateFist() {
  return new Promise(resolve => {
    const battle = $('battle');
    const enemy = $('spr-enemy');
    
    if (!enemy) {
      resolve();
      return;
    }
    
    // Get enemy sprite position
    const rect = enemy.getBoundingClientRect();
    const battleRect = battle.getBoundingClientRect();
    
    // Calculate relative position within battle container
    const relX = rect.left - battleRect.left;
    const relY = rect.top - battleRect.top;
    
    const fist = document.createElement('div');
    fist.className = 'move-fist';
    fist.textContent = '✊';
    
    // Center on enemy sprite
    fist.style.left = (relX + 15) + 'px';
    fist.style.top = (relY + 10) + 'px';
    
    battle.appendChild(fist);
    fist.addEventListener('animationend', () => {
      fist.remove();
      resolve();
    }, { once: true });
  });
}

/* ── TRIGGER MOVE ANIMATION ── */
async function triggerMoveAnimation(moveName) {
  moveName = moveName.toLowerCase();
  
  if (moveName === 'blow') {
    return await animateRedBeam();
  } else if (moveName === 'clap') {
    return await animateYellowBeam();
  } else if (moveName === 'howl' || moveName === 'growl') {
    return await animateFallingOrbs();
  } else if (moveName === 'knock') {
    return await animateFist();
  }
}

/* ── ANIMATE YELLOW BEAM TO PLAYER (ENEMY THUNDERSHOCK, CLAP) ── */
function animateYellowBeamToPlayer() {
  return new Promise(resolve => {
    const battle = $('battle');
    const beam = document.createElement('div');
    beam.className = 'move-beam-yellow';
    beam.style.left = 'auto';
    beam.style.right = '10%';
    beam.style.transform = 'translateY(-50%) scaleX(-1)';
    battle.appendChild(beam);
    beam.addEventListener('animationend', () => {
      beam.remove();
      resolve();
    }, { once: true });
  });
}

/* ── ANIMATE RED BEAM TO PLAYER (ENEMY EMBER) ── */
function animateRedBeamToPlayer() {
  return new Promise(resolve => {
    const battle = $('battle');
    const beam = document.createElement('div');
    beam.className = 'move-beam-red';
    beam.style.left = 'auto';
    beam.style.right = '10%';
    beam.style.transform = 'translateY(-50%) scaleX(-1)';
    battle.appendChild(beam);
    beam.addEventListener('animationend', () => {
      beam.remove();
      resolve();
    }, { once: true });
  });
}

/* ── ANIMATE FIST TO PLAYER (ENEMY ATTACKS) ── */
function animateFistToPlayer() {
  return new Promise(resolve => {
    const battle = $('battle');
    const player = $('spr-player');
    
    if (!player) {
      resolve();
      return;
    }
    
    const rect = player.getBoundingClientRect();
    const battleRect = battle.getBoundingClientRect();
    
    const relX = rect.left - battleRect.left;
    const relY = rect.top - battleRect.top;
    
    const fist = document.createElement('div');
    fist.className = 'move-fist';
    fist.textContent = '✊';
    
    fist.style.left = (relX + 15) + 'px';
    fist.style.top = (relY + 10) + 'px';
    
    battle.appendChild(fist);
    fist.addEventListener('animationend', () => {
      fist.remove();
      resolve();
    }, { once: true });
  });
}

/* ── ANIMATE FALLING ORBS TO PLAYER (ENEMY SAND ATTACK, GROWL) ── */
function animateFallingOrbsToPlayer() {
  return new Promise(resolve => {
    const battle = $('battle');
    const player = $('spr-player');
    
    if (!player) {
      resolve();
      return;
    }
    
    const rect = player.getBoundingClientRect();
    const battleRect = battle.getBoundingClientRect();
    
    const relX = rect.left - battleRect.left;
    const relY = rect.top - battleRect.top;
    
    const orbCount = Math.random() > 0.5 ? 3 : 4;
    let orbsCreated = 0;
    let orbsFinished = 0;
    
    for (let i = 0; i < orbCount; i++) {
      const orb = document.createElement('div');
      orb.className = 'move-orb';
      
      const offsetX = (Math.random() - 0.5) * 60;
      const startY = relY + 10;
      const startX = relX + 40 + offsetX;
      
      orb.style.left = startX + 'px';
      orb.style.top = startY + 'px';
      orb.style.animationDelay = (i * 0.15) + 's';
      
      battle.appendChild(orb);
      orbsCreated++;
      
      orb.addEventListener('animationend', () => {
        orb.remove();
        orbsFinished++;
        if (orbsFinished === orbsCreated) {
          resolve();
        }
      }, { once: true });
    }
  });
}

/* ── TRIGGER ENEMY MOVE ANIMATION ── */
async function triggerEnemyMoveAnimation(moveName) {
  moveName = moveName.toLowerCase();
  
  // Enemy moves target the player, so we animate on player sprite
  if (moveName === 'thundershock' || moveName === 'clap') {
    return await animateYellowBeamToPlayer();
  } else if (moveName === 'quick attack' || moveName === 'scratch' || moveName === 'bite') {
    return await animateFistToPlayer();
  } else if (moveName === 'ember') {
    return await animateRedBeamToPlayer();
  } else if (moveName === 'sand attack') {
    return await animateFallingOrbsToPlayer();
  } else if (moveName === 'dragon rage') {
    return await animateYellowBeamToPlayer();
  } else if (moveName === 'growl') {
    return await animateFallingOrbsToPlayer();
  }
}

/* ── EXECUTE PLAYER MOVE ── */
async function executeMove(move) {
  if (S.busy || S.ehp <= 0 || S.php <= 0) return;
  S.busy = true;
  startTimer();

  await say(`${player.name} used ${move.name}!`);

  // Trigger move animation and WAIT for it to complete
  await triggerMoveAnimation(move.name);

  // Apply damage
  const dmg = Math.round(move.dmg * S.atkMod);
  if (dmg > 0) {
    setHP('e', S.ehp - dmg);
    flash('spr-enemy');
    playHit(); // Play hit sound effect
    // Show damage effectiveness message
    await say(`${move.name} was effective against ${enemyName}!`);
  }

  // Apply effect
  if (move.effect && Math.random() < move.effectChance) {
    const msg = applyEffect(move.effect, 'enemy');
    if (msg) await say(msg);
  }

  if (S.ehp <= 0) {
    fadeOutSpriteAndIcon('e');
    playDeath(); // Play death sound effect
    await say(`${enemyName} fainted! You win! 🎉`, 2000);
    S.busy = false;
    setTimeout(() => { window.location.href = 'Victory.html'; }, 800);
    return;
  }

  resetTimer();
  await enemyTurn();
  resetTimer();
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

    // Trigger enemy move animation and WAIT for it to complete
    await triggerEnemyMoveAnimation(picked.name);

    const dmg = Math.round(picked.dmg * S.eAtkMod);
    if (dmg > 0) {
      setHP('p', S.php - dmg);
      flash('spr-player');
      playHit(); // Play hit sound effect
      // Show damage effectiveness message
      await say(`${picked.name} was effective against ${player.name}!`);
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
    fadeOutSpriteAndIcon('e');
    playDeath(); // Play death sound effect
    await say(`${enemyName} fainted! You win! 🎉`, 2000);
    setTimeout(() => { window.location.href = 'Victory.html'; }, 800);
    return;
  }

  if (S.php <= 0) {
    fadeOutSpriteAndIcon('p');
    playDeath(); // Play death sound effect
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
    confirmExitToIndex();
    return;
  }
  const move = player.moves.find(m => m.cmd === cmd);
  if (move) executeMove(move);
};

/* ── INIT ON LOAD ── */
document.addEventListener('DOMContentLoaded', initBattleUI);

function fadeOutSpriteAndIcon(who) {
  // who: 'p' for player, 'e' for enemy
  const sprite = document.getElementById(who === 'p' ? 'spr-player' : 'spr-enemy');
  const icon = document.getElementById(who === 'p' ? 'hud-player-icon' : 'hud-enemy-icon');
  if (sprite) {
    sprite.style.transition = 'opacity 0.8s';
    sprite.style.opacity = '0';
  }
  if (icon) {
    icon.style.transition = 'opacity 0.8s';
    icon.style.opacity = '0';
  }
}

// Confirmation modal logic
function showExitConfirmModal() {
  const modal = document.getElementById('confirm-exit-modal');
  if (!modal) return;
  modal.style.display = 'flex';
  // Focus Blow by default
  setTimeout(() => { document.getElementById('confirm-blow').focus(); }, 100);
}
function hideExitConfirmModal() {
  const modal = document.getElementById('confirm-exit-modal');
  if (!modal) return;
  modal.style.display = 'none';
}
// Attach modal button handlers
window.addEventListener('DOMContentLoaded', () => {
  const blowBtn = document.getElementById('confirm-blow');
  const knockBtn = document.getElementById('confirm-knock');
  if (blowBtn) blowBtn.onclick = () => { window.location.href = 'index.html'; };
  if (knockBtn) knockBtn.onclick = hideExitConfirmModal;
});

// Intercept exit-to-index actions
function confirmExitToIndex() {
  showExitConfirmModal();
}

// In timer, replace window.location.href = 'index.html'; with confirmExitToIndex();
// In battleVoiceCommand, for confirmCmd, replace window.location.href = 'index.html'; with confirmExitToIndex();
// Voice command support in modal
const origHandleVoiceCommand = window.handleVoiceCommand;
window.handleVoiceCommand = function(cmd) {
  const modal = document.getElementById('confirm-exit-modal');
  if (modal && modal.style.display === 'flex') {
    if (cmd.toLowerCase() === 'blow') {
      window.location.href = 'index.html';
    } else if (cmd.toLowerCase() === 'knock') {
      hideExitConfirmModal();
    }
    return;
  }
  if (origHandleVoiceCommand) origHandleVoiceCommand(cmd);
};
