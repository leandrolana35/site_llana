# LLANA Sistema Financeiro

Sistema financeiro completo multi-empresa para gestão de faturamento, contas a receber/pagar e conciliação bancária.

## Requisitos

- Node.js 18+
- PostgreSQL 14+

## Instalação

### 1. Banco de Dados

```bash
# Criar banco PostgreSQL
createdb llana_financeiro
```

### 2. Backend

```bash
cd financeiro/backend
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com sua DATABASE_URL e JWT_SECRET

# Criar as tabelas no banco
npm run db:push

# Popular dados iniciais
npm run db:seed

# Iniciar servidor
npm run dev
```

### 3. Frontend

```bash
cd financeiro/frontend
npm install
npm run dev
```

Acesse: http://localhost:5173

**Login inicial:** admin@llana.com.br | **Senha:** admin123

---

## Módulos Implementados

### Financeiro
- **Contas a Receber** — Avulso, Recorrente, oriundo de Faturamento; baixas parciais/totais; geração de parcelas
- **Contas a Pagar** — Avulso, Recorrente, oriundo de Compras; baixas com desconto/juros/multa
- **Lançamentos Recorrentes** — Geração automática por periodicidade (diário → anual)

### Faturamento
- **NFS-e** — Nota Fiscal de Serviço Eletrônica (São Paulo-SP, prefeitura.sp.gov.br)
- **NF-e** — Nota Fiscal Eletrônica de Produto (SEFAZ-SP, schema 4.0)
- Cálculo automático de ISS, PIS, COFINS, CSLL, IRPJ, INSS
- Geração de títulos a receber a partir das notas emitidas

### Conciliação Bancária
- Importação via **XLSX** (planilha com mapeamento flexível de colunas)
- Importação via **OFX** (arquivo padrão bancário — Open Financial Exchange)
- Conciliação manual de extratos com títulos

### Cadastros
- **Pessoas** — PF e PJ (clientes, fornecedores, funcionários)
- **Plano de Contas** — Hierárquico, multi-nível
- **Centros de Custo**
- **Contas Bancárias** — Com saldo automaticamente atualizado

### Configurações
- **Multi-empresa** — Acesso por empresa com perfis de usuário
- **Faturamento** — Séries, numeração, ambiente (homologação/produção), prazos
- **Tributário** — Regime, alíquotas ISS/PIS/COFINS/CSLL/IRPJ/INSS

---

## Reforma Tributária (LC 214/2024)

O sistema já está preparado para a Reforma Tributária:

| Tributo | Substituição | Vigência |
|---------|-------------|----------|
| CBS | PIS + COFINS | 2026 |
| IBS | ICMS + ISS | 2026-2033 (gradual) |
| IS | Imposto Seletivo | 2026 |
| Split Payment | Recolhimento automático | 2026 |

Ative em **Configurações → Tributário → Reforma Tributária**.

---

## Roteiro Futuro

- [ ] Emissão de Boleto (integração bancária)
- [ ] CRM — Clientes, Oportunidades, Contratos
- [ ] Módulo de Compras — Pedidos, aprovações
- [ ] Estoque — Entradas, saídas, inventário
- [ ] Ativo Imobilizado — Bens, depreciação
- [ ] App Android — Inventário de Estoque
- [ ] App Android — Inventário de Ativo Imobilizado
- [ ] Integração direta bancária (Open Banking)
- [ ] Relatórios gerenciais e DRE
