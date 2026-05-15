const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const auth = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await prisma.usuario.findUnique({ where: { id: decoded.id } });
    if (!usuario || !usuario.ativo) return res.status(401).json({ error: 'Usuário inválido' });

    req.usuario = usuario;
    req.empresaId = req.headers['x-empresa-id'] || decoded.empresaId;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

const checkEmpresa = async (req, res, next) => {
  if (!req.empresaId) return res.status(400).json({ error: 'Empresa não selecionada' });
  if (req.usuario.superAdmin) return next();

  const acesso = await prisma.empresaUsuario.findFirst({
    where: { empresaId: req.empresaId, usuarioId: req.usuario.id, ativo: true },
  });
  if (!acesso) return res.status(403).json({ error: 'Sem acesso a esta empresa' });

  req.perfil = acesso.perfil;
  next();
};

module.exports = { auth, checkEmpresa };
