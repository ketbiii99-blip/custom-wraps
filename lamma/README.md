# لَمّة | LAMMA

**كل سالفة لها ضحية.**

An Arabic-first (RTL) party game for Gulf and Emirati family and friend gatherings. It supports 3–20 players on one shared phone, tablet, laptop or TV.

## Play

Open `index.html` in a modern browser. You don't need to install anything, there's no backend and there's no login. The session saves to `localStorage`, so a closed tab can pick up again from **كمّل اللمة**.

Arabic web fonts load from Google Fonts. When you're offline, the game falls back to the system Arabic fonts.

## What's inside

| Mode | Idea |
| --- | --- |
| 🫵 منو فينا؟ | Social question → secret vote (pass the phone) or group pointing → dramatic 3‑2‑1 reveal |
| 🕵️ الدخيل | Everyone gets the secret word except the intruder, then clues, a vote and a guess |
| 🤐 ممنوع تقول | Arabic Taboo: 30 s, five forbidden words, and you tap who guessed |
| ✍️ السالفة ناقصة | Everyone secretly finishes a sentence, then a random 👑 judge picks the funniest |
| 🧠 تعرف ولا تتفلسف؟ | Three multiple-choice questions per round. Everyone shows the answer number with their fingers |
| 🎭 مثّلها | Private acting prompt → 45 s charades |
| 😈 ورّط غيرك | A player picks a victim first, and only then is the challenge revealed |
| ⚡ أسرع واحد | Shared-screen buzzer → 5 s to answer. Wrong answers lock the player out and others can steal |

Other systems:
- 👑 **صاحب المجلس** comes every 3–4 rounds and gives one player a one-time power: بدّلها، ×2، ورّطه، حصانة or مواجهة.
- 🚨 **قانون جديد** random rules expire on their own. Anyone who breaks one can lose a point.
- 🕵️ **Secret missions** worth +3 are claimed during standings or at the end.
- **Standings** appear every 4 rounds, followed by **🔥 السؤال الأخير** and **stat-based awards**.

## Structure

```
index.html        shell
css/style.css     visual system (colour tokens in :root)
js/content.js     all game content (≈385 items) as structured data
js/app.js         engine: state, rendering, flows, modes, awards
```

Each content item carries an `id`, `intensity` (1 عائلي · 2 سوالف · 3 بدون رحمة), an `audience` derived from that intensity, plus a `category` and a `difficulty`. Setup choices filter the content (for example, kids present caps intensity at 1). Used cards don't repeat until their pool runs out.

Sounds are synthesised with WebAudio. To use recorded files instead, map names in `SOUND_FILES` inside `app.js`.
