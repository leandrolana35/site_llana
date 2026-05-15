const router = require('express').Router();
const prisma = require('../config/prisma');
const { auth, checkEmpresa } = require('../middleware/auth');

router.use(auth, checkEmpresa);

const include = {
  pessoa: { select: { id: true, razaoSocial: true, nome: true, cnpj: true, cpf: true } },
  itens: true,
};

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, status, dataInicio, dataFim } = req.query;
    const where = { empresaId: req.empresaId };
    if (status) where.status = { in: status.split(',') };
    if (dataInicio || dataFim) {
      where.dataEmissao = {};
      if (dataInicio) where.dataEmissao.gte = new Date(dataInicio);
      if (dataFim) where.dataEmissao.lte = new Date(dataFim);
    }

    const [total, notas] = await prisma.$transaction([
      prisma.notaFiscalProduto.count({ where }),
      prisma.notaFiscalProduto.findMany({
        where,
        include: { pessoa: include.pessoa },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { numero: 'desc' },
      }),
    ]);
    res.json({ data: notas, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const config = await prisma.configFaturamento.findUnique({ where: { empresaId: req.empresaId } });
    const { itens, ...dadosNota } = req.body;

    const valorProdutos = itens.reduce((s, i) => s + Number(i.valorTotal), 0);
    const valorTotal = valorProdutos + Number(dadosNota.valorFrete || 0) +
      Number(dadosNota.valorSeguro || 0) + Number(dadosNota.valorOutros || 0) -
      Number(dadosNota.valorDesconto || 0);

    const proximoNum = config?.proximoNumeroNFe || 1;

    const nota = await prisma.notaFiscalProduto.create({
      data: {
        ...dadosNota,
        empresaId: req.empresaId,
        numero: proximoNum,
        valorProdutos,
        valorTotal,
        status: 'RASCUNHO',
        itens: { create: itens.map((item, idx) => ({ ...item, ordem: idx + 1 })) },
      },
      include,
    });

    await prisma.configFaturamento.update({
      where: { empresaId: req.empresaId },
      data: { proximoNumeroNFe: proximoNum + 1 },
    });

    res.status(201).json(nota);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const nota = await prisma.notaFiscalProduto.findFirst({
      where: { id: req.params.id, empresaId: req.empresaId },
      include,
    });
    if (!nota) return res.status(404).json({ error: 'NF-e não encontrada' });
    res.json(nota);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/cancelar', async (req, res) => {
  try {
    const { motivo } = req.body;
    const nota = await prisma.notaFiscalProduto.update({
      where: { id: req.params.id },
      data: { status: 'CANCELADA', motivoCancelamento: motivo, dataCancelamento: new Date() },
    });
    res.json(nota);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
