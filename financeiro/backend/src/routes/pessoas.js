const router = require('express').Router();
const prisma = require('../config/prisma');
const { auth, checkEmpresa } = require('../middleware/auth');

router.use(auth, checkEmpresa);

const buildWhere = (empresaId, query) => {
  const { busca, tipo, cliente, fornecedor, ativo } = query;
  const where = { empresaId };
  if (tipo) where.tipo = tipo;
  if (cliente === 'true') where.cliente = true;
  if (fornecedor === 'true') where.fornecedor = true;
  if (ativo !== undefined) where.ativo = ativo === 'true';
  else where.ativo = true;
  if (busca) {
    where.OR = [
      { razaoSocial: { contains: busca, mode: 'insensitive' } },
      { nomeFantasia: { contains: busca, mode: 'insensitive' } },
      { nome: { contains: busca, mode: 'insensitive' } },
      { cnpj: { contains: busca } },
      { cpf: { contains: busca } },
    ];
  }
  return where;
};

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const where = buildWhere(req.empresaId, req.query);
    const [total, pessoas] = await prisma.$transaction([
      prisma.pessoa.count({ where }),
      prisma.pessoa.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: [{ razaoSocial: 'asc' }, { nome: 'asc' }],
      }),
    ]);
    res.json({ data: pessoas, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const pessoa = await prisma.pessoa.create({
      data: { ...req.body, empresaId: req.empresaId },
    });
    res.status(201).json(pessoa);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pessoa = await prisma.pessoa.findFirst({
      where: { id: req.params.id, empresaId: req.empresaId },
    });
    if (!pessoa) return res.status(404).json({ error: 'Pessoa não encontrada' });
    res.json(pessoa);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const pessoa = await prisma.pessoa.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(pessoa);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.pessoa.update({ where: { id: req.params.id }, data: { ativo: false } });
    res.json({ message: 'Pessoa desativada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
