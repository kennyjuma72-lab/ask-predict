/**
 * EVENTS LIST PAGE (/events)
 * Calm editorial layout for host event management.
 */
'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import React, { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, orderBy, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  Calendar,
  Users,
  Eye,
  Pencil,
  Trash2,
  CalendarDays,
  TrendingUp,
  CheckCircle2,
  FileText,
  Inbox,
  Loader2,
} from 'lucide-react';

type Filter = 'all' | 'upcoming' | 'completed' | 'drafts';
type ViewMode = 'grid' | 'list';
type SortBy = 'date' | 'title' | 'attendees';

export default function Events() {
  const { userProfile } = useAuth();
  return (
    <ProtectedRoute>
      <DashboardLayout currentPage="events">
        <EventsContent userProfile={userProfile} />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function toDate(value: any): Date | null {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  if (value?.seconds) return new Date(value.seconds * 1000);
  if (value instanceof Date) return value;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function statusOf(item: any): 'Draft' | 'Upcoming' | 'Completed' | 'Scheduled' {
  if (item.isPublished === false) return 'Draft';
  const date = toDate(item.startAt);
  if (!date) return 'Scheduled';
  return date < new Date() ? 'Completed' : 'Upcoming';
}

const statusStyle: Record<string, string> = {
  Draft: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
  Upcoming: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Completed: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
  Scheduled: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
};

function EventsContent({ userProfile }: { userProfile: any }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('date');

  useEffect(() => {
    if (!userProfile?.id) return;
    const q = query(
      collection(db, 'events'),
      where('hostId', '==', userProfile.id),
      orderBy('createdAt', 'desc'),
    );
    const unsub = onSnapshot(q, (snap) => {
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [userProfile?.id]);

  const filtered = useMemo(() => {
    const now = new Date();
    let result = events;
    if (filter === 'upcoming') {
      result = events.filter((e) => {
        const d = toDate(e.startAt);
        return d && d > now;
      });
    } else if (filter === 'completed') {
      result = events.filter((e) => {
        const d = toDate(e.startAt);
        return d && d < now;
      });
    } else if (filter === 'drafts') {
      result = events.filter((e) => e.isPublished === false);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) => e.title?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q),
      );
    }
    if (sortBy === 'title') {
      result = [...result].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'attendees') {
      result = [...result].sort((a, b) => (b.currentAttendees || 0) - (a.currentAttendees || 0));
    }
    return result;
  }, [events, filter, searchQuery, sortBy]);

  const stats = useMemo(() => {
    const now = new Date();
    return {
      total: events.length,
      upcoming: events.filter((e) => {
        const d = toDate(e.startAt);
        return d && d > now;
      }).length,
      completed: events.filter((e) => {
        const d = toDate(e.startAt);
        return d && d < now;
      }).length,
      drafts: events.filter((e) => e.isPublished === false).length,
    };
  }, [events]);

  const removeEvent = async (id: string, title: string) => {
    if (!id) return;
    const confirmed = window.confirm(`Delete "${title}"? This action cannot be undone.`);
    if (!confirmed) return;
    await deleteDoc(doc(db, 'events', id));
  };

  const statCards = [
    { label: 'Total events', value: stats.total, Icon: CalendarDays, tone: 'text-slate-600' },
    { label: 'Upcoming', value: stats.upcoming, Icon: TrendingUp, tone: 'text-emerald-600' },
    { label: 'Completed', value: stats.completed, Icon: CheckCircle2, tone: 'text-purple-600' },
    { label: 'Drafts', value: stats.drafts, Icon: FileText, tone: 'text-amber-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        {/* Header */}
        <header className="flex flex-wrap items-end justify-between gap-6 pb-8 border-b border-slate-200">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Workspace
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Your events
            </h1>
            <p className="mt-2 text-sm text-slate-600 max-w-xl">
              Plan, publish, and track every event you host — all in one quiet, focused workspace.
            </p>
          </div>
          <a
            href="/events/create"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 transition"
          >
            <Plus className="h-4 w-4" />
            New event
          </a>
        </header>

        {/* Stats */}
        <section className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statCards.map(({ label, value, Icon, tone }) => (
            <div
              key={label}
              className="rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
                <Icon className={`h-4 w-4 ${tone}`} />
              </div>
              <p className="mt-3 text-2xl font-semibold text-slate-900 tabular-nums">
                {loading ? '—' : value}
              </p>
            </div>
          ))}
        </section>

        {/* Toolbar */}
        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events…"
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
              />
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
              {(['all', 'upcoming', 'completed', 'drafts'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition ${
                    filter === tab
                      ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            >
              <option value="date">Sort: Date</option>
              <option value="title">Sort: Title</option>
              <option value="attendees">Sort: Attendees</option>
            </select>

            {/* View toggle */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${
                  viewMode === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Grid view"
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${
                  viewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="List view"
                aria-label="List view"
              >
                <ListIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="mt-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="mt-3 text-sm">Loading your events…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <Inbox className="h-6 w-6 text-slate-500" />
              </div>
              <h3 className="mt-5 text-base font-semibold text-slate-900">
                {searchQuery ? 'No matching events' : 'No events yet'}
              </h3>
              <p className="mt-1.5 text-sm text-slate-500">
                {searchQuery
                  ? 'Try a different search term or clear the filters.'
                  : 'Create your first event to start selling tickets.'}
              </p>
              {!searchQuery && (
                <a
                  href="/events/create"
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition"
                >
                  <Plus className="h-4 w-4" />
                  Create event
                </a>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => (
                <EventCard key={item.id} item={item} onDelete={removeEvent} />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <ul className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <EventRow key={item.id} item={item} onDelete={removeEvent} />
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function EventCard({ item, onDelete }: { item: any; onDelete: (id: string, title: string) => void }) {
  const date = toDate(item.startAt);
  const status = statusOf(item);
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-sm">
      <div className="relative h-40 bg-slate-100 overflow-hidden">
        {item.posterURL ? (
          <img
            src={item.posterURL}
            alt={item.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <Calendar className="h-8 w-8 text-slate-400" />
          </div>
        )}
        <span
          className={`absolute top-3 left-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusStyle[status]}`}
        >
          {status}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-semibold text-slate-900 line-clamp-1">{item.title}</h3>
        <p className="mt-1.5 text-sm text-slate-600 line-clamp-2 min-h-[2.5rem]">
          {item.description || 'No description provided.'}
        </p>

        <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {date ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date TBD'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {item.currentAttendees || 0} attending
          </span>
        </div>

        <div className="mt-5 flex items-center gap-2 pt-4 border-t border-slate-100">
          <a
            href={`/events/${item.id}`}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 transition"
          >
            <Eye className="h-3.5 w-3.5" /> View
          </a>
          <a
            href={`/events/${item.id}/edit`}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </a>
          <a
            href={`/events/${item.id}/attendees`}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            <Users className="h-3.5 w-3.5" />
          </a>
          <button
            onClick={() => onDelete(item.id, item.title)}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition"
            title="Delete event"
            aria-label="Delete event"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

function EventRow({ item, onDelete }: { item: any; onDelete: (id: string, title: string) => void }) {
  const date = toDate(item.startAt);
  const status = statusOf(item);
  return (
    <li className="group flex items-center gap-4 p-4 transition hover:bg-slate-50/60">
      <div className="flex-shrink-0 h-12 w-12 overflow-hidden rounded-lg bg-slate-100">
        {item.posterURL ? (
          <img src={item.posterURL} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Calendar className="h-5 w-5 text-slate-400" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-slate-900">{item.title}</h3>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusStyle[status]}`}
          >
            {status}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          {item.description || 'No description provided.'}
        </p>
        <div className="mt-1 flex items-center gap-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            {date ? date.toLocaleDateString() : 'TBD'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3 w-3" />
            {item.currentAttendees || 0}
          </span>
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-1">
        <a
          href={`/events/${item.id}`}
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
          title="View"
        >
          <Eye className="h-4 w-4" />
        </a>
        <a
          href={`/events/${item.id}/attendees`}
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
          title="Attendees"
        >
          <Users className="h-4 w-4" />
        </a>
        <a
          href={`/events/${item.id}/edit`}
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </a>
        <button
          onClick={() => onDelete(item.id, item.title)}
          className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}
