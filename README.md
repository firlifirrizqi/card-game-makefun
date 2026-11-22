# card-game-makefun

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/firlifirrizqi/card-game-makefun/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/firlifirrizqi/card-game-makefun/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

Kartu Purnama — a complete browser card duel under the moon: 24 original cards in four factions (Purnama, Api, Air, Daun), mana that grows each turn, Resonansi combos when two cards of one faction are played in a turn, and a readable AI rival, Sang Gerhana, who plays cards, kills threats and goes for the face.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. Click a card in your hand to play it, click one of your creatures then an enemy to attack, Enter ends your turn. Keys 1-7 pick a hand card, Esc cancels, M mutes the sound.

## How it plays

- **Life 20, mana grows 1-10.** You draw a card each turn; an empty deck bites back (fatigue).
- **24 original cards, four factions:** Purnama (gold ●, balanced), Api (red ▲, +1 attack when attacking), Air (blue 💧, healing and draw), Daun (green 🍃, tough). Each card shows its cost, attack, health and rules text.
- **Resonansi:** the second card of one faction you play in a turn comes in stronger (+1/+1 for creatures, +2 effect for spells).
- **The rival:** Sang Gerhana plays cards greedily, kills creatures it can kill, and goes for your life total when the board is clear.
- **Win** by reducing Sang Gerhana to 0 life. Screenshots: title, mid-game table, win screen, loss screen.

---

<sub>Entered on [make.fun](https://make.fun/?ref=v8vnayfm&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
