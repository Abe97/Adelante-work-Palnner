# Adelante Work Planner

Work & project management tool built with **Next.js 14 App Router**, **Supabase** and **Tailwind CSS**.

## Features

- **Dashboard** — task urgenti, ore settimanali, progetti attivi
- **Clienti** — gestione anagrafica con archivio
- **Progetti** — Kanban board (drag & drop) + list view con tracking ore
- **Task Panel** — side sheet per modifica, log ore e storico
- **Le mie Task** — vista personale filtrata per priorità e progetto
- **Team** — invito membri, cambio ruolo, disattivazione account _(solo Admin)_
- **Impostazioni** — modifica profilo e cambio password

---

## Prerequisiti

- **Node.js** 18+
- **npm** 9+
- Account **[Supabase](https://supabase.com)** (piano gratuito sufficiente)
- Account **[Vercel](https://vercel.com)** (per il deploy)

---

## Setup locale

### 1. Clone del repository

```bash
git clone https://github.com/Abe97/Adelante-work-Palnner.git
cd Adelante-work-Palnner
```

### 2. Installa le dipendenze

```bash
npm install
```

### 3. Variabili d'ambiente

```bash
cp .env.local.example .env.local
```

Apri `.env.local` e compila le tre variabili:

| Variabile | Dove trovarla |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API → service_role secret |

### 4. Esegui le migrazioni database

Nel **SQL Editor** di Supabase, incolla ed esegui il contenuto di:

```
supabase/migrations/001_initial.sql
```

Questo crea tutte le tabelle, le RLS policies e i trigger necessari.

### 5. Avvia il server di sviluppo

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) nel browser.

---

## Deploy su Vercel

### Metodo 1 — Automatico (consigliato)

1. Fai il fork / collega il repo GitHub a Vercel
2. In **Vercel Dashboard → Project → Settings → Environment Variables** aggiungi:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Ogni push su `main` trigghera un deploy automatico

### Metodo 2 — CLI

```bash
npx vercel login
npx vercel --prod --yes
```

### URL produzione

[https://adelante-work-palnner.vercel.app](https://adelante-work-palnner.vercel.app)

---

## Struttura del progetto

```
app/
├── (app)/              # Route protette (richiedono login)
│   ├── layout.tsx      # Layout con sidebar + auth guard
│   ├── dashboard/
│   ├── clients/
│   │   └── [id]/
│   ├── projects/
│   │   └── [id]/       # Kanban + task panel
│   ├── my-tasks/
│   ├── team/           # Solo admin
│   └── settings/
├── login/
└── layout.tsx          # Root layout (font + Toaster)

components/
├── layout/             # Sidebar, mobile header
├── ui/                 # Design system (shadcn/ui + custom)
├── dashboard/
├── clients/
├── projects/           # Kanban, task card, list view
├── my-tasks/
├── team/
├── settings/
└── task-panel.tsx      # Sheet laterale universale

lib/
├── supabase/
│   ├── client.ts       # Browser client
│   └── server.ts       # Server client (async)
├── actions/            # Server Actions
│   ├── tasks.ts
│   ├── team.ts
│   └── profile.ts
└── database.types.ts   # TypeScript types dal DB schema

supabase/
└── migrations/
    └── 001_initial.sql # Schema completo con RLS
```

---

## Stack tecnico

| Tecnologia | Versione | Utilizzo |
|---|---|---|
| Next.js | 14.2 | Framework (App Router) |
| React | 18 | UI |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 3.4 | Styling |
| shadcn/ui | latest | Componenti UI |
| Supabase | 2.x | Database + Auth + RLS |
| @supabase/ssr | 0.8 | Auth SSR-safe |
| @dnd-kit | 6/10 | Drag & drop Kanban |
| sonner | 2.x | Toast notifications |
| lucide-react | 0.5 | Icone |
