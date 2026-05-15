const router = require('express').Router();
const prisma = require('../config/prisma');
const { auth, checkEmpresa } = require('../middleware/auth');

router.use(auth, checkEmpresa);

router.get('/', async (req, res) => {
  try {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    const inicio30 = new Date(); inicio30.setDate(inicio30.getDate() - 30);
    const fim30 = new Date(); fim30.setDate(fim30.getDate() + 30);

    const [
      totalReceber, totalPagar,
      vencidosReceber, vencidosPagar,
      recebidosMes, pagosMes,
      notasMes,
      saldosBancarios,
      proxVencReceber, proxVencPagar,
    ] = await prisma.$transaction([
      prisma.contaReceber.aggregate({
        where: { empresaId: req.empresaId, status: 'ABERTO' },
        _sum: { valor: true },
      }),
      prisma.contaPagar.aggregate({
        where: { empresaId: req.empresaId, status: 'ABERTO' },
        _sum: { valor: true },
      }),
      prisma.contaReceber.aggregate({
        where: { empresaId: req.empresaId, status: 'ABERTO', dataVencimento: { lt: hoje } },
        _sum: { valor: true }, _count: true,
      }),
      prisma.contaPagar.aggregate({
        where: { empresaId: req.empresaId, status: 'ABERTO', dataVencimento: { lt: hoje } },
        _sum: { valor: true }, _count: true,
      }),
      prisma.contaReceber.aggregate({
        where: { empresaId: req.empresaId, status: 'PAGO', dataPagamento: { gte: inicioMes, lte: fimMes } },
        _sum: { valorPago: true },
      }),
      prisma.contaPagar.aggregate({
        where: { empresaId: req.empresaId, status: 'PAGO', dataPagamento: { gte: inicioMes, lte: fimMes } },
        _sum: { valorPago: true },
      }),
      prisma.notaFiscalServico.count({
        where: { empresaId: req.empresaId, dataEmissao: { gte: inicioMes, lte: fimMes } },
      }),
      prisma.contaBancaria.findMany({
        where: { empresaId: req.empresaId, ativo: true },
        select: { id: true, descricao: true, banco: true, saldoAtual: true },
      }),
      prisma.contaReceber.findMany({
        where: { empresaId: req.empresaId, status: 'ABERTO', dataVencimento: { gte: hoje, lte: fim30 } },
        orderBy: { dataVencimento: 'asc' },
        take: 5,
        include: { pessoa: { select: { razaoSocial: true, nome: true } } },
      }),
      prisma.contaPagar.findMany({
        where: { empresaId: req.empresaId, status: 'ABERTO', dataVencimento: { gte: hoje, lte: fim30 } },
        orderBy: { dataVencimento: 'asc' },
        take: 5,
        include: { pessoa: { select: { razaoSocial: true, nome: true } } },
      }),
    ]);

    const saldoTotal = saldosBancarios.reduce((s, c) => s + Number(c.saldoAtual), 0);

    res.json({
      resumo: {
        totalReceber: Number(totalReceber._sum.valor || 0),
        totalPagar: Number(totalPagar._sum.valor || 0),
        vencidosReceber: { valor: Number(vencidosReceber._sum.valor || 0), count: vencidosReceber._count },
        vencidosPagar: { valor: Number(vencidosPagar._sum.valor || 0), count: vencidosPagar._count },
        recebidosMes: Number(recebidosMes._sum.valorPago || 0),
        pagosMes: Number(pagosMes._sum.valorPago || 0),
        notasMes,
        saldoTotal,
      },
      saldosBancarios,
      proxVencReceber,
      proxVencPagar,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fluxo de caixa mensal (12 meses)
router.get('/fluxo-caixa', async (req, res) => {
  try {
    const meses = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const inicio = new Date(d.getFullYear(), d.getMonth(), 1);
      const fim = new Date(d.getFullYear(), d.getMonth() + 1, 0);

      const [rec, pag] = await prisma.$transaction([
        prisma.contaReceber.aggregate({
          where: { empresaId: req.empresaId, status: 'PAGO', dataPagamento: { gte: inicio, lte: fim } },
          _sum: { valorPago: true },
        }),
        prisma.contaPagar.aggregate({
          where: { empresaId: req.empresaId, status: 'PAGO', dataPagamento: { gte: inicio, lte: fim } },
          _sum: { valorPago: true },
        }),
      ]);

      meses.push({
        mes: `${String(inicio.getMonth() + 1).padStart(2, '0')}/${inicio.getFullYear()}`,
        recebimentos: Number(rec._sum.valorPago || 0),
        pagamentos: Number(pag._sum.valorPago || 0),
        resultado: Number(rec._sum.valorPago || 0) - Number(pag._sum.valorPago || 0),
      });
    }
    res.json(meses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
