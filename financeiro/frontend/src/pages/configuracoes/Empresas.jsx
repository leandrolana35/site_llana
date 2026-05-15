import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { fmt } from '../../utils/formatters';

const regimes = { SIMPLES_NACIONAL: 'Simples Nacional', LUCRO_PRESUMIDO: 'Lucro Presumido', LUCRO_REAL: 'Lucro Real', MEI: 'MEI' };
const tipos = { SERVICO: 'Serviço', COMERCIO: 'Comércio', INDUSTRIA: 'Indústria', MISTO: 'Misto' };

const defaultForm = {
  razaoSocial: '', nomeFantasia: '', cnpj: '', inscricaoEstadual: '', inscricaoMunicipal: '',
  regimeTributario: 'SIMPLES_NACIONAL', tipoEmpresa: 'SERVICO', cnaePrincipal: '',
  logradouro: '', numero: '', complemento: '', bairro: '', municipio: 'São Paulo', uf: 'SP',
  cep: '', telefone: '', email: '', site: '',
};

export default function EmpresasPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editando, setEditando] = useState(null);

  const { data: empresas = [], isLoading } = useQuery({
    queryKey: ['empresas'],
    queryFn: () => api.get('/empresas').then(r => r.data),
  });

  const salvar = useMutation({
    mutationFn: (dados) => editando
      ? api.put(`/empresas/${editando.id}`, dados)
      : api.post('/empresas', dados),
    onSuccess: () => {
      qc.invalidateQueries(['empresas']);
      setModal(false); setEditando(null); setForm(defaultForm);
      toast.success(editando ? 'Empresa atualizada!' : 'Empresa cadastrada!');
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Erro ao salvar'),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const abrirEditar = (e) => {
    setEditando(e);
    setForm({
      razaoSocial: e.razaoSocial, nomeFantasia: e.nomeFantasia || '',
      cnpj: e.cnpj, inscricaoEstadual: e.inscricaoEstadual || '',
      inscricaoMunicipal: e.inscricaoMunicipal || '',
      regimeTributario: e.regimeTributario, tipoEmpresa: e.tipoEmpresa,
      cnaePrincipal: e.cnaePrincipal || '', logradouro: e.logradouro || '',
      numero: e.numero || '', bairro: e.bairro || '', municipio: e.municipio || '',
      uf: e.uf || 'SP', cep: e.cep || '', telefone: e.telefone || '',
      email: e.email || '', site: e.site || '',
    });
    setModal(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Empresas</h1>
          <p className="text-sm text-gray-500">Gestão multi-empresa</p>
        </div>
        <button onClick={() => { setEditando(null); setForm(defaultForm); setModal(true); }} className="btn-primary">
          <Plus size={16} /> Nova Empresa
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading && <div className="col-span-2 text-center py-8 text-gray-400">Carregando...</div>}
        {empresas.map((e) => (
          <div key={e.id} className={`card p-5 ${!e.ativo ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                  <Building2 size={24} className="text-primary-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{e.nomeFantasia || e.razaoSocial}</p>
                  {e.nomeFantasia && <p className="text-xs text-gray-500">{e.razaoSocial}</p>}
                  <p className="text-xs font-mono text-gray-400 mt-0.5">{fmt.cnpj(e.cnpj)}</p>
                </div>
              </div>
              <button onClick={() => abrirEditar(e)} className="btn-sm btn-secondary">Editar</button>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs text-gray-500">
              <div><span className="font-medium">Regime:</span> {regimes[e.regimeTributario]}</div>
              <div><span className="font-medium">Tipo:</span> {tipos[e.tipoEmpresa]}</div>
              <div><span className="font-medium">Município:</span> {e.municipio}/{e.uf}</div>
              <div><span className="font-medium">Status:</span> <span className={e.ativo ? 'text-green-600' : 'text-red-600'}>{e.ativo ? 'Ativa' : 'Inativa'}</span></div>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">{editando ? 'Editar' : 'Nova'} Empresa</h2>
              <button onClick={() => { setModal(false); setEditando(null); }} className="btn-ghost p-1"><X size={20} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); salvar.mutate(form); }} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Razão Social *</label>
                  <input className="input" value={form.razaoSocial} onChange={e => set('razaoSocial', e.target.value)} required />
                </div>
                <div>
                  <label className="label">Nome Fantasia</label>
                  <input className="input" value={form.nomeFantasia} onChange={e => set('nomeFantasia', e.target.value)} />
                </div>
                <div>
                  <label className="label">CNPJ *</label>
                  <input className="input font-mono" placeholder="00.000.000/0001-00" value={form.cnpj}
                    onChange={e => set('cnpj', e.target.value)} required />
                </div>
                <div>
                  <label className="label">Inscrição Estadual</label>
                  <input className="input" value={form.inscricaoEstadual} onChange={e => set('inscricaoEstadual', e.target.value)} />
                </div>
                <div>
                  <label className="label">Inscrição Municipal</label>
                  <input className="input" value={form.inscricaoMunicipal} onChange={e => set('inscricaoMunicipal', e.target.value)} />
                </div>
                <div>
                  <label className="label">Regime Tributário</label>
                  <select className="input" value={form.regimeTributario} onChange={e => set('regimeTributario', e.target.value)}>
                    {Object.entries(regimes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Tipo de Empresa</label>
                  <select className="input" value={form.tipoEmpresa} onChange={e => set('tipoEmpresa', e.target.value)}>
                    {Object.entries(tipos).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">CNAE Principal</label>
                  <input className="input font-mono" placeholder="0000-0/00" value={form.cnaePrincipal}
                    onChange={e => set('cnaePrincipal', e.target.value)} />
                </div>
                <div>
                  <label className="label">E-mail</label>
                  <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
                <div>
                  <label className="label">Telefone</label>
                  <input className="input" value={form.telefone} onChange={e => set('telefone', e.target.value)} />
                </div>
                <div>
                  <label className="label">CEP</label>
                  <input className="input" value={form.cep} onChange={e => set('cep', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="label">Logradouro</label>
                  <input className="input" value={form.logradouro} onChange={e => set('logradouro', e.target.value)} />
                </div>
                <div>
                  <label className="label">Número</label>
                  <input className="input" value={form.numero} onChange={e => set('numero', e.target.value)} />
                </div>
                <div>
                  <label className="label">Bairro</label>
                  <input className="input" value={form.bairro} onChange={e => set('bairro', e.target.value)} />
                </div>
                <div>
                  <label className="label">Município</label>
                  <input className="input" value={form.municipio} onChange={e => set('municipio', e.target.value)} />
                </div>
                <div>
                  <label className="label">UF</label>
                  <select className="input" value={form.uf} onChange={e => set('uf', e.target.value)}>
                    {['SP','RJ','MG','RS','SC','PR','BA','GO','DF','PE','CE'].map(uf => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t">
                <button type="button" onClick={() => { setModal(false); setEditando(null); }} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={salvar.isPending} className="btn-primary">
                  {salvar.isPending ? 'Salvando...' : 'Salvar Empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
