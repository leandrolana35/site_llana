const router = require('express').Router();
const prisma = require('../config/prisma');
const { auth, checkEmpresa } = require('../middleware/auth');

router.use(auth, checkEmpresa);

router.get('/', async (req, res) => {
  try {
    const recorrentes = await prisma.lancamentoRecorrente.findMany({
      where: { empresaId: req.empresaId },
      orderBy: { descricao: 'asc' },
    });
    res.json(recorrentes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const recorrente = await prisma.lancamentoRecorrente.create({
      data: { ...req.body, empresaId: req.empresaId },
    });
    res.status(201).json(recorrente);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const recorrente = await prisma.lancamentoRecorrente.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(recorrente);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Gera as parcelas pendentes de um recorrente
router.post('/:id/gerar', async (req, res) => {
  try {
    const { competenciaAte } = req.body;
    const rec = await prisma.lancamentoRecorrente.findFirst({
      where: { id: req.params.id, empresaId: req.empresaId, ativo: true },
    });
    if (!rec) return res.status(404).json({ error: 'Recorrente não encontrado' });

    const ate = competenciaAte ? new Date(competenciaAte) : new Date();
    const gerados = [];
    let dataAtual = new Date(rec.dataInicio);
    dataAtual.setDate(rec.diaVencimento);

    while (dataAtual <= ate) {
      if (!rec.dataFim || dataAtual <= new Date(rec.dataFim)) {
        if (!rec.totalOcorrencias || rec.ocorrenciasGeradas < rec.totalOcorrencias) {
          const competencia = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1);
          const dados = {
            empresaId: rec.empresaId,
            descricao: rec.descricao,
            valor: rec.valor,
            competencia,
            dataVencimento: new Date(dataAtual),
            origem: 'RECORRENTE',
            lancamentoRecorrenteId: rec.id,
          };

          if (rec.tipo === 'RECEBER') {
            const existe = await prisma.contaReceber.findFirst({
              where: { lancamentoRecorrenteId: rec.id, competencia },
            });
            if (!existe) {
              const c = await prisma.contaReceber.create({ data: dados });
              gerados.push(c);
            }
          } else {
            const existe = await prisma.contaPagar.findFirst({
              where: { lancamentoRecorrenteId: rec.id, competencia },
            });
            if (!existe) {
              const c = await prisma.contaPagar.create({ data: dados });
              gerados.push(c);
            }
          }
        }
      }

      // Avança pela periodicidade
      switch (rec.periodicidade) {
        case 'DIARIO': dataAtual.setDate(dataAtual.getDate() + 1); break;
        case 'SEMANAL': dataAtual.setDate(dataAtual.getDate() + 7); break;
        case 'QUINZENAL': dataAtual.setDate(dataAtual.getDate() + 15); break;
        case 'MENSAL': dataAtual.setMonth(dataAtual.getMonth() + 1); break;
        case 'BIMESTRAL': dataAtual.setMonth(dataAtual.getMonth() + 2); break;
        case 'TRIMESTRAL': dataAtual.setMonth(dataAtual.getMonth() + 3); break;
        case 'SEMESTRAL': dataAtual.setMonth(dataAtual.getMonth() + 6); break;
        case 'ANUAL': dataAtual.setFullYear(dataAtual.getFullYear() + 1); break;
        default: break;
      }
    }

    if (gerados.length > 0) {
      await prisma.lancamentoRecorrente.update({
        where: { id: rec.id },
        data: { ocorrenciasGeradas: { increment: gerados.length } },
      });
    }

    res.json({ gerados: gerados.length, lancamentos: gerados });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.lancamentoRecorrente.update({
      where: { id: req.params.id },
      data: { ativo: false },
    });
    res.json({ message: 'Recorrente desativado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
