import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, AlertTriangle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { fmt } from '../../utils/formatters';

export default function ConfigTributariaPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({});

  const { data: config, isLoading } = useQuery({
    queryKey: ['config-tributaria'],
    queryFn: () => api.get('/configuracoes/tributaria').then(r => r.data),
  });

  useEffect(() => { if (config) setForm(config); }, [config]);

  const salvar = useMutation({
    mutationFn: (dados) => api.put('/configuracoes/tributaria', dados),
    onSuccess: () => { qc.invalidateQueries(['config-tributaria']); toast.success('Configurações tributárias salvas!'); },
    onError: (e) => toast.error(e.response?.data?.error || 'Erro'),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const InputAliquota = ({ label, campo, descricao }) => (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <input className="input pr-8" type="number" step="0.01" min="0" max="100"
          value={form[campo] || 0} onChange={e => set(campo, Number(e.target.value))} />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
      </div>
      {descricao && <p className="text-xs text-gray-400 mt-1">{descricao}</p>}
    </div>
  );

  if (isLoading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-b-2 border-primary-600 rounded-full" /></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Configurações Tributárias</h1>
        <p className="text-sm text-gray-500">Alíquotas padrão utilizadas no cálculo das notas fiscais</p>
      </div>

      {/* Regime */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Regime Tributário</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Anexo Simples Nacional</label>
            <select className="input" value={form.anexoSimples || ''} onChange={e => set('anexoSimples', e.target.value)}>
              <option value="">Não se aplica</option>
              {['I', 'II', 'III', 'IV', 'V'].map(a => <option key={a} value={a}>Anexo {a}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Alíquota Efetiva Simples (%)</label>
            <div className="relative">
              <input className="input pr-8" type="number" step="0.01" value={form.aliquotaEfetivaSimples || ''}
                onChange={e => set('aliquotaEfetivaSimples', e.target.value)} placeholder="Ex: 6.00" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tributos Atuais */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Tributos — Sistema Atual</h2>
        <div className="grid grid-cols-3 gap-4">
          <InputAliquota label="ISS" campo="aliquotaIss" descricao="Imposto Sobre Serviços" />
          <InputAliquota label="PIS" campo="aliquotaPis" descricao="Programas Sociais" />
          <InputAliquota label="COFINS" campo="aliquotaCofins" descricao="Financiamento Social" />
          <InputAliquota label="CSLL" campo="aliquotaCsll" descricao="Contribuição Social" />
          <InputAliquota label="IRPJ" campo="aliquotaIrpj" descricao="Imposto de Renda PJ" />
          <InputAliquota label="INSS" campo="aliquotaInss" descricao="Retenção INSS" />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="retid" checked={form.retIdContribuinte || false}
            onChange={e => set('retIdContribuinte', e.target.checked)} className="rounded" />
          <label htmlFor="retid" className="text-sm text-gray-700">
            Contribuinte identificado obrigado a reter ISS na fonte
          </label>
        </div>
      </div>

      {/* Reforma Tributária */}
      <div className={`card p-6 space-y-4 ${form.preparadoReformaTrib ? 'border-green-300' : ''}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              Reforma Tributária — IBS/CBS/IS
              <span className="badge-green text-xs">LC 214/2024</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">Vigência gradual a partir de 2026 — configure com antecedência</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <div className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${form.preparadoReformaTrib ? 'bg-green-600' : 'bg-gray-200'}`}
              onClick={() => set('preparadoReformaTrib', !form.preparadoReformaTrib)}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.preparadoReformaTrib ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm font-medium text-gray-700">Preparado</span>
          </label>
        </div>

        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Substituições previstas:</h3>
          <div className="grid grid-cols-3 gap-3 text-xs text-blue-700">
            <div>
              <p className="font-medium">CBS</p>
              <p>Substitui PIS + COFINS</p>
              <p>Federal — Receita Federal</p>
            </div>
            <div>
              <p className="font-medium">IBS</p>
              <p>Substitui ICMS + ISS</p>
              <p>Estadual/Municipal — Comitê Gestor</p>
            </div>
            <div>
              <p className="font-medium">IS</p>
              <p>Imposto Seletivo</p>
              <p>Produtos específicos</p>
            </div>
          </div>
        </div>

        {form.preparadoReformaTrib && (
          <div className="grid grid-cols-3 gap-4 pt-2">
            <InputAliquota label="CBS (%)" campo="aliquotaCbs" descricao="Contribuição sobre Bens e Serviços" />
            <InputAliquota label="IBS (%)" campo="aliquotaIbs" descricao="Imposto sobre Bens e Serviços" />
            <InputAliquota label="IS (%)" campo="aliquotaIs" descricao="Imposto Seletivo" />
          </div>
        )}

        {form.preparadoReformaTrib && (
          <div className="flex items-center gap-2">
            <input type="checkbox" id="split" checked={form.splitPayment || false}
              onChange={e => set('splitPayment', e.target.checked)} className="rounded" />
            <label htmlFor="split" className="text-sm text-gray-700">
              Habilitar Split Payment (recolhimento automático no ato do pagamento)
            </label>
          </div>
        )}

        {form.preparadoReformaTrib && (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle size={16} className="text-green-600" />
            <p className="text-xs text-green-700">
              Sistema configurado para operar com a Reforma Tributária quando vigente.
              As notas fiscais emitidas já incluirão os campos CBS e IBS.
            </p>
          </div>
        )}
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
