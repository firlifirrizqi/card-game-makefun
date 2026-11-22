// cards.js — every card and faction of Kartu Purnama, plus the deck builder.
// All names, art and rules are original. Four factions, each told apart by
// colour AND shape, so a card stays readable even at thumbnail size.

export const FACTIONS = {
  purnama: {
    id: 'purnama',
    name: 'Purnama',
    color: '#e8b93b',
    dark: '#8a6a14',
    shape: 'circle',
    keyword: 'Terang',
    blurb: 'Seimbang dan bercahaya.',
  },
  api: {
    id: 'api',
    name: 'Api',
    color: '#e0523d',
    dark: '#7e2418',
    shape: 'triangle',
    keyword: 'Membara',
    blurb: 'Menyerang lebih keras.',
  },
  air: {
    id: 'air',
    name: 'Air',
    color: '#3d8fe0',
    dark: '#174a7e',
    shape: 'drop',
    keyword: 'Jernih',
    blurb: 'Menyembuhkan dan mengalir.',
  },
  daun: {
    id: 'daun',
    name: 'Daun',
    color: '#4da34d',
    dark: '#1f5c24',
    shape: 'leaf',
    keyword: 'Akar',
    blurb: 'Tangguh dan tumbuh.',
  },
};

// A creature card: cost in mana, attack and health on the table.
// A spell card: an effect that resolves the moment it is played.
// text is the rules line printed on the card itself.
export const CARD_DEFS = [
  // ---- Purnama (gold, circle) ----
  { id: 'kunang', name: 'Kunang Purnama', faction: 'purnama', type: 'creature', cost: 1, atk: 1, hp: 2, text: 'Seru: gambar 1 kartu.' },
  { id: 'penjaga-bulan', name: 'Penjaga Bulan', faction: 'purnama', type: 'creature', cost: 2, atk: 2, hp: 3, text: 'Berdiri tegak di bawah bulan.' },
  { id: 'ksatria-cahaya', name: 'Ksatria Cahaya', faction: 'purnama', type: 'creature', cost: 4, atk: 4, hp: 4, text: 'Seru: pulihkan 2 nyawa.' },
  { id: 'naga-purnama', name: 'Naga Purnama', faction: 'purnama', type: 'creature', cost: 7, atk: 7, hp: 7, text: 'Seru: makhlukmu lain +2/+2.' },
  { id: 'sinar-purnama', name: 'Sinar Purnama', faction: 'purnama', type: 'spell', cost: 2, text: 'Pulihkan 4 nyawa.', effect: { kind: 'heal', amount: 4 } },
  { id: 'gerhana-kecil', name: 'Gerhana Kecil', faction: 'purnama', type: 'spell', cost: 5, text: 'Beri 4 damage ke semua makhluk lawan.', effect: { kind: 'damageAllEnemy', amount: 4 } },
  // ---- Api (red, triangle) ----
  { id: 'bara-kecil', name: 'Bara Kecil', faction: 'api', type: 'creature', cost: 1, atk: 2, hp: 1, text: 'Membara: +1 serangan saat menyerang.' },
  { id: 'serigala-api', name: 'Serigala Api', faction: 'api', type: 'creature', cost: 2, atk: 3, hp: 2, text: 'Membara: +1 serangan saat menyerang.' },
  { id: 'prajurit-membara', name: 'Prajurit Membara', faction: 'api', type: 'creature', cost: 3, atk: 4, hp: 3, text: 'Membara: +1 serangan saat menyerang.' },
  { id: 'raksasa-lava', name: 'Raksasa Lava', faction: 'api', type: 'creature', cost: 6, atk: 7, hp: 5, text: 'Membara: +1 serangan saat menyerang.' },
  { id: 'semburan-api', name: 'Semburan Api', faction: 'api', type: 'spell', cost: 2, text: 'Beri 3 damage ke satu target.', effect: { kind: 'damageOne', amount: 3 } },
  { id: 'hujan-bara', name: 'Hujan Bara', faction: 'api', type: 'spell', cost: 4, text: 'Beri 2 damage ke semua makhluk lawan.', effect: { kind: 'damageAllEnemy', amount: 2 } },
  // ---- Air (blue, drop) ----
  { id: 'ikan-terbang', name: 'Ikan Terbang', faction: 'air', type: 'creature', cost: 1, atk: 1, hp: 3, text: 'Lincah di atas ombak.' },
  { id: 'penyu-ombak', name: 'Penyu Ombak', faction: 'air', type: 'creature', cost: 2, atk: 2, hp: 4, text: 'Cangkangnya menahan badai.' },
  { id: 'putri-duyung', name: 'Putri Duyung', faction: 'air', type: 'creature', cost: 3, atk: 3, hp: 3, text: 'Seru: pulihkan 3 nyawa.' },
  { id: 'paus-langit', name: 'Paus Langit', faction: 'air', type: 'creature', cost: 5, atk: 5, hp: 6, text: 'Besar, tenang, tak terhentikan.' },
  { id: 'air-penyembuh', name: 'Air Penyembuh', faction: 'air', type: 'spell', cost: 2, text: 'Pulihkan 5 nyawa.', effect: { kind: 'heal', amount: 5 } },
  { id: 'arus-deras', name: 'Arus Deras', faction: 'air', type: 'spell', cost: 3, text: 'Gambar 2 kartu.', effect: { kind: 'draw', amount: 2 } },
  // ---- Daun (green, leaf) ----
  { id: 'tupai-daun', name: 'Tupai Daun', faction: 'daun', type: 'creature', cost: 1, atk: 2, hp: 2, text: 'Cepat dan gesit.' },
  { id: 'kijang-hutan', name: 'Kijang Hutan', faction: 'daun', type: 'creature', cost: 2, atk: 3, hp: 3, text: 'Melompat di antara pepohonan.' },
  { id: 'pohon-penjaga', name: 'Pohon Penjaga', faction: 'daun', type: 'creature', cost: 3, atk: 2, hp: 6, text: 'Akarnya tak tergoyahkan.' },
  { id: 'harimau-rimba', name: 'Harimau Rimba', faction: 'daun', type: 'creature', cost: 5, atk: 6, hp: 5, text: 'Raja rimba yang mengaum.' },
  { id: 'tumbuh-subur', name: 'Tumbuh Subur', faction: 'daun', type: 'spell', cost: 2, text: 'Beri +2/+2 ke satu makhlukmu.', effect: { kind: 'buff', amount: 2 } },
  { id: 'badai-daun', name: 'Badai Daun', faction: 'daun', type: 'spell', cost: 4, text: 'Beri 3 damage ke satu makhluk lawan, lalu gambar 1 kartu.', effect: { kind: 'damageOneDraw', amount: 3 } },
];

export function defById(id) {
  return CARD_DEFS.find((d) => d.id === id);
}

// Small deterministic RNG (mulberry32) so a screenshot seed replays the same game.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffledDeck(rng) {
  const deck = CARD_DEFS.map((d) => d.id);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

let uidCounter = 0;
export function makeCard(defId) {
  const def = defById(defId);
  uidCounter += 1;
  return {
    uid: 'c' + uidCounter + '-' + defId,
    defId: def.id,
    name: def.name,
    faction: def.faction,
    type: def.type,
    cost: def.cost,
    atk: def.atk ?? 0,
    hp: def.hp ?? 0,
    maxHp: def.hp ?? 0,
    text: def.text,
    effect: def.effect ?? null,
    sick: false,
    canAttack: false,
    justPlayed: false,
  };
}
