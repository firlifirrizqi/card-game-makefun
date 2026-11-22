// ai.js — Sang Gerhana, the AI rival. It plays its cards greedily, answers
// threats it can kill, and goes for the face when the board is clear.
// Every choice is readable from the table, so the player can counter it.

import { canPlay, playCard, attack, readyAttackers, damageHero } from './state.js';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Pick the best card the AI can afford right now. Lethal damage first,
// healing when hurt, then the biggest creature, then draw.
function chooseCard(state) {
  const ai = state.ai;
  const playable = ai.hand.filter((c) => canPlay(state, 'ai', c));
  if (playable.length === 0) return null;

  const foeBoard = state.player.board;
  const lethal = playable.find(
    (c) =>
      c.type === 'spell' &&
      c.effect &&
      c.effect.kind === 'damageOne' &&
      c.effect.amount >= state.player.life,
  );
  if (lethal) return { card: lethal, target: null };

  if (ai.life <= 8) {
    const heal = playable.find((c) => c.type === 'spell' && c.effect && c.effect.kind === 'heal');
    if (heal) return { card: heal, target: null };
  }

  const boardWipe = playable.find(
    (c) => c.type === 'spell' && c.effect && c.effect.kind === 'damageAllEnemy' && foeBoard.length >= 2,
  );
  if (boardWipe) return { card: boardWipe, target: null };

  const buff = playable.find((c) => c.type === 'spell' && c.effect && c.effect.kind === 'buff');
  if (buff && ai.board.length > 0) {
    const best = ai.board.slice().sort((a, b) => b.atk - a.atk)[0];
    return { card: buff, target: best.uid };
  }

  const removal = playable.find((c) => c.type === 'spell' && c.effect && (c.effect.kind === 'damageOne' || c.effect.kind === 'damageOneDraw'));
  if (removal && foeBoard.length > 0) {
    const scary = foeBoard.slice().sort((a, b) => b.atk - a.atk)[0];
    if (scary.atk >= 4 || scary.hp <= removal.effect.amount) {
      return { card: removal, target: scary.uid };
    }
  }

  const draw = playable.find((c) => c.type === 'spell' && c.effect && c.effect.kind === 'draw');
  if (draw && ai.hand.length <= 4) return { card: draw, target: null };

  const creatures = playable.filter((c) => c.type === 'creature').sort((a, b) => b.cost - a.cost);
  if (creatures.length > 0) return { card: creatures[0], target: null };

  const faceBurn = playable.find((c) => c.type === 'spell' && c.effect && c.effect.kind === 'damageOne');
  if (faceBurn) return { card: faceBurn, target: null };

  return { card: playable[0], target: null };
}

function chooseAttack(state, attacker) {
  const foes = state.player.board;
  // Kill a creature it can kill, weakest first — otherwise go face.
  const killable = foes.filter((c) => c.hp <= attacker.atk + (attacker.faction === 'api' ? 1 : 0));
  if (killable.length > 0) {
    killable.sort((a, b) => a.hp - b.hp);
    return killable[0].uid;
  }
  return 'hero';
}

export async function takeAiTurn(state, onStep) {
  if (state.phase !== 'play' || state.active !== 'ai') return;
  const step = onStep || (() => {});
  await sleep(650);
  step();

  // Play cards until nothing affordable is worth playing.
  let guard = 0;
  while (state.phase === 'play' && state.active === 'ai' && guard < 12) {
    guard += 1;
    const pick = chooseCard(state);
    if (!pick) break;
    playCard(state, 'ai', pick.card.uid, pick.target);
    step();
    await sleep(550);
  }

  // Attack with every ready creature.
  while (state.phase === 'play' && state.active === 'ai') {
    const ready = readyAttackers(state, 'ai');
    if (ready.length === 0) break;
    const attacker = ready[0];
    const target = chooseAttack(state, attacker);
    attack(state, 'ai', attacker.uid, target);
    step();
    await sleep(600);
  }

  if (state.phase !== 'play') return;
  // Hand the turn back to the player.
  const { beginTurn } = await import('./state.js');
  state.turn += 1;
  beginTurn(state, 'player');
  step();
}
