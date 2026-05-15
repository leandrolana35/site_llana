import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Play, Pause, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { fmt } from '../../utils/formatters';

const periodicidadeLabels = {
  DIARIO: 'Diário', SEMANAL: 'Semanal', QUINZENAL: 'Quinzenal',
  MENSAL: 'Mensal', BIMESTRAL: 'Bimestral', TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral', ANUAL: 'Anual',
};

const defaultForm = {
  tipo: 'PAGAR', descricao: '', valor: '', periodicidade: 'MENSAL',
  diaVencimento: 5, dataInicio: new Date().toISOString().substring(0, 10),
  dataFim: '', totalOcorrencias: '',
};

export default function RecorrentesPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [gerandoId, setGerandoId] = useState(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ['recorrentes'],
    queryFn: () => api.get('/lancamentos-recorrentes').then(r => r.data),
  });

  const salvar = useMutation({
    mutationFn: (dados) => api.post('/lancamentos-recorrentes', dados),
    onSuccess: () => {
      qc.invalidateQueries(['recorrentes']);
      setModal(false); setForm(defaultForm);
      toast.success('Recorrente criado!');
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Erro'),
  });

  const gerar = useMutation({
    mutationFn: ({ id }) => api.post(`/lancamentos-recorrentes/${id}/gerar`, {
      competenciaAte: new Date().toISOString(),
    }),
    onSuccess: (res) => {
      qc.invalidateQueries(['contas-receber']);
      qc.invalidateQueries(['contas-pagar']);
      toast.success(`${res.data.gerados} lançamento(s) gerado(s)!`);
      setGerandoId(null);
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Erro'),
  });

  const desativar = useMutation({
    mutationFn: (id) => api.delete(`/lancamentos-recorrentes/${id}`),
    onSuccess: () => { qc.invalidateQueries(['recorrentes']); toast.success('Desativado'); },
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    salvar.mutate({
      ...form,
      valor: Number(String(form.valor).replace(',', '.')),
      diaVencimento: Number(form.diaVencimento),
      totalOcorrencias: form.totalOcorrencias ? Number(form.totalOcorrencias) : null,
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Lançamentos Recorrentes</h1>
          <p className="text-sm text-gray-500">Automatize despesas e receitas periódicas</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary">
          <Plus size={16} /> Novo Recorrente
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              {['Descrição', 'Tipo', 'Valor', 'Periodicidade', 'Dia Vto', 'Início', 'Gerados', 'Status', 'Ações'].map(h => (
                <th key={h} className="table-header">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={9} className="text-center py-8 text-gray-400">Carregando...</td></tr>}
            {!isLoading && !data.length && (
              <tr><td colSpan={9} className="text-center py-8 text-gray-400">Nenhum recorrente cadastrado</td></tr>
            )}
            {data.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                <td className="table-cell font-medium">{r.descricao}</td>
                <td className="table-cell">
                  <span className={r.tipo === 'RECEBER' ? 'badge-green' : 'badge-red'}>
                    {r.tipo === 'RECEBER' ? 'Receber' : 'Pagar'}
                  </span>
                </td>
                <td className="table-cell font-semibold">{fmt.moeda(r.valor)}</td>
                <td className="table-cell text-gray-600">{periodicidadeLabels[r.periodicidade]}</td>
                <td className="table-cell text-center text-gray-600">Dia {r.diaVencimento}</td>
                <td className="table-cell text-gray-600">{fmt.data(r.dataInicio)}</td>
                <td className="table-cell text-center text-gray-600">
                  {r.ocorrenciasGeradas}{r.totalOcorrencias ? `/${r.totalOcorrencias}` : ''}
                </td>
                <td className="table-cell">
                  <span className={r.ativo ? 'badge-green' : 'badge-gray'}>
                    {r.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="table-cell">
                  <div className="flex gap-1">
                    {r.ativo && (
                      <button
                        onClick={() => { setGerandoId(r.id); gerar.mutate({ id: r.id }); }}
                        disabled={gerar.isPending && gerandoId === r.id}
                        className="btn-sm btn-primary"
                        title="Gerar lançamentos pendentes"
                      >
                        <Play size={12} />
                        {gerar.isPending && gerandoId === r.id ? '...' : 'Gerar'}
                      </button>
                    )}
                    {r.ativo && (
                      <button
                        onClick={() => { if (confirm('Desativar este recorrente?')) desativar.mutate(r.id); }}
                        className="btn-ghost btn-sm text-red-500"
                      >
                        <Pause size={12} />
                      </button>
                    )}
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
              <h2 className="text-lg font-bold">Novo Lançamento Recorrente</h2>
              <button onClick={() => setModal(false)} className="btn-ghost p-1"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Descrição *</label>
                  <input className="input" value={form.descricao} onChange={e => set('descricao', e.target.value)} required />
                </div>
                <div>
                  <label className="label">Tipo *</label>
                  <select className="input" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                    <option value="RECEBER">A Receber</option>
                    <option value="PAGAR">A Pagar</option>
                  </select>
                </div>
                <div>
                  <label className="label">Valor (R$) *</label>
                  <input className="input" type="number" step="0.01" value={form.valor}
                    onChange={e => set('valor', e.target.value)} required />
                </div>
                <div>
                  <label className="label">Periodicidade *</label>
                  <select className="input" value={form.periodicidade} onChange={e => set('periodicidade', e.target.value)}>
                    {Object.entries(periodicidadeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Dia do Vencimento *</label>
                  <input className="input" type="number" min="1" max="31" value={form.diaVencimento}
                    onChange={e => set('diaVencimento', e.target.value)} required />
                </div>
                <div>
                  <label className="label">Data de Início *</label>
                  <input className="input" type="date" value={form.dataInicio}
                    onChange={e => set('dataInicio', e.target.value)} required />
                </div>
                <div>
                  <label className="label">Data de Fim</label>
                  <input className="input" type="date" value={form.dataFim}
                    onChange={e => set('dataFim', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="label">Nº máx. de ocorrências (deixe em branco = indeterminado)</label>
                  <input className="input" type="number" min="1" value={form.totalOcorrencias}
                    onChange={e => set('totalOcorrencias', e.target.value)} />
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
