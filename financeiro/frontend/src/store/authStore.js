import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      usuario: null,
      empresaId: null,
      empresaSelecionada: null,
      setAuth: (token, usuario) => set({ token, usuario }),
      setEmpresa: (empresaId, empresaSelecionada) => set({ empresaId, empresaSelecionada }),
      logout: () => set({ token: null, usuario: null, empresaId: null, empresaSelecionada: null }),
    }),
    { name: 'llana-auth' }
  )
);
