# School ERP — Frontend

A modern school management dashboard built with Next.js 15, TypeScript, and Tailwind CSS.

---

## Tech Stack

- **Next.js 15** — App Router + Turbopack
- **TypeScript** — strict, zero errors
- **Tailwind CSS** — custom design system, dark mode
- **Shadcn / Radix UI** — Dialog, Select, Toast, AlertDialog
- **TanStack Table** — sorting, filtering, server-side pagination
- **Recharts** — attendance trend, grade distribution charts
- **React Hook Form + Zod** — validated forms
- **Axios** — JWT interceptor, auto-logout on 401
- **next-themes** — light / dark mode

---

## Setup

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Configure environment

Create `.env.local` in the `frontend/` folder:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Start the dev server

```bash
npm run dev
```

App runs at → **http://localhost:3000**

> Make sure the backend is running on port 5000 first.

---

## Login Credentials

| Role    | Email                   | Password     |
|---------|-------------------------|--------------|
| Admin   | admin@schoolerp.com     | Admin@123    |
| Teacher | rajesh@schoolerp.com    | Teacher@123  |
| Student | aarav@school.com        | Student@123  |

Use the **Admin** account to access all features.

---

## Pages

| Route        | Description                                      |
|--------------|--------------------------------------------------|
| `/login`     | Login page with demo credentials shown           |
| `/dashboard` | Stats, attendance chart, grade chart, announcements |
| `/students`  | Full CRUD — search, sort, paginate, view detail  |
| `/teachers`  | Full CRUD                                        |
| `/classes`   | Full CRUD with class teacher assignment          |
| `/subjects`  | Full CRUD                                        |
| `/attendance`| Bulk mark attendance by class & date             |
| `/grades`    | Record & manage student grades                   |
| `/files`     | Drag-and-drop file upload, download, delete      |
| `/settings`  | Profile, change password, theme toggle           |

---

## Folder Structure

```
frontend/
├── app/                   Pages (App Router)
├── components/
│   ├── layout/            Sidebar, Navbar, DashboardLayout
│   └── ui/                Button, Input, Badge, Dialog, DataTable, etc.
├── contexts/              AuthContext (JWT, session)
├── providers/             ThemeProvider + AuthProvider
├── services/              One file per API domain
├── lib/                   axios.ts, utils.ts
└── types/                 All TypeScript interfaces
```

---

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
```
