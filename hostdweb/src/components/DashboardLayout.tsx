/**
 * SHARED DASHBOARD LAYOUT
 * Sidebar + top bar shell for every host page
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  PlusCircle,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  LogOut,
  ChevronLeft,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
}

export default function DashboardLayout({ children, currentPage = 'dashboard' }: DashboardLayoutProps) {
  const { userProfile, logout } = useAuth();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!userProfile?.id) return;
    const eventsQuery = query(
      collection(db, 'events'),
      where('hostId', '==', userProfile.id),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(eventsQuery, (snap) => {
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [userProfile?.id]);

  useEffect(() => {
    if (!userProfile?.id || events.length === 0) return;
    const eventIds = events.slice(0, 10).map((e: any) => e.id);
    if (eventIds.length === 0) return;
    const notificationsQuery = query(
      collection(db, 'tickets'),
      where('eventId', 'in', eventIds),
      where('status', '==', 'confirmed')
    );
    const unsub = onSnapshot(notificationsQuery, (snap) => {
      const changes = snap.docChanges();
      const sortedChanges = [...changes].sort((a, b) => {
        const at = (a.doc.data().createdAt as any)?.toDate?.()?.getTime() || 0;
        const bt = (b.doc.data().createdAt as any)?.toDate?.()?.getTime() || 0;
        return bt - at;
      });
      const incoming = sortedChanges
        .filter((c) => c.type === 'added')
        .slice(0, 20)
        .map((c) => ({
          id: c.doc.id,
          message: `New ticket purchased for "${
            events.find((e) => e.id === c.doc.data().eventId)?.title ?? 'your event'
          }"`,
          timestamp: c.doc.data().createdAt,
          read: false,
        }));
      if (incoming.length > 0) {
        setNotifications((prev) => [...incoming, ...prev].slice(0, 50));
        setUnreadCount((prev) => prev + incoming.length);
      }
    });
    return unsub;
  }, [userProfile?.id, events]);

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((p) => Math.max(0, p - 1));
  };
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const formatTime = (date: any) => {
    if (!date || !mounted) return '';
    try {
      const d = date?.toDate ? date.toDate() : date?.seconds ? new Date(date.seconds * 1000) : new Date(date);
      const diff = Date.now() - d.getTime();
      const min = Math.floor(diff / 60000);
      if (min < 1) return 'just now';
      if (min < 60) return `${min}m ago`;
      const hr = Math.floor(min / 60);
      if (hr < 24) return `${hr}h ago`;
      return d.toLocaleDateString();
    } catch {
      return '';
    }
  };

  const navigation = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', key: 'dashboard' },
    { label: 'Events', icon: Calendar, href: '/events', key: 'events' },
    { label: 'Analytics', icon: BarChart3, href: '/analytics', key: 'analytics' },
    { label: 'Create Event', icon: PlusCircle, href: '/events/create', key: 'create' },
    { label: 'Settings', icon: Settings, href: '/settings', key: 'settings' },
  ];

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-secondary-rose/30 border-t-secondary-rose animate-spin" />
      </div>
    );
  }

  const SidebarBrand = ({ collapsed }: { collapsed: boolean }) => (
    <Link
      href="/dashboard"
      className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-femvents-gradient p-[2px] shadow-sm">
        <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-white">
          <img src="/icon.png" alt="" className="h-7 w-7 rounded-md" onError={(e) => (e.currentTarget.style.display = 'none')} />
        </div>
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight text-femvents-gradient">FemVents</p>
          <p className="truncate text-[11px] text-[var(--foreground-muted)]">Host Dashboard</p>
        </div>
      )}
    </Link>
  );

  const NavLinks = ({ collapsed, onClick }: { collapsed: boolean; onClick?: () => void }) => (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
      {!collapsed && (
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
          Menu
        </p>
      )}
      {navigation.map((item) => {
        const isActive = currentPage === item.key;
        const Icon = item.icon;
        return (
          <Link
            key={item.key}
            href={item.href}
            onClick={onClick}
            aria-current={isActive ? 'page' : undefined}
            className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
              isActive
                ? 'bg-gradient-to-r from-primary-purple/10 via-secondary-rose/10 to-accent-coral/10 text-secondary-rose'
                : 'text-[var(--foreground)] hover:bg-[var(--surface-subtle)]'
            } ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? item.label : undefined}
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-femvents-gradient" />
            )}
            <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-secondary-rose' : 'text-[var(--foreground-muted)] group-hover:text-[var(--foreground)]'}`} strokeWidth={1.75} />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );

  const SidebarFooter = ({ collapsed }: { collapsed: boolean }) => (
    <div className="p-3 border-t border-[var(--border-subtle)]">
      {!collapsed && userProfile && (
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-femvents-gradient text-white text-sm font-semibold">
            {(userProfile?.name?.[0] ?? userProfile?.email?.[0] ?? 'H').toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[var(--foreground)]">
              {userProfile?.name ?? 'Host'}
            </p>
            <p className="truncate text-xs text-[var(--foreground-muted)]">{userProfile?.email}</p>
          </div>
        </div>
      )}
      <button
        onClick={logout as any}
        className={`w-full inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors ${
          collapsed ? 'justify-center' : ''
        }`}
        title={collapsed ? 'Sign out' : undefined}
      >
        <LogOut className="h-4 w-4" strokeWidth={1.75} />
        {!collapsed && <span>Sign out</span>}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Sidebar - desktop */}
      <aside
        className={`hidden lg:flex fixed left-0 top-0 h-screen flex-col ${
          isCollapsed ? 'w-20' : 'w-64'
        } bg-[var(--surface)] border-r border-[var(--border-subtle)] transition-all duration-300 z-40`}
      >
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-4 h-[68px] border-b border-[var(--border-subtle)]`}>
          <SidebarBrand collapsed={isCollapsed} />
          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:bg-[var(--surface-subtle)] transition-colors"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="mx-3 mt-3 p-1.5 rounded-lg text-[var(--foreground-muted)] hover:bg-[var(--surface-subtle)] transition-colors self-center"
            aria-label="Expand sidebar"
          >
            <ChevronLeft className="h-4 w-4 rotate-180" />
          </button>
        )}

        <NavLinks collapsed={isCollapsed} />
        <SidebarFooter collapsed={isCollapsed} />
      </aside>

      {/* Sidebar - mobile drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 bg-[var(--surface)] shadow-2xl flex flex-col animate-fade-in-up">
            <div className="flex items-center justify-between px-4 h-[68px] border-b border-[var(--border-subtle)]">
              <SidebarBrand collapsed={false} />
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 rounded-lg text-[var(--foreground-muted)] hover:bg-[var(--surface-subtle)]"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks collapsed={false} onClick={() => setIsSidebarOpen(false)} />
            <SidebarFooter collapsed={false} />
          </aside>
        </div>
      )}

      {/* Main */}
      <main className={`${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'} ml-0 transition-all duration-300`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-[var(--surface)]/85 backdrop-blur-lg border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 h-[68px]">
            <button
              className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--foreground)] active:scale-95 transition-transform"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground-muted)]" />
              <input
                type="search"
                placeholder="Search events, attendees, tickets…"
                className="w-full pl-10 pr-4 h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-secondary-rose/40 focus:ring-2 focus:ring-secondary-rose/20 focus:bg-[var(--surface)] transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowNotifications((v) => !v)}
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-[var(--foreground)] hover:bg-[var(--surface-subtle)] transition-colors"
                  aria-label="Notifications"
                  aria-expanded={showNotifications}
                >
                  <Bell className="h-5 w-5" strokeWidth={1.75} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-secondary-rose text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-[var(--surface)]">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <div className="absolute right-0 top-12 w-[360px] max-w-[calc(100vw-2rem)] bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border-subtle)] z-50 max-h-[480px] overflow-hidden flex flex-col animate-fade-in-up">
                      <div className="px-5 py-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-[var(--foreground)]">Notifications</h3>
                          {unreadCount > 0 && (
                            <p className="text-xs text-[var(--foreground-muted)] mt-0.5">{unreadCount} unread</p>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs font-medium text-secondary-rose hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="overflow-y-auto flex-1">
                        {notifications.length > 0 ? (
                          notifications.map((n) => (
                            <button
                              key={n.id}
                              onClick={() => markNotificationAsRead(n.id)}
                              className={`w-full text-left px-5 py-3.5 border-b border-[var(--border-subtle)] last:border-0 transition-colors ${
                                n.read
                                  ? 'bg-transparent hover:bg-[var(--surface-subtle)]'
                                  : 'bg-secondary-rose/[0.04] hover:bg-secondary-rose/[0.08]'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {!n.read && (
                                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-secondary-rose" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className={`text-sm leading-snug ${n.read ? 'text-[var(--foreground-muted)]' : 'text-[var(--foreground)] font-medium'}`}>
                                    {n.message}
                                  </p>
                                  <p className="text-[11px] text-[var(--foreground-muted)] mt-1">
                                    {formatTime(n.timestamp)}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="px-5 py-12 text-center">
                            <div className="mx-auto h-12 w-12 rounded-2xl bg-[var(--surface-subtle)] flex items-center justify-center mb-3">
                              <Bell className="h-5 w-5 text-[var(--foreground-muted)]" />
                            </div>
                            <p className="text-sm font-medium text-[var(--foreground)]">All caught up</p>
                            <p className="text-xs text-[var(--foreground-muted)] mt-1">
                              You'll see new ticket purchases and updates here.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => router.push('/settings')}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-femvents-gradient text-white text-sm font-semibold shadow-sm hover:shadow-md transition-shadow"
                aria-label="Account"
              >
                {(userProfile?.name?.[0] ?? userProfile?.email?.[0] ?? 'H').toUpperCase()}
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in-up">{children}</div>
      </main>
    </div>
  );
}
