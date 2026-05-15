import { useQuery } from '@tanstack/react-query';
import { ArrowDownCircle, ArrowUpCircle, AlertTriangle, TrendingUp, Landmark, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { fmt } from '../utils/formatters';

function KpiCard({ label, value, sub, icon: Icon, cor }) {
  const cores = {
    green: 'bg-green-50 border-green-200 text-green-600',
    red: 'bg-red-50 border-red-200 text-red-600',
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${cores[cor]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then(r => r.data),
    refetchInterval: 60000,
  });

  const { data: fluxo = [] } = useQuery({
    queryKey: ['fluxo-caixa'],
    queryFn: () => api.get('/dashboard/fluxo-caixa').then(r => r.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  const r = data?.resumo || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard Financeiro</h1>
        <p className="text-sm text-gray-500">Visão geral das suas finanças</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          label="A Receber" value={fmt.moeda(r.totalReceber)}
          sub="total em aberto" icon={ArrowDownCircle} cor="green"
        />
        <KpiCard
          label="A Pagar" value={fmt.moeda(r.totalPagar)}
          sub="total em aberto" icon={ArrowUpCircle} cor="red"
        />
        <KpiCard
          label="Recebido (mês)" value={fmt.moeda(r.recebidosMes)}
          sub="mês atual" icon={TrendingUp} cor="blue"
        />
        <KpiCard
          label="Pago (mês)" value={fmt.moeda(r.pagosMes)}
          sub="mês atual" icon={TrendingUp} cor="orange"
        />
        <KpiCard
          label="Vencidos CR" value={fmt.moeda(r.vencidosReceber?.valor)}
          sub={`${r.vencidosReceber?.count || 0} títulos`} icon={AlertTriangle} cor="red"
        />
        <KpiCard
          label="Saldo Bancos" value={fmt.moeda(r.saldoTotal)}
          sub={`${data?.saldosBancarios?.length || 0} contas`} icon={Landmark} cor="purple"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Fluxo de Caixa */}
        <div className="xl:col-span-2 card p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Fluxo de Caixa — Últimos 12 meses</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={fluxo} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => fmt.moeda(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="recebimentos" name="Recebimentos" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pagamentos" name="Pagamentos" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Saldos bancários */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Saldos Bancários</h2>
          <div className="space-y-3">
            {data?.saldosBancarios?.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.descricao}</p>
                  {c.banco && <p className="text-xs text-gray-500">{c.banco}</p>}
                </div>
                <span className={`text-sm font-semibold ${Number(c.saldoAtual) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {fmt.moeda(c.saldoAtual)}
                </span>
              </div>
            ))}
            {!data?.saldosBancarios?.length && (
              <p className="text-sm text-gray-400 text-center py-4">Nenhuma conta bancária</p>
            )}
          </div>
        </div>
      </div>

      {/* Próximos vencimentos */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ProximosVencimentos
          titulo="Próximas Contas a Receber"
          dados={data?.proxVencReceber}
          cor="green"
          icon={ArrowDownCircle}
        />
        <ProximosVencimentos
          titulo="Próximas Contas a Pagar"
          dados={data?.proxVencPagar}
          cor="red"
          icon={ArrowUpCircle}
        />
      </div>
    </div>
  );
}

function ProximosVencimentos({ titulo, dados = [], cor, icon: Icon }) {
  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Icon size={16} className={cor === 'green' ? 'text-green-600' : 'text-red-600'} />
        {titulo}
      </h2>
      <div className="space-y-2">
        {dados.map((t) => (
          <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">{t.descricao}</p>
              <p className="text-xs text-gray-500">
                {t.pessoa?.razaoSocial || t.pessoa?.nome || 'Sem cliente'} · Vence {fmt.data(t.dataVencimento)}
              </p>
            </div>
            <span className={`text-sm font-semibold ml-3 ${cor === 'green' ? 'text-green-600' : 'text-red-600'}`}>
              {fmt.moeda(t.valor)}
            </span>
          </div>
        ))}
        {!dados.length && (
          <p className="text-sm text-gray-400 text-center py-4">Nenhum vencimento próximo</p>
        )}
      </div>
    </div>
  );
}
