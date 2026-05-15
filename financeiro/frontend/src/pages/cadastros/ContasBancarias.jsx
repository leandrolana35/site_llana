import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Landmark } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { fmt } from '../../utils/formatters';

const tipos = { CORRENTE: 'Conta Corrente', POUPANCA: 'Poupança', INVESTIMENTO: 'Investimento', CAIXA: 'Caixa' };

export default function ContasBancariasPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ descricao: '', banco: '', codigoBanco: '', agencia: '', conta: '', tipoConta: 'CORRENTE', saldoInicial: 0, dataAbertura: '' });
  const [editando, setEditando] = useState(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ['contas-bancarias'],
    queryFn: () => api.get('/contas-bancarias').then(r => r.data),
  });

  const salvar = useMutation({
    mutationFn: (dados) => editando
      ? api.put(`/contas-bancarias/${editando.id}`, dados)
      : api.post('/contas-bancarias', dados),
    onSuccess: () => { qc.invalidateQueries(['contas-bancarias']); setModal(false); toast.success('Salvo!'); },
    onError: (e) => toast.error(e.response?.data?.error || 'Erro'),
  });

  const desativar = useMutation({
    mutationFn: (id) => api.delete(`/contas-bancarias/${id}`),
    onSuccess: () => { qc.invalidateQueries(['contas-bancarias']); toast.success('Desativada'); },
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const bancosComuns = [
    { codigo: '001', nome: 'Banco do Brasil' },
    { codigo: '033', nome: 'Santander' },
    { codigo: '104', nome: 'Caixa Econômica Federal' },
    { codigo: '237', nome: 'Bradesco' },
    { codigo: '341', nome: 'Itaú' },
    { codigo: '745', nome: 'Citibank' },
    { codigo: '077', nome: 'Inter' },
    { codigo: '260', nome: 'NuBank' },
    { codigo: '290', nome: 'PagSeguro' },
    { codigo: '323', nome: 'Mercado Pago' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Contas Bancárias</h1>
          <p className="text-sm text-gray-500">Gerencie suas contas e caixas</p>
        </div>
        <button onClick={() => { setEditando(null); setForm({ descricao: '', banco: '', codigoBanco: '', agencia: '', conta: '', tipoConta: 'CORRENTE', saldoInicial: 0, dataAbertura: '' }); setModal(true); }} className="btn-primary">
          <Plus size={16} /> Nova Conta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && <div className="col-span-3 text-center py-8 text-gray-400">Carregando...</div>}
        {data.map((c) => (
          <div key={c.id} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                  <Landmark size={20} className="text-primary-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{c.descricao}</p>
                  <p className="text-xs text-gray-500">{tipos[c.tipoConta]}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditando(c); setForm({ descricao: c.descricao, banco: c.banco || '', codigoBanco: c.codigoBanco || '', agencia: c.agencia || '', conta: c.conta || '', tipoConta: c.tipoConta, saldoInicial: c.saldoInicial, dataAbertura: c.dataAbertura?.substring(0, 10) || '' }); setModal(true); }}
                  className="btn-ghost btn-sm">Editar</button>
                <button onClick={() => { if (confirm('Desativar?')) desativar.mutate(c.id); }}
                  className="btn-ghost btn-sm text-red-500"><X size={13} /></button>
              </div>
            </div>
            {c.banco && <p className="text-sm text-gray-600">{c.banco}</p>}
            {c.agencia && <p className="text-xs text-gray-500">Ag: {c.agencia} · CC: {c.conta}</p>}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">Saldo atual</p>
              <p className={`text-xl font-bold ${Number(c.saldoAtual) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {fmt.moeda(c.saldoAtual)}
              </p>
            </div>
          </div>
        ))}
        {!isLoading && !data.length && (
          <div className="col-span-3 card p-12 text-center text-gray-400">
            <Landmark size={48} className="mx-auto mb-3 text-gray-300" />
            <p>Nenhuma conta bancária cadastrada</p>
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">{editando ? 'Editar' : 'Nova'} Conta Bancária</h2>
              <button onClick={() => setModal(false)} className="btn-ghost p-1"><X size={20} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); salvar.mutate(form); }} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Descrição *</label>
                  <input className="input" placeholder="Ex: Bradesco Conta Corrente" value={form.descricao}
                    onChange={e => set('descricao', e.target.value)} required />
                </div>
                <div>
                  <label className="label">Tipo *</label>
                  <select className="input" value={form.tipoConta} onChange={e => set('tipoConta', e.target.value)}>
                    {Object.entries(tipos).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Banco</label>
                  <select className="input" value={form.banco}
                    onChange={e => {
                      const b = bancosComuns.find(b => b.nome === e.target.value);
                      set('banco', e.target.value);
                      if (b) set('codigoBanco', b.codigo);
                    }}
                  >
                    <option value="">Selecionar...</option>
                    {bancosComuns.map(b => <option key={b.codigo} value={b.nome}>{b.codigo} - {b.nome}</option>)}
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="label">Agência</label>
                  <input className="input" placeholder="0000" value={form.agencia} onChange={e => set('agencia', e.target.value)} />
                </div>
                <div>
                  <label className="label">Conta</label>
                  <input className="input" placeholder="00000-0" value={form.conta} onChange={e => set('conta', e.target.value)} />
                </div>
                <div>
                  <label className="label">Saldo Inicial (R$)</label>
                  <input className="input" type="number" step="0.01" value={form.saldoInicial}
                    onChange={e => set('saldoInicial', e.target.value)} />
                </div>
                <div>
                  <label className="label">Data de Abertura</label>
                  <input className="input" type="date" value={form.dataAbertura} onChange={e => set('dataAbertura', e.target.value)} />
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
