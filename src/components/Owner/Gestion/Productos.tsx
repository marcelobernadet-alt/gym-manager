import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import { useProducts } from '../../../hooks/useProducts';
import { Modal } from '../../ui/Modal';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { Spinner } from '../../ui/Spinner';
import type { Product } from '../../../types';

const EMPTY_PRODUCT = {
  name: '',
  description: '',
  price: '',
  currency: 'ARS',
  stock: '',
  image_url: '',
  category: '',
  is_active: true
};

export const Productos: React.FC = () => {
  const { products, loading, createProduct, updateProduct, deleteProduct } = useProducts({ includeInactive: true });
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_PRODUCT);
    setFormOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description ?? '',
      price: String(p.price),
      currency: p.currency,
      stock: String(p.stock),
      image_url: p.image_url ?? '',
      category: p.category ?? '',
      is_active: p.is_active
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description || null,
      price: Number(form.price) || 0,
      currency: form.currency,
      stock: Number(form.stock) || 0,
      image_url: form.image_url || null,
      category: form.category || null,
      is_active: form.is_active
    };
    try {
      if (editingId) await updateProduct(editingId, payload);
      else await createProduct(payload);
      setFormOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> Nuevo producto
        </button>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {products.map((p) => (
            <div key={p.id} className="bg-[#141414] border border-neutral-800 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#1c1c1c] flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-neutral-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{p.name}</p>
                  <p className="text-xs text-neutral-500">
                    {p.currency} {p.price.toLocaleString('es-AR')} · Stock: {p.stock}
                  </p>
                  {!p.is_active && <span className="text-[10px] text-neutral-500 bg-neutral-500/10 px-2 py-0.5 rounded-full">Inactivo</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg bg-[#222222] hover:bg-[#2a2a2a]">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteTarget(p.id)} className="p-1.5 rounded-lg bg-[#222222] hover:bg-red-500/20 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {products.length === 0 && <p className="text-xs text-neutral-600 py-6 col-span-full text-center">Todavía no hay productos.</p>}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editingId ? 'Editar producto' : 'Nuevo producto'}>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">Nombre *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full bg-[#1c1c1c] border border-neutral-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={2}
              className="w-full bg-[#1c1c1c] border border-neutral-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Precio</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                className="w-full bg-[#1c1c1c] border border-neutral-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Stock</label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
                className="w-full bg-[#1c1c1c] border border-neutral-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Categoría</label>
              <input
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="w-full bg-[#1c1c1c] border border-neutral-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Moneda</label>
              <input
                value={form.currency}
                onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
                className="w-full bg-[#1c1c1c] border border-neutral-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">URL de imagen</label>
            <input
              value={form.image_url}
              onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))}
              className="w-full bg-[#1c1c1c] border border-neutral-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} />
            Visible en la tienda
          </label>
          <button
            onClick={handleSave}
            disabled={!form.name || saving}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm disabled:opacity-60"
          >
            {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar producto"
        message="Esta acción no se puede deshacer."
        danger
        confirmLabel="Eliminar"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteProduct(deleteTarget);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
};
