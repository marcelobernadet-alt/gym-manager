import React, { useState } from 'react';
import { Plus, Minus, Package, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../hooks/useProducts';
import { useOrders } from '../../hooks/useOrders';
import { useMembers } from '../../hooks/useMembers';
import type { CartLine } from '../../types';
import { Spinner } from '../ui/Spinner';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Efectivo' },
  { id: 'card', label: 'Tarjeta' },
  { id: 'transfer', label: 'Transferencia' },
  { id: 'mercadopago', label: 'Mercado Pago' }
];

export const Ventas: React.FC = () => {
  const { profile } = useAuth();
  const { products, loading } = useProducts();
  const { members } = useMembers();
  const { orders, checkout } = useOrders({ all: true });
  const [cart, setCart] = useState<CartLine[]>([]);
  const [memberQuery, setMemberQuery] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const addToCart = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === productId);
      if (existing) {
        return prev.map((l) => (l.product.id === productId ? { ...l, quantity: Math.min(l.quantity + 1, product.stock) } : l));
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const changeQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) => (l.product.id === productId ? { ...l, quantity: Math.min(Math.max(l.quantity + delta, 0), l.product.stock) } : l))
        .filter((l) => l.quantity > 0)
    );
  };

  const total = cart.reduce((sum, l) => sum + l.product.price * l.quantity, 0);

  const filteredMembers = memberQuery
    ? members.filter(
        (m) => m.full_name?.toLowerCase().includes(memberQuery.toLowerCase()) || m.email.toLowerCase().includes(memberQuery.toLowerCase())
      )
    : [];
  const selectedMember = members.find((m) => m.id === selectedMemberId);

  const handleConfirm = async () => {
    if (!profile || cart.length === 0) return;
    setProcessing(true);
    setError(null);
    try {
      await checkout(cart, selectedMemberId, paymentMethod, 'pos');
      setCart([]);
      setSelectedMemberId(null);
      setMemberQuery('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo registrar la venta.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <h1 className="text-xl font-bold">Punto de venta</h1>
        {loading ? (
          <div className="py-12 flex justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {products.map((product) => (
              <button
                key={product.id}
                disabled={product.stock <= 0}
                onClick={() => addToCart(product.id)}
                className="bg-[#141414] border border-neutral-800 rounded-2xl p-3 text-left hover:border-emerald-600 transition-colors disabled:opacity-40"
              >
                <div className="aspect-square bg-[#1c1c1c] rounded-xl mb-2 flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-6 h-6 text-neutral-600" />
                  )}
                </div>
                <p className="text-xs font-semibold truncate">{product.name}</p>
                <p className="text-xs text-neutral-500">${product.price.toLocaleString('es-AR')}</p>
                <p className="text-[10px] text-neutral-600">Stock: {product.stock}</p>
              </button>
            ))}
            {products.length === 0 && <p className="text-xs text-neutral-600 col-span-full">No hay productos cargados todavía.</p>}
          </div>
        )}

        <div>
          <p className="text-xs text-neutral-500 font-medium mb-2">Ventas recientes</p>
          <div className="space-y-2">
            {orders.slice(0, 6).map((o) => (
              <div key={o.id} className="bg-[#141414] border border-neutral-800 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{o.profiles?.full_name || 'Venta mostrador'}</p>
                  <p className="text-xs text-neutral-500">{new Date(o.created_at).toLocaleString('es-AR')}</p>
                </div>
                <p className="font-bold text-sm">${o.total.toLocaleString('es-AR')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-5 space-y-4 self-start sticky top-24">
        <h2 className="font-bold">Venta actual</h2>

        <div>
          <label className="text-xs text-neutral-500 mb-1 block">Socio (opcional)</label>
          {selectedMember ? (
            <div className="flex items-center justify-between bg-[#1c1c1c] rounded-xl px-3 py-2">
              <span className="text-sm truncate">{selectedMember.full_name || selectedMember.email}</span>
              <button onClick={() => setSelectedMemberId(null)} className="text-xs text-neutral-500 hover:text-white">
                Quitar
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={memberQuery}
                onChange={(e) => setMemberQuery(e.target.value)}
                placeholder="Buscar por nombre o email..."
                className="w-full bg-[#1c1c1c] border border-neutral-700 rounded-xl pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              />
              {filteredMembers.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-[#1c1c1c] border border-neutral-700 rounded-xl max-h-40 overflow-y-auto">
                  {filteredMembers.slice(0, 6).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelectedMemberId(m.id);
                        setMemberQuery('');
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-[#262626]"
                    >
                      {m.full_name || m.email}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {cart.length === 0 ? (
          <p className="text-xs text-neutral-600">Agregá productos desde la lista.</p>
        ) : (
          <div className="space-y-2">
            {cart.map((line) => (
              <div key={line.product.id} className="flex items-center gap-2">
                <p className="text-xs flex-1 truncate">{line.product.name}</p>
                <button onClick={() => changeQty(line.product.id, -1)} className="w-6 h-6 rounded bg-[#222222] flex items-center justify-center">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-xs w-4 text-center">{line.quantity}</span>
                <button onClick={() => changeQty(line.product.id, 1)} className="w-6 h-6 rounded bg-[#222222] flex items-center justify-center">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="text-xs text-neutral-500 mb-1 block">Método de pago</label>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setPaymentMethod(m.id)}
                className={`text-xs py-2 rounded-xl font-semibold transition-colors ${
                  paymentMethod === m.id ? 'bg-emerald-600 text-white' : 'bg-[#1c1c1c] text-neutral-400'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">{error}</div>}
        {success && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">Venta registrada ✓</div>}

        <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
          <span className="text-sm font-semibold">Total</span>
          <span className="font-bold text-lg">${total.toLocaleString('es-AR')}</span>
        </div>

        <button
          onClick={handleConfirm}
          disabled={cart.length === 0 || processing}
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm disabled:opacity-50"
        >
          {processing ? 'Procesando...' : 'Confirmar venta'}
        </button>
      </div>
    </div>
  );
};
