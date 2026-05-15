const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { auth } = require('../middleware/auth');

router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: {
        empresasUsuario: { where: { ativo: true }, include: { empresa: true } },
      },
    });
    if (!usuario || !usuario.ativo) return res.status(401).json({ error: 'Credenciais inválidas' });

    const senhaOk = await bcrypt.compare(senha, usuario.senha);
    if (!senhaOk) return res.status(401).json({ error: 'Credenciais inválidas' });

    const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });

    const { senha: _, ...usuarioSemSenha } = usuario;
    res.json({ token, usuario: usuarioSemSenha });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/registro', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) return res.status(400).json({ error: 'E-mail já cadastrado' });

    const hash = await bcrypt.hash(senha, 10);
    const usuario = await prisma.usuario.create({
      data: { nome, email, senha: hash, superAdmin: true },
    });
    const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });
    const { senha: _, ...usuarioSemSenha } = usuario;
    res.status(201).json({ token, usuario: usuarioSemSenha });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', auth, async (req, res) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.usuario.id },
    include: {
      empresasUsuario: { where: { ativo: true }, include: { empresa: true } },
    },
  });
  const { senha: _, ...usuarioSemSenha } = usuario;
  res.json(usuarioSemSenha);
});

router.put('/senha', auth, async (req, res) => {
  try {
    const { senhaAtual, novaSenha } = req.body;
    const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario.id } });
    const ok = await bcrypt.compare(senhaAtual, usuario.senha);
    if (!ok) return res.status(400).json({ error: 'Senha atual incorreta' });
    const hash = await bcrypt.hash(novaSenha, 10);
    await prisma.usuario.update({ where: { id: req.usuario.id }, data: { senha: hash } });
    res.json({ message: 'Senha alterada com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
