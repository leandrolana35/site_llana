const router = require('express').Router();
const prisma = require('../config/prisma');
const { auth, checkEmpresa } = require('../middleware/auth');

router.use(auth, checkEmpresa);

router.get('/faturamento', async (req, res) => {
  try {
    const config = await prisma.configFaturamento.findUnique({
      where: { empresaId: req.empresaId },
    });
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/faturamento', async (req, res) => {
  try {
    const config = await prisma.configFaturamento.upsert({
      where: { empresaId: req.empresaId },
      update: req.body,
      create: { ...req.body, empresaId: req.empresaId },
    });
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/tributaria', async (req, res) => {
  try {
    const config = await prisma.configTributaria.findUnique({
      where: { empresaId: req.empresaId },
    });
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/tributaria', async (req, res) => {
  try {
    const config = await prisma.configTributaria.upsert({
      where: { empresaId: req.empresaId },
      update: req.body,
      create: { ...req.body, empresaId: req.empresaId },
    });
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
