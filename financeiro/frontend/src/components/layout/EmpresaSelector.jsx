import { useQuery } from '@tanstack/react-query';
import { Building2, Plus, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function EmpresaSelector() {
  const navigate = useNavigate();
  const { setEmpresa } = useAuthStore();

  const { data: empresas = [], isLoading } = useQuery({
    queryKey: ['empresas'],
    queryFn: () => api.get('/empresas').then(r => r.data),
  });

  const selecionar = (empresa) => {
    setEmpresa(empresa.id, empresa);
    navigate('/');
  };

  if (isLoading) return <div className="text-gray-500">Carregando...</div>;

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BarChart3 size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">LLANA Financeiro</h1>
        <p className="text-gray-500 mt-1">Selecione a empresa para continuar</p>
      </div>

      <div className="space-y-2">
        {empresas.filter(e => e.ativo).map((empresa) => (
          <button
            key={empresa.id}
            onClick={() => selecionar(empresa)}
            className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-left"
          >
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 size={20} className="text-primary-600" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">
                {empresa.nomeFantasia || empresa.razaoSocial}
              </p>
              <p className="text-xs text-gray-500">{empresa.cnpj} · {empresa.uf}</p>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => navigate('/config/empresas')}
        className="w-full mt-4 flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-primary-300 hover:text-primary-600 transition-all text-sm font-medium"
      >
        <Plus size={16} />
        Cadastrar Nova Empresa
      </button>
    </div>
  );
}
