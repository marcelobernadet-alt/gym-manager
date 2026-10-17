import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus, Package } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../hooks/useProducts';
import { useOrders } from '../../hooks/useOrders';
import type { CartLine } from '../../types';
import { Spinner } from '../ui/Spinner';
import { Modal } from '../ui/Modal';

export const Store: React.FC = () => {
  const { profile } = useAuth();
  const { products, loading } = useProducts();
  const { checkout } = useOrders({ clientId: profile?.id });
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
  const cartCount = cart.reduce((sum, l) => sum + l.quantity, 0);

  const handleCheckout = async () => {
    if (!profile || cart.length === 0) return;
    setCheckingOut(true);
    setError(null);
    try {
      const orderId = await checkout(cart, profile.id, 'manual', 'store');
      setConfirmedOrderId(orderId);
      setCart([]);
      setCartOpen(false);
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo completar la compra.');
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Tienda</h1>
        <button onClick={() => setCartOpen(true)} className="relative p-2.5 rounded-xl bg-[#141414] border border-neutral-800">
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-emerald-500 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <Spinner />
        </div>
      ) : products.length === 0 ? (
        <p className="text-sm text-neutral-500 py-8 text-center">Todavía no hay productos a la venta.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {products.map((product) => (
            <div key={product.id} className="bg-[#141414] border border-neutral-800 rounded-2xl overflow-hidden flex flex-col">
              <div className="aspect-square bg-[#1c1c1c] flex items-center justify-center">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-8 h-8 text-neutral-600" />
                )}
              </div>
              <div className="p-3 flex-1 flex flex-col">
                <p className="text-sm font-semibold truncate">{product.name}</p>
                <p className="text-xs text-neutral-500 mb-2">
                  {product.currency} {product.price.toLocaleString('es-AR')}
                </p>
                <button
                  disabled={product.stock <= 0}
                  onClick={() => addToCart(product.id)}
                  className="mt-auto w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold disabled:opacity-40 disabled:bg-neutral-700"
                >
                  {product.stock <= 0 ? 'Sin stock' : 'Agregar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={cartOpen} onClose={() => setCartOpen(false)} title="Tu carrito">
        {cart.length === 0 ? (
          <p className="text-sm text-neutral-500 text-center py-6">El carrito está vacío.</p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              {cart.map((line) => (
                <div key={line.product.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{line.product.name}</p>
                    <p className="text-xs text-neutral-500">
                      {line.product.currency} {line.product.price.toLocaleString('es-AR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => changeQty(line.product.id, -1)}
                      className="w-7 h-7 rounded-lg bg-[#222222] flex items-center justify-center"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm w-5 text-center">{line.quantity}</span>
                    <button
                      onClick={() => changeQty(line.product.id, 1)}
                      disabled={line.quantity >= line.product.stock}
                      className="w-7 h-7 rounded-lg bg-[#222222] flex items-center justify-center disabled:opacity-40"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">{error}</div>}

            <div className="border-t border-neutral-800 pt-4 flex items-center justify-between">
              <span className="text-sm font-semibold">Total</span>
              <span className="font-bold">{cart[0].product.currency} {total.toLocaleString('es-AR')}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={checkingOut}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm disabled:opacity-60"
            >
              {checkingOut ? 'Procesando...' : 'Confirmar compra'}
            </button>
          </div>
        )}
      </Modal>

      <Modal open={!!confirmedOrderId} onClose={() => setConfirmedOrderId(null)} title="¡Compra confirmada!">
        <p className="text-sm text-neutral-400">
          Tu pedido fue registrado. Podés pasar a retirarlo por el gimnasio o coordinar la entrega con el equipo.
        </p>
        <button
          onClick={() => setConfirmedOrderId(null)}
          className="w-full mt-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm"
        >
          Listo
        </button>
      </Modal>
    </div>
  );
};
