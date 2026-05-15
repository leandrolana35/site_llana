const router = require('express').Router();
const prisma = require('../config/prisma');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const where = req.usuario.superAdmin
      ? {}
      : { empresasUsuario: { some: { usuarioId: req.usuario.id, ativo: true } } };
    const empresas = await prisma.empresa.findMany({
      where,
      include: { configFaturamento: true, configTributaria: true },
      orderBy: { razaoSocial: 'asc' },
    });
    res.json(empresas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const empresa = await prisma.empresa.create({
      data: {
        ...req.body,
        empresasUsuario: {
          create: { usuarioId: req.usuario.id, perfil: 'ADMIN' },
        },
        configFaturamento: { create: {} },
        configTributaria: { create: {} },
      },
      include: { configFaturamento: true, configTributaria: true },
    });
    res.status(201).json(empresa);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const empresa = await prisma.empresa.findUnique({
      where: { id: req.params.id },
      include: { configFaturamento: true, configTributaria: true },
    });
    if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada' });
    res.json(empresa);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { configFaturamento, configTributaria, ...dadosEmpresa } = req.body;
    const empresa = await prisma.empresa.update({
      where: { id: req.params.id },
      data: dadosEmpresa,
      include: { configFaturamento: true, configTributaria: true },
    });
    res.json(empresa);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.empresa.update({ where: { id: req.params.id }, data: { ativo: false } });
    res.json({ message: 'Empresa desativada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
