import { useEffect, useState, useMemo, type Dispatch, type SetStateAction } from 'react';
import { Link } from 'react-router-dom';
import { Users, Mail, Search, Trash2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { User } from '../App';

type BorrowingRow = {
  id: number;
  book_id: number;
  user_id: number;
  book_title: string;
  book_author: string;
  user_name: string;
  user_email: string;
  borrow_date: string;
  due_date: string;
  status: 'borrowed' | 'returned';
  renew_count?: number;
  renew_extra_allowed?: number;
};

export default function Students({
  currentUser,
  onUsersChange,
}: {
  currentUser: User;
  onUsersChange?: Dispatch<SetStateAction<User[]>>;
}) {
  const [students, setStudents] = useState<User[]>([]);
  const [borrowings, setBorrowings] = useState<BorrowingRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const load = () => {
    Promise.all([fetch('/api/users').then((r) => r.json()), fetch('/api/borrowings').then((r) => r.json())]).then(
      ([users, br]) => {
        setStudents(users.filter((u: User) => u.role === 'student'));
        setBorrowings(br);
        setIsLoading(false);
      },
    );
  };

  useEffect(() => {
    load();
  }, []);

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const loansByUser = useMemo(() => {
    const m = new Map<number, BorrowingRow[]>();
    for (const b of borrowings) {
      if (b.status !== 'borrowed') continue;
      const uid = b.user_id;
      const list = m.get(uid) || [];
      list.push(b);
      m.set(uid, list);
    }
    return m;
  }, [borrowings]);

  const allowSecondRenew = async (borrowingId: number) => {
    try {
      const res = await fetch(`/api/librarian/borrowings/${borrowingId}/allow-renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ librarian_id: currentUser.id }),
      });
      if (res.ok) {
        toast.success('Patron can renew again from their borrowings page');
        load();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Could not approve');
      }
    } catch {
      toast.error('Request failed');
    }
  };

  const requestReturn = async (borrowingId: number) => {
    try {
      const res = await fetch('/api/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ borrowing_id: borrowingId }),
      });
      if (res.ok) {
        toast.success('Marked as returned');
        load();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Return failed');
      }
    } catch {
      toast.error('Return failed');
    }
  };

  const removeStudent = async (student: User) => {
    if (!confirm(`Remove ${student.name} permanently? They must have no active loans.`)) return;
    try {
      const res = await fetch(`/api/users/${student.id}?librarianId=${currentUser.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Student removed');
        setStudents((prev) => prev.filter((s) => s.id !== student.id));
        onUsersChange?.((prev) => prev.filter((u) => u.id !== student.id));
        load();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Could not remove');
      }
    } catch {
      toast.error('Could not remove');
    }
  };

  if (currentUser.role !== 'librarian') {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="max-w-md border border-[color:var(--border)] bg-[color:var(--surface)] p-8 text-center">
          <Users className="mx-auto mb-4 h-12 w-12 text-[color:var(--text-muted)]" />
          <h2 className="text-xl font-bold text-[color:var(--text-primary)]">Access denied</h2>
          <p className="mt-2 text-[color:var(--text-muted)]">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--text-primary)]">Students</h1>
          <p className="mt-1 text-[color:var(--text-muted)]">Registered patrons — loans and account actions</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[color:var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search students…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-[color:var(--border)] bg-white py-2.5 pl-10 pr-4 text-[color:var(--text-primary)] outline-none focus:ring-2 focus:ring-[color:var(--primary)] sm:w-64"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin border-2 border-[color:var(--primary)] border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredStudents.map((student) => {
            const loans = loansByUser.get(student.id) || [];
            return (
              <div
                key={student.id}
                className="border border-[color:var(--border)] bg-[color:var(--surface)] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-[color:var(--border)] bg-[color:var(--primary)] text-lg font-bold text-white">
                      {student.avatar_url ? (
                        <img src={student.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        student.name.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-[color:var(--text-primary)]">{student.name}</h3>
                      <div className="mt-1 flex items-center gap-1.5 text-sm text-[color:var(--text-muted)]">
                        <Mail className="h-4 w-4 shrink-0" />
                        <span className="truncate">{student.email}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => removeStudent(student)}
                      className="inline-flex items-center gap-1 border border-red-600 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove account
                    </button>
                  </div>
                </div>

                <div className="mt-4 border-t border-[color:var(--border)] pt-4">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-[color:var(--text-muted)]">
                    Active loans
                  </h4>
                  {loans.length === 0 ? (
                    <p className="text-sm text-[color:var(--text-muted)]">No active loans</p>
                  ) : (
                    <ul className="space-y-2">
                      {loans.map((loan) => (
                        <li
                          key={loan.id}
                          className="flex flex-wrap items-center justify-between gap-2 border border-[color:var(--border)] bg-[color:var(--app-bg)] p-3 text-sm"
                        >
                          <div className="min-w-0 flex-1">
                            <Link
                              to={`/books/${loan.book_id}`}
                              className="font-semibold text-[color:var(--primary)] hover:underline"
                            >
                              {loan.book_title}
                            </Link>
                            <span className="text-[color:var(--text-muted)]"> · {loan.book_author}</span>
                            <div className="mt-1 text-xs text-[color:var(--text-muted)]">
                              Due {format(new Date(loan.due_date), 'MMM d, yyyy')}
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-wrap items-center gap-2">
                            {Number(loan.renew_count ?? 0) === 1 && Number(loan.renew_extra_allowed ?? 0) === 0 && (
                              <button
                                type="button"
                                onClick={() => allowSecondRenew(loan.id)}
                                className="inline-flex items-center gap-1 border border-[color:var(--border)] bg-[color:var(--app-bg)] px-3 py-1.5 text-xs font-bold text-[color:var(--primary)] hover:bg-[color:var(--surface)]"
                              >
                                Approve 2nd renew
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => requestReturn(loan.id)}
                              className="inline-flex items-center gap-1 border border-[color:var(--border)] bg-[color:var(--primary)] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Record return
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
          {filteredStudents.length === 0 && (
            <div className="py-12 text-center text-[color:var(--text-muted)]">
              <Users className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p className="text-lg font-bold text-[color:var(--text-primary)]">No students found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
