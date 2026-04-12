import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Bookmark } from 'lucide-react';
import { User } from '../App';

type Row = {
  id: number;
  book_title: string;
  book_author: string;
  user_name: string;
  user_email: string;
  reservation_date: string;
  status: 'active' | 'fulfilled' | 'cancelled';
};

export default function Reservations({ currentUser }: { currentUser: User }) {
  const [rows, setRows] = useState<Row[]>([]);

  const load = () => {
    fetch('/api/reservations')
      .then((r) => r.json())
      .then(setRows);
  };

  useEffect(() => {
    load();
  }, []);

  const visible =
    currentUser.role === 'librarian' ? rows : rows.filter((r) => r.user_name === currentUser.name);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-[color:var(--border)] pb-3">
        <Bookmark className="h-6 w-6 text-[color:var(--accent)]" />
        <h1 className="text-2xl font-bold text-[color:var(--text-primary)]">Reservations</h1>
      </div>
      <p className="text-sm text-[color:var(--text-muted)]">
        {currentUser.role === 'librarian'
          ? 'All active holds and reservation history.'
          : 'Books you reserved when no copies were available.'}
      </p>
      <div className="overflow-hidden border border-[color:var(--border)] bg-[color:var(--surface)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[color:var(--border)] text-xs uppercase">
            <tr>
              <th className="px-4 py-3 font-bold text-[color:var(--text-primary)]">Book</th>
              {currentUser.role === 'librarian' && (
                <th className="px-4 py-3 font-bold text-[color:var(--text-primary)]">Patron</th>
              )}
              <th className="px-4 py-3 font-bold text-[color:var(--text-primary)]">Date</th>
              <th className="px-4 py-3 font-bold text-[color:var(--text-primary)]">Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id} className="border-b border-[color:var(--border)] hover:bg-[color:var(--app-bg)]">
                <td className="px-4 py-3">
                  <div className="font-semibold text-[color:var(--text-primary)]">{r.book_title}</div>
                  <div className="text-xs text-[color:var(--text-muted)]">{r.book_author}</div>
                </td>
                {currentUser.role === 'librarian' && (
                  <td className="px-4 py-3 text-sm">
                    {r.user_name}
                    <div className="text-xs text-[color:var(--text-muted)]">{r.user_email}</div>
                  </td>
                )}
                <td className="px-4 py-3 whitespace-nowrap">{format(new Date(r.reservation_date), 'MMM d, yyyy')}</td>
                <td className="px-4 py-3 capitalize">{r.status}</td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={currentUser.role === 'librarian' ? 4 : 3} className="px-4 py-10 text-center text-[color:var(--text-muted)]">
                  No reservations.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
