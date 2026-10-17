import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Clock, Users } from 'lucide-react';
import { useGymClasses, useClassSessions } from '../../../hooks/useClasses';
import { Modal } from '../../ui/Modal';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { Spinner } from '../../ui/Spinner';

const COLORS = ['#10b981', '#4285F4', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4'];

const EMPTY_CLASS = { name: '', description: '', instructor_name: '', duration_min: 60, category: '', color: COLORS[0] };

export const Clases: React.FC = () => {
  const { classes, loading, createClass, deleteClass } = useGymClasses();
  const from = useMemo(() => new Date(), []);
  const to = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d;
  }, []);
  const { sessions, createSession, deleteSession } = useClassSessions(from, to);

  const [newClassOpen, setNewClassOpen] = useState(false);
  const [newClass, setNewClass] = useState(EMPTY_CLASS);
  const [scheduleFor, setScheduleFor] = useState<string | null>(null);
  const [newSession, setNewSession] = useState({ date: '', time: '', capacity: '15', location: '' });
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'class' | 'session'; id: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateClass = async () => {
    if (!newClass.name) return;
    await createClass({ ...newClass, is_active: true });
    setNewClass(EMPTY_CLASS);
    setNewClassOpen(false);
  };

  const handleCreateSession = async () => {
    const cls = classes.find((c) => c.id === scheduleFor);
    if (!cls || !newSession.date || !newSession.time) return;
    setError(null);
    const start = new Date(`${newSession.date}T${newSession.time}:00`);
    const end = new Date(start.getTime() + cls.duration_min * 60000);
    try {
      await createSession({
        class_id: cls.id,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        capacity: Number(newSession.capacity) || 15,
        location: newSession.location || null
      });
      setScheduleFor(null);
      setNewSession({ date: '', time: '', capacity: '15', location: '' });
    } catch (err: any) {
      setError('No se pudo programar la clase.');
    }
  };

  const sessionsByClass = (classId: string) =>
    sessions.filter((s) => s.class_id === classId).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setNewClassOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> Nueva clase
        </button>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-4">
          {classes.map((cls) => (
            <div key={cls.id} className="bg-[#141414] border border-neutral-800 rounded-2xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-10 rounded-full" style={{ backgroundColor: cls.color }} />
                  <div>
                    <p className="font-bold">{cls.name}</p>
                    <p className="text-xs text-neutral-500">
                      {cls.instructor_name && `${cls.instructor_name} · `}
                      {cls.duration_min} min
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setScheduleFor(cls.id)}
                    className="px-3 py-1.5 rounded-lg bg-[#222222] hover:bg-[#2a2a2a] text-xs font-semibold"
                  >
                    Programar horario
                  </button>
                  <button
                    onClick={() => setDeleteTarget({ type: 'class', id: cls.id })}
                    className="p-2 rounded-lg bg-[#222222] hover:bg-red-500/20 text-neutral-400 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {sessionsByClass(cls.id).map((s) => (
                  <div key={s.id} className="flex items-center gap-2 bg-[#1c1c1c] rounded-lg px-2.5 py-1.5 text-xs">
                    <Clock className="w-3 h-3 text-neutral-500" />
                    {new Date(s.start_time).toLocaleString('es-AR', { weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    <span className="flex items-center gap-1 text-neutral-500">
                      <Users className="w-3 h-3" />
                      {s.booked_count ?? 0}/{s.capacity}
                    </span>
                    <button onClick={() => setDeleteTarget({ type: 'session', id: s.id })} className="text-neutral-500 hover:text-red-400">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {sessionsByClass(cls.id).length === 0 && <p className="text-xs text-neutral-600">Sin horarios programados.</p>}
              </div>
            </div>
          ))}
          {classes.length === 0 && <p className="text-xs text-neutral-600 py-6 text-center">Todavía no creaste ninguna clase.</p>}
        </div>
      )}

      <Modal open={newClassOpen} onClose={() => setNewClassOpen(false)} title="Nueva clase">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">Nombre *</label>
            <input
              value={newClass.name}
              onChange={(e) => setNewClass((p) => ({ ...p, name: e.target.value }))}
              placeholder="Ej: Spinning"
              className="w-full bg-[#1c1c1c] border border-neutral-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">Instructor</label>
            <input
              value={newClass.instructor_name}
              onChange={(e) => setNewClass((p) => ({ ...p, instructor_name: e.target.value }))}
              className="w-full bg-[#1c1c1c] border border-neutral-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Duración (min)</label>
              <input
                type="number"
                value={newClass.duration_min}
                onChange={(e) => setNewClass((p) => ({ ...p, duration_min: Number(e.target.value) }))}
                className="w-full bg-[#1c1c1c] border border-neutral-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Categoría</label>
              <input
                value={newClass.category}
                onChange={(e) => setNewClass((p) => ({ ...p, category: e.target.value }))}
                placeholder="Ej: Cardio"
                className="w-full bg-[#1c1c1c] border border-neutral-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">Color</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewClass((p) => ({ ...p, color: c }))}
                  className={`w-7 h-7 rounded-full ${newClass.color === c ? 'ring-2 ring-white' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <button
            onClick={handleCreateClass}
            disabled={!newClass.name}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm disabled:opacity-60"
          >
            Crear clase
          </button>
        </div>
      </Modal>

      <Modal open={!!scheduleFor} onClose={() => setScheduleFor(null)} title="Programar horario">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Fecha</label>
              <input
                type="date"
                value={newSession.date}
                onChange={(e) => setNewSession((p) => ({ ...p, date: e.target.value }))}
                className="w-full bg-[#1c1c1c] border border-neutral-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Hora</label>
              <input
                type="time"
                value={newSession.time}
                onChange={(e) => setNewSession((p) => ({ ...p, time: e.target.value }))}
                className="w-full bg-[#1c1c1c] border border-neutral-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Cupo</label>
              <input
                type="number"
                value={newSession.capacity}
                onChange={(e) => setNewSession((p) => ({ ...p, capacity: e.target.value }))}
                className="w-full bg-[#1c1c1c] border border-neutral-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Sala / Ubicación</label>
              <input
                value={newSession.location}
                onChange={(e) => setNewSession((p) => ({ ...p, location: e.target.value }))}
                className="w-full bg-[#1c1c1c] border border-neutral-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">{error}</div>}
          <button
            onClick={handleCreateSession}
            disabled={!newSession.date || !newSession.time}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm disabled:opacity-60"
          >
            Programar
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title={deleteTarget?.type === 'class' ? 'Eliminar clase' : 'Eliminar horario'}
        message={
          deleteTarget?.type === 'class'
            ? 'Se eliminará la clase y todos sus horarios programados. Esta acción no se puede deshacer.'
            : 'Se eliminará este horario y las reservas asociadas.'
        }
        danger
        confirmLabel="Eliminar"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          if (deleteTarget.type === 'class') await deleteClass(deleteTarget.id);
          else await deleteSession(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
};
