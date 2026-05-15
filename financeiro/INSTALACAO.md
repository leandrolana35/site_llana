# LLANA Financeiro — Guia de Instalação para Iniciantes (Windows)

## PASSO 1 — Instalar o Node.js

1. Acesse: **https://nodejs.org**
2. Clique no botão verde **"LTS"** (versão recomendada)
3. Baixe e instale normalmente (Next → Next → Install)
4. Ao finalizar, **reinicie o computador**

---

## PASSO 2 — Baixar o sistema

1. Acesse: **https://github.com/leandrolana35/site_llana/tree/claude/financial-management-system-afZaP**
2. Clique no botão verde **"Code"**
3. Clique em **"Download ZIP"**
4. Salve o arquivo ZIP na sua **Área de Trabalho**
5. Clique com botão direito no ZIP → **"Extrair tudo"** → Extrair
6. Vai criar uma pasta chamada `site_llana-claude-financial-management-system-afZaP`
7. **Renomeie** essa pasta para `LLANA` (mais fácil de encontrar)

---

## PASSO 3 — Instalar o sistema (só na primeira vez)

1. Abra a pasta `LLANA`
2. Depois abra a pasta `financeiro`
3. Clique duas vezes em **`setup.bat`**
4. Uma janela preta vai abrir — aguarde até aparecer **"Setup concluido!"**
5. Feche a janela

> ⚠️ Se aparecer "Windows protegeu seu computador", clique em **"Mais informações"** → **"Executar assim mesmo"**

---

## PASSO 4 — Abrir o sistema

1. Dentro da pasta `financeiro`
2. Clique duas vezes em **`iniciar.bat`**
3. Duas janelas pretas vão abrir (backend e frontend) — **não feche essas janelas**
4. O navegador abrirá automaticamente em **http://localhost:5173**

**Login:** admin@llana.com.br  
**Senha:** admin123

---

## Para usar no dia a dia

Toda vez que quiser abrir o sistema:
→ Clique duas vezes em **`iniciar.bat`**

Para fechar:
→ Feche as duas janelas pretas que ficam abertas

---

## Estrutura de pastas

```
LLANA/
├── financeiro/
│   ├── setup.bat        ← Instalar (só 1 vez)
│   ├── iniciar.bat      ← Abrir o sistema
│   ├── backend/         ← Servidor (não mexa)
│   │   └── prisma/
│   │       └── llana.db ← Seus dados ficam aqui!
│   └── frontend/        ← Interface (não mexa)
```

> 💾 Faça backup do arquivo `llana.db` regularmente — ele contém todos os seus dados!
