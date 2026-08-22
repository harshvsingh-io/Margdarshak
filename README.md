<div align="center">

# 🧭 Margdarshak

### *Your next opportunity is closer than you think.*

**A personalized navigator for Indian students to discover scholarships, fellowships, internships, and government opportunities — matched to your journey with clear eligibility and official sources.**

---

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth+%7C+DB-3ecf8e?logo=supabase)](https://supabase.com/)

</div>

---

## ✨ What is Margdarshak?

India's education opportunity landscape is **scattered across hundreds of government portals** — each with different eligibility rules, deadlines, and application processes.

**Margdarshak** changes that. It's a **personalized opportunity navigator** that:

- 🔍 **Discovers** scholarships, fellowships, and internships from verified government sources
- 🎯 **Matches** opportunities to your profile — stage, marks, category, state, and income
- 📊 **Classifies** every opportunity as *Eligible Now*, *Gap-Eligible*, or *Future-Eligible*
- 📋 **Tracks** your applications with a built-in Kanban-style registry
- 🧭 **Guides** you on exactly what to do next for each opportunity

> No fabricated data. No fake success stories. Just real government opportunities with real eligibility checks.

---

## 🏗️ Architecture

```
Visitor → Landing Page → Sign In / Get Started → Auth → Profile Setup → Dashboard
```

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), React 18, Tailwind CSS |
| **UI Components** | shadcn/ui, Lucide Icons, Framer-style CSS animations |
| **Authentication** | Supabase Auth (Google OAuth, Phone OTP, Email/Password) |
| **Database** | Supabase PostgreSQL (profiles, opportunities, applications) |
| **Fonts** | Fraunces (headings), IBM Plex Sans (body), IBM Plex Mono (data) |
| **Deployment** | Vercel |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and **npm** / **pnpm** / **yarn**
- A [Supabase](https://supabase.com/) project (free tier works)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/margdarshak.git
cd margdarshak
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Site URL (for OAuth redirects)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Database Schema

Run the SQL in `supabase_schema.sql` against your Supabase SQL editor to set up all tables and RLS policies.

### 4. Run Development Server

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** — you'll see the public landing page.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx              ← Root: Landing page (logged out) / Dashboard (logged in)
│   ├── layout.tsx            ← Root layout with fonts & providers
│   ├── globals.css           ← Design tokens & animations
│   ├── middleware.ts          ← Auth routing & role-based access
│   ├── login/page.tsx        ← Split-screen auth experience
│   ├── onboarding/page.tsx   ← 3-step student profile setup
│   ├── opportunities/        ← Opportunity discovery feed
│   ├── tracker/              ← Kanban-style application tracker
│   ├── vault/                ← Document vault
│   ├── admin/                ← Admin moderation & role management
│   ├── auth/callback/        ← Supabase OAuth callback handler
│   └── actions/              ← Server actions (auth, profile, opportunities)
├── components/
│   ├── ClientLandingPage.tsx ← Public landing page with 3D visual
│   ├── ClientDashboardWrapper.tsx ← Dashboard client-side interactions
│   ├── ProgressiveProfile.tsx ← Stepped profile completion
│   ├── OpportunityCard.tsx   ← Individual opportunity display
│   ├── OpportunityDetailDialog.tsx ← Detailed opportunity modal
│   └── ui/                   ← shadcn/ui components
└── lib/
    ├── supabase/server.ts    ← Supabase server client
    ├── eligibilityEngine.ts  ← Opportunity matching logic
    ├── i18n.ts               ← Internationalization utils
    ├── validations/          ← Zod schemas
    └── utils.ts              ← General utilities
```

---

## 🎨 Design System

Margdarshak uses a **premium editorial design language** inspired by government document aesthetics:

| Token | Color | Usage |
|-------|-------|-------|
| **Paper** | `#F6F5F1` | Backgrounds, cards |
| **Ink** | `#16213E` | Primary text, dark UI |
| **Seal Gold** | `#C08A28` | CTAs, accents, highlights |
| **Growth Teal** | `#2F6F5E` | Success states, eligible items |
| **Horizon Slate** | `#5C7290` | Secondary text, metadata |
| **Stamp Red** | `#9E3B3B` | Urgency, deadline warnings |

### Typography

- **Fraunces** — Serif heading font (character, warmth)
- **IBM Plex Sans** — Body text (clean, readable)
- **IBM Plex Mono** — Data, counters, timestamps (precision, technical feel)

---

## 🛡️ Authentication

Three sign-in methods, prioritized for the Indian student context:

| Method | Priority | Notes |
|--------|----------|-------|
| **Google OAuth** | Primary | One-click sign-in |
| **Phone + OTP** | Secondary | Most accessible for Indian users |
| **Email + Password** | Fallback | For users without Google/phone |

### Auth Flow

```
Landing Page → Auth Modal → Google / Phone OTP / Email → Session Created
  ↓
First-time user → Profile Onboarding (3 steps) → Dashboard
Existing user   → Dashboard
```

---

## 🚢 Deployment (Vercel)

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Add environment variables in the Vercel dashboard
5. Deploy — done!

### Environment Variables for Production

```
NEXT_PUBLIC_SUPABASE_URL        = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY   = your_anon_key
SUPABASE_SERVICE_ROLE_KEY       = your_service_role_key
NEXT_PUBLIC_SITE_URL            = https://your-app.vercel.app
```

> ⚠️ **Never commit `.env.local`** — it's already in `.gitignore`. Always set secrets in your hosting dashboard.

---

## 📄 License

This project is private and proprietary. All rights reserved.

---

<div align="center">

**Built with care for Indian students navigating a complex opportunity landscape.**

*Margdarshak* — मार्गदर्शक — *The Guide*

</div>
