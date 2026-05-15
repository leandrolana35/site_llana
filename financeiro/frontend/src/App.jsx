import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/layout/Layout';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import EmpresasPage from './pages/configuracoes/Empresas';
import ConfigFaturamentoPage from './pages/configuracoes/ConfigFaturamento';
import ConfigTributariaPage from './pages/configuracoes/ConfigTributaria';
import PessoasPage from './pages/cadastros/Pessoas';
import PlanoContasPage from './pages/cadastros/PlanoContas';
import CentrosCustoPage from './pages/cadastros/CentrosCusto';
import ContasBancariasPage from './pages/cadastros/ContasBancarias';
import ContasReceberPage from './pages/financeiro/ContasReceber';
import ContasPagarPage from './pages/financeiro/ContasPagar';
import RecorrentesPage from './pages/financeiro/Recorrentes';
import NFSePage from './pages/faturamento/NFSe';
import NFEPage from './pages/faturamento/NFe';
import ConciliacaoPage from './pages/conciliacao/Conciliacao';

const PrivateRoute = ({ children }) => {
  const { token, empresaId } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (!empresaId) return <Navigate to="/empresas" replace />;
  return children;
};

const AuthRoute = ({ children }) => {
  const { token } = useAuthStore();
  if (token) return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
        <Route path="/empresas" element={
          <RequireAuth><EmpresaSelectorWrapper /></RequireAuth>
        } />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="financeiro/contas-receber" element={<ContasReceberPage />} />
          <Route path="financeiro/contas-pagar" element={<ContasPagarPage />} />
          <Route path="financeiro/recorrentes" element={<RecorrentesPage />} />
          <Route path="faturamento/nfse" element={<NFSePage />} />
          <Route path="faturamento/nfe" element={<NFEPage />} />
          <Route path="conciliacao" element={<ConciliacaoPage />} />
          <Route path="cadastros/pessoas" element={<PessoasPage />} />
          <Route path="cadastros/plano-contas" element={<PlanoContasPage />} />
          <Route path="cadastros/centros-custo" element={<CentrosCustoPage />} />
          <Route path="cadastros/contas-bancarias" element={<ContasBancariasPage />} />
          <Route path="config/faturamento" element={<ConfigFaturamentoPage />} />
          <Route path="config/tributaria" element={<ConfigTributariaPage />} />
          <Route path="config/empresas" element={<EmpresasPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function RequireAuth({ children }) {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function EmpresaSelectorWrapper() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <EmpresaSelector />
    </div>
  );
}

import EmpresaSelector from './components/layout/EmpresaSelector';
