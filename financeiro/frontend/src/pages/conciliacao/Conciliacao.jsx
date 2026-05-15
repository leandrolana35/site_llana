import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Plus, Link2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { fmt } from '../../utils/formatters';

export default function ConciliacaoPage() {
  const qc = useQueryClient();
  const [conciliacaoAtiva, setConciliacaoAtiva] = useState(null);
  const [modalNova, setModalNova] = useState(false);
  const [form, setForm] = useState({ descricao: '', contaBancariaId: '', dataInicio: '', dataFim: '', saldoInicial: '', saldoFinal: '' });
  const [uploading, setUploading] = useState(false);

  const { data: conciliacoes = [] } = useQuery({
    queryKey: ['conciliacoes'],
    queryFn: () => api.get('/conciliacao').then(r => r.data),
  });

  const { data: contas = [] } = useQuery({
    queryKey: ['contas-bancarias'],
    queryFn: () => api.get('/contas-bancarias').then(r => r.data),
  });

  const { data: extratos = [] } = useQuery({
    queryKey: ['extratos', conciliacaoAtiva?.id],
    queryFn: () => api.get(`/conciliacao/${conciliacaoAtiva.id}/extratos`).then(r => r.data),
    enabled: !!conciliacaoAtiva,
  });

  const criar = useMutation({
    mutationFn: (dados) => api.post('/conciliacao', dados),
    onSuccess: (res) => {
      qc.invalidateQueries(['conciliacoes']);
      setConciliacaoAtiva(res.data);
      setModalNova(false);
      toast.success('Conciliação criada!');
    },
  });

  const importarXLSX = async (e) => {
    const file = e.target.files[0];
    if (!file || !conciliacaoAtiva) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('arquivo', file);
      const { data } = await api.post(`/conciliacao/${conciliacaoAtiva.id}/importar-xlsx`, fd);
      qc.invalidateQueries(['extratos', conciliacaoAtiva.id]);
      toast.success(`${data.importados} lançamentos importados!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao importar');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const importarOFX = async (e) => {
    const file = e.target.files[0];
    if (!file || !conciliacaoAtiva) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('arquivo', file);
      const { data } = await api.post(`/conciliacao/${conciliacaoAtiva.id}/importar-ofx`, fd);
      qc.invalidateQueries(['extratos', conciliacaoAtiva.id]);
      toast.success(`${data.importados} lançamentos importados!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao importar OFX');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCriar = (e) => {
    e.preventDefault();
    criar.mutate({
      ...form,
      saldoInicial: Number(form.saldoInicial),
      saldoFinal: Number(form.saldoFinal),
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Conciliação Bancária</h1>
          <p className="text-sm text-gray-500">Importe extratos e concilie com seus lançamentos</p>
        </div>
        <button onClick={() => setModalNova(true)} className="btn-primary">
          <Plus size={16} /> Nova Conciliação
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Lista de conciliações */}
        <div className="lg:col-span-1 space-y-2">
          <h2 className="text-sm font-semibold text-gray-700">Conciliações</h2>
          {conciliacoes.map((c) => (
            <button
              key={c.id}
              onClick={() => setConciliacaoAtiva(c)}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                conciliacaoAtiva?.id === c.id
                  ? 'border-primary-300 bg-primary-50'
                  : 'border-gray-200 bg-white hover:border-primary-200'
              }`}
            >
              <p className="text-sm font-medium text-gray-900 truncate">{c.descricao}</p>
              <p className="text-xs text-gray-500 mt-1">
                {c.contaBancaria?.descricao}
              </p>
              <p className="text-xs text-gray-400">
                {fmt.data(c.dataInicio)} a {fmt.data(c.dataFim)}
              </p>
              <span className={`mt-1 badge ${c.status === 'CONCLUIDA' ? 'badge-green' : 'badge-yellow'}`}>
                {c.status === 'CONCLUIDA' ? 'Concluída' : 'Em andamento'}
              </span>
            </button>
          ))}
          {!conciliacoes.length && (
            <p className="text-sm text-gray-400 text-center py-8">Nenhuma conciliação</p>
          )}
        </div>

        {/* Área principal */}
        <div className="lg:col-span-3 space-y-4">
          {conciliacaoAtiva ? (
            <>
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-gray-900">{conciliacaoAtiva.descricao}</h2>
                  <div className="flex gap-2">
                    <label className={`btn-secondary cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
                      <Upload size={14} />
                      {uploading ? 'Importando...' : 'Importar XLSX'}
                      <input type="file" className="hidden" accept=".xlsx,.xls" onChange={importarXLSX} disabled={uploading} />
                    </label>
                    <label className={`btn-secondary cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
                      <Upload size={14} />
                      Importar OFX
                      <input type="file" className="hidden" accept=".ofx,.txt" onChange={importarOFX} disabled={uploading} />
                    </label>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Formatos suportados: XLSX (planilha com colunas Data, Histórico, Valor), OFX (arquivo bancário padrão)
                </p>
              </div>

              <div className="card overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Lançamentos do Extrato ({extratos.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        {['Data', 'Histórico', 'Documento', 'Tipo', 'Valor', 'Conciliado'].map(h => (
                          <th key={h} className="table-header">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {!extratos.length && (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-gray-400">
                            <Upload size={32} className="mx-auto mb-2 text-gray-300" />
                            <p>Importe um extrato bancário para começar</p>
                          </td>
                        </tr>
                      )}
                      {extratos.map((e) => (
                        <tr key={e.id} className={`hover:bg-gray-50 transition-colors ${e.conciliado ? 'bg-green-50' : ''}`}>
                          <td className="table-cell text-gray-600">{fmt.data(e.data)}</td>
                          <td className="table-cell max-w-xs">
                            <p className="truncate text-sm">{e.historico}</p>
                          </td>
                          <td className="table-cell text-xs text-gray-500">{e.documento || '-'}</td>
                          <td className="table-cell">
                            <span className={e.tipo === 'CREDITO' ? 'badge-green' : 'badge-red'}>
                              {e.tipo === 'CREDITO' ? 'Crédito' : 'Débito'}
                            </span>
                          </td>
                          <td className={`table-cell font-semibold ${e.tipo === 'CREDITO' ? 'text-green-700' : 'text-red-700'}`}>
                            {fmt.moeda(e.valor)}
                          </td>
                          <td className="table-cell">
                            {e.conciliado
                              ? <span className="badge-green">✓ Conciliado</span>
                              : <span className="badge-gray">Pendente</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="card p-12 text-center text-gray-400">
              <Link2 size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="font-medium">Selecione uma conciliação ou crie uma nova</p>
              <p className="text-sm mt-1">Importe extratos via XLSX ou OFX</p>
            </div>
          )}
        </div>
      </div>

      {modalNova && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">Nova Conciliação Bancária</h2>
              <button onClick={() => setModalNova(false)} className="btn-ghost p-1"><X size={20} /></button>
            </div>
            <form onSubmit={handleCriar} className="p-6 space-y-4">
              <div>
                <label className="label">Descrição *</label>
                <input className="input" placeholder="Ex: Bradesco CC jan/2025" value={form.descricao}
                  onChange={e => set('descricao', e.target.value)} required />
              </div>
              <div>
                <label className="label">Conta Bancária *</label>
                <select className="input" value={form.contaBancariaId} onChange={e => set('contaBancariaId', e.target.value)} required>
                  <option value="">Selecionar...</option>
                  {contas.map(c => <option key={c.id} value={c.id}>{c.descricao}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Data Início *</label>
                  <input className="input" type="date" value={form.dataInicio}
                    onChange={e => set('dataInicio', e.target.value)} required />
                </div>
                <div>
                  <label className="label">Data Fim *</label>
                  <input className="input" type="date" value={form.dataFim}
                    onChange={e => set('dataFim', e.target.value)} required />
                </div>
                <div>
                  <label className="label">Saldo Inicial (R$)</label>
                  <input className="input" type="number" step="0.01" value={form.saldoInicial}
                    onChange={e => set('saldoInicial', e.target.value)} />
                </div>
                <div>
                  <label className="label">Saldo Final (R$)</label>
                  <input className="input" type="number" step="0.01" value={form.saldoFinal}
                    onChange={e => set('saldoFinal', e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t">
                <button type="button" onClick={() => setModalNova(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={criar.isPending} className="btn-primary">
                  {criar.isPending ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
