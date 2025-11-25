---
title: Webshop AI Agent
emoji: 🐢
colorFrom: gray
colorTo: yellow
sdk: static
pinned: false
license: mit
app_build_command: npm run build
app_file: dist/index.html
---

# Webshop AI Agent

This is the starter repository for the workshop "Getting started with AI (-agents) in the browser" - [https://nico.dev/workshops/ai-agents](https://nico.dev/workshops/ai-agents)

There are two branches:

- `main`: blank webshop, ready to implement AI features
- `complete`: all AI features implemented

## Getting Started

```
git clone git@github.com:nico-martin/webshop-ai-agent.git
cd webshop-ai-agent
npm install
npm run dev
```

### Env
This project supports two env variables in a `.env` file in the root of the project:
- `PORT`: the local port on which the dev server will listen (optional)

## Setup
```
- public      // public assets (mainly images)
- src         // main application logic
- - app       // layout components
- - store     // react context provider, data
- - theme     // UI components with limited logic
- - utils     // utility functions (some will be relevant later in the workshop)
- - App.tsx   // main App
- - index.css // set up tailwindcss
- - main.tsx  // main entry-point
- index.html  // set up vite
```

## Dependencies

**Webshop AI Agent** is a [React](https://react.dev/) Application that uses [tailwindcss](https://tailwindcss.com/) for styling.

### Key dependencies
*   **[React](https://react.dev/)**: For building the user interface.
*   **[React Router](https://reactrouter.com/)**: For client-side navigation.
*   **[Headless UI](https://headlessui.com/)**: For accessible UI components.
*   **[Heroicons](https://heroicons.com/)**: For icons.
*   **[Tailwind CSS](https://tailwindcss.com/)**: For rapid UI development and styling.
*   **[Showdown](https://showdownjs.com/)**: For converting Markdown to HTML.

### Build process
*   **[Vite](https://vitejs.dev/)**: For fast development and building.

### AI Tasks
*   **[Transformers.js](https://huggingface.co/docs/transformers.js/en/index)**: For natural language processing: LLM (text-generation), vector-embeddings (feature-extraction).

### Developer Experience
*   **[TypeScript](https://www.typescriptlang.org/)**: For static typing.
*   **[ESLint](https://eslint.org/)**: For code quality.
*   **[Prettier](https://prettier.io/)**: For code formatting.