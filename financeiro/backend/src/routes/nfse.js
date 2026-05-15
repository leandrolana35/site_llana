const router = require('express').Router();
const prisma = require('../config/prisma');
const { auth, checkEmpresa } = require('../middleware/auth');

router.use(auth, checkEmpresa);

const include = {
  pessoa: { select: { id: true, razaoSocial: true, nome: true, cnpj: true, cpf: true, email: true } },
};

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, status, dataInicio, dataFim, busca } = req.query;
    const where = { empresaId: req.empresaId };
    if (status) where.status = { in: status.split(',') };
    if (dataInicio || dataFim) {
      where.dataEmissao = {};
      if (dataInicio) where.dataEmissao.gte = new Date(dataInicio);
      if (dataFim) where.dataEmissao.lte = new Date(dataFim);
    }
    if (busca) {
      where.OR = [
        { numero: { equals: isNaN(busca) ? undefined : Number(busca) } },
        { discriminacao: { contains: busca, mode: 'insensitive' } },
        { pessoa: { razaoSocial: { contains: busca, mode: 'insensitive' } } },
      ];
    }

    const [total, notas] = await prisma.$transaction([
      prisma.notaFiscalServico.count({ where }),
      prisma.notaFiscalServico.findMany({
        where, include,
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
    const configTrib = await prisma.configTributaria.findUnique({ where: { empresaId: req.empresaId } });

    const { valorServico, deducoes = 0, ...dados } = req.body;
    const baseCalculo = Number(valorServico) - Number(deducoes);

    // Cálculo de tributos
    const aliquotaIss = Number(configTrib?.aliquotaIss || 2);
    const aliquotaPis = Number(configTrib?.aliquotaPis || 0);
    const aliquotaCofins = Number(configTrib?.aliquotaCofins || 0);
    const aliquotaCsll = Number(configTrib?.aliquotaCsll || 0);
    const aliquotaIr = Number(configTrib?.aliquotaIrpj || 0);
    const aliquotaInss = Number(configTrib?.aliquotaInss || 0);

    const valorIss = (baseCalculo * aliquotaIss) / 100;
    const valorPis = (baseCalculo * aliquotaPis) / 100;
    const valorCofins = (baseCalculo * aliquotaCofins) / 100;
    const valorCsll = (baseCalculo * aliquotaCsll) / 100;
    const valorIr = (baseCalculo * aliquotaIr) / 100;
    const valorInss = (baseCalculo * aliquotaInss) / 100;

    const retidoFonte = dados.retidoFonte || false;
    const descontos = retidoFonte ? (valorIss + valorPis + valorCofins + valorCsll + valorIr + valorInss) : 0;
    const valorLiquido = Number(valorServico) - descontos;

    // Próximo número
    const proximoNum = config?.proximoNumeroNFSe || 1;

    const nota = await prisma.notaFiscalServico.create({
      data: {
        ...dados,
        empresaId: req.empresaId,
        numero: proximoNum,
        valorServico: Number(valorServico),
        deducoes: Number(deducoes),
        baseCalculo,
        aliquotaIss,
        valorIss,
        aliquotaPis,
        valorPis,
        aliquotaCofins,
        valorCofins,
        aliquotaCsll,
        valorCsll,
        aliquotaIr,
        valorIr,
        aliquotaInss,
        valorInss,
        valorLiquido,
        status: 'RASCUNHO',
      },
      include,
    });

    // Atualiza próximo número
    await prisma.configFaturamento.update({
      where: { empresaId: req.empresaId },
      data: { proximoNumeroNFSe: proximoNum + 1 },
    });

    res.status(201).json(nota);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const nota = await prisma.notaFiscalServico.findFirst({
      where: { id: req.params.id, empresaId: req.empresaId },
      include: { ...include, contasReceber: true },
    });
    if (!nota) return res.status(404).json({ error: 'NFS-e não encontrada' });
    res.json(nota);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Gerar título a receber a partir da NFS-e
router.post('/:id/gerar-titulo', async (req, res) => {
  try {
    const nota = await prisma.notaFiscalServico.findFirst({
      where: { id: req.params.id, empresaId: req.empresaId },
    });
    if (!nota) return res.status(404).json({ error: 'NFS-e não encontrada' });

    const { dataVencimento, contaBancariaId, planoContasId, centroCustoId } = req.body;

    const titulo = await prisma.contaReceber.create({
      data: {
        empresaId: req.empresaId,
        pessoaId: nota.pessoaId,
        descricao: `NFS-e nº ${nota.numero} - ${nota.discriminacao.substring(0, 50)}`,
        valor: nota.valorLiquido,
        competencia: nota.dataCompetencia,
        dataVencimento: new Date(dataVencimento),
        origem: 'FATURAMENTO',
        notaFiscalServicoId: nota.id,
        contaBancariaId,
        planoContasId,
        centroCustoId,
      },
    });

    res.status(201).json(titulo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancelar NFS-e
router.post('/:id/cancelar', async (req, res) => {
  try {
    const { motivo } = req.body;
    const nota = await prisma.notaFiscalServico.update({
      where: { id: req.params.id },
      data: { status: 'CANCELADA', motivoCancelamento: motivo, dataCancelamento: new Date() },
    });
    res.json(nota);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
