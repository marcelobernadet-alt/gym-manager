import React, { useState } from 'react';
import { Users, Calendar, Package } from 'lucide-react';
import { Socios } from './Socios';
import { Clases } from './Clases';
import { Productos } from './Productos';

type GestionTab = 'socios' | 'clases' | 'productos';

const TABS: { id: GestionTab; label: string; icon: React.ElementType }[] = [
  { id: 'socios', label: 'Socios', icon: Users },
  { id: 'clases', label: 'Clases', icon: Calendar },
  { id: 'productos', label: 'Productos', icon: Package }
];

export const GestionShell: React.FC = () => {
  const [tab, setTab] = useState<GestionTab>('socios');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold mb-3">Gestión</h1>
        <div className="flex gap-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                tab === id ? 'bg-emerald-600 text-white' : 'bg-[#141414] text-neutral-400 border border-neutral-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'socios' && <Socios />}
      {tab === 'clases' && <Clases />}
      {tab === 'productos' && <Productos />}
    </div>
  );
};
