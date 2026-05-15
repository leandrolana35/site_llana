import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

const defaultForm = {
  descricao: '', pessoaId: '', valor: '', competencia: '', dataVencimento: '',
  planoContasId: '', centroCustoId: '', numeroDocumento: '', totalParcelas: 1,
  origem: 'AVULSO', observacao: '',
};

export default function ModalLancamento({ tipo, dados, onClose, onSalvar, loading }) {
  const [form, setForm] = useState(defaultForm);

  const { data: pessoas = [] } = useQuery({
    queryKey: ['pessoas-select', tipo],
    queryFn: () => api.get('/pessoas', {
      params: { limit: 200, [tipo === 'RECEBER' ? 'cliente' : 'fornecedor']: true }
    }).then(r => r.data.data),
  });

  const { data: planoContas = [] } = useQuery({
    queryKey: ['plano-contas-select'],
    queryFn: () => api.get('/plano-contas', { params: { aceitaLancamento: true } }).then(r => r.data),
  });

  const { data: centrosCusto = [] } = useQuery({
    queryKey: ['centros-custo-select'],
    queryFn: () => api.get('/centros-custo').then(r => r.data),
  });

  useEffect(() => {
    if (dados) {
      setForm({
        descricao: dados.descricao || '',
        pessoaId: dados.pessoaId || '',
        valor: dados.valor || '',
        competencia: dados.competencia ? dados.competencia.substring(0, 7) : '',
        dataVencimento: dados.dataVencimento ? dados.dataVencimento.substring(0, 10) : '',
        planoContasId: dados.planoContasId || '',
        centroCustoId: dados.centroCustoId || '',
        numeroDocumento: dados.numeroDocumento || '',
        totalParcelas: 1,
        origem: dados.origem || 'AVULSO',
        observacao: dados.observacao || '',
      });
    } else {
      const hoje = new Date();
      setForm({
        ...defaultForm,
        competencia: `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`,
      });
    }
  }, [dados]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      valor: Number(String(form.valor).replace(',', '.')),
      competencia: form.competencia ? `${form.competencia}-01` : undefined,
      totalParcelas: Number(form.totalParcelas),
    };
    onSalvar(payload);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold text-gray-900">
            {dados ? 'Editar' : 'Novo'} Lançamento — {tipo === 'RECEBER' ? 'Conta a Receber' : 'Conta a Pagar'}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Descrição *</label>
              <input className="input" value={form.descricao} onChange={e => set('descricao', e.target.value)} required />
            </div>

            <div className="col-span-2">
              <label className="label">{tipo === 'RECEBER' ? 'Cliente' : 'Fornecedor'}</label>
              <select className="input" value={form.pessoaId} onChange={e => set('pessoaId', e.target.value)}>
                <option value="">Selecionar...</option>
                {pessoas.map(p => (
                  <option key={p.id} value={p.id}>{p.razaoSocial || p.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Valor (R$) *</label>
              <input className="input" type="number" step="0.01" min="0.01" value={form.valor}
                onChange={e => set('valor', e.target.value)} required />
            </div>

            <div>
              <label className="label">Nº Documento</label>
              <input className="input" value={form.numeroDocumento} onChange={e => set('numeroDocumento', e.target.value)} />
            </div>

            <div>
              <label className="label">Competência *</label>
              <input className="input" type="month" value={form.competencia}
                onChange={e => set('competencia', e.target.value)} required />
            </div>

            <div>
              <label className="label">Vencimento *</label>
              <input className="input" type="date" value={form.dataVencimento}
                onChange={e => set('dataVencimento', e.target.value)} required />
            </div>

            {!dados && (
              <div>
                <label className="label">Parcelas</label>
                <input className="input" type="number" min="1" max="360" value={form.totalParcelas}
                  onChange={e => set('totalParcelas', e.target.value)} />
              </div>
            )}

            <div>
              <label className="label">Origem</label>
              <select className="input" value={form.origem} onChange={e => set('origem', e.target.value)}>
                <option value="AVULSO">Avulso</option>
                <option value="RECORRENTE">Recorrente</option>
                <option value="FATURAMENTO">Faturamento</option>
              </select>
            </div>

            <div>
              <label className="label">Plano de Contas</label>
              <select className="input" value={form.planoContasId} onChange={e => set('planoContasId', e.target.value)}>
                <option value="">Selecionar...</option>
                {planoContas.filter(p => p.aceitaLancamento).map(p => (
                  <option key={p.id} value={p.id}>{p.codigo} - {p.descricao}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Centro de Custo</label>
              <select className="input" value={form.centroCustoId} onChange={e => set('centroCustoId', e.target.value)}>
                <option value="">Selecionar...</option>
                {centrosCusto.map(c => (
                  <option key={c.id} value={c.id}>{c.codigo} - {c.descricao}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="label">Observação</label>
              <textarea className="input resize-none h-20" value={form.observacao}
                onChange={e => set('observacao', e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
