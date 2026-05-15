import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const fmt = {
  moeda: (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0),
  numero: (v, dec = 2) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(Number(v) || 0),
  data: (v) => {
    if (!v) return '-';
    try {
      const d = typeof v === 'string' ? parseISO(v) : v;
      return isValid(d) ? format(d, 'dd/MM/yyyy') : '-';
    } catch { return '-'; }
  },
  dataHora: (v) => {
    if (!v) return '-';
    try {
      const d = typeof v === 'string' ? parseISO(v) : v;
      return isValid(d) ? format(d, 'dd/MM/yyyy HH:mm') : '-';
    } catch { return '-'; }
  },
  mesPorExtenso: (v) => {
    if (!v) return '-';
    try {
      const d = typeof v === 'string' ? parseISO(v) : v;
      return isValid(d) ? format(d, "MMMM 'de' yyyy", { locale: ptBR }) : '-';
    } catch { return '-'; }
  },
  cnpj: (v) => {
    if (!v) return '-';
    const n = v.replace(/\D/g, '');
    return n.length === 14
      ? n.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
      : v;
  },
  cpf: (v) => {
    if (!v) return '-';
    const n = v.replace(/\D/g, '');
    return n.length === 11 ? n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : v;
  },
  percentual: (v) => `${Number(v || 0).toFixed(2).replace('.', ',')}%`,
};

export const statusCores = {
  ABERTO: 'badge-blue',
  PAGO: 'badge-green',
  PARCIAL: 'badge-yellow',
  CANCELADO: 'badge-gray',
  VENCIDO: 'badge-red',
};

export const statusLabels = {
  ABERTO: 'Em Aberto',
  PAGO: 'Pago',
  PARCIAL: 'Parcial',
  CANCELADO: 'Cancelado',
  VENCIDO: 'Vencido',
};

export const statusNotaCores = {
  RASCUNHO: 'badge-gray',
  ENVIADA: 'badge-yellow',
  AUTORIZADA: 'badge-green',
  CANCELADA: 'badge-red',
  DENEGADA: 'badge-red',
};

export const origemLabels = {
  AVULSO: 'Avulso',
  RECORRENTE: 'Recorrente',
  FATURAMENTO: 'Faturamento',
  COMPRA: 'Compra',
};
