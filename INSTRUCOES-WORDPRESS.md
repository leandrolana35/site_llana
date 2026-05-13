# INSTRUÇÕES DE PUBLICAÇÃO NO WORDPRESS
## Site LLANA Brindes — Guia completo

---

## ESTRUTURA DO PROJETO

```
site_llana/
├── css/
│   └── style.css         ← CSS global (todas as páginas)
├── js/
│   └── main.js           ← JavaScript global (todas as páginas)
├── img/                  ← Coloque suas imagens aqui
│   ├── logo-llana.png    ← Logo da marca LLANA
│   └── ...
├── index.html            ← Página Principal
├── catalogo.html         ← Catálogo de Brindes
├── campanhas.html        ← Mural de Campanhas
├── kits.html             ← Kits Promocionais
└── contato.html          ← Contato e Orçamento
```

---

## OPÇÃO 1 — PUBLICAR COMO SITE ESTÁTICO (mais simples)

Se você quiser hospedar como site HTML puro (sem WordPress):

1. Faça upload de toda a pasta `site_llana/` para o servidor via FTP
2. Aponte o domínio para a pasta
3. O site já funciona completo

---

## OPÇÃO 2 — PUBLICAR NO WORDPRESS (passo a passo)

### PASSO 1 — Adicionar o CSS global

**Método A (recomendado): via Appearance > Customize**
1. No painel do WordPress: Aparência > Personalizar > CSS Adicional
2. Cole o conteúdo completo do arquivo `css/style.css`
3. Clique em "Publicar"

**Método B: via plugin**
1. Instale o plugin "Simple Custom CSS and JS"
2. Vá em CSS and JS > Add Custom CSS
3. Cole o conteúdo do `css/style.css`
4. Marque "Linked file" e salve

**Método C: via tema filho**
1. Adicione a linha no `functions.php` do tema filho:
```php
wp_enqueue_style('llana-style', get_stylesheet_directory_uri() . '/css/style.css');
```
2. Faça upload do `css/style.css` para a pasta do tema filho

---

### PASSO 2 — Adicionar o JavaScript global

**Método A: via plugin "Insert Headers and Footers"**
1. Instale o plugin
2. Vá em Settings > Insert Headers and Footers
3. Cole no campo "Scripts in Footer":
```html
<script src="/wp-content/uploads/llana/js/main.js"></script>
```
4. Faça upload do `js/main.js` via Media > Adicionar novo arquivo

**Método B: via functions.php do tema filho**
```php
wp_enqueue_script('llana-js', get_stylesheet_directory_uri() . '/js/main.js', array(), '1.0', true);
```

---

### PASSO 3 — Criar as páginas no WordPress

Para cada página (Início, Catálogo, Campanhas, Kits, Contato):

1. No painel: Páginas > Adicionar nova
2. Dê o título da página (ex: "Catálogo de Brindes")
3. No editor: clique nos 3 pontos (⋮) > "Editor de código" ou use o bloco "HTML personalizado"
4. Cole o conteúdo HTML entre as tags `<main>` e `</main>` do arquivo correspondente
   - **Não inclua** `<html>`, `<head>`, `<body>`, header ou footer — o WordPress já os gera
5. Clique em "Publicar"

**ATENÇÃO:** O header e o footer do site são do WordPress (do tema ativo).
Para usar o header/footer do projeto LLANA, você precisa de um tema que suporte HTML customizado,
ou use um page builder como Elementor com template em branco.

---

### PASSO 4 — Usar o header e footer LLANA no WordPress

**Opção A: Tema em branco (recomendado)**
1. Instale o tema "Blank Canvas" ou "Astra" (com template em branco)
2. Ao criar cada página, selecione o template "Sem cabeçalho/rodapé" ou "Blank"
3. Cole o HTML completo de cada página (incluindo header e footer LLANA)

**Opção B: Com Elementor (gratuito)**
1. Instale o Elementor
2. Edite a página com Elementor
3. Mude o template para "Tela cheia" (sem header/footer do tema)
4. Adicione um bloco "HTML" e cole o código da página completa

**Opção C: Plugin "WP Full Page"**
1. Instale o plugin que permite páginas sem header/footer do tema
2. Cole o HTML completo de cada página

---

### PASSO 5 — Ajustar links entre páginas

Por padrão, os links no código HTML apontam para:
- `index.html` → substitua pela URL da sua página inicial (ex: `/`)
- `catalogo.html` → substitua pelo permalink (ex: `/catalogo`)
- `campanhas.html` → `/campanhas`
- `kits.html` → `/kits-promocionais`
- `contato.html` → `/contato`

**Como fazer em lote:**
Use o "Ctrl+H" (buscar e substituir) no editor de texto para substituir todos os links de uma vez antes de colar no WordPress.

---

### PASSO 6 — Substituir imagens

Todas as imagens placeholder seguem o padrão:
```html
src="https://placehold.co/LARGURA×ALTURA/COR_FUNDO/COR_TEXTO?text=DESCRIÇÃO"
```

Para substituir:
1. Faça upload da sua imagem via WordPress > Mídia > Adicionar novo
2. Copie a URL da imagem no WordPress (ex: `https://seusite.com/wp-content/uploads/2025/01/produto.jpg`)
3. Substitua no HTML:
   - Antes: `src="https://placehold.co/400x400/..."`
   - Depois: `src="https://seusite.com/wp-content/uploads/2025/01/produto.jpg"`

**Dica:** Todos os pontos de troca de imagem têm comentários no código, como:
```html
<!-- TROQUE pela foto do produto COM A LOGOMARCA LLANA APLICADA -->
```

---

### PASSO 7 — Configurar o WhatsApp flutuante

No arquivo `js/main.js`, linha da função `initWhatsApp()`:
```javascript
const WHATSAPP_NUMBER  = '5511999999999'; // TROQUE pelo número real
const WHATSAPP_MESSAGE = encodeURIComponent('...mensagem padrão...');
```

Ou diretamente no HTML, troque o href:
```html
href="https://wa.me/5511999999999?text=Sua+mensagem"
```

---

## CONFIGURAR O HUBSPOT

1. Acesse: app.hubspot.com
2. Marketing > Forms > Criar formulário (ou use um existente)
3. No formulário criado, copie:
   - **Portal ID**: Settings > Account > HubSpot Account ID
   - **Form ID**: na URL do formulário ou em "Share > Embed"
4. No arquivo `js/main.js`, edite a função `initHubSpotForm`:
```javascript
const HUBSPOT_PORTAL_ID = '12345678';                          // seu Portal ID
const HUBSPOT_FORM_ID   = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxx';     // seu Form ID
```
5. Em `contato.html`:
   - Comente o bloco `id="formulario-nativo"`
   - Descomente o bloco "OPÇÃO B — FORMULÁRIO HUBSPOT"
6. No final de `js/main.js`, descomente:
```javascript
// initHubSpotForm('hubspot-form');
```

---

## CONFIGURAR O MAILCHIMP

1. Acesse: mailchimp.com
2. Audience > Signup forms > Embedded forms
3. Copie a URL de `action` do formulário (formato: `https://xxxx.us1.list-manage.com/subscribe/post?...`)
4. Substitua em **todos** os formulários do site:
```html
<form id="mc-form" action="COLE_AQUI_A_URL_DO_MAILCHIMP" method="post">
```
5. O campo honeypot: substitua o valor de `name`:
```html
<input type="text" name="b_SEU_CODIGO_MAILCHIMP" tabindex="-1" value="">
```
   (O Mailchimp fornece esse código no código do formulário embedded)

---

## CHECKLIST FINAL ANTES DE PUBLICAR

- [ ] Substituir todos os números de telefone/WhatsApp
- [ ] Substituir todos os endereços de e-mail
- [ ] Substituir endereço físico da empresa
- [ ] Inserir a logomarca LLANA real nos headers (comentário: `<!-- TROQUE: logomarca LLANA -->`)
- [ ] Substituir imagens placeholder pelos mockups reais (com logo LLANA aplicada)
- [ ] Ajustar links entre páginas para os permalinks reais do WordPress
- [ ] Configurar HubSpot (Portal ID + Form ID)
- [ ] Configurar Mailchimp (action URL)
- [ ] Atualizar links das redes sociais no footer
- [ ] Inserir iframe real do Google Maps na página Contato
- [ ] Verificar responsivo no celular após publicação
- [ ] Testar formulário de contato enviando mensagem de teste
- [ ] Atualizar o ano no copyright do footer

---

## DÚVIDAS FREQUENTES DE PUBLICAÇÃO

**O CSS não está sendo aplicado no WordPress. O que fazer?**
Verifique se o CSS foi adicionado corretamente via "CSS Adicional" e se não há conflito com o tema ativo. Tente usar `!important` nas propriedades críticas ou prefixe as classes com `.llana-` para evitar conflitos.

**O menu mobile não está funcionando. O que fazer?**
Confirme que o `js/main.js` está sendo carregado na página. Abra o Console do navegador (F12) e veja se há erros de JavaScript.

**Os filtros do catálogo não funcionam. O que fazer?**
Verifique se os atributos `data-filter` nos botões correspondem aos `data-cat` nos cards de produto.

**Como adicionar um novo produto no catálogo?**
Copie um bloco `.produto-card` completo no `catalogo.html`, substitua a imagem, textos e defina o `data-cat` para a categoria correta.

---

*Documentação gerada para o projeto LLANA Brindes.*
