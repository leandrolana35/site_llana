require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const app = express();

app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rotas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/empresas', require('./routes/empresas'));
app.use('/api/pessoas', require('./routes/pessoas'));
app.use('/api/plano-contas', require('./routes/planoContas'));
app.use('/api/centros-custo', require('./routes/centrosCusto'));
app.use('/api/contas-bancarias', require('./routes/contasBancarias'));
app.use('/api/contas-receber', require('./routes/contasReceber'));
app.use('/api/contas-pagar', require('./routes/contasPagar'));
app.use('/api/lancamentos-recorrentes', require('./routes/lancamentosRecorrentes'));
app.use('/api/nfse', require('./routes/nfse'));
app.use('/api/nfe', require('./routes/nfe'));
app.use('/api/conciliacao', require('./routes/conciliacao'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/configuracoes', require('./routes/configuracoes'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '1.0.0' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

module.exports = app;
