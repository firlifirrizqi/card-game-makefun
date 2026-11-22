// main.js — boots Kartu Purnama: wires clicks and keys to the rules in
// state.js, runs the rival's turn through ai.js, and re-renders after
// every step. Exposes window.__duel so tests and screenshots can drive it.

import { newGame, startDuel, playCard, attack, endTurn, canPlay, canAttack } from './state.js';
import { takeAiTurn } from './ai.js';
import { renderAll, banner, floatText } from './render.js';
import { sfx, toggleMute, isMuted } from './sound.js';
import { setupShot, shotSeed } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = shotSeed(params);

let state = newGame(seed);
let selectedUid = null;
let attackerUid = null;

const ui = {
  get selectedUid() { return selectedUid; },
  get attackerUid() { return attackerUid; },
  onHandCard,
  onBoardCard,
  onTarget,
};

function rerender() {
  renderAll(state, ui);
  const muteBtn = document.getElementById('mute-btn');
  if (muteBtn) muteBtn.textContent = isMuted() ? '🔇 Suara: Mati' : '🔊 Suara: Hidup';
}

function heroEl(side) {
  return document.querySelector('[data-hero="' + side + '"]');
}

function afterAction(prevLife) {
  // Floating damage numbers on the hero that just lost life.
  if (prevLife) {
    for (const side of ['player', 'ai']) {
      const before = prevLife[side];
      const after = state[side].life;
      if (after < before) floatText('-' + (before - after), heroEl(side), 'dmg');
      if (after > before) floatText('+' + (after - before), heroEl(side), 'heal');
    }
  }
  rerender();
  if (state.phase === 'win') {
    sfx.win();
  } else if (state.phase === 'loss') {
    sfx.lose();
  }
}

function snapshotLife() {
  return { player: state.player.life, ai: state.ai.life };
}

function onHandCard(uid) {
  if (state.phase !== 'play' || state.active !== 'player') return;
  const card = state.player.hand.find((c) => c.uid === uid);
  if (!card) return;
  attackerUid = null;
  if (selectedUid === uid) {
    // Second click: play it (spells that need a target wait for one instead).
    const needsTarget =
      card.type === 'spell' &&
      card.effect &&
      (card.effect.kind === 'damageOne' || card.effect.kind === 'damageOneDraw' || card.effect.kind === 'buff');
    if (needsTarget) {
      sfx.click();
      rerender();
      return; // keep it selected; the next click picks the target
    }
    selectedUid = null;
    playSelected(card);
    return;
  }
  selectedUid = uid;
  sfx.click();
  rerender();
}

function playSelected(card, targetUid) {
  const before = snapshotLife();
  const res = playCard(state, 'player', card.uid, targetUid);
  if (!res.ok) {
    selectedUid = null;
    rerender();
    return;
  }
  selectedUid = null;
  if (res.resonated) sfx.resonance();
  else if (card.type === 'spell' && card.effect && card.effect.kind === 'heal') sfx.heal();
  else sfx.play();
  afterAction(before);
}

function onBoardCard(uid) {
  if (state.phase !== 'play' || state.active !== 'player') return;
  const card = state.player.board.find((c) => c.uid === uid);
  if (!card) return;
  selectedUid = null;
  if (attackerUid === uid) {
    attackerUid = null;
  } else if (canAttack(state, 'player', card)) {
    attackerUid = uid;
    sfx.click();
  }
  rerender();
}

function onTarget(targetUid) {
  if (state.phase !== 'play' || state.active !== 'player') return;
  // A selected spell with a target resolves here.
  if (selectedUid) {
    const card = state.player.hand.find((c) => c.uid === selectedUid);
    if (card && card.type === 'spell') {
      if (card.effect && card.effect.kind === 'buff') {
        // Buff targets your own creature, not the enemy — ignore enemy clicks.
        return;
      }
      playSelected(card, targetUid === 'hero' ? null : targetUid);
      return;
    }
  }
  // Otherwise it is an attack target.
  if (attackerUid) {
    const before = snapshotLife();
    const res = attack(state, 'player', attackerUid, targetUid);
    attackerUid = null;
    if (res.ok) {
      sfx.attack();
      afterAction(before);
    } else {
      rerender();
    }
  }
}

// Buff spells target your own board: board clicks check for a pending buff.
const origOnBoardCard = onBoardCard;
ui.onBoardCard = function (uid) {
  if (selectedUid) {
    const card = state.player.hand.find((c) => c.uid === selectedUid);
    if (card && card.type === 'spell' && card.effect && card.effect.kind === 'buff') {
      playSelected(card, uid);
      return;
    }
  }
  origOnBoardCard(uid);
};

async function onEndTurn() {
  if (state.phase !== 'play' || state.active !== 'player') return;
  selectedUid = null;
  attackerUid = null;
  sfx.turn();
  endTurn(state);
  rerender();
  await takeAiTurn(state, () => {
    const ev = state.lastEvent;
    if (ev && ev.kind === 'attack') sfx.attack();
    if (ev && ev.kind === 'play') sfx.play();
    rerender();
  });
  rerender();
  if (state.phase === 'play') {
    banner('Giliranmu', 'Mana penuh — mainkan kartumu.');
    sfx.turn();
  } else {
    afterAction(null);
  }
}

function restart() {
  state = newGame((seed + 1) % 100000);
  selectedUid = null;
  attackerUid = null;
  rerender();
  banner('Duel Baru', 'Bulan terbit lagi.');
}

function boot() {
  document.getElementById('start-btn').addEventListener('click', () => {
    sfx.play();
    startDuel(state);
    banner('Duel Dimulai!', 'Giliranmu — mainkan kartumu.');
    rerender();
  });
  document.getElementById('how-btn').addEventListener('click', () => {
    const panel = document.getElementById('how-panel');
    panel.hidden = !panel.hidden;
  });
  document.getElementById('end-turn').addEventListener('click', onEndTurn);
  document.getElementById('mute-btn').addEventListener('click', () => {
    toggleMute();
    rerender();
  });
  document.getElementById('table').addEventListener('click', (e) => {
    if (e.target.id === 'table' || e.target.classList.contains('board-row')) {
      selectedUid = null;
      attackerUid = null;
      rerender();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (state.phase !== 'play') return;
    if (e.key >= '1' && e.key <= '7') {
      const idx = Number(e.key) - 1;
      const card = state.player.hand[idx];
      if (card && state.active === 'player') onHandCard(card.uid);
    } else if (e.key === 'Enter') {
      onEndTurn();
    } else if (e.key === 'Escape') {
      selectedUid = null;
      attackerUid = null;
      rerender();
    } else if (e.key === 'm' || e.key === 'M') {
      toggleMute();
      rerender();
    }
  });

  if (shot) {
    setupShot(state, shot, seed);
  }
  rerender();
}

window.__duel = {
  get state() { return state; },
  restart,
  playCard: (uid, target) => {
    const card = state.player.hand.find((c) => c.uid === uid);
    if (!card) return { ok: false, reason: 'not-in-hand' };
    return playSelected(card, target);
  },
  attack: (uid, target) => { const b = snapshotLife(); const r = attack(state, 'player', uid, target); afterAction(b); return r; },
  endTurn: onEndTurn,
  selectHand: (uid) => onHandCard(uid),
  selectBoard: (uid) => onBoardCard(uid),
  target: (uid) => onTarget(uid),
};

boot();
