import React, { useState } from 'react';
import { UserPlus, Search } from 'lucide-react';
import { useMembers, type MemberRow } from '../../../hooks/useMembers';
import { Modal } from '../../ui/Modal';
import { Spinner } from '../../ui/Spinner';
import type { MembershipStatus } from '../../../types';

const STATUS_LABEL: Record<MembershipStatus, string> = {
  active: 'Activa',
  expired: 'Vencida',
  paused: 'Pausada',
  cancelled: 'Cancelada'
};

const STATUS_COLOR: Record<MembershipStatus, string> = {
  active: 'text-emerald-400 bg-emerald-500/10',
  expired: 'text-red-400 bg-red-500/10',
  paused: 'text-amber-400 bg-amber-500/10',
  cancelled: 'text-neutral-400 bg-neutral-500/10'
};

const EMPTY_NEW_MEMBER = { full_name: '', email: '', phone: '', plan_name: '', plan_price: '' };

export const Socios: React.FC = () => {
  const { members, loading, addMember, addMembership, updateMembership } = useMembers();
  const [query, setQuery] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [newMember, setNewMember] = useState(EMPTY_NEW_MEMBER);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailMember, setDetailMember] = useState<MemberRow | null>(null);
  const [newPlan, setNewPlan] = useState({ plan_name: '', price: '' });

  const filtered = members.filter(
    (m) => !query || m.full_name?.toLowerCase().includes(query.toLowerCase()) || m.email.toLowerCase().includes(query.toLowerCase())
  );

  const latestMembership = (m: MemberRow) =>
    [...(m.memberships ?? [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  const handleAddMember = async () => {
    if (!newMember.full_name || !newMember.email) {
      setError('Nombre y email son obligatorios.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await addMember({
        full_name: newMember.full_name,
        email: newMember.email,
        phone: newMember.phone || undefined,
        plan_name: newMember.plan_name || undefined,
        plan_price: newMember.plan_price ? Number(newMember.plan_price) : undefined
      });
      setNewMember(EMPTY_NEW_MEMBER);
      setAddOpen(false);
    } catch (err: any) {
      setError(err?.message?.includes('duplicate') ? 'Ya existe un socio con ese email.' : 'No se pudo crear el socio.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPlan = async () => {
    if (!detailMember || !newPlan.plan_name) return;
    await addMembership(detailMember.id, { plan_name: newPlan.plan_name, price: Number(newPlan.price) || 0, status: 'active', end_date: null, start_date: new Date().toISOString().slice(0, 10) });
    setNewPlan({ plan_name: '', price: '' });
    setDetailMember(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar socio..."
            className="w-full bg-[#141414] border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4" /> Nuevo socio
        </button>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => {
            const membership = latestMembership(m);
            return (
              <button
                key={m.id}
                onClick={() => setDetailMember(m)}
                className="w-full bg-[#141414] border border-neutral-800 rounded-xl p-4 flex items-center justify-between text-left hover:border-neutral-600"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{m.full_name || '(sin nombre)'}</p>
                  <p className="text-xs text-neutral-500 truncate">{m.email}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {membership && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[membership.status]}`}>
                      {STATUS_LABEL[membership.status]}
                    </span>
                  )}
                  {!m.auth_user_id && (
                    <span className="text-[10px] font-medium text-neutral-500 bg-neutral-500/10 px-2 py-0.5 rounded-full">
                      Sin ingresar
                    </span>
                  )}
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && <p className="text-xs text-neutral-600 py-6 text-center">No se encontraron socios.</p>}
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Nuevo socio">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">Nombre completo *</label>
            <input
              value={newMember.full_name}
              onChange={(e) => setNewMember((p) => ({ ...p, full_name: e.target.value }))}
              className="w-full bg-[#1c1c1c] border border-neutral-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">Email *</label>
            <input
              type="email"
              value={newMember.email}
              onChange={(e) => setNewMember((p) => ({ ...p, email: e.target.value }))}
              className="w-full bg-[#1c1c1c] border border-neutral-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[10px] text-neutral-600 mt-1">
              Cuando inicie sesión con Google usando este email, su cuenta se vincula automáticamente.
            </p>
          </div>
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">Teléfono</label>
            <input
              value={newMember.phone}
              onChange={(e) => setNewMember((p) => ({ ...p, phone: e.target.value }))}
              className="w-full bg-[#1c1c1c] border border-neutral-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Plan (opcional)</label>
              <input
                value={newMember.plan_name}
                onChange={(e) => setNewMember((p) => ({ ...p, plan_name: e.target.value }))}
                placeholder="Ej: Mensual"
                className="w-full bg-[#1c1c1c] border border-neutral-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Precio</label>
              <input
                type="number"
                value={newMember.plan_price}
                onChange={(e) => setNewMember((p) => ({ ...p, plan_price: e.target.value }))}
                className="w-full bg-[#1c1c1c] border border-neutral-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">{error}</div>}

          <button
            onClick={handleAddMember}
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Dar de alta'}
          </button>
        </div>
      </Modal>

      <Modal open={!!detailMember} onClose={() => setDetailMember(null)} title={detailMember?.full_name || 'Socio'}>
        {detailMember && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-neutral-500">{detailMember.email}</p>
              {detailMember.phone && <p className="text-xs text-neutral-500">{detailMember.phone}</p>}
            </div>

            <div>
              <p className="text-xs text-neutral-500 font-medium mb-2">Membresías</p>
              <div className="space-y-2">
                {(detailMember.memberships ?? []).map((mb) => (
                  <div key={mb.id} className="bg-[#1c1c1c] rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{mb.plan_name}</p>
                      <p className="text-xs text-neutral-500">${mb.price.toLocaleString('es-AR')}</p>
                    </div>
                    <select
                      value={mb.status}
                      onChange={(e) => updateMembership(mb.id, { status: e.target.value as MembershipStatus })}
                      className="bg-[#262626] border border-neutral-700 rounded-lg text-xs px-2 py-1.5"
                    >
                      {Object.entries(STATUS_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
                {(detailMember.memberships ?? []).length === 0 && (
                  <p className="text-xs text-neutral-600">Sin membresías registradas.</p>
                )}
              </div>
            </div>

            <div className="border-t border-neutral-800 pt-4 space-y-2">
              <p className="text-xs text-neutral-500 font-medium">Agregar nueva membresía</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={newPlan.plan_name}
                  onChange={(e) => setNewPlan((p) => ({ ...p, plan_name: e.target.value }))}
                  placeholder="Plan"
                  className="bg-[#1c1c1c] border border-neutral-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="number"
                  value={newPlan.price}
                  onChange={(e) => setNewPlan((p) => ({ ...p, price: e.target.value }))}
                  placeholder="Precio"
                  className="bg-[#1c1c1c] border border-neutral-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                onClick={handleAddPlan}
                disabled={!newPlan.plan_name}
                className="w-full py-2 rounded-xl bg-[#262626] hover:bg-[#303030] text-sm font-semibold disabled:opacity-50"
              >
                Agregar membresía
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
