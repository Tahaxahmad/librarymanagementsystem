import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toPng } from 'html-to-image';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { toast } from 'sonner';
import { User } from '../App';
import BookCover from './BookCover';

type DnaPayload = {
  genre_breakdown: Record<string, number>;
  books_total: number;
  books_reading_now?: number;
  dna_note?: string;
  avg_per_month: number;
  estimated_pages: number;
  taste_label: string;
  reading_streak_weeks: number;
  because_you_read: {
    id: number;
    title: string;
    author: string;
    isbn: string;
  }[];
};

const PIE_COLORS = ['#0d9488', '#4338ca', '#64748b', '#ca8a04', '#0f766e', '#3730a3'];

export default function ReadingDNA({ currentUser }: { currentUser: User }) {
  const [dna, setDna] = useState<DnaPayload | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'error' | 'ok'>('loading');
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoadState('loading');
    fetch(`/api/v1/users/me/dna?userId=${currentUser.id}`)
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error(err.error || r.statusText);
        }
        return r.json();
      })
      .then((data) => {
        setDna(data);
        setLoadState('ok');
      })
      .catch(() => {
        setDna(null);
        setLoadState('error');
      });
  }, [currentUser.id]);

  const pieData = dna
    ? Object.entries(dna.genre_breakdown).map(([name, value]) => ({ name, value }))
    : [];

  const shareCard = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'edulib-reading-dna.png';
      a.click();
      toast.success('Card saved');
    } catch {
      toast.error('Could not generate image');
    }
  };

  if (loadState === 'loading') {
    return (
      <div className="border border-[color:var(--border)] bg-[color:var(--surface)] p-10 text-center text-[color:var(--text-muted)]">
        Loading your Reading DNA…
      </div>
    );
  }

  if (loadState === 'error' || !dna) {
    return (
      <div className="border border-[color:var(--border)] bg-[color:var(--surface)] p-10 text-center">
        <p className="text-[color:var(--text-muted)]">Could not load Reading DNA. Try again later.</p>
        <p className="mt-2 text-sm text-[color:var(--text-muted)]">Return a few books first — stats build from your history.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-[color:var(--text-primary)]">Reading DNA</h1>
        <p className="mt-1 text-[color:var(--text-muted)]">Your personal reading analytics — unique to EduLib Pro.</p>
      </div>

      <div
        ref={cardRef}
        className="space-y-4 border border-[color:var(--border)] bg-[color:var(--surface)] p-6"
        style={{ background: 'linear-gradient(145deg, #ffffff 0%, #e8edf5 100%)' }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--secondary)]">EduLib Pro</p>
            <h2 className="mt-1 text-xl font-bold text-[color:var(--text-heading)]">{currentUser.name}</h2>
            <p className="text-lg font-semibold text-[color:var(--primary)]">{dna.taste_label}</p>
          </div>
          <button
            type="button"
            onClick={shareCard}
            className="border border-[color:var(--border)] bg-[color:var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Download share card
          </button>
        </div>
        {dna.dna_note && <p className="text-sm text-[color:var(--text-body)]">{dna.dna_note}</p>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border border-[color:var(--border)] bg-white/80 p-3 text-center">
            <div className="text-2xl font-bold text-[color:var(--text-heading)]">{dna.books_total}</div>
            <div className="text-xs text-[color:var(--text-muted)]">Books finished</div>
          </div>
          <div className="border border-[color:var(--border)] bg-white/80 p-3 text-center">
            <div className="text-2xl font-bold text-[color:var(--text-heading)]">{dna.books_reading_now ?? 0}</div>
            <div className="text-xs text-[color:var(--text-muted)]">On loan now</div>
          </div>
          <div className="border border-[color:var(--border)] bg-white/80 p-3 text-center">
            <div className="text-2xl font-bold text-[color:var(--text-heading)]">{dna.avg_per_month}</div>
            <div className="text-xs text-[color:var(--text-muted)]">Returns / month</div>
          </div>
          <div className="border border-[color:var(--border)] bg-white/80 p-3 text-center">
            <div className="text-2xl font-bold text-[color:var(--text-heading)]">{dna.reading_streak_weeks}</div>
            <div className="text-xs text-[color:var(--text-muted)]">Week streak</div>
          </div>
        </div>
        <p className="text-sm text-[color:var(--text-body)]">
          ~{dna.estimated_pages.toLocaleString()} pages read (estimated from genres).
        </p>
      </div>

      <section className="border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
        <h2 className="text-lg font-bold text-[color:var(--text-primary)]">Genre breakdown</h2>
        {pieData.length > 0 ? (
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="mt-4 text-sm text-[color:var(--text-muted)]">
            Return a few books to see your genre mix — your chart grows with every return.
          </p>
        )}
      </section>

      <section className="border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
        <h2 className="text-lg font-bold text-[color:var(--text-primary)]">Because you read similar titles</h2>
        <p className="mt-1 text-sm text-[color:var(--text-muted)]">
          Books borrowed by readers who share your taste — collaborative picks.
        </p>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {dna.because_you_read.map((b) => (
            <li key={b.id}>
              <Link
                to={`/books/${b.id}`}
                className="flex gap-3 border border-[color:var(--border)] bg-[color:var(--app-bg)] p-3 transition hover:border-[color:var(--primary)]"
              >
                <BookCover isbn={b.isbn} title={b.title} className="h-20 w-14 shrink-0" size="S" />
                <div className="min-w-0">
                  <p className="font-semibold text-[color:var(--text-primary)]">{b.title}</p>
                  <p className="text-xs text-[color:var(--text-muted)]">{b.author}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        {dna.because_you_read.length === 0 && (
          <p className="mt-4 text-sm text-[color:var(--text-muted)]">No suggestions yet — keep borrowing.</p>
        )}
      </section>

      <p className="text-center text-xs text-[color:var(--text-muted)]">
        Year in Reading — coming this December.
      </p>
    </div>
  );
}
