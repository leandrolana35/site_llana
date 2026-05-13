/* ============================================================
   LLANA BRINDES — JAVASCRIPT GLOBAL
   Arquivo: js/main.js

   ÍNDICE:
   01. Menu mobile
   02. Header scroll
   03. Scroll reveal (IntersectionObserver)
   04. FAQ accordion
   05. Filtros de catálogo
   06. Busca de produtos
   07. Contadores animados
   08. Formulário de contato — validação básica
   09. Mailchimp — estrutura de submit
   10. HubSpot — hook de inicialização
   11. WhatsApp flutuante
   12. Smooth scroll para âncoras
   13. Init
   ============================================================ */

'use strict';

/* ============================================================
   01. MENU MOBILE
   ============================================================ */
function initMobileMenu() {
  const toggle   = document.querySelector('.menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (!toggle || !mobileMenu) return;

  toggle.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    toggle.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Fecha ao clicar em um link
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      toggle.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Fecha ao clicar fora
  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !mobileMenu.contains(e.target)) {
      mobileMenu.classList.remove('open');
      toggle.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
}

/* ============================================================
   02. HEADER SCROLL — adiciona classe "scrolled" ao rolar
   ============================================================ */
function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ============================================================
   03. SCROLL REVEAL (IntersectionObserver)
   Adicione a classe "reveal" (ou "reveal-left"/"reveal-right")
   em qualquer elemento para ativar a animação de entrada.
   ============================================================ */
function initScrollReveal() {
  const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  if (!els.length || !('IntersectionObserver' in window)) {
    // Fallback: mostra tudo sem animação
    els.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => observer.observe(el));
}

/* ============================================================
   04. FAQ ACCORDION
   ============================================================ */
function initFAQ() {
  const items = document.querySelectorAll('.faq-item');
  if (!items.length) return;

  items.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      // Fecha todos
      items.forEach(i => i.classList.remove('open'));
      // Abre o clicado (se estava fechado)
      if (!isOpen) item.classList.add('open');
    });
  });
}

/* ============================================================
   05. FILTROS DE CATÁLOGO
   Funciona com data-filter no botão e data-cat no card.
   ============================================================ */
function initCatalogFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn[data-filter]');
  const productCards = document.querySelectorAll('[data-cat]');
  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Atualiza botões ativos
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      productCards.forEach(card => {
        if (filter === 'all' || card.dataset.cat === filter) {
          card.style.display = '';
          setTimeout(() => card.classList.add('visible'), 10);
        } else {
          card.style.display = 'none';
          card.classList.remove('visible');
        }
      });
    });
  });
}

/* ============================================================
   06. BUSCA DE PRODUTOS (busca em nome e descrição)
   ============================================================ */
function initSearch() {
  const searchInput = document.getElementById('product-search');
  if (!searchInput) return;

  const productCards = document.querySelectorAll('.produto-card, .kit-card, .campanha-card');

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase().trim();

    productCards.forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(query) ? '' : 'none';
    });
  });

  // Botão de busca
  const searchBtn = document.getElementById('search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      searchInput.dispatchEvent(new Event('input'));
    });
  }
}

/* ============================================================
   07. CONTADORES ANIMADOS
   Adicione data-count="número" no elemento para animar.
   ============================================================ */
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el    = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      let start    = 0;
      const step   = Math.ceil(target / 60);
      const timer  = setInterval(() => {
        start += step;
        if (start >= target) {
          el.textContent = target.toLocaleString('pt-BR') + suffix;
          clearInterval(timer);
        } else {
          el.textContent = start.toLocaleString('pt-BR') + suffix;
        }
      }, 25);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

/* ============================================================
   08. FORMULÁRIO DE CONTATO — VALIDAÇÃO BÁSICA
   ============================================================ */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    // Remove erros anteriores
    form.querySelectorAll('.field-error').forEach(el => el.remove());
    form.querySelectorAll('.form-control').forEach(el => el.style.borderColor = '');

    // Validação simples dos campos obrigatórios
    form.querySelectorAll('[required]').forEach(field => {
      if (!field.value.trim()) {
        valid = false;
        field.style.borderColor = '#E53935';
        const err = document.createElement('span');
        err.className = 'field-error';
        err.style.cssText = 'color:#E53935;font-size:.78rem;display:block;margin-top:4px;';
        err.textContent = 'Campo obrigatório';
        field.parentNode.appendChild(err);
      }
    });

    // Validação de email
    const emailField = form.querySelector('[type="email"]');
    if (emailField && emailField.value.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailField.value)) {
        valid = false;
        emailField.style.borderColor = '#E53935';
        const err = document.createElement('span');
        err.className = 'field-error';
        err.style.cssText = 'color:#E53935;font-size:.78rem;display:block;margin-top:4px;';
        err.textContent = 'E-mail inválido';
        emailField.parentNode.appendChild(err);
      }
    }

    if (!valid) return;

    // Mostra feedback de sucesso
    const btn = form.querySelector('[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = '✓ Mensagem enviada!';
    btn.disabled = true;
    btn.style.background = '#2E7D32';

    // ATENÇÃO: Substitua este bloco pelo envio real ao HubSpot ou seu backend.
    // Exemplo de envio via fetch para uma endpoint customizada:
    /*
    const data = Object.fromEntries(new FormData(form));
    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    */

    setTimeout(() => {
      btn.textContent = originalText;
      btn.disabled = false;
      btn.style.background = '';
      form.reset();
    }, 4000);
  });
}

/* ============================================================
   09. MAILCHIMP — ESTRUTURA DE SUBMIT

   INSTRUÇÕES:
   1. Acesse sua conta Mailchimp
   2. Vá em Audience > Signup forms > Embedded forms
   3. Copie a URL de action (formato: https://xxx.us1.list-manage.com/subscribe/post)
   4. Substitua MAILCHIMP_ACTION_URL abaixo
   5. O campo "EMAIL" é padrão no Mailchimp (não altere o name)
   ============================================================ */
function initMailchimp() {
  const mcForm = document.getElementById('mc-form');
  if (!mcForm) return;

  mcForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const emailInput  = mcForm.querySelector('[name="EMAIL"]');
    const submitBtn   = mcForm.querySelector('[type="submit"]');
    const msgEl       = document.getElementById('mc-message');

    if (!emailInput || !emailInput.value.trim()) {
      if (msgEl) { msgEl.textContent = 'Digite seu e-mail.'; msgEl.style.color = '#E53935'; }
      return;
    }

    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;

    /* ===================================================
       MAILCHIMP JSONP SUBMIT
       Substitua a action abaixo pelo link do seu formulário Mailchimp.
       O URL deve terminar com &c=? para JSONP.
       =================================================== */
    const MAILCHIMP_ACTION_URL = 'SEU_LINK_DO_MAILCHIMP_AQUI'; // TROQUE AQUI

    const url = MAILCHIMP_ACTION_URL.replace('/post?', '/post-json?') + '&EMAIL=' + encodeURIComponent(emailInput.value) + '&c=llanaCallback';

    window.llanaCallback = function(data) {
      if (msgEl) {
        msgEl.style.color = data.result === 'success' ? '#2E7D32' : '#E53935';
        msgEl.textContent = data.result === 'success'
          ? '✓ Obrigado! Em breve você receberá nossas novidades.'
          : data.msg || 'Erro ao cadastrar. Tente novamente.';
      }
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      if (data.result === 'success') emailInput.value = '';
    };

    const script = document.createElement('script');
    script.src = url;
    document.body.appendChild(script);
    setTimeout(() => document.body.removeChild(script), 3000);
  });
}

/* ============================================================
   10. HUBSPOT — HOOK DE INICIALIZAÇÃO

   INSTRUÇÕES:
   1. Acesse sua conta HubSpot
   2. Vá em Marketing > Forms
   3. Crie um formulário ou copie o ID de um existente
   4. Substitua HUBSPOT_PORTAL_ID e HUBSPOT_FORM_ID abaixo
   5. O script do HubSpot é carregado dinamicamente aqui
   ============================================================ */
function initHubSpotForm(containerId) {
  /* ===================================================
     CONFIGURAÇÃO HUBSPOT — SUBSTITUA OS VALORES ABAIXO
     =================================================== */
  const HUBSPOT_PORTAL_ID = 'SEU_PORTAL_ID';   // Ex: '12345678'
  const HUBSPOT_FORM_ID   = 'SEU_FORM_ID';     // Ex: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

  const container = document.getElementById(containerId || 'hubspot-form');
  if (!container) return;

  // Verifica se o SDK do HubSpot já foi carregado
  if (window.hbspt) {
    window.hbspt.forms.create({
      portalId: HUBSPOT_PORTAL_ID,
      formId:   HUBSPOT_FORM_ID,
      target:   '#' + (containerId || 'hubspot-form'),
      onFormSubmit: function() {
        // Callback após submit — personalize conforme necessário
        console.log('[LLANA] HubSpot form submitted');
      }
    });
    return;
  }

  // Carrega o SDK do HubSpot dinamicamente
  const script = document.createElement('script');
  script.src = '//js.hsforms.net/forms/embed/v2.js';
  script.charset = 'utf-8';
  script.type = 'text/javascript';
  script.onload = function() {
    if (window.hbspt) {
      window.hbspt.forms.create({
        portalId: HUBSPOT_PORTAL_ID,
        formId:   HUBSPOT_FORM_ID,
        target:   '#' + (containerId || 'hubspot-form')
      });
    }
  };
  document.head.appendChild(script);
}

/* ============================================================
   11. WHATSAPP FLUTUANTE
   Troque o número abaixo pelo número real da LLANA.
   Formato: código do país + DDD + número (sem espaços ou traços)
   ============================================================ */
function initWhatsApp() {
  const btn = document.querySelector('.whatsapp-float-btn');
  if (!btn) return;

  /* TROQUE pelo número real do WhatsApp da LLANA */
  const WHATSAPP_NUMBER  = '5511999999999'; // Ex: 5511999999999
  const WHATSAPP_MESSAGE = encodeURIComponent('Olá! Gostaria de solicitar um orçamento de brindes personalizados.');

  btn.addEventListener('click', () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`, '_blank');
  });
}

/* ============================================================
   12. SMOOTH SCROLL PARA ÂNCORAS
   ============================================================ */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--hdr-height')) || 78;
      const top = target.getBoundingClientRect().top + window.scrollY - offset - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ============================================================
   13. INIT — Inicializa tudo ao carregar a página
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initHeaderScroll();
  initScrollReveal();
  initFAQ();
  initCatalogFilters();
  initSearch();
  initCounters();
  initContactForm();
  initMailchimp();
  initWhatsApp();
  initSmoothScroll();

  /* HubSpot: descomente a linha abaixo para inicializar o form do HubSpot.
     Passe o ID do elemento HTML onde o form deve ser renderizado.        */
  // initHubSpotForm('hubspot-form');
});
