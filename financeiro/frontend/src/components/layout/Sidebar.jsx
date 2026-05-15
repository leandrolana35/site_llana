import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CreditCard, FileText, ArrowDownCircle, ArrowUpCircle,
  RefreshCw, Building2, Users, BookOpen, Landmark, Target, Settings,
  Scale, BarChart3, ChevronDown, ChevronRight, FileCheck,
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

const menu = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  {
    label: 'Faturamento', icon: FileCheck,
    children: [
      { label: 'NFS-e (Serviços)', path: '/faturamento/nfse' },
      { label: 'NF-e (Produtos)', path: '/faturamento/nfe' },
    ],
  },
  {
    label: 'Financeiro', icon: CreditCard,
    children: [
      { label: 'Contas a Receber', path: '/financeiro/contas-receber', icon: ArrowDownCircle },
      { label: 'Contas a Pagar', path: '/financeiro/contas-pagar', icon: ArrowUpCircle },
      { label: 'Recorrentes', path: '/financeiro/recorrentes', icon: RefreshCw },
    ],
  },
  { label: 'Conciliação', icon: Scale, path: '/conciliacao' },
  {
    label: 'Cadastros', icon: BookOpen,
    children: [
      { label: 'Pessoas (PF/PJ)', path: '/cadastros/pessoas', icon: Users },
      { label: 'Plano de Contas', path: '/cadastros/plano-contas', icon: BookOpen },
      { label: 'Centros de Custo', path: '/cadastros/centros-custo', icon: Target },
      { label: 'Contas Bancárias', path: '/cadastros/contas-bancarias', icon: Landmark },
    ],
  },
  {
    label: 'Configurações', icon: Settings,
    children: [
      { label: 'Empresas', path: '/config/empresas', icon: Building2 },
      { label: 'Faturamento', path: '/config/faturamento' },
      { label: 'Tributário', path: '/config/tributaria' },
    ],
  },
];

function MenuItem({ item }) {
  const [open, setOpen] = useState(false);

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          <span className="flex items-center gap-3">
            <item.icon size={16} />
            {item.label}
          </span>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {open && (
          <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
            {item.children.map((child) => (
              <NavLink
                key={child.path}
                to={child.path}
                className={({ isActive }) =>
                  clsx('flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                    isActive ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white')
                }
              >
                {child.icon && <child.icon size={13} />}
                {child.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      className={({ isActive }) =>
        clsx('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
          isActive ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white')
      }
    >
      <item.icon size={16} />
      {item.label}
    </NavLink>
  );
}

export default function Sidebar() {
  return (
    <aside className="w-60 bg-sidebar flex flex-col flex-shrink-0 overflow-hidden">
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <BarChart3 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm leading-none">LLANA</h1>
            <p className="text-gray-400 text-xs mt-0.5">Sistema Financeiro</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {menu.map((item, i) => <MenuItem key={i} item={item} />)}
      </nav>
      <div className="p-3 border-t border-white/10">
        <p className="text-gray-500 text-xs text-center">v1.0.0 · Reforma Tributária Ready</p>
      </div>
    </aside>
  );
}
