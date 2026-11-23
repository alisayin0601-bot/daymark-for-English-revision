# Daymark

A straightforward IELTS practice app: reading, writing, speaking, grammar, listening, a Mistake Book and spaced vocabulary review.

Daymark runs as a single Node.js server with a vanilla JavaScript front end and a local SQLite database. There is no build step and no runtime dependency to install.

## Start

Local use:

Requires **Node.js 24 or newer**.

On Windows, double-click **Start Daymark.cmd**. It starts the server and opens the app.

Or from a terminal:

```bash
node server.js
```

Then open <http://127.0.0.1:4173>.

Stop the server with `Ctrl+C`.

## What is included

- **Accounts:** email and password sign-up with password confirmation, login, logout and private per-user data. New accounts start with no streak, submissions, mistakes or saved words.
- **Reading:** a daily passage at your chosen band, tap-to-look-up dictionary, save-to-vocabulary, comprehension checks, a passage library and optional generated passages. You can also keep up to **3 reading books with 30 articles each**, create plain-text articles (or save daily passages), tap words for definitions and listen to the text.
- **Writing:** Task 1 and Task 2 practice, a paragraph or full-response mode, local draft saving, history and criterion-based feedback.
- **Speaking:** short and long turns, browser speech recognition where available, an editable transcript, history and feedback based on the transcript.
- **Grammar:** ten topics with short lessons, example pairs and four-question checks.
- **Listening:** browser-read talks, play/pause/replay, speed controls, comprehension questions and revealed transcripts.
- **Mistake Book:** wrong reading, grammar and listening answers, plus flagged writing and speaking phrases. Mistakes are grouped, filterable and can be retested. When memory is enabled, a mistake leaves the book only after its full review cycle.
- **Word books:** up to **5 books with 1,000 words each**, including one deletable 500-word built-in IELTS book for each band (5–6, 6–7, 7–8+). Add words one at a time, paste multiple lines, or import a CSV-style list. Normal study shows Chinese meaning, an English example and audio, then a four-choice Chinese meaning quiz. Optional spelling practice can be **Chinese → English**, **audio → English**, or both.
- **Today:** a custom daily task list linked to activity types, automatic completion only after the matching activity, 10 points per first completion, a daily target, and a 7-day continuous bar chart whose bars can pass the target line.
- **Memory plans:** long-term (day 1/3/7/14/30), short-term (20 minutes/1 hour/9 hours), or mixed. A strip at the top of the word books opens the explanation and chart. Words and mistakes can be switched on or off independently. Changing the curve restarts active reminders.
- **Word study:** a full-page session with a hint/audio stage, four-choice meaning quiz that sends wrong words back to the end of the queue, and an optional spelling stage (Chinese-to-English, audio-to-English, or both).
- **Reading home:** any saved article can replace the Reading page article; word lookup plays the clicked word and supports article read-aloud.
- **Themes & language:** six coordinated palettes (including pure white + red and pure white + purple) plus an English/Chinese switch for the new books, main shell, login and settings. The default is Stone + Blue.
- **Dashboard:** a custom daily task plan with a daily target and points, a 7-day streak bar chart that can pass the goal line, plus due vocabulary and open mistakes.

## Make it public

See [Public URL.md](Public%20URL.md) for tunnels, Render, a VPS with HTTPS, and Docker. The short version: Daymark is a Node server with SQLite, so it needs a host that runs Node (not GitHub Pages). Put secrets in the host's environment variables, never in the repository.

## AI is optional

Daymark supports an optional AI provider. The default is **Qwen** through Alibaba Cloud Model Studio / DashScope (OpenAI-compatible). DeepSeek, any OpenAI-compatible API, and Gemini are also supported. Keys are server-side only and never sent to the browser or committed to the repository.

Without a key:

- reading, grammar and listening use built-in content;
- generated reading/listening requests fall back to built-in material;
- writing and speaking feedback uses a transparent rule-based estimate. The interface labels this as a **practice estimate, not an AI assessment**.

With a key, writing and speaking feedback and fresh reading/listening passages are requested from the configured provider. Defaults: `qwen-plus` for Qwen, `deepseek-chat` for DeepSeek, `gemini-2.5-flash` for Gemini, `gpt-4.1-mini` for OpenAI-compatible endpoints.

### Enabling an AI provider

Recommended for mainland China:

1. Create a Qwen API key in Alibaba Cloud Model Studio: <https://bailian.console.aliyun.com/>.
2. Copy `.env.example` to `.env` (never commit the real `.env`; it is already in `.gitignore`).
3. Set `AI_PROVIDER=qwen` and `QWEN_API_KEY=your-key`.
4. Restart `node server.js`.

OpenRouter can also proxy Qwen with one key:

```ini
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your-key
OPENROUTER_MODEL=qwen/qwen3.8-flash
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

DeepSeek, Gemini and other OpenAI-compatible examples are included in `.env.example`. On a deployed server, use the host's environment-variable settings instead of committing secrets. If you deploy only static GitHub Pages, do not put a Qwen key in the frontend: a static site cannot hide it. Run the Node server, a VPS/Render service, or a small serverless proxy instead.

Useful environment values:

```ini
PORT=4173
HOST=127.0.0.1
APP_TIMEZONE=Asia/Shanghai

AI_PROVIDER=qwen
QWEN_API_KEY=
QWEN_MODEL=qwen-plus
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

AI_REQUESTS_PER_HOUR=24
AI_DAILY_LIMIT=150
```

The AI request limits are conservative spend guards. When a limit is reached, Daymark falls back to built-in content or a rule-based estimate rather than failing the page.

## Data

The SQLite database is created automatically at:

```text
data/daymark.db
```

Set `DAYMARK_DB_PATH` to use a different file. The database uses WAL mode. Back it up by copying the database file while the server is stopped, or use SQLite's backup tools.

Passwords are hashed with scrypt. Sessions are sent as an HttpOnly, SameSite=Lax cookie. All learner data is scoped to the signed-in account. There are no public profiles or leaderboards.

Speaking audio is not uploaded or stored. Only the transcript is saved. Word lookups use the free Dictionary API and are cached locally.

To reset all local users and practice data, stop the server, delete `data/daymark.db` and its `-wal`/`-shm` files, then start the server again. This cannot be undone.

## Themes

Themes are CSS variable palettes applied with a `data-theme` attribute:

- `stone-blue` (default)
- `olive-cream`
- `slate-amber`
- `clay-paper`

The choice is stored in `localStorage` under `daymark-theme`. `public/js/theme-init.js` applies it before the stylesheet loads to avoid a flash of the wrong palette. Settings includes a live palette picker.

## Project layout

```text
server.js              HTTP server, static files, SPA fallback
server/api.js          API routes and request handling
server/ai.js           optional Gemini integration
server/content.js      built-in reading, writing, speaking, grammar and listening content
server/feedback.js     rule-based writing/speaking feedback
server/db.js           SQLite schema and connection
server/session.js      sessions and password helpers
server/activity.js     streak, weekly summary and daily plan
server/dictionary.js   dictionary lookup and cache
server/http.js         request/response helpers
public/index.html      app shell
public/styles.css      base component styles
public/theme.css       Daymark theme and layout overrides
public/js/app.js       client router and auth flow
public/js/views/       app pages, including the public home
public/js/theme.js     theme presets and persistence
public/js/i18n.js      English/Chinese UI language
server/builtin-words/  three 500-word band-level word books
server/books-api.js    word books, reading books and memory preferences
```

## Notes

- Scores and bands are practice estimates, not official IELTS results.
- Speech recognition works best in Chrome or Edge, and on `localhost` or HTTPS.
- The app is served from `127.0.0.1` by default and is not intended for public deployment without additional hardening, TLS and a reverse proxy.
- The UI is English-first.
