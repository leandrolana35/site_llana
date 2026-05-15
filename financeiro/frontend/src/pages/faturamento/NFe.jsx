import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Info } from 'lucide-react';
import api from '../../services/api';
import { fmt } from '../../utils/formatters';

const statusCores = { RASCUNHO: 'badge-gray', ENVIADA: 'badge-yellow', AUTORIZADA: 'badge-green', CANCELADA: 'badge-red' };
const statusLabels = { RASCUNHO: 'Rascunho', ENVIADA: 'Enviada', AUTORIZADA: 'Autorizada', CANCELADA: 'Cancelada' };

export default function NFEPage() {
  const [filtros, setFiltros] = useState({ status: '', dataInicio: '', dataFim: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['nfe', filtros],
    queryFn: () => api.get('/nfe', { params: filtros }).then(r => r.data),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">NF-e — Nota Fiscal Eletrônica</h1>
          <p className="text-sm text-gray-500">Emissão de notas fiscais de produto</p>
        </div>
      </div>

      <div className="card p-5 border-l-4 border-l-yellow-400 bg-yellow-50">
        <div className="flex gap-3">
          <Info size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900">Integração com SEFAZ</h3>
            <p className="text-sm text-yellow-700 mt-1">
              A emissão de NF-e requer certificado digital A1/A3 e integração com a SEFAZ-SP.
              O cadastro e visualização estão disponíveis. Para emissão em produção, configure o certificado
              em <strong>Configurações &rarr; Faturamento</strong>.
            </p>
            <div className="mt-3 flex gap-3 text-sm text-yellow-700">
              <span>✓ Schema NF-e 4.0</span>
              <span>✓ Ambiente Homologação</span>
              <span>✓ Reforma Tributária Ready</span>
            </div>
          </div>
        </div>
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
              {['Nº/Série', 'Emissão', 'Destinatário', 'Natureza', 'Valor Total', 'Chave', 'Status'].map(h => (
                <th key={h} className="table-header">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="text-center py-8 text-gray-400">Carregando...</td></tr>}
            {!isLoading && !data?.data?.length && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  <FileText size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>Nenhuma NF-e cadastrada</p>
                </td>
              </tr>
            )}
            {data?.data?.map((n) => (
              <tr key={n.id} className="hover:bg-gray-50 transition-colors">
                <td className="table-cell font-bold">#{n.numero}/{n.serie}</td>
                <td className="table-cell text-gray-600">{fmt.data(n.dataEmissao)}</td>
                <td className="table-cell">
                  <p className="font-medium">{n.pessoa?.razaoSocial || n.pessoa?.nome}</p>
                  <p className="text-xs text-gray-500">{n.pessoa?.cnpj ? fmt.cnpj(n.pessoa.cnpj) : ''}</p>
                </td>
                <td className="table-cell text-sm text-gray-600">{n.naturezaOperacao}</td>
                <td className="table-cell font-semibold text-green-700">{fmt.moeda(n.valorTotal)}</td>
                <td className="table-cell">
                  {n.chaveAcesso
                    ? <span className="font-mono text-xs text-gray-500">{n.chaveAcesso.substring(0, 20)}...</span>
                    : <span className="text-gray-400 text-xs">Não transmitida</span>
                  }
                </td>
                <td className="table-cell">
                  <span className={statusCores[n.status]}>{statusLabels[n.status]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
