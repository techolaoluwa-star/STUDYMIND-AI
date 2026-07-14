# StudyMind AI

A production-ready, ChatGPT-style AI study companion built on React + TypeScript,
Firebase, and the Gemini API.

## Features

- Email/password + Google authentication (Firebase Auth)
- Persistent chat history per user (Firestore), offline cache enabled
- Multi-turn conversation memory sent to Gemini on every turn
- Create, rename, delete conversations
- Token-by-token streaming responses via a Netlify Edge Function proxy
- Markdown rendering with syntax-highlighted, copyable code blocks
- Edit a past message (regenerates everything after it)
- Regenerate any assistant response
- Typing indicator, stop-generation control
- Mobile-responsive layout with a collapsible sidebar
- Centralized error handling with inline retry, no leaked API keys client-side

## Architecture

```
src/
  context/       AuthContext, ChatContext — all state + Firestore/Gemini orchestration
  lib/           firebase.ts, chatStore.ts (Firestore CRUD), gemini.ts (streaming client)
  components/
    auth/        Sign-in / sign-up
    layout/      AppShell, Sidebar, Topbar
    chat/        ChatView, MessageList, MessageItem, Composer, Markdown
    ui/          Button, IconButton, Modal
netlify/edge-functions/gemini-chat.ts   Streams Gemini responses, keeps API key server-side
```

Data model (Firestore): `users/{uid}/conversations/{id}` and
`users/{uid}/conversations/{id}/messages/{id}`. Rules in `firestore.rules` restrict
all reads/writes to the owning user.

The Gemini API key never reaches the browser — the client calls
`/.netlify/functions/gemini-chat`, which is backed by a Netlify **Edge Function**
(required for real token streaming; classic Lambda-style functions buffer the
whole response).

## Setup

1. **Firebase**: create a project, enable Email/Password + Google sign-in
   (Authentication), and Firestore. Deploy `firestore.rules`.
2. **Gemini**: get an API key from [Google AI Studio](https://aistudio.google.com/apikey).
3. Copy `.env.example` to `.env` and fill in the `VITE_FIREBASE_*` values.
4. In the Netlify dashboard (or `netlify.toml` for local dev via `netlify dev`),
   set `GEMINI_API_KEY` and optionally `GEMINI_MODEL` — these must **not** have
   the `VITE_` prefix or they'll be bundled into client code.
5. Install and run:

```bash
npm install
netlify dev     # runs Vite + the edge function together, recommended
# or: npm run dev   (frontend only; streaming endpoint won't be available)
```

6. Deploy: connect the repo to Netlify, set the same environment variables in
   Site settings, and push — `netlify.toml` handles the build.

## Notes on scaling

- Firestore writes during streaming are throttled (~220ms) to avoid excessive
  document writes while still feeling real-time; the UI renders every token
  immediately from local state regardless of flush cadence.
- History sent to Gemini is capped at the last 30 messages per turn; extend
  `MAX_HISTORY_MESSAGES` in the edge function if you need longer context and
  are using a larger-context model.
- Swap `GEMINI_MODEL` to any Gemini model id (e.g. `gemini-2.0-flash`,
  `gemini-1.5-pro`) without code changes.
# STUDYMIND-AI
