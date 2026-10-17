import React, { useState } from 'react';
import { LayoutDashboard, ShoppingCart, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { OwnerDashboard } from './OwnerDashboard';
import { Ventas } from './Ventas';
import { GestionShell } from './Gestion/GestionShell';

type OwnerTab = 'dashboard' | 'ventas' | 'gestion';

const TABS: { id: OwnerTab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
  { id: 'ventas', label: 'Venta', icon: ShoppingCart },
  { id: 'gestion', label: 'Gestión', icon: Settings }
];

export const OwnerShell: React.FC = () => {
  const { profile, logout } = useAuth();
  const [tab, setTab] = useState<OwnerTab>('dashboard');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b border-neutral-800 bg-[#111111]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    tab === id ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:bg-[#1c1c1c]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-500 hidden sm:inline">{profile?.full_name || profile?.email}</span>
            <button onClick={logout} className="p-2 rounded-xl bg-[#1c1c1c] hover:bg-[#262626] text-neutral-400">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {tab === 'dashboard' && <OwnerDashboard onNavigate={setTab} />}
        {tab === 'ventas' && <Ventas />}
        {tab === 'gestion' && <GestionShell />}
      </main>
    </div>
  );
};

export type { OwnerTab };
