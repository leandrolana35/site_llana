import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, FileText, DollarSign, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { fmt } from '../../utils/formatters';

const statusCores = { RASCUNHO: 'badge-gray', ENVIADA: 'badge-yellow', AUTORIZADA: 'badge-green', CANCELADA: 'badge-red' };
const statusLabels = { RASCUNHO: 'Rascunho', ENVIADA: 'Enviada', AUTORIZADA: 'Autorizada', CANCELADA: 'Cancelada' };

export default function NFSePage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [modalTitulo, setModalTitulo] = useState(null);
  const [filtros, setFiltros] = useState({ status: '', dataInicio: '', dataFim: '' });
  const [form, setForm] = useState({
    pessoaId: '', dataCompetencia: new Date().toISOString().substring(0, 7),
    discriminacao: '', codigoServico: '', valorServico: '', deducoes: '',
    retidoFonte: false, observacao: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['nfse', filtros],
    queryFn: () => api.get('/nfse', { params: filtros }).then(r => r.data),
  });

  const { data: pessoas = [] } = useQuery({
    queryKey: ['pessoas-clientes'],
    queryFn: () => api.get('/pessoas', { params: { cliente: true, limit: 500 } }).then(r => r.data.data),
  });

  const { data: configTrib } = useQuery({
    queryKey: ['config-tributaria'],
    queryFn: () => api.get('/configuracoes/tributaria').then(r => r.data),
  });

  const criar = useMutation({
    mutationFn: (dados) => api.post('/nfse', dados),
    onSuccess: () => { qc.invalidateQueries(['nfse']); setModal(false); toast.success('NFS-e criada!'); },
    onError: (e) => toast.error(e.response?.data?.error || 'Erro'),
  });

  const cancelar = useMutation({
    mutationFn: ({ id, motivo }) => api.post(`/nfse/${id}/cancelar`, { motivo }),
    onSuccess: () => { qc.invalidateQueries(['nfse']); toast.success('NFS-e cancelada'); },
  });

  const gerarTitulo = useMutation({
    mutationFn: ({ id, dados }) => api.post(`/nfse/${id}/gerar-titulo`, dados),
    onSuccess: () => {
      qc.invalidateQueries(['contas-receber']);
      setModalTitulo(null);
      toast.success('Título a receber gerado!');
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Erro'),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    criar.mutate({
      ...form,
      dataCompetencia: `${form.dataCompetencia}-01`,
      valorServico: Number(form.valorServico),
      deducoes: Number(form.deducoes || 0),
    });
  };

  // Cálculo preview de tributos
  const valServ = Number(form.valorServico || 0);
  const deduc = Number(form.deducoes || 0);
  const base = valServ - deduc;
  const iss = base * Number(configTrib?.aliquotaIss || 2) / 100;
  const liq = form.retidoFonte ? valServ - iss : valServ;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">NFS-e — Nota Fiscal de Serviço</h1>
          <p className="text-sm text-gray-500">Emissão de notas fiscais de serviço eletrônicas · São Paulo-SP</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary">
          <Plus size={16} /> Nova NFS-e
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <select className="input w-auto py-1.5" value={filtros.status}
            onChange={e => setFiltros(f => ({ ...f, status: e.target.value }))}>
            <option value="">Todos os status</option>
            {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input type="date" className="input w-auto py-1.5" value={filtros.dataInicio}
            onChange={e => setFiltros(f => ({ ...f, dataInicio: e.target.value }))} />
          <input type="date" className="input w-auto py-1.5" value={filtros.dataFim}
            onChange={e => setFiltros(f => ({ ...f, dataFim: e.target.value }))} />
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              {['Nº', 'Competência', 'Cliente', 'Serviço', 'ISS', 'Valor Líq.', 'Status', 'Ações'].map(h => (
                <th key={h} className="table-header">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={8} className="text-center py-8 text-gray-400">Carregando...</td></tr>}
            {!isLoading && !data?.data?.length && (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">Nenhuma NFS-e encontrada</td></tr>
            )}
            {data?.data?.map((n) => (
              <tr key={n.id} className="hover:bg-gray-50 transition-colors">
                <td className="table-cell font-bold text-primary-600">#{n.numero}</td>
                <td className="table-cell text-gray-600">{fmt.data(n.dataCompetencia)?.substring(3)}</td>
                <td className="table-cell">
                  <p className="font-medium">{n.pessoa?.razaoSocial || n.pessoa?.nome}</p>
                  <p className="text-xs text-gray-500">{n.pessoa?.cnpj ? fmt.cnpj(n.pessoa.cnpj) : fmt.cpf(n.pessoa?.cpf)}</p>
                </td>
                <td className="table-cell max-w-xs">
                  <p className="truncate text-sm text-gray-700">{n.discriminacao}</p>
                  {n.codigoServico && <p className="text-xs text-gray-400">Cód: {n.codigoServico}</p>}
                </td>
                <td className="table-cell text-sm">
                  <p>{fmt.percentual(n.aliquotaIss)}</p>
                  <p className="text-xs text-gray-500">{fmt.moeda(n.valorIss)}</p>
                </td>
                <td className="table-cell font-semibold text-green-700">{fmt.moeda(n.valorLiquido)}</td>
                <td className="table-cell">
                  <span className={statusCores[n.status]}>{statusLabels[n.status]}</span>
                </td>
                <td className="table-cell">
                  <div className="flex gap-1">
                    <button onClick={() => setModalTitulo(n)} className="btn-sm btn-secondary" title="Gerar Título">
                      <DollarSign size={12} />
                    </button>
                    {n.status !== 'CANCELADA' && (
                      <button
                        onClick={() => {
                          const motivo = prompt('Motivo do cancelamento:');
                          if (motivo) cancelar.mutate({ id: n.id, motivo });
                        }}
                        className="btn-ghost btn-sm text-red-500" title="Cancelar NFS-e"
                      >
                        <XCircle size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Nova NFS-e */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">Nova NFS-e</h2>
              <button onClick={() => setModal(false)} className="btn-ghost p-1"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Cliente *</label>
                  <select className="input" value={form.pessoaId} onChange={e => set('pessoaId', e.target.value)} required>
                    <option value="">Selecionar cliente...</option>
                    {pessoas.map(p => <option key={p.id} value={p.id}>{p.razaoSocial || p.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Competência *</label>
                  <input className="input" type="month" value={form.dataCompetencia}
                    onChange={e => set('dataCompetencia', e.target.value)} required />
                </div>
                <div>
                  <label className="label">Código do Serviço (LC 116)</label>
                  <input className="input" placeholder="Ex: 01.01" value={form.codigoServico}
                    onChange={e => set('codigoServico', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="label">Discriminação do Serviço *</label>
                  <textarea className="input resize-none h-24" value={form.discriminacao}
                    onChange={e => set('discriminacao', e.target.value)} required
                    placeholder="Descreva detalhadamente os serviços prestados..." />
                </div>
                <div>
                  <label className="label">Valor do Serviço (R$) *</label>
                  <input className="input" type="number" step="0.01" min="0.01" value={form.valorServico}
                    onChange={e => set('valorServico', e.target.value)} required />
                </div>
                <div>
                  <label className="label">Deduções (R$)</label>
                  <input className="input" type="number" step="0.01" min="0" value={form.deducoes}
                    onChange={e => set('deducoes', e.target.value)} />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="retido" checked={form.retidoFonte}
                  onChange={e => set('retidoFonte', e.target.checked)} className="rounded" />
                <label htmlFor="retido" className="text-sm text-gray-700">ISS Retido na Fonte</label>
              </div>

              {/* Preview cálculo */}
              {valServ > 0 && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <h3 className="text-sm font-semibold text-blue-900 mb-3">Preview Tributário</h3>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-blue-700">Valor Bruto</p>
                      <p className="font-semibold text-blue-900">{fmt.moeda(valServ)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-700">ISS ({fmt.percentual(configTrib?.aliquotaIss || 2)})</p>
                      <p className="font-semibold text-blue-900">{fmt.moeda(iss)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-700">Valor Líquido</p>
                      <p className="font-bold text-green-700">{fmt.moeda(liq)}</p>
                    </div>
                  </div>
                  {configTrib?.preparadoReformaTrib && (
                    <p className="text-xs text-blue-600 mt-2">
                      ✓ Sistema preparado para Reforma Tributária (CBS/IBS)
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="label">Observações</label>
                <textarea className="input resize-none h-16" value={form.observacao}
                  onChange={e => set('observacao', e.target.value)} />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={criar.isPending} className="btn-primary">
                  {criar.isPending ? 'Criando...' : 'Criar NFS-e'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Gerar Título */}
      {modalTitulo && (
        <ModalGerarTitulo nota={modalTitulo}
          onClose={() => setModalTitulo(null)}
          onSalvar={(dados) => gerarTitulo.mutate({ id: modalTitulo.id, dados })}
          loading={gerarTitulo.isPending} />
      )}
    </div>
  );
}

function ModalGerarTitulo({ nota, onClose, onSalvar, loading }) {
  const [form, setForm] = useState({
    dataVencimento: new Date().toISOString().substring(0, 10),
    contaBancariaId: '', planoContasId: '', centroCustoId: '',
  });

  const { data: contas = [] } = useQuery({
    queryKey: ['contas-bancarias-select'],
    queryFn: () => api.get('/contas-bancarias').then(r => r.data),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-gray-900">Gerar Título a Receber</h2>
          <button onClick={onClose} className="btn-ghost p-1"><X size={18} /></button>
        </div>
        <div className="p-5">
          <p className="text-sm text-gray-600 mb-4">NFS-e #{nota.numero} · {fmt.moeda(nota.valorLiquido)}</p>
          <div className="space-y-3">
            <div>
              <label className="label">Data de Vencimento *</label>
              <input className="input" type="date" value={form.dataVencimento}
                onChange={e => setForm(f => ({ ...f, dataVencimento: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Conta Bancária</label>
              <select className="input" value={form.contaBancariaId}
                onChange={e => setForm(f => ({ ...f, contaBancariaId: e.target.value }))}>
                <option value="">Selecionar...</option>
                {contas.map(c => <option key={c.id} value={c.id}>{c.descricao}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-5">
            <button onClick={onClose} className="btn-secondary">Cancelar</button>
            <button onClick={() => onSalvar(form)} disabled={loading} className="btn-primary">
              <DollarSign size={14} />
              {loading ? 'Gerando...' : 'Gerar Título'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
