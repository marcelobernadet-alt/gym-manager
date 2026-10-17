import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Users, Clock, MapPin, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useClassSessions } from '../../hooks/useClasses';
import { useMyBookings } from '../../hooks/useBookings';
import { Spinner } from '../ui/Spinner';

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const ClassCalendar: React.FC = () => {
  const { profile } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [busySessionId, setBusySessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const weekStart = useMemo(() => {
    const d = startOfWeek(new Date());
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);
  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    return d;
  }, [weekStart]);

  const { sessions, loading, refresh } = useClassSessions(weekStart, weekEnd);
  const { bookings, book, cancel } = useMyBookings(profile?.id);

  const myBookingBySession = new Map(bookings.map((b) => [b.session_id, b]));

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const handleToggle = async (sessionId: string, isBooked: boolean) => {
    setError(null);
    setBusySessionId(sessionId);
    try {
      if (isBooked) {
        const booking = myBookingBySession.get(sessionId)!;
        await cancel(booking.id);
      } else {
        await book(sessionId);
      }
      await refresh();
    } catch (err: any) {
      setError(err?.message?.includes('duplicate') ? 'Ya tenés un lugar reservado en esta clase.' : 'No se pudo completar la acción.');
    } finally {
      setBusySessionId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Calendario de clases</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="p-2 rounded-xl bg-[#141414] border border-neutral-800 hover:border-neutral-600"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="p-2 rounded-xl bg-[#141414] border border-neutral-800 hover:border-neutral-600"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-xs text-neutral-500">
        {weekStart.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} —{' '}
        {new Date(weekEnd.getTime() - 86400000).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
        {weekOffset !== 0 && (
          <button onClick={() => setWeekOffset(0)} className="ml-2 text-emerald-400 font-semibold">
            Hoy
          </button>
        )}
      </p>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">{error}</div>
      )}

      {loading ? (
        <div className="py-12 flex justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-6">
          {days.map((day, idx) => {
            const daySessions = sessions.filter((s) => {
              const d = new Date(s.start_time);
              return d.toDateString() === day.toDateString();
            });
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div key={idx}>
                <p className={`text-xs font-bold mb-2 ${isToday ? 'text-emerald-400' : 'text-neutral-500'}`}>
                  {DAY_LABELS[idx]} {day.getDate()}
                  {isToday && ' · Hoy'}
                </p>
                {daySessions.length === 0 ? (
                  <p className="text-xs text-neutral-600 pb-2">Sin clases</p>
                ) : (
                  <div className="space-y-2">
                    {daySessions.map((session) => {
                      const cls = session.gym_classes;
                      const isBooked = myBookingBySession.has(session.id);
                      const full = (session.booked_count ?? 0) >= session.capacity;
                      const busy = busySessionId === session.id;
                      return (
                        <div
                          key={session.id}
                          className="bg-[#141414] border border-neutral-800 rounded-2xl p-4 flex items-center gap-3"
                        >
                          <div
                            className="w-1.5 self-stretch rounded-full flex-shrink-0"
                            style={{ backgroundColor: cls?.color ?? '#10b981' }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{cls?.name}</p>
                            <div className="flex items-center gap-3 text-xs text-neutral-500 mt-0.5 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(session.start_time).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {session.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {session.location}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {session.booked_count ?? 0}/{session.capacity}
                              </span>
                            </div>
                          </div>
                          <button
                            disabled={busy || (full && !isBooked)}
                            onClick={() => handleToggle(session.id, isBooked)}
                            className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 ${
                              isBooked
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : full
                                  ? 'bg-neutral-800 text-neutral-500'
                                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
                            }`}
                          >
                            {busy ? '...' : isBooked ? (
                              <span className="flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Reservado
                              </span>
                            ) : full ? (
                              'Completo'
                            ) : (
                              'Reservar'
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
