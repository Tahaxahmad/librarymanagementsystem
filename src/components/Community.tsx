import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type TrendRow = { id: number; title: string; reader_count: number };

export default function CommunityPage() {
  const [trending, setTrending] = useState<TrendRow[]>([]);

  useEffect(() => {
    fetch('/api/v1/books/trending')
      .then((r) => r.json())
      .then(setTrending);
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-[color:var(--text-primary)]">Community</h1>
        <p className="mt-2 text-[color:var(--text-muted)]">
          Borrow activity from the last 7 days — titles ranked by how many loans started this week (including returns).
        </p>
      </header>
      <section className="border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[color:var(--text-primary)]">
          Trending (last 7 days)
        </h2>
        <ul className="mt-4 space-y-3">
          {trending.map((t) => (
            <li key={t.id}>
              <Link
                to={`/books/${t.id}`}
                className="flex items-center justify-between gap-3 border border-transparent py-2 hover:border-[color:var(--border)] hover:bg-[color:var(--app-bg)]"
              >
                <span className="font-medium text-[color:var(--text-primary)]">{t.title}</span>
                <span className="shrink-0 text-sm text-[color:var(--text-muted)]">
                  {t.reader_count} loan{t.reader_count === 1 ? '' : 's'}
                </span>
              </Link>
            </li>
          ))}
          {trending.length === 0 && <li className="text-sm text-[color:var(--text-muted)]">No trending data yet.</li>}
        </ul>
      </section>
    </div>
  );
}
