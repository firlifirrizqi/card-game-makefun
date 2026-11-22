// shots.js — screenshot setups for ?shot=title|play|win|loss.
// Each setup reaches its state through the game's own functions (newGame,
// startDuel, playCard, attack, beginTurn) with a fixed seed, so the
// screenshot is a real render of the game, never a mock-up.

import { newGame, startDuel, drawCard, playCard, attack, beginTurn, endTurn } from './state.js';
import { makeCard } from './cards.js';

// A simple synchronous auto-player used only to reach a mid-game table.
function autoTurn(state, side) {
  const p = state[side];
  let guard = 0;
  while (guard < 10) {
    guard += 1;
    const playable = p.hand.filter(
      (c) => state.active === side && p.mana >= c.cost && (c.type === 'spell' || p.board.length < 5),
    );
    if (playable.length === 0) break;
    playable.sort((a, b) => b.cost - a.cost);
    const card = playable[0];
    let target = null;
    if (card.type === 'spell' && card.effect && (card.effect.kind === 'damageOne' || card.effect.kind === 'damageOneDraw')) {
      target = 'hero';
    }
    if (card.type === 'spell' && card.effect && card.effect.kind === 'buff' && p.board.length > 0) {
      target = p.board[0].uid;
    }
    playCard(state, side, card.uid, target);
    if (state.phase !== 'play') return;
  }
  const ready = p.board.filter((c) => c.canAttack && !c.sick);
  for (const c of ready) {
    attack(state, side, c.uid, 'hero');
    if (state.phase !== 'play') return;
  }
}

function midGame(state) {
  // Four rounds of both sides playing greedily, then stop on the player's turn.
  for (let round = 0; round < 4; round++) {
    if (state.phase !== 'play') break;
    autoTurn(state, 'player');
    if (state.phase !== 'play') break;
    endTurn(state);
    if (state.phase !== 'play') break;
    // AI side, same greedy logic, synchronous.
    autoTurn(state, 'ai');
    if (state.phase !== 'play') break;
    state.turn += 1;
    beginTurn(state, 'player');
  }
}

function placeCreature(state, side, defId, canAttack) {
  const card = makeCard(defId);
  card.sick = !canAttack;
  card.canAttack = !!canAttack;
  state[side].board.push(card);
  return card;
}

function giveHand(state, side, defIds) {
  state[side].hand = defIds.map((id) => makeCard(id));
}

export function setupShot(state, shot, seed) {
  if (shot === 'title') return state;
  if (shot === 'play') {
    startDuel(state);
    midGame(state);
    return state;
  }
  if (shot === 'win') {
    // One real click away from victory: a ready attacker vs 3 life.
    startDuel(state);
    state.ai.life = 3;
    state.player.life = 17;
    state.player.mana = 6;
    state.player.maxMana = 6;
    placeCreature(state, 'player', 'serigala-api', true);
    placeCreature(state, 'player', 'penyu-ombak', true);
    placeCreature(state, 'ai', 'tupai-daun', false);
    giveHand(state, 'player', ['semburan-api', 'ksatria-cahaya', 'tumbuh-subur', 'ikan-terbang']);
    giveHand(state, 'ai', ['bara-kecil', 'air-penyembuh', 'kijang-hutan']);
    return state;
  }
  if (shot === 'loss') {
    // One End Turn away from defeat: 2 life, no blockers, the rival is ready.
    startDuel(state);
    state.player.life = 2;
    state.ai.life = 18;
    state.player.mana = 4;
    state.player.maxMana = 4;
    placeCreature(state, 'ai', 'raksasa-lava', true);
    placeCreature(state, 'ai', 'serigala-api', true);
    giveHand(state, 'player', ['tupai-daun', 'ikan-terbang', 'air-penyembuh']);
    giveHand(state, 'ai', ['bara-kecil']);
    return state;
  }
  return state;
}

export function shotSeed(params) {
  const s = parseInt(params.get('seed') || '1', 10);
  return Number.isFinite(s) ? s : 1;
}
