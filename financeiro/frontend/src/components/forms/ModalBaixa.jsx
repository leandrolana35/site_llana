import { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { fmt } from '../../utils/formatters';

export default function ModalBaixa({ titulo, tipo, onClose, onSalvar, loading }) {
  const [form, setForm] = useState({
    dataPagamento: new Date().toISOString().substring(0, 10),
    valorPago: titulo.valor,
    contaBancariaId: '',
    valorDesconto: 0,
    valorJuros: 0,
    valorMulta: 0,
  });

  const { data: contas = [] } = useQuery({
    queryKey: ['contas-bancarias-select'],
    queryFn: () => api.get('/contas-bancarias').then(r => r.data),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSalvar({
      ...form,
      valorPago: Number(form.valorPago),
      valorDesconto: Number(form.valorDesconto || 0),
      valorJuros: Number(form.valorJuros || 0),
      valorMulta: Number(form.valorMulta || 0),
    });
  };

  const label = tipo === 'receber' ? 'Recebimento' : 'Pagamento';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold text-gray-900">Registrar {label}</h2>
          <button onClick={onClose} className="btn-ghost p-1"><X size={20} /></button>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-b">
          <p className="text-sm font-medium text-gray-900">{titulo.descricao}</p>
          <p className="text-xs text-gray-500 mt-1">
            Valor original: {fmt.moeda(titulo.valor)} · Vence: {fmt.data(titulo.dataVencimento)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Data do {label} *</label>
            <input className="input" type="date" value={form.dataPagamento}
              onChange={e => set('dataPagamento', e.target.value)} required />
          </div>

          <div>
            <label className="label">Valor {label === 'Recebimento' ? 'Recebido' : 'Pago'} (R$) *</label>
            <input className="input" type="number" step="0.01" min="0.01" value={form.valorPago}
              onChange={e => set('valorPago', e.target.value)} required />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Desconto</label>
              <input className="input" type="number" step="0.01" min="0" value={form.valorDesconto}
                onChange={e => set('valorDesconto', e.target.value)} />
            </div>
            <div>
              <label className="label">Juros</label>
              <input className="input" type="number" step="0.01" min="0" value={form.valorJuros}
                onChange={e => set('valorJuros', e.target.value)} />
            </div>
            <div>
              <label className="label">Multa</label>
              <input className="input" type="number" step="0.01" min="0" value={form.valorMulta}
                onChange={e => set('valorMulta', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">Conta Bancária</label>
            <select className="input" value={form.contaBancariaId} onChange={e => set('contaBancariaId', e.target.value)}>
              <option value="">Selecionar...</option>
              {contas.map(c => (
                <option key={c.id} value={c.id}>{c.descricao} {c.banco ? `· ${c.banco}` : ''}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary">
              <CheckCircle size={15} />
              {loading ? 'Salvando...' : `Confirmar ${label}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
