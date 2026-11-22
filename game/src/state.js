// state.js — the rules of Kartu Purnama: turns, mana, drawing, playing cards,
// combat, Resonansi combos, and how a duel is won or lost. Pure logic, no DOM.

import { FACTIONS, makeCard, makeRng, shuffledDeck } from './cards.js';

export const START_LIFE = 20;
export const MAX_HAND = 7;
export const MAX_BOARD = 5;
export const MAX_MANA = 10;

function freshSide(deck) {
  return {
    life: START_LIFE,
    mana: 0,
    maxMana: 0,
    deck: deck.slice(),
    hand: [],
    board: [],
    discard: [],
    playedFactions: {},
  };
}

export function newGame(seed) {
  const rng = makeRng(seed || (Date.now() % 2147483647));
  const state = {
    seed,
    rng,
    phase: 'title',
    turn: 0,
    active: 'player',
    player: freshSide(shuffledDeck(rng)),
    ai: freshSide(shuffledDeck(rng)),
    log: [],
    stats: { turns: 0, cardsPlayed: 0, damageDealt: 0, resonance: 0 },
    winner: null,
    lastEvent: null,
  };
  return state;
}

export function startDuel(state) {
  state.phase = 'play';
  state.turn = 1;
  for (let i = 0; i < 3; i++) drawCard(state, 'player');
  for (let i = 0; i < 3; i++) drawCard(state, 'ai');
  beginTurn(state, 'player');
  pushLog(state, 'Duel dimulai! Giliranmu — mainkan kartumu.');
}

export function drawCard(state, side) {
  const p = state[side];
  if (p.deck.length === 0) {
    // An empty deck bites: fatigue damage, 1 then 2 then 3...
    p.fatigue = (p.fatigue || 0) + 1;
    damageHero(state, side, p.fatigue, 'kelelahan');
    pushLog(state, sideName(side) + ' kehabisan kartu! -' + p.fatigue + ' nyawa (kelelahan).');
    return null;
  }
  if (p.hand.length >= MAX_HAND) {
    const burned = p.deck.shift();
    pushLog(state, sideName(side) + ' tangannya penuh — kartu terbakar.');
    return null;
  }
  const card = makeCard(p.deck.shift());
  p.hand.push(card);
  return card;
}

export function sideName(side) {
  return side === 'player' ? 'Kamu' : 'Sang Gerhana';
}

export function beginTurn(state, side) {
  const p = state[side];
  state.active = side;
  p.maxMana = Math.min(MAX_MANA, p.maxMana + 1);
  p.mana = p.maxMana;
  p.playedFactions = {};
  for (const c of p.board) {
    c.canAttack = true;
    c.sick = false;
  }
  drawCard(state, side);
  if (side === 'player') {
    state.stats.turns += 1;
    pushLog(state, '— Giliran ' + state.turn + ': manamu ' + p.mana + '/' + p.maxMana + ' —');
  }
}

export function endTurn(state) {
  if (state.phase !== 'play' || state.active !== 'player') return false;
  for (const c of state.player.board) c.canAttack = false;
  const next = 'ai';
  state.turn += 1;
  beginTurn(state, next);
  return true;
}

// Resonansi: the second (and later) card of the same faction in one turn
// comes in stronger — +1/+1 for creatures, +2 effect for spells.
function resonanceBonus(state, side, card) {
  const played = state[side].playedFactions[card.faction] || 0;
  return played >= 1;
}

function applyResonance(state, side, card) {
  const bonus = resonanceBonus(state, side, card);
  state[side].playedFactions[card.faction] = (state[side].playedFactions[card.faction] || 0) + 1;
  if (bonus) {
    state.stats.resonance += 1;
    pushLog(state, '✦ RESONANSI ' + FACTIONS[card.faction].name + '! Kartu ini lebih kuat.');
    return true;
  }
  return false;
}

export function canPlay(state, side, card) {
  return (
    state.phase === 'play' &&
    state.active === side &&
    state[side].mana >= card.cost &&
    (card.type === 'spell' || state[side].board.length < MAX_BOARD)
  );
}

export function playCard(state, side, uid, targetUid) {
  const p = state[side];
  const idx = p.hand.findIndex((c) => c.uid === uid);
  if (idx < 0) return { ok: false, reason: 'not-in-hand' };
  const card = p.hand[idx];
  if (!canPlay(state, side, card)) return { ok: false, reason: 'cannot-play' };
  const resonated = applyResonance(state, side, card);
  p.mana -= card.cost;
  p.hand.splice(idx, 1);
  state.stats.cardsPlayed += 1;
  state.lastEvent = { kind: 'play', side, card: card.name, resonated };

  if (card.type === 'creature') {
    if (resonated) {
      card.atk += 1;
      card.hp += 1;
      card.maxHp += 1;
    }
    card.sick = true;
    card.canAttack = false;
    card.justPlayed = true;
    p.board.push(card);
    pushLog(state, sideName(side) + ' memainkan ' + card.name + ' (' + card.atk + '/' + card.hp + ').');
    if (card.defId === 'kunang') drawCard(state, side);
    if (card.defId === 'ksatria-cahaya') healHero(state, side, 2);
    if (card.defId === 'putri-duyung') healHero(state, side, 3);
    if (card.defId === 'naga-purnama') {
      for (const other of p.board) {
        if (other.uid !== card.uid) {
          other.atk += 2;
          other.hp += 2;
          other.maxHp += 2;
        }
      }
      pushLog(state, 'Naga Purnama memberkati semua makhluk ' + sideName(side) + ' +2/+2!');
    }
  } else {
    p.discard.push(card);
    resolveSpell(state, side, card, targetUid, resonated);
  }
  checkEnd(state);
  return { ok: true, card, resonated };
}

function resolveSpell(state, side, card, targetUid, resonated) {
  const foe = side === 'player' ? 'ai' : 'player';
  const eff = card.effect;
  const bonus = resonated ? 2 : 0;
  if (!eff) return;
  if (eff.kind === 'heal') {
    healHero(state, side, eff.amount + bonus);
    pushLog(state, sideName(side) + ' memakai ' + card.name + ': +' + (eff.amount + bonus) + ' nyawa.');
  } else if (eff.kind === 'draw') {
    const n = eff.amount + (resonated ? 1 : 0);
    for (let i = 0; i < n; i++) drawCard(state, side);
    pushLog(state, sideName(side) + ' memakai ' + card.name + ': gambar ' + n + ' kartu.');
  } else if (eff.kind === 'damageAllEnemy') {
    const dmg = eff.amount + bonus;
    for (const c of state[foe].board.slice()) damageCreature(state, foe, c, dmg);
    pushLog(state, card.name + ': semua makhluk lawan -' + dmg + '.');
  } else if (eff.kind === 'damageOne' || eff.kind === 'damageOneDraw') {
    const target = state[foe].board.find((c) => c.uid === targetUid);
    if (target) {
      damageCreature(state, foe, target, eff.amount + bonus);
      pushLog(state, card.name + ': ' + target.name + ' -' + (eff.amount + bonus) + '.');
    } else {
      damageHero(state, foe, eff.amount + bonus, card.name);
      pushLog(state, card.name + ': ' + sideName(foe) + ' -' + (eff.amount + bonus) + ' nyawa.');
    }
    if (eff.kind === 'damageOneDraw') drawCard(state, side);
  } else if (eff.kind === 'buff') {
    const target = state[side].board.find((c) => c.uid === targetUid) || state[side].board[0];
    if (target) {
      target.atk += eff.amount + bonus;
      target.hp += eff.amount + bonus;
      target.maxHp += eff.amount + bonus;
      pushLog(state, card.name + ': ' + target.name + ' +' + (eff.amount + bonus) + '/+' + (eff.amount + bonus) + '.');
    }
  }
}

export function healHero(state, side, amount) {
  const p = state[side];
  p.life = Math.min(START_LIFE, p.life + amount);
}

export function damageHero(state, side, amount, source) {
  const p = state[side];
  p.life -= amount;
  if (side === 'ai') state.stats.damageDealt += amount;
  state.lastEvent = { kind: 'damage', side, amount, source: source || 'serangan' };
  checkEnd(state);
}

export function damageCreature(state, side, card, amount) {
  card.hp -= amount;
  state.lastEvent = { kind: 'damage', side, amount, card: card.name };
  if (card.hp <= 0) {
    const p = state[side];
    const idx = p.board.findIndex((c) => c.uid === card.uid);
    if (idx >= 0) {
      p.board.splice(idx, 1);
      p.discard.push(card);
      pushLog(state, card.name + ' hancur!');
    }
  }
}

export function canAttack(state, side, card) {
  return (
    state.phase === 'play' &&
    state.active === side &&
    card.type === 'creature' &&
    card.canAttack &&
    !card.sick
  );
}

export function attack(state, side, attackerUid, targetUid) {
  const p = state[side];
  const foe = side === 'player' ? 'ai' : 'player';
  const attacker = p.board.find((c) => c.uid === attackerUid);
  if (!attacker || !canAttack(state, side, attacker)) return { ok: false, reason: 'cannot-attack' };
  let power = attacker.atk;
  if (attacker.faction === 'api') power += 1; // Membara: +1 serangan saat menyerang
  attacker.canAttack = false;
  state.lastEvent = { kind: 'attack', side, card: attacker.name, power };

  if (!targetUid || targetUid === 'hero') {
    pushLog(state, attacker.name + ' menyerang ' + sideName(foe) + ' (-' + power + ').');
    damageHero(state, foe, power, attacker.name);
    return { ok: true, target: 'hero', power };
  }
  const target = state[foe].board.find((c) => c.uid === targetUid);
  if (!target) return { ok: false, reason: 'no-target' };
  pushLog(state, attacker.name + ' (' + power + ') melawan ' + target.name + ' (' + target.atk + ').');
  damageCreature(state, foe, target, power);
  damageCreature(state, side, attacker, target.atk);
  return { ok: true, target: target.name, power };
}

export function checkEnd(state) {
  if (state.phase !== 'play') return;
  if (state.ai.life <= 0) {
    state.phase = 'win';
    state.winner = 'player';
    pushLog(state, '🏆 MENANG! Sang Gerhana tumbang di bawah cahaya purnama.');
  } else if (state.player.life <= 0) {
    state.phase = 'loss';
    state.winner = 'ai';
    pushLog(state, '🌑 KALAH... Gerhana menelan cahaya purnama.');
  }
}

export function pushLog(state, text) {
  state.log.push(text);
  if (state.log.length > 40) state.log.shift();
}

export function playableCards(state, side) {
  return state[side].hand.filter((c) => canPlay(state, side, c));
}

export function readyAttackers(state, side) {
  return state[side].board.filter((c) => canAttack(state, side, c));
}
