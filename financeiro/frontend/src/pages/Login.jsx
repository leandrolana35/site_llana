import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', senha: '' });
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modo, setModo] = useState('login'); // login | registro

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = modo === 'login' ? '/auth/login' : '/auth/registro';
      const { data } = await api.post(endpoint, form);
      setAuth(data.token, data.usuario);
      toast.success(`Bem-vindo, ${data.usuario.nome}!`);
      navigate('/empresas');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <BarChart3 size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">LLANA Financeiro</h1>
          <p className="text-primary-200 mt-1">Sistema de Gestão Financeira</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {modo === 'login' ? 'Entrar no sistema' : 'Criar conta'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {modo === 'registro' && (
              <div>
                <label className="label">Nome completo</label>
                <input
                  className="input"
                  placeholder="Seu nome"
                  value={form.nome || ''}
                  onChange={e => setForm({ ...form, nome: e.target.value })}
                  required
                />
              </div>
            )}
            <div>
              <label className="label">E-mail</label>
              <input
                className="input"
                type="email"
                placeholder="seu@email.com.br"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={mostrarSenha ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.senha}
                  onChange={e => setForm({ ...form, senha: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Aguarde...' : (modo === 'login' ? 'Entrar' : 'Criar conta')}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setModo(modo === 'login' ? 'registro' : 'login')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {modo === 'login' ? 'Criar nova conta' : 'Já tenho conta'}
            </button>
          </div>

          {modo === 'login' && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500 text-center">
              Demo: admin@llana.com.br / admin123
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
