import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, CheckCircle, XCircle, Filter, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { fmt, statusCores, statusLabels, origemLabels } from '../../utils/formatters';
import ModalLancamento from '../../components/forms/ModalLancamento';
import ModalBaixa from '../../components/forms/ModalBaixa';

export default function ContasReceberPage() {
  const qc = useQueryClient();
  const [filtros, setFiltros] = useState({ status: 'ABERTO,VENCIDO', busca: '', dataInicio: '', dataFim: '' });
  const [modalLanc, setModalLanc] = useState(false);
  const [modalBaixa, setModalBaixa] = useState(null);
  const [editando, setEditando] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['contas-receber', filtros],
    queryFn: () => api.get('/contas-receber', { params: filtros }).then(r => r.data),
  });

  const { data: resumo } = useQuery({
    queryKey: ['contas-receber-resumo'],
    queryFn: () => api.get('/contas-receber/resumo').then(r => r.data),
  });

  const salvar = useMutation({
    mutationFn: (dados) => editando
      ? api.put(`/contas-receber/${editando.id}`, dados)
      : api.post('/contas-receber', dados),
    onSuccess: () => {
      qc.invalidateQueries(['contas-receber']);
      qc.invalidateQueries(['contas-receber-resumo']);
      qc.invalidateQueries(['dashboard']);
      setModalLanc(false); setEditando(null);
      toast.success(editando ? 'Atualizado!' : 'Lançamento criado!');
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Erro ao salvar'),
  });

  const baixar = useMutation({
    mutationFn: ({ id, dados }) => api.post(`/contas-receber/${id}/receber`, dados),
    onSuccess: () => {
      qc.invalidateQueries(['contas-receber']);
      qc.invalidateQueries(['dashboard']);
      setModalBaixa(null);
      toast.success('Baixa registrada!');
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Erro ao registrar baixa'),
  });

  const cancelar = useMutation({
    mutationFn: (id) => api.delete(`/contas-receber/${id}`),
    onSuccess: () => { qc.invalidateQueries(['contas-receber']); toast.success('Cancelado'); },
  });

  const hoje = new Date();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Contas a Receber</h1>
          <p className="text-sm text-gray-500">Gerencie seus títulos a receber</p>
        </div>
        <button onClick={() => { setEditando(null); setModalLanc(true); }} className="btn-primary">
          <Plus size={16} /> Novo Lançamento
        </button>
      </div>

      {/* Resumo */}
      {resumo && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total em Aberto', valor: resumo.abertos._sum?.valor, count: resumo.abertos._count, cor: 'blue' },
            { label: 'Vencidos', valor: resumo.vencidos._sum?.valor, count: resumo.vencidos._count, cor: 'red' },
            { label: 'A Vencer (mês)', valor: resumo.aVencerMes._sum?.valor, count: resumo.aVencerMes._count, cor: 'yellow' },
            { label: 'Recebido (mês)', valor: resumo.recebidosMes._sum?.valorPago, count: resumo.recebidosMes._count, cor: 'green' },
          ].map(({ label, valor, count, cor }) => (
            <div key={label} className="card p-4">
              <p className="text-xs text-gray-500 font-medium">{label}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{fmt.moeda(valor)}</p>
              <p className="text-xs text-gray-400">{count || 0} título(s)</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-48 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9 py-1.5"
              placeholder="Buscar por descrição ou documento..."
              value={filtros.busca}
              onChange={e => setFiltros(f => ({ ...f, busca: e.target.value }))}
            />
          </div>
          <select
            className="input w-auto py-1.5"
            value={filtros.status}
            onChange={e => setFiltros(f => ({ ...f, status: e.target.value }))}
          >
            <option value="">Todos os status</option>
            <option value="ABERTO,VENCIDO">Em aberto</option>
            <option value="ABERTO">Aberto</option>
            <option value="PAGO">Pago</option>
            <option value="PARCIAL">Parcial</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
          <input type="date" className="input w-auto py-1.5" value={filtros.dataInicio}
            onChange={e => setFiltros(f => ({ ...f, dataInicio: e.target.value }))}
          />
          <input type="date" className="input w-auto py-1.5" value={filtros.dataFim}
            onChange={e => setFiltros(f => ({ ...f, dataFim: e.target.value }))}
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {['Descrição / Pessoa', 'Competência', 'Vencimento', 'Origem', 'Status', 'Valor', 'Ações'].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Carregando...</td></tr>
              )}
              {!isLoading && !data?.data?.length && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Nenhum lançamento encontrado</td></tr>
              )}
              {data?.data?.map((c) => {
                const vencido = c.status === 'ABERTO' && new Date(c.dataVencimento) < hoje;
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell">
                      <p className="font-medium text-gray-900">{c.descricao}</p>
                      {c.pessoa && (
                        <p className="text-xs text-gray-500">
                          {c.pessoa.razaoSocial || c.pessoa.nome}
                        </p>
                      )}
                    </td>
                    <td className="table-cell text-gray-600">{fmt.data(c.competencia)}</td>
                    <td className="table-cell">
                      <span className={vencido ? 'text-red-600 font-medium' : 'text-gray-900'}>
                        {fmt.data(c.dataVencimento)}
                      </span>
                    </td>
                    <td className="table-cell text-gray-500 text-xs">{origemLabels[c.origem] || c.origem}</td>
                    <td className="table-cell">
                      <span className={statusCores[vencido ? 'VENCIDO' : c.status]}>
                        {statusLabels[vencido ? 'VENCIDO' : c.status]}
                      </span>
                    </td>
                    <td className="table-cell font-semibold text-green-700">{fmt.moeda(c.valor)}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        {['ABERTO', 'PARCIAL'].includes(c.status) && (
                          <button
                            onClick={() => setModalBaixa(c)}
                            className="btn-sm btn-primary"
                            title="Registrar Recebimento"
                          >
                            <CheckCircle size={13} /> Receber
                          </button>
                        )}
                        <button onClick={() => { setEditando(c); setModalLanc(true); }}
                          className="btn-sm btn-secondary">Editar</button>
                        {c.status !== 'CANCELADO' && (
                          <button
                            onClick={() => { if (confirm('Cancelar este lançamento?')) cancelar.mutate(c.id); }}
                            className="btn-ghost btn-sm text-red-500">
                            <XCircle size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {data?.total > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
            {data.total} registro(s) encontrado(s)
          </div>
        )}
      </div>

      {modalLanc && (
        <ModalLancamento
          tipo="RECEBER"
          dados={editando}
          onClose={() => { setModalLanc(false); setEditando(null); }}
          onSalvar={salvar.mutate}
          loading={salvar.isPending}
        />
      )}
      {modalBaixa && (
        <ModalBaixa
          titulo={modalBaixa}
          tipo="receber"
          onClose={() => setModalBaixa(null)}
          onSalvar={(dados) => baixar.mutate({ id: modalBaixa.id, dados })}
          loading={baixar.isPending}
        />
      )}
    </div>
  );
}
