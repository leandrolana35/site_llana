const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed...');

  // Usuário admin
  const hash = await bcrypt.hash('admin123', 10);
  const usuario = await prisma.usuario.upsert({
    where: { email: 'admin@llana.com.br' },
    update: {},
    create: { nome: 'Administrador', email: 'admin@llana.com.br', senha: hash, superAdmin: true },
  });

  // Empresa exemplo
  const empresa = await prisma.empresa.upsert({
    where: { cnpj: '00.000.000/0001-00' },
    update: {},
    create: {
      razaoSocial: 'LLANA SERVIÇOS LTDA',
      nomeFantasia: 'LLANA',
      cnpj: '00.000.000/0001-00',
      inscricaoMunicipal: '12345678',
      regimeTributario: 'SIMPLES_NACIONAL',
      tipoEmpresa: 'SERVICO',
      logradouro: 'Av. Paulista',
      numero: '1000',
      bairro: 'Bela Vista',
      municipio: 'São Paulo',
      uf: 'SP',
      cep: '01310-100',
      email: 'contato@llana.com.br',
      empresasUsuario: { create: { usuarioId: usuario.id, perfil: 'ADMIN' } },
      configFaturamento: {
        create: {
          emiteNFSe: true, proximoNumeroNFSe: 1, ambienteNFSe: 'HOMOLOGACAO',
          emiteNFe: false, proximoNumeroNFe: 1, diasVencimentoPadrao: 30,
        },
      },
      configTributaria: {
        create: {
          aliquotaIss: 2.00, aliquotaPis: 0.65, aliquotaCofins: 3.00,
          aliquotaCsll: 1.00, aliquotaIrpj: 1.50,
          preparadoReformaTrib: true, anexoSimples: 'III',
        },
      },
    },
  });

  // Plano de contas padrão
  const planoBase = [
    { codigo: '1', descricao: 'ATIVO', tipo: 'ATIVO', natureza: 'DEVEDORA', aceitaLancamento: false },
    { codigo: '1.1', descricao: 'ATIVO CIRCULANTE', tipo: 'ATIVO', natureza: 'DEVEDORA', aceitaLancamento: false },
    { codigo: '1.1.1', descricao: 'CAIXA E EQUIVALENTES', tipo: 'ATIVO', natureza: 'DEVEDORA', aceitaLancamento: false },
    { codigo: '1.1.1.01', descricao: 'CAIXA', tipo: 'ATIVO', natureza: 'DEVEDORA', nivel: 4 },
    { codigo: '1.1.1.02', descricao: 'BANCO CONTA CORRENTE', tipo: 'ATIVO', natureza: 'DEVEDORA', nivel: 4 },
    { codigo: '1.1.2', descricao: 'CONTAS A RECEBER', tipo: 'ATIVO', natureza: 'DEVEDORA', aceitaLancamento: false },
    { codigo: '1.1.2.01', descricao: 'CLIENTES', tipo: 'ATIVO', natureza: 'DEVEDORA', nivel: 4 },
    { codigo: '2', descricao: 'PASSIVO', tipo: 'PASSIVO', natureza: 'CREDORA', aceitaLancamento: false },
    { codigo: '2.1', descricao: 'PASSIVO CIRCULANTE', tipo: 'PASSIVO', natureza: 'CREDORA', aceitaLancamento: false },
    { codigo: '2.1.1', descricao: 'FORNECEDORES', tipo: 'PASSIVO', natureza: 'CREDORA', aceitaLancamento: false },
    { codigo: '2.1.1.01', descricao: 'FORNECEDORES NACIONAIS', tipo: 'PASSIVO', natureza: 'CREDORA', nivel: 4 },
    { codigo: '2.1.2', descricao: 'OBRIGAÇÕES FISCAIS', tipo: 'PASSIVO', natureza: 'CREDORA', aceitaLancamento: false },
    { codigo: '2.1.2.01', descricao: 'ISS A RECOLHER', tipo: 'PASSIVO', natureza: 'CREDORA', nivel: 4 },
    { codigo: '2.1.2.02', descricao: 'PIS A RECOLHER', tipo: 'PASSIVO', natureza: 'CREDORA', nivel: 4 },
    { codigo: '2.1.2.03', descricao: 'COFINS A RECOLHER', tipo: 'PASSIVO', natureza: 'CREDORA', nivel: 4 },
    { codigo: '2.1.2.04', descricao: 'CBS A RECOLHER', tipo: 'PASSIVO', natureza: 'CREDORA', nivel: 4 },
    { codigo: '2.1.2.05', descricao: 'IBS A RECOLHER', tipo: 'PASSIVO', natureza: 'CREDORA', nivel: 4 },
    { codigo: '3', descricao: 'RECEITAS', tipo: 'RECEITA', natureza: 'CREDORA', aceitaLancamento: false },
    { codigo: '3.1', descricao: 'RECEITA BRUTA', tipo: 'RECEITA', natureza: 'CREDORA', aceitaLancamento: false },
    { codigo: '3.1.1.01', descricao: 'RECEITA DE SERVIÇOS', tipo: 'RECEITA', natureza: 'CREDORA', nivel: 4 },
    { codigo: '3.1.1.02', descricao: 'RECEITA DE PRODUTOS', tipo: 'RECEITA', natureza: 'CREDORA', nivel: 4 },
    { codigo: '4', descricao: 'DESPESAS', tipo: 'DESPESA', natureza: 'DEVEDORA', aceitaLancamento: false },
    { codigo: '4.1', descricao: 'DESPESAS OPERACIONAIS', tipo: 'DESPESA', natureza: 'DEVEDORA', aceitaLancamento: false },
    { codigo: '4.1.1.01', descricao: 'SALÁRIOS E ENCARGOS', tipo: 'DESPESA', natureza: 'DEVEDORA', nivel: 4 },
    { codigo: '4.1.1.02', descricao: 'ALUGUEL', tipo: 'DESPESA', natureza: 'DEVEDORA', nivel: 4 },
    { codigo: '4.1.1.03', descricao: 'TELEFONIA E INTERNET', tipo: 'DESPESA', natureza: 'DEVEDORA', nivel: 4 },
    { codigo: '4.1.1.04', descricao: 'ENERGIA ELÉTRICA', tipo: 'DESPESA', natureza: 'DEVEDORA', nivel: 4 },
    { codigo: '4.1.1.05', descricao: 'MATERIAL DE ESCRITÓRIO', tipo: 'DESPESA', natureza: 'DEVEDORA', nivel: 4 },
    { codigo: '4.1.1.06', descricao: 'SERVIÇOS DE TERCEIROS', tipo: 'DESPESA', natureza: 'DEVEDORA', nivel: 4 },
    { codigo: '4.1.2.01', descricao: 'SIMPLES NACIONAL', tipo: 'DESPESA', natureza: 'DEVEDORA', nivel: 4 },
    { codigo: '4.1.2.02', descricao: 'IRPJ', tipo: 'DESPESA', natureza: 'DEVEDORA', nivel: 4 },
    { codigo: '4.1.2.03', descricao: 'CSLL', tipo: 'DESPESA', natureza: 'DEVEDORA', nivel: 4 },
  ];

  for (const conta of planoBase) {
    await prisma.planoContas.upsert({
      where: { empresaId_codigo: { empresaId: empresa.id, codigo: conta.codigo } },
      update: {},
      create: { ...conta, empresaId: empresa.id, nivel: conta.nivel || conta.codigo.split('.').length },
    });
  }

  // Centros de custo padrão
  const centros = [
    { codigo: '01', descricao: 'ADMINISTRATIVO' },
    { codigo: '02', descricao: 'COMERCIAL' },
    { codigo: '03', descricao: 'OPERACIONAL' },
    { codigo: '04', descricao: 'FINANCEIRO' },
  ];

  for (const c of centros) {
    await prisma.centroCusto.upsert({
      where: { empresaId_codigo: { empresaId: empresa.id, codigo: c.codigo } },
      update: {},
      create: { ...c, empresaId: empresa.id },
    });
  }

  // Conta bancária exemplo
  await prisma.contaBancaria.upsert({
    where: { id: 'caixa-llana' },
    update: {},
    create: {
      id: 'caixa-llana',
      empresaId: empresa.id,
      descricao: 'CAIXA',
      tipoConta: 'CAIXA',
      saldoInicial: 0,
      saldoAtual: 0,
    },
  });

  console.log('Seed concluído!');
  console.log('Login: admin@llana.com.br | Senha: admin123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
