const router = require('express').Router();
const multer = require('multer');
const XLSX = require('xlsx');
const prisma = require('../config/prisma');
const { auth, checkEmpresa } = require('../middleware/auth');

router.use(auth, checkEmpresa);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/', async (req, res) => {
  try {
    const conciliacoes = await prisma.conciliacaoBancaria.findMany({
      where: { empresaId: req.empresaId },
      include: { contaBancaria: { select: { id: true, descricao: true, banco: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(conciliacoes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const conc = await prisma.conciliacaoBancaria.create({
      data: { ...req.body, empresaId: req.empresaId, status: 'EM_ANDAMENTO' },
    });
    res.status(201).json(conc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Import de extrato via planilha XLSX
router.post('/:id/importar-xlsx', upload.single('arquivo'), async (req, res) => {
  try {
    const { id } = req.params;
    const conciliacao = await prisma.conciliacaoBancaria.findFirst({
      where: { id, empresaId: req.empresaId },
    });
    if (!conciliacao) return res.status(404).json({ error: 'Conciliação não encontrada' });

    const wb = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: null });

    // Mapeamento flexível de colunas
    const mapearLinha = (row) => {
      const keys = Object.keys(row).map(k => k.toLowerCase().trim());
      const get = (...names) => {
        for (const name of names) {
          const key = keys.find(k => k.includes(name));
          if (key) return row[Object.keys(row)[keys.indexOf(key)]];
        }
        return null;
      };

      const data = get('data', 'date', 'dt');
      const historico = get('historico', 'descricao', 'description', 'memo');
      const valorStr = get('valor', 'value', 'amount', 'credito', 'debito');
      const documento = get('documento', 'doc', 'numero');

      if (!data || valorStr == null) return null;

      const valor = parseFloat(String(valorStr).replace(',', '.').replace(/[^0-9.-]/g, ''));

      return {
        conciliacaoId: id,
        contaBancariaId: conciliacao.contaBancariaId,
        data: data instanceof Date ? data : new Date(data),
        historico: String(historico || ''),
        documento: documento ? String(documento) : null,
        valor: Math.abs(valor),
        tipo: valor >= 0 ? 'CREDITO' : 'DEBITO',
      };
    };

    const extratos = rows.map(mapearLinha).filter(Boolean);

    await prisma.extratoBancario.createMany({ data: extratos, skipDuplicates: true });

    res.json({ importados: extratos.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Import de extrato via OFX/TXT
router.post('/:id/importar-ofx', upload.single('arquivo'), async (req, res) => {
  try {
    const { id } = req.params;
    const conciliacao = await prisma.conciliacaoBancaria.findFirst({
      where: { id, empresaId: req.empresaId },
    });
    if (!conciliacao) return res.status(404).json({ error: 'Conciliação não encontrada' });

    const conteudo = req.file.buffer.toString('latin1');
    const transacoes = [];
    const regexStmt = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
    let match;

    while ((match = regexStmt.exec(conteudo)) !== null) {
      const bloco = match[1];
      const get = (tag) => {
        const m = new RegExp(`<${tag}>([^<]+)`).exec(bloco);
        return m ? m[1].trim() : null;
      };

      const trntype = get('TRNTYPE');
      const dtposted = get('DTPOSTED');
      const trnamt = get('TRNAMT');
      const memo = get('MEMO') || get('NAME');
      const fitid = get('FITID');

      if (!dtposted || !trnamt) continue;

      const year = dtposted.substring(0, 4);
      const month = dtposted.substring(4, 6);
      const day = dtposted.substring(6, 8);
      const data = new Date(`${year}-${month}-${day}`);
      const valor = parseFloat(trnamt.replace(',', '.'));

      transacoes.push({
        conciliacaoId: id,
        contaBancariaId: conciliacao.contaBancariaId,
        data,
        historico: memo || trntype || '',
        documento: fitid,
        valor: Math.abs(valor),
        tipo: valor >= 0 ? 'CREDITO' : 'DEBITO',
      });
    }

    await prisma.extratoBancario.createMany({ data: transacoes, skipDuplicates: true });
    res.json({ importados: transacoes.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar extratos da conciliação
router.get('/:id/extratos', async (req, res) => {
  try {
    const extratos = await prisma.extratoBancario.findMany({
      where: { conciliacaoId: req.params.id },
      orderBy: { data: 'asc' },
    });
    res.json(extratos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Conciliar extrato com título
router.post('/:id/conciliar', async (req, res) => {
  try {
    const { extratoId, tituloId, tipo } = req.body;
    // tipo: 'receber' | 'pagar'

    await prisma.extratoBancario.update({
      where: { id: extratoId },
      data: { conciliado: true },
    });

    if (tipo === 'receber') {
      await prisma.contaReceber.update({
        where: { id: tituloId },
        data: { conciliado: true, dataConciliacao: new Date(), extratoId },
      });
    } else {
      await prisma.contaPagar.update({
        where: { id: tituloId },
        data: { conciliado: true, dataConciliacao: new Date(), extratoId },
      });
    }

    res.json({ message: 'Conciliado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/finalizar', async (req, res) => {
  try {
    const conc = await prisma.conciliacaoBancaria.update({
      where: { id: req.params.id },
      data: { status: 'CONCLUIDA', ...req.body },
    });
    res.json(conc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
