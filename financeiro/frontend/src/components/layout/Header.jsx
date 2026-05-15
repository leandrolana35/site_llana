import { Bell, ChevronDown, LogOut, Building2, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';

export default function Header() {
  const { usuario, empresaSelecionada, logout } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        {empresaSelecionada && (
          <div className="flex items-center gap-2 text-sm">
            <Building2 size={14} className="text-gray-400" />
            <span className="font-medium text-gray-700">
              {empresaSelecionada.nomeFantasia || empresaSelecionada.razaoSocial}
            </span>
            <button
              onClick={() => navigate('/empresas')}
              className="text-primary-600 hover:text-primary-700 text-xs underline ml-1"
            >
              Trocar
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell size={18} />
        </button>

        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center">
              <User size={14} className="text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">{usuario?.nome?.split(' ')[0]}</span>
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-50">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{usuario?.nome}</p>
                <p className="text-xs text-gray-500">{usuario?.email}</p>
              </div>
              <button
                onClick={() => { logout(); navigate('/login'); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={14} />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
