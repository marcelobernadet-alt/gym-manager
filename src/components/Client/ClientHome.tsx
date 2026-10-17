import React from 'react';
import { Calendar, ShoppingBag, Clock, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMyMembership } from '../../hooks/useMyMembership';
import { useMyBookings } from '../../hooks/useBookings';
import type { ClientTab } from './ClientShell';

const STATUS_LABEL: Record<string, string> = {
  active: 'Activa',
  expiring_soon: 'Por vencer',
  expired: 'Vencida',
  paused: 'Pausada',
  cancelled: 'Cancelada'
};

const STATUS_COLOR: Record<string, string> = {
  active: 'text-emerald-400 bg-emerald-500/10',
  expired: 'text-red-400 bg-red-500/10',
  paused: 'text-amber-400 bg-amber-500/10',
  cancelled: 'text-neutral-400 bg-neutral-500/10'
};

export const ClientHome: React.FC<{ onNavigate: (tab: ClientTab) => void }> = ({ onNavigate }) => {
  const { profile } = useAuth();
  const { membership } = useMyMembership(profile?.id);
  const { bookings } = useMyBookings(profile?.id);

  const nextBooking = bookings
    .filter((b) => b.class_sessions && new Date(b.class_sessions.start_time) > new Date())
    .sort((a, b) => new Date(a.class_sessions!.start_time).getTime() - new Date(b.class_sessions!.start_time).getTime())[0];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-neutral-500">Hola,</p>
        <h1 className="text-2xl font-bold">{profile?.full_name || profile?.email}</h1>
      </div>

      <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-neutral-500 font-medium">Tu membresía</p>
          {membership && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[membership.status]}`}>
              {STATUS_LABEL[membership.status]}
            </span>
          )}
        </div>
        {membership ? (
          <>
            <p className="font-bold text-lg">{membership.plan_name}</p>
            {membership.end_date && (
              <p className="text-xs text-neutral-500 mt-1">Vence el {new Date(membership.end_date).toLocaleDateString('es-AR')}</p>
            )}
          </>
        ) : (
          <p className="text-sm text-neutral-500">Todavía no tenés una membresía asignada. Hablá con recepción.</p>
        )}
      </div>

      <div>
        <p className="text-xs text-neutral-500 font-medium mb-2">Próxima clase</p>
        {nextBooking?.class_sessions ? (
          <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-4 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${nextBooking.class_sessions.gym_classes?.color ?? '#10b981'}20` }}
            >
              <Calendar className="w-5 h-5" style={{ color: nextBooking.class_sessions.gym_classes?.color ?? '#10b981' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{nextBooking.class_sessions.gym_classes?.name}</p>
              <div className="flex items-center gap-3 text-xs text-neutral-500 mt-0.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(nextBooking.class_sessions.start_time).toLocaleString('es-AR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                {nextBooking.class_sessions.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {nextBooking.class_sessions.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => onNavigate('calendar')}
            className="w-full bg-[#141414] border border-dashed border-neutral-700 rounded-2xl p-4 text-sm text-neutral-400 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
          >
            No tenés clases reservadas. Reservá una →
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onNavigate('calendar')}
          className="bg-[#141414] border border-neutral-800 rounded-2xl p-4 flex flex-col items-start gap-2 hover:border-emerald-600 transition-colors"
        >
          <Calendar className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">Calendario de clases</span>
        </button>
        <button
          onClick={() => onNavigate('store')}
          className="bg-[#141414] border border-neutral-800 rounded-2xl p-4 flex flex-col items-start gap-2 hover:border-emerald-600 transition-colors"
        >
          <ShoppingBag className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">Tienda online</span>
        </button>
      </div>
    </div>
  );
};
