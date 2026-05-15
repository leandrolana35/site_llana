import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function CentrosCustoPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ codigo: '', descricao: '' });
  const [editando, setEditando] = useState(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ['centros-custo'],
    queryFn: () => api.get('/centros-custo').then(r => r.data),
  });

  const salvar = useMutation({
    mutationFn: (dados) => editando
      ? api.put(`/centros-custo/${editando.id}`, dados)
      : api.post('/centros-custo', dados),
    onSuccess: () => { qc.invalidateQueries(['centros-custo']); setModal(false); toast.success('Salvo!'); },
    onError: (e) => toast.error(e.response?.data?.error || 'Erro'),
  });

  const desativar = useMutation({
    mutationFn: (id) => api.delete(`/centros-custo/${id}`),
    onSuccess: () => { qc.invalidateQueries(['centros-custo']); toast.success('Desativado'); },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Centros de Custo</h1>
          <p className="text-sm text-gray-500">Organize seus lançamentos por área ou projeto</p>
        </div>
        <button onClick={() => { setEditando(null); setForm({ codigo: '', descricao: '' }); setModal(true); }} className="btn-primary">
          <Plus size={16} /> Novo Centro
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              {['Código', 'Descrição', 'Ações'].map(h => <th key={h} className="table-header">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={3} className="text-center py-8 text-gray-400">Carregando...</td></tr>}
            {data.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="table-cell font-mono font-semibold text-gray-700">{c.codigo}</td>
                <td className="table-cell">{c.descricao}</td>
                <td className="table-cell">
                  <div className="flex gap-1">
                    <button onClick={() => { setEditando(c); setForm({ codigo: c.codigo, descricao: c.descricao }); setModal(true); }}
                      className="btn-sm btn-secondary"><Pencil size={12} /></button>
                    <button onClick={() => { if (confirm('Desativar?')) desativar.mutate(c.id); }}
                      className="btn-ghost btn-sm text-red-500"><X size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">{editando ? 'Editar' : 'Novo'} Centro de Custo</h2>
              <button onClick={() => setModal(false)} className="btn-ghost p-1"><X size={20} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); salvar.mutate(form); }} className="p-6 space-y-4">
              <div>
                <label className="label">Código *</label>
                <input className="input font-mono" placeholder="01" value={form.codigo}
                  onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Descrição *</label>
                <input className="input" placeholder="Ex: Administrativo" value={form.descricao}
                  onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} required />
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
