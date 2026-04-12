import { BrowserRouter, Routes, Route, NavLink, Link, Navigate, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Library,
  Menu,
  Clock,
  Search,
  Bell,
  LogIn,
  Home,
  Settings,
  ChevronDown,
  Bookmark,
  LayoutDashboard,
  Star,
  MessagesSquare,
  Sparkles,
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import Dashboard from './components/Dashboard';
import Books from './components/Books';
import BookDetail from './components/BookDetail';
import Borrowings from './components/Borrowings';
import Reservations from './components/Reservations';
import Admin from './components/Admin';
import Login from './components/Login';
import Profile from './components/Profile';
import SettingsPage from './components/Settings';
import Community from './components/Community';
import StaffPicksPage from './components/StaffPicksPage';
import ReadingDNA from './components/ReadingDNA';
import SearchSuggest from './components/SearchSuggest';
import { cn } from './lib/utils';
import { useProfileStore } from './stores/profileStore';
import { SearchProvider, useSearchQuery } from './context/SearchContext';
import { useUIStore } from './stores/uiStore';
import { useNotifStore } from './stores/notifStore';

export type User = {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'librarian';
  avatar_url?: string | null;
};

function RailLink({
  to,
  end,
  title,
  children,
  onNavigate,
}: {
  to: string;
  end?: boolean;
  title: string;
  children: React.ReactNode;
  onNavigate?: () => void;
}) {
  return (
    <NavLink
      to={to}
      end={end ?? false}
      onClick={onNavigate}
      title={title}
      className={({ isActive }) =>
        cn(
          'flex h-10 w-10 shrink-0 items-center justify-center border transition-colors',
          isActive
            ? 'border-[#475569] bg-[color:var(--nav-accent)] text-white'
            : 'border-transparent text-[color:var(--nav-text)] hover:border-[#475569] hover:bg-white/5 hover:text-[color:var(--nav-text-active)]',
        )
      }
    >
      {children}
      <span className="sr-only">{title}</span>
    </NavLink>
  );
}

function AppShell({
  users,
  currentUser,
  setCurrentUser,
  setUsers,
}: {
  users: User[];
  currentUser: User | null;
  setCurrentUser: (u: User | null) => void;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}) {
  const navigate = useNavigate();
  const { query, setQuery } = useSearchQuery();
  const mode = useUIStore((s) => s.mode);
  const baseFontSize = useUIStore((s) => s.baseFontSize);
  const lineSpacing = useUIStore((s) => s.lineSpacing);
  const reduceMotion = useUIStore((s) => s.reduceMotion);

  const notifItems = useNotifStore((s) => s.items);
  const markRead = useNotifStore((s) => s.markRead);
  const markAllRead = useNotifStore((s) => s.markAllRead);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.className = `mode-${mode}`;
    document.documentElement.style.setProperty('--font-base', `${baseFontSize}px`);
    const scale = mode === 'elderly' ? 1.125 : mode === 'child' ? 1.06 : 1;
    document.documentElement.style.setProperty('--mode-font-scale', String(scale));
    document.documentElement.dataset.lineSpacing = lineSpacing;
    document.documentElement.dataset.reduceMotion = reduceMotion ? '1' : '0';
  }, [mode, baseFontSize, lineSpacing, reduceMotion]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const showMainNav = Boolean(currentUser);
  const homeTo = '/';
  const localAvatar = useProfileStore((s) => (currentUser ? s.avatarByUserId[currentUser.id] : undefined));
  const unreadCount = notifItems.filter((n) => !n.read).length;

  function signOut() {
    setCurrentUser(null);
    setUserMenuOpen(false);
    setQuery('');
    navigate('/', { replace: true });
    toast.success('Signed out');
  }

  return (
    <div className="flex min-h-screen bg-[color:var(--app-bg)]">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex h-[100dvh] w-[var(--rail-width)] shrink-0 flex-col border-r border-[#334155] bg-[color:var(--nav-bg)]',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          'transition-transform duration-200',
        )}
      >
        <div className="flex shrink-0 items-center justify-center border-b border-[#334155] py-3">
          <Link
            to={homeTo}
            className="flex h-10 w-10 items-center justify-center bg-[color:var(--nav-accent)] text-white"
            title="EduLib Pro — Home"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Library className="h-5 w-5" strokeWidth={2.5} aria-hidden />
          </Link>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col items-center gap-1 overflow-y-auto py-3" aria-label="Primary">
          <RailLink to="/" end title="Home" onNavigate={() => setIsMobileMenuOpen(false)}>
            <Home className="h-5 w-5" strokeWidth={2} />
          </RailLink>
          <RailLink to="/books" title="Catalogue" onNavigate={() => setIsMobileMenuOpen(false)}>
            <BookOpen className="h-5 w-5" strokeWidth={2} />
          </RailLink>
          {showMainNav && (
            <RailLink to="/borrowings" title="My borrowings" onNavigate={() => setIsMobileMenuOpen(false)}>
              <Clock className="h-5 w-5" strokeWidth={2} />
            </RailLink>
          )}
          {showMainNav && (
            <RailLink to="/reservations" title="Reservations" onNavigate={() => setIsMobileMenuOpen(false)}>
              <Bookmark className="h-5 w-5" strokeWidth={2} />
            </RailLink>
          )}
          <RailLink to="/community" title="Community" onNavigate={() => setIsMobileMenuOpen(false)}>
            <MessagesSquare className="h-5 w-5" strokeWidth={2} />
          </RailLink>
          <RailLink to="/staff-picks" title="Staff picks" onNavigate={() => setIsMobileMenuOpen(false)}>
            <Star className="h-5 w-5" strokeWidth={2} />
          </RailLink>
          {showMainNav && (
            <RailLink to="/reading-dna" title="Reading DNA" onNavigate={() => setIsMobileMenuOpen(false)}>
              <Sparkles className="h-5 w-5" strokeWidth={2} />
            </RailLink>
          )}
          {currentUser?.role === 'librarian' && (
            <RailLink to="/admin" title="Admin" onNavigate={() => setIsMobileMenuOpen(false)}>
              <LayoutDashboard className="h-5 w-5" strokeWidth={2} />
            </RailLink>
          )}
        </nav>

        <div className="mt-auto flex shrink-0 flex-col items-center gap-1 border-t border-[#334155] py-3">
          <RailLink to="/settings" title="Settings" onNavigate={() => setIsMobileMenuOpen(false)}>
            <Settings className="h-5 w-5" strokeWidth={2} />
          </RailLink>
          {!showMainNav ? (
            <RailLink to="/login" title="Sign in" onNavigate={() => setIsMobileMenuOpen(false)}>
              <LogIn className="h-5 w-5" strokeWidth={2} />
            </RailLink>
          ) : null}
        </div>
      </aside>

      {isMobileMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          aria-label="Close menu"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col pl-0 lg:pl-[var(--rail-width)]">
        <header className="sticky top-0 z-20 border-b border-[color:var(--border)] bg-[color:var(--bg-surface)] shadow-sm">
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4">
            <button
              type="button"
              className="shrink-0 border border-[color:var(--border)] bg-[color:var(--surface)] p-2 lg:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5 text-[color:var(--text-primary)]" />
            </button>
            <div className="relative flex min-w-0 flex-1 items-start gap-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
              <SearchSuggest
                query={query}
                onQueryChange={setQuery}
                inputClassName="w-full border border-[color:var(--border)] bg-[color:var(--surface)] py-2.5 pl-10 pr-10 text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--text-muted)] outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-2"
              />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setNotifOpen((o) => !o)}
                  className="relative flex h-10 w-10 items-center justify-center border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-primary)] hover:bg-[color:var(--app-bg)]"
                  aria-expanded={notifOpen}
                  aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 bg-[color:var(--accent)] ring-2 ring-[color:var(--surface)]" />
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 z-[300] mt-2 w-[min(100vw-2rem,22rem)] border border-[color:var(--border)] bg-[color:var(--surface)] shadow-lg">
                    <div className="flex items-center justify-between border-b border-[color:var(--border)] px-3 py-2">
                      <span className="text-sm font-semibold text-[color:var(--text-primary)]">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={() => markAllRead()}
                          className="text-xs font-medium text-[color:var(--accent)] hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <ul className="max-h-72 overflow-y-auto">
                      {notifItems.length === 0 ? (
                        <li className="px-3 py-6 text-center text-sm text-[color:var(--text-muted)]">No notifications</li>
                      ) : (
                        notifItems.map((n) => (
                          <li key={n.id}>
                            <button
                              type="button"
                              onClick={() => markRead(n.id)}
                              className={cn(
                                'w-full border-b border-[color:var(--border)] px-3 py-3 text-left text-sm last:border-b-0',
                                n.read
                                  ? 'text-[color:var(--text-muted)]'
                                  : 'bg-[color:var(--accent-soft)] font-medium text-[color:var(--text-primary)]',
                              )}
                            >
                              {n.body}
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {currentUser ? (
                <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex max-w-[14rem] items-center gap-2 border border-[color:var(--border)] bg-[color:var(--surface)] py-1 pl-1 pr-2 hover:bg-[color:var(--app-bg)]"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                >
                  <span className="flex h-8 w-8 items-center justify-center overflow-hidden bg-[color:var(--accent)] text-sm font-bold text-[color:var(--accent-ink)]">
                    {localAvatar || currentUser.avatar_url ? (
                      <img
                        src={localAvatar || currentUser.avatar_url || ''}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      currentUser.name.charAt(0)
                    )}
                  </span>
                  <span className="hidden min-w-0 flex-1 text-left sm:block">
                    <span className="block truncate text-sm font-medium text-[color:var(--text-primary)]">{currentUser.name}</span>
                    <span className="block truncate text-xs capitalize text-[color:var(--text-muted)]">{currentUser.role}</span>
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-[color:var(--text-muted)]" />
                </button>
                {userMenuOpen && (
                  <div
                    className="absolute right-0 z-[300] mt-2 w-56 border border-[color:var(--border)] bg-[color:var(--surface)] py-1 shadow-lg"
                    role="menu"
                  >
                    <Link
                      to="/profile"
                      role="menuitem"
                      className="block px-4 py-2.5 text-sm text-[color:var(--text-primary)] hover:bg-[color:var(--app-bg)]"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      to="/settings"
                      role="menuitem"
                      className="block px-4 py-2.5 text-sm text-[color:var(--text-primary)] hover:bg-[color:var(--app-bg)]"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full border-t border-[color:var(--border)] px-4 py-2.5 text-left text-sm text-[color:var(--text-primary)] hover:bg-[color:var(--app-bg)]"
                      onClick={signOut}
                    >
                      Sign out
                    </button>
                  </div>
                )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm font-medium text-[color:var(--text-primary)] hover:bg-[color:var(--app-bg)]"
                >
                  <LogIn className="h-4 w-4 shrink-0" />
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto px-3 py-4 sm:px-6 sm:py-6">
          <Routes>
            <Route path="/" element={<Dashboard currentUser={currentUser} />} />
            <Route path="/books" element={<Books currentUser={currentUser} />} />
            <Route path="/books/:id" element={<BookDetail currentUser={currentUser} />} />
            <Route
              path="/login"
              element={
                <Login
                  users={users}
                  onLogin={setCurrentUser}
                  onRegistered={(user) => {
                    setUsers((prev) => [...prev, user]);
                  }}
                />
              }
            />
            <Route
              path="/settings"
              element={
                <SettingsPage
                  currentUser={currentUser}
                  onUserUpdated={(u) => {
                    setCurrentUser(u);
                    setUsers((prev) => prev.map((x) => (x.id === u.id ? u : x)));
                  }}
                />
              }
            />
            <Route
              path="/borrowings"
              element={currentUser ? <Borrowings currentUser={currentUser} /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/reservations"
              element={currentUser ? <Reservations currentUser={currentUser} /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/students"
              element={<Navigate to="/admin?tab=students" replace />}
            />
            <Route
              path="/admin"
              element={
                currentUser?.role === 'librarian' ? (
                  <Admin currentUser={currentUser} onUsersChange={setUsers} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/profile"
              element={currentUser ? <Profile currentUser={currentUser} /> : <Navigate to="/login" replace />}
            />
            <Route path="/community" element={<Community />} />
            <Route path="/staff-picks" element={<StaffPicksPage currentUser={currentUser} />} />
            <Route
              path="/reading-dna"
              element={currentUser ? <ReadingDNA currentUser={currentUser} /> : <Navigate to="/login" replace />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="mode-standard flex min-h-screen items-center justify-center bg-[color:var(--app-bg)]">
        <div className="border border-[color:var(--border)] bg-[color:var(--surface)] px-10 py-8 text-[color:var(--text-primary)]">
          Loading EduLib Pro…
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <SearchProvider>
        <AppShell users={users} currentUser={currentUser} setCurrentUser={setCurrentUser} setUsers={setUsers} />
      </SearchProvider>
    </BrowserRouter>
  );
}
