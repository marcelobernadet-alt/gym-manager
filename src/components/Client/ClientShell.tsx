import React, { useState } from 'react';
import { Home, Calendar, ShoppingBag, User } from 'lucide-react';
import { ClientHome } from './ClientHome';
import { ClassCalendar } from './ClassCalendar';
import { Store } from './Store';
import { ClientProfile } from './ClientProfile';

type ClientTab = 'home' | 'calendar' | 'store' | 'profile';

const TABS: { id: ClientTab; label: string; icon: React.ElementType }[] = [
  { id: 'home', label: 'Inicio', icon: Home },
  { id: 'calendar', label: 'Clases', icon: Calendar },
  { id: 'store', label: 'Tienda', icon: ShoppingBag },
  { id: 'profile', label: 'Perfil', icon: User }
];

export const ClientShell: React.FC = () => {
  const [tab, setTab] = useState<ClientTab>('home');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-20">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        {tab === 'home' && <ClientHome onNavigate={setTab} />}
        {tab === 'calendar' && <ClassCalendar />}
        {tab === 'store' && <Store />}
        {tab === 'profile' && <ClientProfile />}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#111111] border-t border-neutral-800 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-2xl mx-auto grid grid-cols-4">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                tab === id ? 'text-emerald-400' : 'text-neutral-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export type { ClientTab };
