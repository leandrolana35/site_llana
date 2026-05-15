const router = require('express').Router();
const prisma = require('../config/prisma');
const { auth, checkEmpresa } = require('../middleware/auth');

router.use(auth, checkEmpresa);

const include = {
  pessoa: { select: { id: true, razaoSocial: true, nome: true, cnpj: true, cpf: true } },
  planoContas: { select: { id: true, codigo: true, descricao: true } },
  centroCusto: { select: { id: true, codigo: true, descricao: true } },
  contaBancaria: { select: { id: true, descricao: true, banco: true } },
};

const buildWhere = (empresaId, query) => {
  const { status, pessoaId, dataInicio, dataFim, competenciaInicio, competenciaFim, origem, busca } = query;
  const where = { empresaId };
  if (status) where.status = { in: status.split(',') };
  if (pessoaId) where.pessoaId = pessoaId;
  if (origem) where.origem = origem;
  if (dataInicio || dataFim) {
    where.dataVencimento = {};
    if (dataInicio) where.dataVencimento.gte = new Date(dataInicio);
    if (dataFim) where.dataVencimento.lte = new Date(dataFim);
  }
  if (competenciaInicio || competenciaFim) {
    where.competencia = {};
    if (competenciaInicio) where.competencia.gte = new Date(competenciaInicio);
    if (competenciaFim) where.competencia.lte = new Date(competenciaFim);
  }
  if (busca) {
    where.OR = [
      { descricao: { contains: busca, mode: 'insensitive' } },
      { numeroDocumento: { contains: busca, mode: 'insensitive' } },
    ];
  }
  return where;
};

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const where = buildWhere(req.empresaId, req.query);
    const [total, contas] = await prisma.$transaction([
      prisma.contaReceber.count({ where }),
      prisma.contaReceber.findMany({
        where, include,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { dataVencimento: 'asc' },
      }),
    ]);
    res.json({ data: contas, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { totalParcelas = 1, ...dados } = req.body;
    if (totalParcelas > 1) {
      const parcelas = [];
      const vencimento = new Date(dados.dataVencimento);
      for (let i = 0; i < totalParcelas; i++) {
        const dataVenc = new Date(vencimento);
        dataVenc.setMonth(dataVenc.getMonth() + i);
        parcelas.push({
          ...dados,
          empresaId: req.empresaId,
          parcela: i + 1,
          totalParcelas,
          dataVencimento: dataVenc,
          descricao: `${dados.descricao} (${i + 1}/${totalParcelas})`,
        });
      }
      const created = await prisma.contaReceber.createMany({ data: parcelas });
      return res.status(201).json({ message: `${created.count} parcelas criadas` });
    }
    const conta = await prisma.contaReceber.create({
      data: { ...dados, empresaId: req.empresaId },
      include,
    });
    res.status(201).json(conta);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/resumo', async (req, res) => {
  try {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    const [abertos, vencidos, recebidosMes, aVencerMes] = await prisma.$transaction([
      prisma.contaReceber.aggregate({
        where: { empresaId: req.empresaId, status: 'ABERTO' },
        _sum: { valor: true }, _count: true,
      }),
      prisma.contaReceber.aggregate({
        where: { empresaId: req.empresaId, status: 'ABERTO', dataVencimento: { lt: hoje } },
        _sum: { valor: true }, _count: true,
      }),
      prisma.contaReceber.aggregate({
        where: { empresaId: req.empresaId, status: 'PAGO', dataPagamento: { gte: inicioMes, lte: fimMes } },
        _sum: { valorPago: true }, _count: true,
      }),
      prisma.contaReceber.aggregate({
        where: { empresaId: req.empresaId, status: 'ABERTO', dataVencimento: { gte: hoje, lte: fimMes } },
        _sum: { valor: true }, _count: true,
      }),
    ]);

    res.json({ abertos, vencidos, recebidosMes, aVencerMes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const conta = await prisma.contaReceber.findFirst({
      where: { id: req.params.id, empresaId: req.empresaId },
      include,
    });
    if (!conta) return res.status(404).json({ error: 'Lançamento não encontrado' });
    res.json(conta);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const conta = await prisma.contaReceber.update({
      where: { id: req.params.id },
      data: req.body,
      include,
    });
    res.json(conta);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/receber', async (req, res) => {
  try {
    const { dataPagamento, valorPago, contaBancariaId, valorDesconto, valorJuros, valorMulta } = req.body;
    const conta = await prisma.contaReceber.findFirst({
      where: { id: req.params.id, empresaId: req.empresaId },
    });
    if (!conta) return res.status(404).json({ error: 'Lançamento não encontrado' });

    const vPago = Number(valorPago);
    const status = vPago >= Number(conta.valor) ? 'PAGO' : 'PARCIAL';

    const atualizado = await prisma.contaReceber.update({
      where: { id: req.params.id },
      data: {
        dataPagamento: new Date(dataPagamento),
        valorPago: vPago,
        valorDesconto: Number(valorDesconto || 0),
        valorJuros: Number(valorJuros || 0),
        valorMulta: Number(valorMulta || 0),
        contaBancariaId,
        status,
      },
      include,
    });

    if (contaBancariaId) {
      await prisma.contaBancaria.update({
        where: { id: contaBancariaId },
        data: { saldoAtual: { increment: vPago } },
      });
    }

    res.json(atualizado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.contaReceber.update({
      where: { id: req.params.id },
      data: { status: 'CANCELADO' },
    });
    res.json({ message: 'Lançamento cancelado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
