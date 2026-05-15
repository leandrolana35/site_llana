import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, X, User, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { fmt } from '../../utils/formatters';

const defaultForm = {
  tipo: 'JURIDICA', razaoSocial: '', nomeFantasia: '', cnpj: '', inscricaoEstadual: '',
  inscricaoMunicipal: '', nome: '', cpf: '', email: '', telefone: '', celular: '',
  cep: '', logradouro: '', numero: '', complemento: '', bairro: '', municipio: '', uf: 'SP',
  cliente: true, fornecedor: false, observacao: '', limiteCredito: '', diasPrazoPadrao: 30,
};

export default function PessoasPage() {
  const qc = useQueryClient();
  const [filtros, setFiltros] = useState({ busca: '', tipo: '', cliente: '', fornecedor: '' });
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editando, setEditando] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['pessoas', filtros],
    queryFn: () => api.get('/pessoas', { params: filtros }).then(r => r.data),
  });

  const salvar = useMutation({
    mutationFn: (dados) => editando
      ? api.put(`/pessoas/${editando.id}`, dados)
      : api.post('/pessoas', dados),
    onSuccess: () => {
      qc.invalidateQueries(['pessoas']);
      setModal(false); setEditando(null); setForm(defaultForm);
      toast.success(editando ? 'Atualizado!' : 'Cadastrado!');
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Erro ao salvar'),
  });

  const desativar = useMutation({
    mutationFn: (id) => api.delete(`/pessoas/${id}`),
    onSuccess: () => { qc.invalidateQueries(['pessoas']); toast.success('Desativado'); },
  });

  const abrirEditar = (p) => {
    setEditando(p);
    setForm({
      tipo: p.tipo, razaoSocial: p.razaoSocial || '', nomeFantasia: p.nomeFantasia || '',
      cnpj: p.cnpj || '', inscricaoEstadual: p.inscricaoEstadual || '',
      inscricaoMunicipal: p.inscricaoMunicipal || '', nome: p.nome || '', cpf: p.cpf || '',
      email: p.email || '', telefone: p.telefone || '', celular: p.celular || '',
      cep: p.cep || '', logradouro: p.logradouro || '', numero: p.numero || '',
      complemento: p.complemento || '', bairro: p.bairro || '', municipio: p.municipio || '',
      uf: p.uf || 'SP', cliente: p.cliente, fornecedor: p.fornecedor,
      observacao: p.observacao || '', limiteCredito: p.limiteCredito || '',
      diasPrazoPadrao: p.diasPrazoPadrao || 30,
    });
    setModal(true);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pessoas (Clientes / Fornecedores)</h1>
          <p className="text-sm text-gray-500">Cadastro de pessoas físicas e jurídicas</p>
        </div>
        <button onClick={() => { setEditando(null); setForm(defaultForm); setModal(true); }} className="btn-primary">
          <Plus size={16} /> Nova Pessoa
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9 py-1.5" placeholder="Buscar por nome, CNPJ, CPF..."
              value={filtros.busca} onChange={e => setFiltros(f => ({ ...f, busca: e.target.value }))} />
          </div>
          <select className="input w-auto py-1.5" value={filtros.tipo}
            onChange={e => setFiltros(f => ({ ...f, tipo: e.target.value }))}>
            <option value="">PF e PJ</option>
            <option value="FISICA">Pessoa Física</option>
            <option value="JURIDICA">Pessoa Jurídica</option>
          </select>
          <select className="input w-auto py-1.5" value={filtros.cliente}
            onChange={e => setFiltros(f => ({ ...f, cliente: e.target.value }))}>
            <option value="">Todos</option>
            <option value="true">Clientes</option>
          </select>
          <select className="input w-auto py-1.5" value={filtros.fornecedor}
            onChange={e => setFiltros(f => ({ ...f, fornecedor: e.target.value }))}>
            <option value="">Todos</option>
            <option value="true">Fornecedores</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              {['Nome / Razão Social', 'Tipo', 'CPF / CNPJ', 'Cidade/UF', 'Contato', 'Papel', 'Ações'].map(h => (
                <th key={h} className="table-header">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="text-center py-8 text-gray-400">Carregando...</td></tr>}
            {!isLoading && !data?.data?.length && (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Nenhuma pessoa encontrada</td></tr>
            )}
            {data?.data?.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      p.tipo === 'JURIDICA' ? 'bg-blue-100' : 'bg-purple-100'
                    }`}>
                      {p.tipo === 'JURIDICA'
                        ? <Building2 size={14} className="text-blue-600" />
                        : <User size={14} className="text-purple-600" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{p.razaoSocial || p.nome}</p>
                      {p.nomeFantasia && <p className="text-xs text-gray-500">{p.nomeFantasia}</p>}
                    </div>
                  </div>
                </td>
                <td className="table-cell">
                  <span className={p.tipo === 'JURIDICA' ? 'badge-blue' : 'badge-gray'}>
                    {p.tipo === 'JURIDICA' ? 'PJ' : 'PF'}
                  </span>
                </td>
                <td className="table-cell text-sm text-gray-600 font-mono">
                  {p.cnpj ? fmt.cnpj(p.cnpj) : fmt.cpf(p.cpf)}
                </td>
                <td className="table-cell text-sm text-gray-600">
                  {p.municipio ? `${p.municipio}/${p.uf}` : '-'}
                </td>
                <td className="table-cell text-sm text-gray-600">
                  {p.email || p.telefone || '-'}
                </td>
                <td className="table-cell">
                  <div className="flex gap-1">
                    {p.cliente && <span className="badge-green">Cliente</span>}
                    {p.fornecedor && <span className="badge-blue">Forn.</span>}
                  </div>
                </td>
                <td className="table-cell">
                  <div className="flex gap-1">
                    <button onClick={() => abrirEditar(p)} className="btn-sm btn-secondary">Editar</button>
                    <button onClick={() => { if (confirm('Desativar?')) desativar.mutate(p.id); }}
                      className="btn-ghost btn-sm text-red-500"><X size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.total > 0 && (
          <div className="px-4 py-3 border-t text-xs text-gray-500">{data.total} registro(s)</div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">{editando ? 'Editar' : 'Nova'} Pessoa</h2>
              <button onClick={() => { setModal(false); setEditando(null); }} className="btn-ghost p-1"><X size={20} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); salvar.mutate(form); }} className="p-6 space-y-5">
              {/* Tipo */}
              <div className="flex gap-3">
                {['JURIDICA', 'FISICA'].map(t => (
                  <button key={t} type="button"
                    onClick={() => set('tipo', t)}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      form.tipo === t ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    {t === 'JURIDICA' ? '🏢 Pessoa Jurídica' : '👤 Pessoa Física'}
                  </button>
                ))}
              </div>

              {/* Dados principais */}
              <div className="grid grid-cols-2 gap-4">
                {form.tipo === 'JURIDICA' ? (
                  <>
                    <div className="col-span-2">
                      <label className="label">Razão Social *</label>
                      <input className="input" value={form.razaoSocial} onChange={e => set('razaoSocial', e.target.value)} required />
                    </div>
                    <div>
                      <label className="label">Nome Fantasia</label>
                      <input className="input" value={form.nomeFantasia} onChange={e => set('nomeFantasia', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">CNPJ</label>
                      <input className="input" placeholder="00.000.000/0001-00" value={form.cnpj} onChange={e => set('cnpj', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Inscrição Estadual</label>
                      <input className="input" value={form.inscricaoEstadual} onChange={e => set('inscricaoEstadual', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Inscrição Municipal</label>
                      <input className="input" value={form.inscricaoMunicipal} onChange={e => set('inscricaoMunicipal', e.target.value)} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-span-2">
                      <label className="label">Nome Completo *</label>
                      <input className="input" value={form.nome} onChange={e => set('nome', e.target.value)} required />
                    </div>
                    <div>
                      <label className="label">CPF</label>
                      <input className="input" placeholder="000.000.000-00" value={form.cpf} onChange={e => set('cpf', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">RG</label>
                      <input className="input" value={form.rg || ''} onChange={e => set('rg', e.target.value)} />
                    </div>
                  </>
                )}

                <div><label className="label">E-mail</label><input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
                <div><label className="label">Telefone</label><input className="input" value={form.telefone} onChange={e => set('telefone', e.target.value)} /></div>
                <div><label className="label">CEP</label><input className="input" placeholder="00000-000" value={form.cep} onChange={e => set('cep', e.target.value)} /></div>
                <div><label className="label">Logradouro</label><input className="input" value={form.logradouro} onChange={e => set('logradouro', e.target.value)} /></div>
                <div><label className="label">Número</label><input className="input" value={form.numero} onChange={e => set('numero', e.target.value)} /></div>
                <div><label className="label">Bairro</label><input className="input" value={form.bairro} onChange={e => set('bairro', e.target.value)} /></div>
                <div><label className="label">Município</label><input className="input" value={form.municipio} onChange={e => set('municipio', e.target.value)} /></div>
                <div>
                  <label className="label">UF</label>
                  <select className="input" value={form.uf} onChange={e => set('uf', e.target.value)}>
                    {['SP','RJ','MG','RS','SC','PR','BA','GO','DF','PE','CE','MA','ES','AM','MT','MS','PA','RN','PB','AL','PI','SE','TO','AC','AP','RO','RR'].map(uf => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Papel */}
              <div>
                <label className="label mb-2">Papel</label>
                <div className="flex gap-4">
                  {[['cliente', 'Cliente'], ['fornecedor', 'Fornecedor']].map(([k, l]) => (
                    <label key={k} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form[k]} onChange={e => set(k, e.target.checked)} className="rounded" />
                      <span className="text-sm text-gray-700">{l}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t">
                <button type="button" onClick={() => { setModal(false); setEditando(null); }} className="btn-secondary">Cancelar</button>
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
