const router = require('express').Router();
const prisma = require('../config/prisma');
const { auth, checkEmpresa } = require('../middleware/auth');

router.use(auth, checkEmpresa);

router.get('/', async (req, res) => {
  try {
    const centros = await prisma.centroCusto.findMany({
      where: { empresaId: req.empresaId, ativo: true },
      orderBy: { codigo: 'asc' },
    });
    res.json(centros);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const centro = await prisma.centroCusto.create({
      data: { ...req.body, empresaId: req.empresaId },
    });
    res.status(201).json(centro);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const centro = await prisma.centroCusto.update({ where: { id: req.params.id }, data: req.body });
    res.json(centro);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.centroCusto.update({ where: { id: req.params.id }, data: { ativo: false } });
    res.json({ message: 'Centro de custo desativado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
