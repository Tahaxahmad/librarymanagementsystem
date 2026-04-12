# EduLib — Library Borrowing System

> A web-based school library management platform built for students and librarians. EduLib replaces manual borrowing processes with a fully digital workflow, offering catalogue search, loan management, reservations, review moderation, and a personalised Reading DNA analytics engine.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Overview](#api-overview)
- [Team](#team)

---

## Features

### Student Interface
- **Catalogue Search** — Full-text search by title, author, or ISBN with filters for genre, publication year, author nationality, and kids-friendly content.
- **Borrow / Reserve / Renew** — Borrow available books instantly; reserve out-of-stock titles; renew loans with a built-in two-step renewal policy (self-renew once, librarian approval required for a second).
- **My Borrowings** — View current loans, due dates, loan history, and renewal status at a glance.
- **Reading DNA** — Personalised reading analytics including genre breakdown, reading velocity (avg books/month), estimated pages read, weekly reading streak, a taste label (e.g. *"The Story Seeker"*), and collaborative-filtering book recommendations based on what similar readers borrowed.
- **Trending & Staff Picks** — Discover what the campus is reading this week and browse librarian-curated staff picks.
- **Reviews** — Submit star ratings and written reviews for books you have borrowed (subject to librarian moderation).

### Librarian Interface
- **Book Catalogue Management** — Add, edit, and remove books including copy counts, genre, nationality, kids-friendly flag, and staff pick designation.
- **Student Account Management** — View and manage all registered student accounts.
- **Loan & Reservation Management** — Monitor all active loans, approve renewal requests, and manage the reservation queue.
- **Review Moderation** — Approve or reject student-submitted reviews before they appear publicly.
- **Library Statistics** — Dashboard showing total books, student count, active borrowings, and active reservations.

### Accessibility
Four display modes selectable from Settings:
- **Standard** — Default layout and colours.
- **Child** — Filters to kids-friendly books only, with slightly larger type.
- **Large Text** — Extra-large font with a continuous size slider.
- **High Contrast** — Strong outlines and high-contrast colours for visibility.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS 4, Vite 6 |
| State Management | Zustand |
| Charts | Recharts |
| Backend | Node.js, Express.js, TypeScript |
| Database | SQLite via better-sqlite3 |
| Runtime (dev) | tsx |
| Animation | Motion |
| Icons | Lucide React |

---

## Getting Started

### Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Tahaxahmad/librarymanagementsystem
   cd edulib
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   This starts the Express backend and the Vite frontend together on:
   ```
   http://localhost:3000
   ```

   > The SQLite database (`library.db`) is created and seeded automatically on first run with sample users, books, reviews, and staff picks. No manual database setup is required.

### Default Accounts

| Role | Email | 
|---|---|
| Librarian | alice@library.edu |
| Student | bob@student.edu |
| Student | charlie@student.edu |

### Build for Production

```bash
npm run build   # Compiles the frontend into /dist
npm start       # Runs the Express server in production mode, serving /dist
```

---

## Project Structure

```
edulib/
├── server.ts            # Express backend — all API routes and database logic
├── seed-books.ts        # Extended book catalogue seed data
├── library.db           # SQLite database (auto-generated on first run)
├── vite.config.ts       # Vite frontend build configuration
├── package.json
├── tsconfig.json
└── src/
    ├── main.tsx             # React entry point
    ├── App.tsx              # Root component and client-side routing
    ├── index.css            # Global styles
    ├── stores/
    │   ├── uiStore.ts       # Display mode and UI state (Zustand)
    │   ├── profileStore.ts  # User profile state
    │   └── notifStore.ts    # Notification state
    ├── context/
    │   └── SearchContext.tsx
    ├── lib/
    │   ├── utils.ts
    │   └── bookCover.ts     # Dynamic book cover generation
    └── components/
        ├── Dashboard.tsx    # Student home dashboard
        ├── Books.tsx        # Catalogue search and browsing
        ├── BookDetail.tsx   # Individual book page
        ├── Borrowings.tsx   # My borrowings and loan history
        ├── ReadingDNA.tsx   # Reading analytics page
        ├── Admin.tsx        # Librarian admin panel
        ├── Students.tsx     # Student account management
        ├── Reservations.tsx # Reservation management
        ├── StaffPicksPage.tsx
        ├── Settings.tsx     # Profile and accessibility settings
        ├── Login.tsx        # Authentication
        ├── Community.tsx    # Community reviews page
        ├── SearchSuggest.tsx
        ├── BookCover.tsx
        └── BookDetailModal.tsx
```

---

## API Overview

The backend exposes 32 REST endpoints under the Express server. Key groups:

| Group | Endpoints |
|---|---|
| Books | `GET /api/v1/books`, `GET /api/books/:id`, `POST /api/books`, `PUT /api/books/:id`, `DELETE /api/books/:id` |
| Borrowing | `POST /api/borrow`, `POST /api/return`, `POST /api/renew`, `GET /api/borrowings` |
| Reservations | `POST /api/reserve`, `GET /api/reservations` |
| Users | `GET /api/users`, `POST /api/users/register`, `PUT /api/users/:id`, `DELETE /api/users/:id` |
| Reading DNA | `GET /api/v1/users/me/dna` |
| Discovery | `GET /api/v1/books/trending`, `GET /api/v1/books/staff-picks`, `GET /api/v1/search/suggest`, `GET /api/v1/books/random` |
| Reviews | `POST /api/v1/reviews`, `GET /api/v1/reviews/:bookId`, `PUT /api/v1/admin/reviews/:id/approve`, `DELETE /api/v1/admin/reviews/:id` |
| Admin | `GET /api/stats`, `POST /api/librarian/borrowings/:id/allow-renew` |

---

## Team

All team members contributed equally to the project, with each individual fulfilling their designated responsibilities to ensure the successful delivery of EduLib.

| Name | Student ID | Role |
|---|---|---|
| Ahmad Muhammad Taha | 13667329 | Project Manager |
| YE Yuzhang | 13156580 | Frontend Developer |
| Chow Chi Chung | 13664536 | Developer |
| YAN Boyang | 13072520 | UI/UX Designer |
| Jason Li | 13135792 | Developer |
| Lau Tak Hing | 13694497 | Backend Developer |
| NG Wing Ho | 13035781 | Backend Developer |
| SHEN Qiwen | 13673791 | Tester |

---

> **Course:** COMPS351F — Software Project Management | **Group:** 7 | **Supervisor:** Dr. Ndudi Ezemuzie
