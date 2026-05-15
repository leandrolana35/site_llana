const router = require('express').Router();
const prisma = require('../config/prisma');
const { auth, checkEmpresa } = require('../middleware/auth');

router.use(auth, checkEmpresa);

router.get('/', async (req, res) => {
  try {
    const { tipo, ativo = 'true' } = req.query;
    const where = { empresaId: req.empresaId, ativo: ativo === 'true' };
    if (tipo) where.tipo = tipo;
    const contas = await prisma.planoContas.findMany({
      where,
      include: { contasFilhas: { where: { ativo: true }, orderBy: { codigo: 'asc' } } },
      orderBy: { codigo: 'asc' },
    });
    res.json(contas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const conta = await prisma.planoContas.create({
      data: { ...req.body, empresaId: req.empresaId },
    });
    res.status(201).json(conta);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const conta = await prisma.planoContas.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(conta);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.planoContas.update({ where: { id: req.params.id }, data: { ativo: false } });
    res.json({ message: 'Conta desativada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
