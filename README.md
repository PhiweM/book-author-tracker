# BookTracker

A personal book tracking app. Log what you're reading, what you've read, and what's on your list — with ratings, genres, formats, and reading insights.

## Features

- Track books by status: Read, Currently Reading, To Read, Wish List, Did Not Finish
- Multi-genre tagging, category (Fiction / Non-Fiction), format (Physical / Audiobook / E-Book)
- Re-read tracking — mark 2nd, 3rd reads, etc.
- Author view — group and browse your library by author
- Reading insights — stats, pages read, avg rating, yearly breakdown
- Search and filter by status, genre, category, author, and rating
- Multi-user support with email/password accounts

## Stack

- [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- [Prisma 7](https://www.prisma.io/) + SQLite via `better-sqlite3`
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [TanStack Table](https://tanstack.com/table)

## Getting Started

```bash
npm install
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, and start tracking.

## Environment Variables

Create a `.env.local` file:

```
AUTH_SECRET=your-secret-key-here
```
