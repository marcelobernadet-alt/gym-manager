import React, { useState } from 'react';
import { LogOut, Pencil, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMyMembership } from '../../hooks/useMyMembership';
import { useMyBookings } from '../../hooks/useBookings';
import { supabase } from '../../lib/supabase';
import { Modal } from '../ui/Modal';

export const ClientProfile: React.FC = () => {
  const { profile, logout, refreshProfile } = useAuth();
  const { membership } = useMyMembership(profile?.id);
  const { bookings } = useMyBookings(profile?.id);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    await supabase.from('profiles').update({ full_name: fullName, phone }).eq('id', profile.id);
    await refreshProfile();
    setSaving(false);
    setEditing(false);
  };

  const pastBookings = bookings
    .filter((b) => b.class_sessions)
    .sort((a, b) => new Date(b.class_sessions!.start_time).getTime() - new Date(a.class_sessions!.start_time).getTime());

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Perfil</h1>

      <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-5 flex items-center gap-4">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center text-lg font-bold">
            {(profile?.full_name || profile?.email || '?').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold truncate">{profile?.full_name || 'Sin nombre'}</p>
          <p className="text-xs text-neutral-500 truncate">{profile?.email}</p>
          {profile?.phone && <p className="text-xs text-neutral-500">{profile.phone}</p>}
        </div>
        <button onClick={() => setEditing(true)} className="p-2 rounded-xl bg-[#222222] hover:bg-[#2a2a2a]">
          <Pencil className="w-4 h-4" />
        </button>
      </div>

      {membership && (
        <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-5">
          <p className="text-xs text-neutral-500 font-medium mb-1">Membresía</p>
          <p className="font-bold">{membership.plan_name}</p>
          <p className="text-xs text-neutral-500 mt-1 capitalize">{membership.status}</p>
        </div>
      )}

      <div>
        <p className="text-xs text-neutral-500 font-medium mb-2">Historial de clases</p>
        <div className="space-y-2">
          {pastBookings.length === 0 && <p className="text-xs text-neutral-600">Todavía no reservaste ninguna clase.</p>}
          {pastBookings.slice(0, 10).map((b) => (
            <div key={b.id} className="bg-[#141414] border border-neutral-800 rounded-xl p-3 flex items-center gap-3">
              <Calendar className="w-4 h-4 text-neutral-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{b.class_sessions?.gym_classes?.name}</p>
                <p className="text-xs text-neutral-500">
                  {new Date(b.class_sessions!.start_time).toLocaleDateString('es-AR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={logout}
        className="w-full py-3 rounded-xl bg-[#141414] border border-neutral-800 text-red-400 text-sm font-semibold flex items-center justify-center gap-2 hover:border-red-500/50"
      >
        <LogOut className="w-4 h-4" /> Cerrar sesión
      </button>

      <Modal open={editing} onClose={() => setEditing(false)} title="Editar perfil">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">Nombre completo</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-[#1c1c1c] border border-neutral-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">Teléfono</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#1c1c1c] border border-neutral-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </Modal>
    </div>
  );
};
