const router = require('express').Router();
const prisma = require('../config/prisma');
const { auth, checkEmpresa } = require('../middleware/auth');

router.use(auth, checkEmpresa);

router.get('/', async (req, res) => {
  try {
    const contas = await prisma.contaBancaria.findMany({
      where: { empresaId: req.empresaId, ativo: true },
      orderBy: { descricao: 'asc' },
    });
    res.json(contas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const conta = await prisma.contaBancaria.create({
      data: { ...req.body, empresaId: req.empresaId, saldoAtual: req.body.saldoInicial || 0 },
    });
    res.status(201).json(conta);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const conta = await prisma.contaBancaria.findFirst({
      where: { id: req.params.id, empresaId: req.empresaId },
    });
    if (!conta) return res.status(404).json({ error: 'Conta não encontrada' });
    res.json(conta);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const conta = await prisma.contaBancaria.update({ where: { id: req.params.id }, data: req.body });
    res.json(conta);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.contaBancaria.update({ where: { id: req.params.id }, data: { ativo: false } });
    res.json({ message: 'Conta desativada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
