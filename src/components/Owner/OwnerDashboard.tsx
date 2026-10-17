import React, { useMemo } from 'react';
import { Users, DollarSign, Calendar, Package } from 'lucide-react';
import { useMembers } from '../../hooks/useMembers';
import { useClassSessions } from '../../hooks/useClasses';
import { useOrders } from '../../hooks/useOrders';
import type { OwnerTab } from './OwnerShell';

export const OwnerDashboard: React.FC<{ onNavigate: (tab: OwnerTab) => void }> = ({ onNavigate }) => {
  const { members } = useMembers();
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const todayEnd = useMemo(() => {
    const d = new Date(todayStart);
    d.setDate(d.getDate() + 1);
    return d;
  }, [todayStart]);
  const { sessions } = useClassSessions(todayStart, todayEnd);
  const { orders } = useOrders({ all: true });

  const activeMembers = members.filter((m) => m.memberships?.some((mb) => mb.status === 'active')).length;
  const todayRevenue = orders
    .filter((o) => new Date(o.created_at) >= todayStart && o.status === 'paid')
    .reduce((sum, o) => sum + o.total, 0);

  const stats = [
    { label: 'Socios activos', value: activeMembers, icon: Users, color: 'text-emerald-400' },
    { label: 'Clases hoy', value: sessions.length, icon: Calendar, color: 'text-sky-400' },
    { label: 'Ventas hoy', value: `$${todayRevenue.toLocaleString('es-AR')}`, icon: DollarSign, color: 'text-amber-400' },
    { label: 'Total socios', value: members.length, icon: Package, color: 'text-fuchsia-400' }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Resumen</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#141414] border border-neutral-800 rounded-2xl p-4">
            <Icon className={`w-5 h-5 mb-2 ${color}`} />
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs text-neutral-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <button
          onClick={() => onNavigate('ventas')}
          className="bg-[#141414] border border-neutral-800 rounded-2xl p-5 text-left hover:border-emerald-600 transition-colors"
        >
          <DollarSign className="w-5 h-5 text-emerald-400 mb-2" />
          <p className="font-bold">Registrar una venta</p>
          <p className="text-xs text-neutral-500 mt-1">Vendé productos o cobrá una membresía desde el punto de venta.</p>
        </button>
        <button
          onClick={() => onNavigate('gestion')}
          className="bg-[#141414] border border-neutral-800 rounded-2xl p-5 text-left hover:border-emerald-600 transition-colors"
        >
          <Users className="w-5 h-5 text-emerald-400 mb-2" />
          <p className="font-bold">Gestionar socios y clases</p>
          <p className="text-xs text-neutral-500 mt-1">Dar de alta socios, programar clases y administrar productos.</p>
        </button>
      </div>

      <div>
        <p className="text-xs text-neutral-500 font-medium mb-2">Últimas ventas</p>
        <div className="space-y-2">
          {orders.slice(0, 5).map((o) => (
            <div key={o.id} className="bg-[#141414] border border-neutral-800 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{o.profiles?.full_name || 'Venta mostrador'}</p>
                <p className="text-xs text-neutral-500">
                  {new Date(o.created_at).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  {' · '}
                  {o.source === 'pos' ? 'Punto de venta' : 'Tienda online'}
                </p>
              </div>
              <p className="font-bold text-sm">${o.total.toLocaleString('es-AR')}</p>
            </div>
          ))}
          {orders.length === 0 && <p className="text-xs text-neutral-600">Todavía no hay ventas registradas.</p>}
        </div>
      </div>
    </div>
  );
};
