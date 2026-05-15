import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const tipoLabels = { ATIVO: 'Ativo', PASSIVO: 'Passivo', PATRIMONIO: 'Patrimônio', RECEITA: 'Receita', DESPESA: 'Despesa', CUSTOS: 'Custos' };
const tipoCores = { ATIVO: 'badge-blue', PASSIVO: 'badge-red', PATRIMONIO: 'badge-gray', RECEITA: 'badge-green', DESPESA: 'badge-red', CUSTOS: 'badge-yellow' };

export default function PlanoContasPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ codigo: '', descricao: '', tipo: 'DESPESA', natureza: 'DEVEDORA', aceitaLancamento: true, contaPaiId: '' });
  const [editando, setEditando] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('');

  const { data: contas = [], isLoading } = useQuery({
    queryKey: ['plano-contas', filtroTipo],
    queryFn: () => api.get('/plano-contas', { params: filtroTipo ? { tipo: filtroTipo } : {} }).then(r => r.data),
  });

  const salvar = useMutation({
    mutationFn: (dados) => editando
      ? api.put(`/plano-contas/${editando.id}`, dados)
      : api.post('/plano-contas', dados),
    onSuccess: () => {
      qc.invalidateQueries(['plano-contas']);
      setModal(false); setEditando(null);
      toast.success(editando ? 'Atualizado!' : 'Conta criada!');
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Erro'),
  });

  const desativar = useMutation({
    mutationFn: (id) => api.delete(`/plano-contas/${id}`),
    onSuccess: () => { qc.invalidateQueries(['plano-contas']); toast.success('Conta desativada'); },
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Plano de Contas</h1>
          <p className="text-sm text-gray-500">Estrutura contábil da empresa</p>
        </div>
        <button onClick={() => { setEditando(null); setForm({ codigo: '', descricao: '', tipo: 'DESPESA', natureza: 'DEVEDORA', aceitaLancamento: true, contaPaiId: '' }); setModal(true); }} className="btn-primary">
          <Plus size={16} /> Nova Conta
        </button>
      </div>

      <div className="card p-4 flex gap-3">
        <select className="input w-auto py-1.5" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
          <option value="">Todas</option>
          {Object.entries(tipoLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              {['Código', 'Descrição', 'Tipo', 'Natureza', 'Lançamento', 'Ações'].map(h => (
                <th key={h} className="table-header">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="text-center py-8 text-gray-400">Carregando...</td></tr>}
            {contas.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="table-cell font-mono text-sm font-semibold text-gray-700">{c.codigo}</td>
                <td className="table-cell">
                  <span style={{ paddingLeft: `${(c.nivel - 1) * 16}px` }} className="flex items-center gap-1">
                    {c.nivel > 1 && <ChevronRight size={12} className="text-gray-400" />}
                    {c.descricao}
                  </span>
                </td>
                <td className="table-cell"><span className={tipoCores[c.tipo]}>{tipoLabels[c.tipo]}</span></td>
                <td className="table-cell text-sm text-gray-600">{c.natureza === 'DEVEDORA' ? 'Devedora' : 'Credora'}</td>
                <td className="table-cell">
                  <span className={c.aceitaLancamento ? 'badge-green' : 'badge-gray'}>
                    {c.aceitaLancamento ? 'Sim' : 'Não'}
                  </span>
                </td>
                <td className="table-cell">
                  <div className="flex gap-1">
                    <button onClick={() => { setEditando(c); setForm({ codigo: c.codigo, descricao: c.descricao, tipo: c.tipo, natureza: c.natureza, aceitaLancamento: c.aceitaLancamento, contaPaiId: c.contaPaiId || '' }); setModal(true); }}
                      className="btn-sm btn-secondary">Editar</button>
                    <button onClick={() => { if (confirm('Desativar?')) desativar.mutate(c.id); }}
                      className="btn-ghost btn-sm text-red-500"><X size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">{editando ? 'Editar' : 'Nova'} Conta Contábil</h2>
              <button onClick={() => setModal(false)} className="btn-ghost p-1"><X size={20} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); salvar.mutate(form); }} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Código *</label>
                  <input className="input font-mono" placeholder="1.1.1.01" value={form.codigo}
                    onChange={e => set('codigo', e.target.value)} required />
                </div>
                <div>
                  <label className="label">Tipo *</label>
                  <select className="input" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                    {Object.entries(tipoLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label">Descrição *</label>
                  <input className="input" value={form.descricao} onChange={e => set('descricao', e.target.value)} required />
                </div>
                <div>
                  <label className="label">Natureza</label>
                  <select className="input" value={form.natureza} onChange={e => set('natureza', e.target.value)}>
                    <option value="DEVEDORA">Devedora</option>
                    <option value="CREDORA">Credora</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input type="checkbox" id="aceita" checked={form.aceitaLancamento}
                    onChange={e => set('aceitaLancamento', e.target.checked)} className="rounded" />
                  <label htmlFor="aceita" className="text-sm text-gray-700">Aceita lançamentos</label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={salvar.isPending} className="btn-primary">
                  {salvar.isPending ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
