// render.js — everything the player sees: the table, the hands, the cards,
// the life and mana, the log, the banners and the floating numbers.
// DOM only; the rules live in state.js.

import { FACTIONS } from './cards.js';

const SHAPES = {
  circle: '<circle cx="12" cy="12" r="9" fill="currentColor"/>',
  triangle: '<path d="M12 3 L22 21 L2 21 Z" fill="currentColor"/>',
  drop: '<path d="M12 2 C12 2 4 12 4 16 A8 8 0 0 0 20 16 C20 12 12 2 12 2 Z" fill="currentColor"/>',
  leaf: '<path d="M20 4 C10 4 4 10 4 20 C14 20 20 14 20 4 Z M6 18 C10 12 14 9 18 6" fill="currentColor" stroke="currentColor" stroke-width="1.5"/>',
};

export function factionIcon(factionId, size) {
  const f = FACTIONS[factionId];
  const s = size || 20;
  return (
    '<svg class="faction-icon" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" ' +
    'style="color:' + f.color + '" aria-label="' + f.name + '">' + SHAPES[f.shape] + '</svg>'
  );
}

function esc(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// One card on the table. opts: {faceDown, playable, selected, attacking, owner}
export function cardEl(card, opts) {
  const o = opts || {};
  const f = FACTIONS[card.faction];
  const el = document.createElement('div');
  el.className = 'card' + (o.faceDown ? ' face-down' : '') + (o.playable ? ' playable' : '') + (o.selected ? ' selected' : '');
  el.dataset.uid = card.uid;
  el.style.setProperty('--faction', f.color);
  el.style.setProperty('--faction-dark', f.dark);
  if (o.faceDown) {
    el.innerHTML =
      '<div class="card-back"><span class="card-back-moon">☾</span></div>';
    return el;
  }
  const stats =
    card.type === 'creature'
      ? '<div class="card-stats"><span class="atk">⚔ ' + card.atk + '</span><span class="hp">♥ ' + card.hp + '</span></div>'
      : '<div class="card-stats"><span class="spell-tag">MANTRA</span></div>';
  el.innerHTML =
    '<div class="card-cost">' + card.cost + '</div>' +
    '<div class="card-faction">' + factionIcon(card.faction, 18) + '<span>' + f.name + '</span></div>' +
    '<div class="card-art">' + factionIcon(card.faction, 44) + '</div>' +
    '<div class="card-name">' + esc(card.name) + '</div>' +
    '<div class="card-text">' + esc(card.text) + '</div>' +
    stats;
  if (card.sick) el.classList.add('sick');
  if (o.attacking) el.classList.add('attacking');
  return el;
}

function heroEl(side, state, ui) {
  const p = state[side];
  const isAi = side === 'ai';
  const el = document.createElement('div');
  el.className = 'hero ' + (isAi ? 'hero-ai' : 'hero-player') + (state.active === side ? ' active-turn' : '');
  el.dataset.hero = side;
  const portrait = isAi ? '🌑' : '🌕';
  const name = isAi ? 'Sang Gerhana' : 'Penjaga Purnama';
  el.innerHTML =
    '<div class="hero-portrait">' + portrait + '</div>' +
    '<div class="hero-info"><div class="hero-name">' + name + '</div>' +
    '<div class="hero-life">♥ <b>' + p.life + '</b> / 20</div>' +
    '<div class="hero-mana">◆ ' + p.mana + ' / ' + p.maxMana + ' mana</div>' +
    '<div class="hero-deck">🂠 Dek: ' + p.deck.length + ' &nbsp; Tangan: ' + p.hand.length + '</div></div>';
  return el;
}

export function renderAll(state, ui) {
  const title = document.getElementById('title-screen');
  const table = document.getElementById('table');
  const end = document.getElementById('end-screen');
  title.hidden = state.phase !== 'title';
  table.hidden = state.phase === 'title';
  end.hidden = state.phase !== 'win' && state.phase !== 'loss';

  if (state.phase === 'title') return;
  if (state.phase === 'win' || state.phase === 'loss') {
    renderEnd(state);
    return;
  }

  // --- Opponent row ---
  const aiHand = document.getElementById('ai-hand');
  aiHand.innerHTML = '';
  for (const c of state.ai.hand) aiHand.appendChild(cardEl(c, { faceDown: true }));
  const aiBoard = document.getElementById('ai-board');
  aiBoard.innerHTML = '';
  for (const c of state.ai.board) {
    const el = cardEl(c, {});
    el.addEventListener('click', () => ui.onTarget(c.uid));
    aiBoard.appendChild(el);
  }
  const aiHero = document.getElementById('ai-hero');
  aiHero.innerHTML = '';
  const aiHeroEl = heroEl('ai', state, ui);
  aiHeroEl.addEventListener('click', () => ui.onTarget('hero'));
  aiHero.appendChild(aiHeroEl);

  // --- Player row ---
  const plBoard = document.getElementById('player-board');
  plBoard.innerHTML = '';
  for (const c of state.player.board) {
    const el = cardEl(c, { attacking: ui.attackerUid === c.uid });
    el.addEventListener('click', () => ui.onBoardCard(c.uid));
    plBoard.appendChild(el);
  }
  const plHand = document.getElementById('player-hand');
  plHand.innerHTML = '';
  state.player.hand.forEach((c, i) => {
    const playable =
      state.active === 'player' && state.player.mana >= c.cost &&
      (c.type === 'spell' || state.player.board.length < 5);
    const el = cardEl(c, { playable, selected: ui.selectedUid === c.uid });
    el.addEventListener('click', () => ui.onHandCard(c.uid));
    el.dataset.index = String(i + 1);
    plHand.appendChild(el);
  });
  const plHero = document.getElementById('player-hero');
  plHero.innerHTML = '';
  plHero.appendChild(heroEl('player', state, ui));

  // --- Middle row: log, turn, end turn ---
  const turnLabel = document.getElementById('turn-label');
  turnLabel.textContent =
    state.active === 'player'
      ? 'Giliran ' + state.turn + ' — Giliranmu'
      : 'Giliran ' + state.turn + ' — Sang Gerhana berpikir…';
  const endBtn = document.getElementById('end-turn');
  endBtn.disabled = state.active !== 'player';
  endBtn.textContent = state.active === 'player' ? '⏎ Akhiri Giliran' : '…';
  const log = document.getElementById('log');
  log.innerHTML = state.log.slice(-6).map((l) => '<div>' + esc(l) + '</div>').join('');
  log.scrollTop = log.scrollHeight;

  // Targeting hint
  const hint = document.getElementById('hint');
  if (ui.attackerUid) {
    hint.textContent = 'Pilih target serangan: makhluk lawan atau Sang Gerhana.';
  } else if (ui.selectedUid) {
    const c = state.player.hand.find((x) => x.uid === ui.selectedUid);
    hint.textContent = c && c.type === 'spell' && c.effect && (c.effect.kind === 'damageOne' || c.effect.kind === 'damageOneDraw' || c.effect.kind === 'buff')
      ? 'Pilih target untuk ' + c.name + ' (klik lagi untuk batal).'
      : 'Klik kartu lagi untuk memainkan, atau klik di luar untuk batal.';
  } else {
    hint.textContent = 'Klik kartu di tangan untuk memainkannya. Klik makhlukmu lalu target untuk menyerang. (1-7: pilih kartu, Enter: akhiri giliran)';
  }
}

function renderEnd(state) {
  const end = document.getElementById('end-screen');
  const won = state.phase === 'win';
  end.className = 'end-screen ' + (won ? 'end-win' : 'end-loss');
  end.innerHTML =
    '<div class="end-inner">' +
    '<div class="end-emoji">' + (won ? '🏆' : '🌑') + '</div>' +
    '<h1>' + (won ? 'MENANG!' : 'KALAH…') + '</h1>' +
    '<p class="end-sub">' +
    (won
      ? 'Sang Gerhana tumbang di bawah cahaya purnama. Bulan kembali bersinar!'
      : 'Gerhana menelan cahaya purnama… tapi bulan selalu terbit lagi.') +
    '</p>' +
    '<div class="end-stats">' +
    '<div><b>' + state.stats.turns + '</b><span>giliran</span></div>' +
    '<div><b>' + state.stats.cardsPlayed + '</b><span>kartu dimainkan</span></div>' +
    '<div><b>' + state.stats.damageDealt + '</b><span>damage ke lawan</span></div>' +
    '<div><b>' + state.stats.resonance + '</b><span>Resonansi</span></div>' +
    '</div>' +
    '<button id="again-btn" class="big-btn">' + (won ? '⚔ Main Lagi' : '🌕 Coba Lagi') + '</button>' +
    '</div>';
  const btn = document.getElementById('again-btn');
  if (btn) btn.addEventListener('click', () => window.__duel.restart());
}

export function banner(text, sub) {
  const b = document.getElementById('banner');
  b.innerHTML = '<div class="banner-title">' + esc(text) + '</div>' + (sub ? '<div class="banner-sub">' + esc(sub) + '</div>' : '');
  b.classList.remove('show');
  void b.offsetWidth;
  b.classList.add('show');
}

export function floatText(text, targetEl, cls) {
  if (!targetEl) return;
  const layer = document.getElementById('fx-layer');
  const r = targetEl.getBoundingClientRect();
  const app = document.getElementById('app').getBoundingClientRect();
  const span = document.createElement('div');
  span.className = 'float-text ' + (cls || '');
  span.textContent = text;
  span.style.left = r.left - app.left + r.width / 2 + 'px';
  span.style.top = r.top - app.top + 'px';
  layer.appendChild(span);
  setTimeout(() => span.remove(), 1400);
}
