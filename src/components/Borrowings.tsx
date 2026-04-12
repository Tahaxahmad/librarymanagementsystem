import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { User } from '../App';
import { CheckCircle, Clock, AlertCircle, Bookmark, X } from 'lucide-react';

type Borrowing = {
  id: number;
  book_id: number;
  book_title: string;
  book_author: string;
  user_name: string;
  user_email: string;
  borrow_date: string;
  due_date: string;
  return_date: string | null;
  status: 'borrowed' | 'returned';
  renew_count?: number;
  renew_extra_allowed?: number;
};

type Reservation = {
  id: number;
  book_title: string;
  book_author: string;
  user_name: string;
  user_email: string;
  reservation_date: string;
  status: 'active' | 'fulfilled' | 'cancelled';
};

export default function Borrowings({ currentUser }: { currentUser: User }) {
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activeTab, setActiveTab] = useState<'borrowings' | 'reservations'>('borrowings');

  const fetchBorrowings = () => {
    const url =
      currentUser.role === 'librarian' ? '/api/borrowings' : `/api/borrowings?userId=${currentUser.id}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => setBorrowings(data));
  };

  const fetchReservations = () => {
    fetch('/api/reservations')
      .then((res) => res.json())
      .then((data) => setReservations(data));
  };

  useEffect(() => {
    fetchBorrowings();
    if (currentUser.role === 'librarian') {
      fetchReservations();
    }
  }, [currentUser.id, currentUser.role]);

  const handleReturn = async (borrowingId: number) => {
    try {
      const res = await fetch('/api/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ borrowing_id: borrowingId }),
      });
      if (res.ok) {
        fetchBorrowings();
        toast.success('Book returned');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Return failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong');
    }
  };

  const filteredBorrowings =
    currentUser.role === 'librarian' ? borrowings : borrowings.filter((b) => b.user_name === currentUser.name);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h2 className="text-xl font-bold text-[color:var(--text-primary)]">
          {currentUser.role === 'librarian' ? 'Library activity' : 'My borrowings'}
        </h2>
        {currentUser.role === 'librarian' && (
          <div className="flex border border-[color:var(--border)] bg-[color:var(--app-bg)] p-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('borrowings')}
              className={`px-4 py-2 text-sm font-bold ${
                activeTab === 'borrowings'
                  ? 'bg-[color:var(--accent)] text-[color:var(--accent-ink)]'
                  : 'text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]'
              }`}
            >
              Borrowings
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reservations')}
              className={`px-4 py-2 text-sm font-bold ${
                activeTab === 'reservations'
                  ? 'bg-[color:var(--accent)] text-[color:var(--accent-ink)]'
                  : 'text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]'
              }`}
            >
              Reservations
            </button>
          </div>
        )}
      </div>

      <div className="overflow-hidden border border-[color:var(--border)] bg-[color:var(--surface)]">
        <div className="overflow-x-auto">
          {activeTab === 'borrowings' || currentUser.role === 'student' ? (
            <table className="w-full text-left text-sm text-[color:var(--text-muted)]">
              <thead className="border-b border-[color:var(--border)] text-xs uppercase">
                <tr>
                  <th scope="col" className="px-6 py-4 font-bold text-[color:var(--text-primary)]">
                    Book
                  </th>
                  {currentUser.role === 'librarian' && (
                    <th scope="col" className="px-6 py-4 font-bold text-[color:var(--text-primary)]">
                      Patron
                    </th>
                  )}
                  <th scope="col" className="px-6 py-4 font-bold text-[color:var(--text-primary)]">
                    Borrowed
                  </th>
                  <th scope="col" className="px-6 py-4 font-bold text-[color:var(--text-primary)]">
                    Due
                  </th>
                  <th scope="col" className="px-6 py-4 font-bold text-[color:var(--text-primary)]">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-4 text-right font-bold text-[color:var(--text-primary)]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredBorrowings.map((borrowing) => {
                  const isOverdue = borrowing.status === 'borrowed' && new Date(borrowing.due_date) < new Date();

                  return (
                    <tr key={borrowing.id} className="border-b border-[color:var(--border)] hover:bg-[color:var(--app-bg)]">
                      <td className="px-6 py-4">
                        <Link
                          to={`/books/${borrowing.book_id}`}
                          className="font-semibold text-[color:var(--primary)] hover:underline"
                        >
                          {borrowing.book_title}
                        </Link>
                        <div className="text-xs">{borrowing.book_author}</div>
                      </td>
                      {currentUser.role === 'librarian' && (
                        <td className="px-6 py-4">
                          <div className="font-medium text-[color:var(--text-primary)]">{borrowing.user_name}</div>
                          <div className="text-xs">{borrowing.user_email}</div>
                        </td>
                      )}
                      <td className="whitespace-nowrap px-6 py-4">{format(new Date(borrowing.borrow_date), 'MMM dd, yyyy')}</td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={isOverdue ? 'font-bold text-red-700' : ''}>
                          {format(new Date(borrowing.due_date), 'MMM dd, yyyy')}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {borrowing.status === 'returned' ? (
                          <span className="inline-flex items-center gap-1 border border-[color:var(--border)] bg-[color:var(--app-bg)] px-2 py-0.5 text-xs font-bold text-emerald-800">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Returned
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center gap-1 border border-[color:var(--border)] bg-[color:var(--app-bg)] px-2 py-0.5 text-xs font-bold text-red-800">
                            <AlertCircle className="h-3.5 w-3.5" />
                            Overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 border border-[color:var(--border)] bg-[color:var(--app-bg)] px-2 py-0.5 text-xs font-bold text-[color:var(--text-primary)]">
                            <Clock className="h-3.5 w-3.5" />
                            Borrowed
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        {borrowing.status === 'borrowed' && (
                          <button
                            type="button"
                            onClick={() => handleReturn(borrowing.id)}
                            className="border border-[color:var(--border)] bg-[color:var(--accent)] px-3 py-1.5 text-xs font-bold text-[color:var(--accent-ink)] hover:opacity-90"
                          >
                            Return
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredBorrowings.length === 0 && (
                  <tr>
                    <td colSpan={currentUser.role === 'librarian' ? 6 : 5} className="px-6 py-8 text-center text-[color:var(--text-muted)]">
                      No borrowing records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-sm text-[color:var(--text-muted)]">
              <thead className="border-b border-[color:var(--border)] text-xs uppercase">
                <tr>
                  <th scope="col" className="px-6 py-4 font-bold text-[color:var(--text-primary)]">
                    Book
                  </th>
                  <th scope="col" className="px-6 py-4 font-bold text-[color:var(--text-primary)]">
                    Patron
                  </th>
                  <th scope="col" className="px-6 py-4 font-bold text-[color:var(--text-primary)]">
                    Reserved
                  </th>
                  <th scope="col" className="px-6 py-4 font-bold text-[color:var(--text-primary)]">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((reservation) => (
                  <tr key={reservation.id} className="border-b border-[color:var(--border)] hover:bg-[color:var(--app-bg)]">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[color:var(--text-primary)]">{reservation.book_title}</div>
                      <div className="text-xs">{reservation.book_author}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-[color:var(--text-primary)]">{reservation.user_name}</div>
                      <div className="text-xs">{reservation.user_email}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {format(new Date(reservation.reservation_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {reservation.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 border border-[color:var(--border)] bg-[color:var(--app-bg)] px-2 py-0.5 text-xs font-bold text-amber-900">
                          <Bookmark className="h-3.5 w-3.5" />
                          Active
                        </span>
                      ) : reservation.status === 'fulfilled' ? (
                        <span className="inline-flex items-center gap-1 border border-[color:var(--border)] bg-[color:var(--app-bg)] px-2 py-0.5 text-xs font-bold text-emerald-800">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Fulfilled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 border border-[color:var(--border)] bg-[color:var(--app-bg)] px-2 py-0.5 text-xs font-bold">
                          <X className="h-3.5 w-3.5" />
                          Cancelled
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {reservations.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-[color:var(--text-muted)]">
                      No reservations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
