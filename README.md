# Jaydip Parmar — Portfolio

A full-stack MERN portfolio with user-facing site, admin panel, and REST API.

## Folder Structure
```
PortFolio/
├── backend/     → Express + MongoDB API (port 5000)
├── user/        → React portfolio site (port 5173)
└── admin/       → React admin panel (port 5174)
```

## Quick Start

### 1. Backend
```bash
cd backend
npm run dev
```

### 2. User Site
```bash
cd user
npm run dev
```

### 3. Admin Panel
```bash
cd admin
npm run dev -- --port 5174
```

## Admin Login
- Email: `admin@jaydip.com`
- Password: `admin123`

## Features
- 🎨 4 themes (Dark, Light, Ocean, Sunset) — user selectable
- 💼 Projects managed from admin panel
- 📩 DM / Contact form with admin reply system
- ⭐ Compliments with admin approval workflow
- 🎞️ Framer Motion animations throughout
- 📱 Fully responsive
- 🤖 AI-generated avatar (DiceBear)
