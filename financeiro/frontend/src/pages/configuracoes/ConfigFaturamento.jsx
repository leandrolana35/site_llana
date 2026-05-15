import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function ConfigFaturamentoPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({});

  const { data: config, isLoading } = useQuery({
    queryKey: ['config-faturamento'],
    queryFn: () => api.get('/configuracoes/faturamento').then(r => r.data),
  });

  useEffect(() => { if (config) setForm(config); }, [config]);

  const salvar = useMutation({
    mutationFn: (dados) => api.put('/configuracoes/faturamento', dados),
    onSuccess: () => { qc.invalidateQueries(['config-faturamento']); toast.success('Configurações salvas!'); },
    onError: (e) => toast.error(e.response?.data?.error || 'Erro'),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  if (isLoading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-b-2 border-primary-600 rounded-full" /></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Configurações de Faturamento</h1>
        <p className="text-sm text-gray-500">Configure a emissão de notas fiscais eletrônicas</p>
      </div>

      {/* NFS-e */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">NFS-e — Nota Fiscal de Serviço Eletrônica</h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <div className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${form.emiteNFSe ? 'bg-primary-600' : 'bg-gray-200'}`}
              onClick={() => set('emiteNFSe', !form.emiteNFSe)}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.emiteNFSe ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm font-medium text-gray-700">Habilitado</span>
          </label>
        </div>

        {form.emiteNFSe && (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="label">Série NFS-e</label>
              <input className="input" value={form.serieNFSe || '1'} onChange={e => set('serieNFSe', e.target.value)} />
            </div>
            <div>
              <label className="label">Próximo Número</label>
              <input className="input" type="number" value={form.proximoNumeroNFSe || 1}
                onChange={e => set('proximoNumeroNFSe', Number(e.target.value))} />
            </div>
            <div>
              <label className="label">Ambiente</label>
              <select className="input" value={form.ambienteNFSe || 'HOMOLOGACAO'} onChange={e => set('ambienteNFSe', e.target.value)}>
                <option value="HOMOLOGACAO">Homologação (Testes)</option>
                <option value="PRODUCAO">Produção</option>
              </select>
            </div>
            <div>
              <label className="label">Código Município (IBGE)</label>
              <input className="input font-mono" value={form.codigoMunicipioNFSe || '3550308'}
                onChange={e => set('codigoMunicipioNFSe', e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">São Paulo-SP: 3550308</p>
            </div>
            <div className="col-span-2">
              <label className="label">Observação Padrão NFS-e</label>
              <textarea className="input resize-none h-16" value={form.observacaoPadraoNFSe || ''}
                onChange={e => set('observacaoPadraoNFSe', e.target.value)}
                placeholder="Texto padrão para todas as NFS-e emitidas..." />
            </div>
          </div>
        )}
      </div>

      {/* NF-e */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">NF-e — Nota Fiscal Eletrônica (Produtos)</h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <div className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${form.emiteNFe ? 'bg-primary-600' : 'bg-gray-200'}`}
              onClick={() => set('emiteNFe', !form.emiteNFe)}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.emiteNFe ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm font-medium text-gray-700">Habilitado</span>
          </label>
        </div>

        {form.emiteNFe && (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="label">Série NF-e</label>
              <input className="input" type="number" value={form.serieNFe || 1} onChange={e => set('serieNFe', Number(e.target.value))} />
            </div>
            <div>
              <label className="label">Próximo Número</label>
              <input className="input" type="number" value={form.proximoNumeroNFe || 1}
                onChange={e => set('proximoNumeroNFe', Number(e.target.value))} />
            </div>
            <div>
              <label className="label">Ambiente</label>
              <select className="input" value={form.ambienteNFe || 'HOMOLOGACAO'} onChange={e => set('ambienteNFe', e.target.value)}>
                <option value="HOMOLOGACAO">Homologação (Testes)</option>
                <option value="PRODUCAO">Produção</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Cobrança */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Cobrança</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Prazo Padrão de Vencimento (dias)</label>
            <input className="input" type="number" min="0" value={form.diasVencimentoPadrao || 30}
              onChange={e => set('diasVencimentoPadrao', Number(e.target.value))} />
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <Info size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-yellow-700">
            A emissão de boleto será habilitada em versão futura. Para integração bancária e emissão de boleto,
            configure o banco e as credenciais API no módulo de integração bancária.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={() => salvar.mutate(form)} disabled={salvar.isPending} className="btn-primary btn-lg">
          <Save size={16} />
          {salvar.isPending ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  );
}
