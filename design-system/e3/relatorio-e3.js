/* Relatório E3 · site em seções com scroll (skin E3: amarelo e preto)
   Uma página por cliente. Semanal, Diário e Mensal trocam os dados na mesma página (?r=tipo/AAAA-MM-DD).
   Movimento: motor scroll-craft (scrollcraft/scrollcraft.js, sem edição). As seções marcam data-sc-*;
   o leque, a capa e os blocos de sentimento leem o --sc-p da cena. No PDF tudo vai para o estado final
   e cada seção vira uma página A4 deitada. Blocos ligam/desligam pelo que existe nos dados. */
(function () {
  /* ---------------- utilidades ---------------- */
  const h = (tag, at = {}, ...filhos) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(at || {})) {
      if (v == null || v === false) continue;
      if (k === 'html') el.innerHTML = v; else if (k.startsWith('on')) el[k] = v; else el.setAttribute(k, v === true ? '' : v);
    }
    filhos.flat(9).forEach(f => f != null && f !== false && el.append(f.nodeType ? f : document.createTextNode(f)));
    return el;
  };
  const svg = s => { const t = document.createElement('template'); t.innerHTML = s.trim(); return t.content.firstChild; };
  const nf = (n, d = 0) => Number(n).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const varPct = (v, a) => a ? (v - a) / a * 100 : null;
  const pctBaixo = (a, t) => t ? Math.floor(a / t * 100) : 0;          // o PDF trunca os percentuais
  const clamp01 = x => x < 0 ? 0 : x > 1 ? 1 : x;
  const reduz = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mouse = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
  const celular = () => matchMedia('(max-width: 760px)').matches;
  const final = () => document.documentElement.classList.contains('final');

  /* cenas: no computador algumas seções ficam presas (pin) e a rolagem conduz o que acontece nelas;
     no celular tudo é fluxo (flow), com as entradas ainda guiadas pela rolagem. */
  let PRESO = true;
  function cena(sec, span) {
    if (PRESO && span) {
      sec.classList.add('sc-stage');
      return h('div', { class: 'cena', 'data-sc-act': 'pin', 'data-sc-span': span }, sec);
    }
    sec.setAttribute('data-sc-act', 'flow');
    return sec;
  }
  /* entrada guiada pela rolagem: valor da cena presa e valor do fluxo */
  const cue = (pin, flow) => (PRESO ? pin : flow);
  const quadro = (el, val, cls = '') => h('div', { class: 'cue ' + cls, 'data-sc-cue': val }, el);

  /* número que conta ao entrar: 214000 -> "214 mil", 68228 -> "68.228" (cheio) */
  function num(n, o = {}) {
    let v = n, u = '', d = 0;
    if (!o.cheio && n >= 1e6) { v = n / 1e6; u = 'mi'; } else if (!o.cheio && n >= 1e4) { v = n / 1e3; u = 'mil'; }
    if (u && Math.round(v * 10) % 10 !== 0) d = 1;
    if (o.d != null) d = o.d;
    return h('span', { class: 'n' + (o.cls ? ' ' + o.cls : '') },
      h('span', { class: 'n-v', 'data-n': v, 'data-d': d }, nf(v, d)), u ? h('small', {}, ' ' + u) : null, o.suf ? h('small', {}, o.suf) : null);
  }
  const txtNum = n => num(n).textContent;
  function pill(p, cls = '') {
    if (p == null) return null;
    const t = p > 0.05 ? 'sobe' : p < -0.05 ? 'desce' : 'igual';
    return h('span', { class: 'pill pill--' + t + ' ' + cls }, (t === 'sobe' ? '↑ ' : t === 'desce' ? '↓ ' : '= ') + nf(Math.abs(p), 1).replace(',0', '') + '%');
  }

  const I = {
    pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
    coracao: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    balao: '<path d="M7 17 3 21V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2z"/>',
    olho: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    compartilhar: '<path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v14"/>',
    pdf: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
    topo: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    fechar: '<path d="M6 6l12 12M18 6 6 18"/>',
    seta: '<path d="M7 17 17 7M8 7h9v9"/>',
    raio: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    opcoes: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
    semana: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4M7 14h10"/>',
    dia: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/><circle cx="12" cy="15.5" r="1.6"/>',
    mes: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4M7 14h2M11 14h2M15 14h2M7 17.5h2M11 17.5h2"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    sair: '<path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M14 16l4-4-4-4M18 12H8"/>',
    imagem: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
    facebook: '<path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V10H6.5v3.5H9V21h3.5v-7.5H15l.5-3.5h-3V7a1 1 0 0 1 1-1H15z"/>',
    tiktok: '<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.5 2.6 2.4 4.4 5 4.6"/>'
  };
  const ic = (n, cls = '') => h('span', { class: 'ic ' + cls, 'aria-hidden': 'true', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (I[n] || '') + '</svg>' });
  const iniciais = s => s.replace(/\(\d\)/g, '').replace(/[^\p{L}\d ]/gu, ' ').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const irPara = id => { const el = document.getElementById(id); if (!el) return; const alvo = el.closest('.cena') || el; scrollTo({ top: alvo.getBoundingClientRect().top + scrollY, behavior: reduz() ? 'auto' : 'smooth' }); };

  const TIPOS = [['semanal', 'Semanal', 'semana'], ['diario', 'Diário', 'dia'], ['mensal', 'Mensal', 'mes']];
  const TIPO_TXT = { semanal: 'semanal', diario: 'diário', mensal: 'mensal' };
  const DA = { semanal: 'da semana', diario: 'do dia', mensal: 'do mês' };
  const tituloDe = D => D.titulo || 'Relatório ' + TIPO_TXT[D.tipo] + ' de redes sociais';

  /* ---------------- seções ---------------- */
  function capa(D, cfg, ctx) {
    const c = D.capa || {};
    const ano = (D.periodo.fim || '').slice(0, 4);
    const sai = PRESO ? '-0.3 0.66' : null;      // no computador o título sai conforme a câmera aproxima
    return cena(h('section', { class: 'sec sec--capa', id: 'inicio', 'data-sec': 'capa', 'aria-label': 'Capa' },
      h('div', { class: 'capa-foto', 'data-plano': '0.6' },
        h('picture', {}, c.celular ? h('source', { media: 'screen and (max-width: 760px)', srcset: c.celular }) : null,
          h('img', { src: c.foto, alt: 'Ponte estaiada de ' + D.cliente.cidade + ' ao pôr do sol', style: c.foco ? 'object-position:' + c.foco : null, fetchpriority: 'high' }))),
      h('div', { class: 'capa-sol', 'data-plano': '0.3' }),
      h('div', { class: 'capa-tinta' }),
      h('header', { class: 'capa-topo' },
        h('div', { class: 'capa-cliente' },
          cfg.marcaBranca ? h('img', { class: 'capa-marca', src: cfg.marcaBranca, alt: D.cliente.nome }) : h('b', {}, D.cliente.nome),
          seletor(ctx, 'capa-sel')),
        cfg.logoE3 ? h('img', { class: 'capa-e3', src: cfg.logoE3, alt: 'E3 Comunicação Integrada' }) : null),
      h('div', { class: 'capa-txt', 'data-plano': '-0.25' },
        h('p', { class: 'capa-local', 'data-sc-cue': sai }, ic('pin'), D.cliente.cidade + (D.cliente.uf ? ' · ' + D.cliente.uf : '')),
        h('h1', { 'data-sc-cue': sai, 'data-sc-kinetic': sai ? 'lines' : null }, tituloDe(D)),
        h('p', { class: 'capa-periodo', 'data-sc-cue': sai }, D.periodo.texto + (ano ? ' de ' + ano : '')))), 1.7);
  }

  /* Semanal · Diário · Mensal (capa e menu usam o mesmo) */
  function seletor(ctx, cls) {
    return h('div', { class: 'seletor ' + cls, role: 'group', 'aria-label': 'Tipo de relatório' },
      TIPOS.map(([t, nome]) => {
        const tem = (ctx.edicoes[t] || []).length > 0, ativo = t === ctx.tipo;
        return h('button', { type: 'button', class: 'sel-bt' + (ativo ? ' is-ativo' : ''), 'aria-pressed': ativo ? 'true' : 'false', disabled: !tem && !ativo,
          onclick: () => tem && !ativo && ctx.trocar(t) }, nome, !tem ? h('small', {}, 'em breve') : null);
      }));
  }

  function resumo(D) {
    if (!D.resumo) return null;
    return cena(h('section', { class: 'sec sec--resumo', id: 'resumo', 'data-sec': 'resumo', 'aria-labelledby': 't-resumo' },
      h('div', { class: 'resumo-fundo' }, h('img', { src: (D.capa || {}).foto, alt: '', 'aria-hidden': 'true' })),
      h('article', { class: 'resumo-card' },
        h('div', { class: 'resumo-topo' }, h('span', { class: 'bola' }, ic('raio')), h('h2', { id: 't-resumo' }, 'Resumo ' + DA[D.tipo]),
          h('span', { class: 'resumo-per' }, D.periodo.curto || '')),
        h('p', { class: 'resumo-txt', html: D.resumo, 'data-sc-cue': cue('0.02', '0.16'), 'data-sc-kinetic': 'lines' }),
        h('div', { class: 'chips', 'data-sc-cue': cue('0.5', '0.3') }, (D.redes || []).map(r => h('a', { class: 'chip', href: '#rede-' + r.rede, 'data-ir': 'rede-' + r.rede }, ic(r.rede), r.nome)),
          (D.temas || []).map(t => h('a', { class: 'chip', href: '#tema-' + t.id, 'data-ir': 'tema-' + t.id }, t.nome)),
          D.sentimento ? h('a', { class: 'chip', href: '#sentimento', 'data-ir': 'sentimento' }, 'Sentimento') : null))), 1.6);
  }

  /* arco (meio círculo) e anel */
  function arco(p) {
    const L = Math.PI * 90;
    return svg(`<svg class="arco" viewBox="0 0 220 124" aria-hidden="true"><path d="M20 112a90 90 0 0 1 180 0" class="arco-fundo"/><path d="M20 112a90 90 0 0 1 180 0" class="arco-v" style="--L:${L.toFixed(1)};--o:${(L - L * p / 100).toFixed(1)}"/></svg>`);
  }
  function anel(p) {
    const L = 2 * Math.PI * 46;
    let pontos = '';
    const ini = p / 100 * 360, n = 7;
    for (let i = 0; i < n; i++) {
      const a = (ini + 18 + i * (360 - ini - 36) / (n - 1)) * Math.PI / 180;
      pontos += `<circle cx="${(60 + 46 * Math.cos(a)).toFixed(1)}" cy="${(60 + 46 * Math.sin(a)).toFixed(1)}" r="3.4" class="anel-ponto" style="--i:${i}"/>`;
    }
    return svg(`<svg class="anel" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="46" class="anel-v" style="--L:${L.toFixed(1)};--o:${(L - L * p / 100).toFixed(1)}"/>${pontos}</svg>`);
  }
  function barrasDia(d, o = {}) {
    if (!d || !d.valores) return null;
    const max = Math.max(...d.valores), pico = d.valores.indexOf(max);
    return h('div', { class: 'barras' + (o.cls ? ' ' + o.cls : ''), role: 'img', 'aria-label': d.rotulo + ': ' + d.valores.map((v, i) => 'dia ' + d.dias[i] + ', ' + v).join('; ') },
      d.valores.map((v, i) => h('div', { class: 'barra' + (i === pico ? ' is-pico' : ''), style: '--h:' + Math.max(6, v / max * 100) + '%;--i:' + i },
        i === pico ? h('span', { class: 'barra-tag' }, nf(v)) : null, h('i', {}), h('small', {}, d.dias[i]))));
  }

  function numeros(D) {
    const S = D.sentimento || {}, ex = S.externas, pr = S.prefeitura;
    const ig = (D.redes || []).find(r => r.rede === 'instagram');
    const redes = D.redes || [];
    const totSeg = redes.reduce((s, r) => s + (r.seguidores || 0), 0);
    const vis = redes.map(r => [r, (r.metricas || []).find(m => /visualiza/i.test(m.k))]).filter(x => x[1]);
    const totVis = vis.reduce((s, x) => s + x[1].v, 0), maxVis = Math.max(...vis.map(x => x[1].v));
    const cel = (area, i, card) => h('div', { class: 'cel cel--' + area, 'data-sc-cue': (0.1 + i * 0.045).toFixed(3) }, card);
    const cards = [];
    if (ex) cards.push(cel('arco', 0, h('article', { class: 'bento b-arco', 'data-sc-tilt': '5' },
      h('header', {}, h('h3', {}, 'Sentimento nas redes externas'), h('span', { class: 'bento-tag' }, 'positivo')),
      h('p', { class: 'b-frase' }, '› ', h('b', {}, nf(ex.positivas)), ' de ', nf(ex.total), ' ocorrências foram positivas'),
      h('div', { class: 'arco-box' }, arco(pctBaixo(ex.positivas, ex.total)), h('div', { class: 'arco-num' }, num(pctBaixo(ex.positivas, ex.total), { suf: '%' }), h('small', {}, 'positivas'))),
      h('div', { class: 'b-mini' },
        h('div', {}, h('small', {}, 'Ocorrências'), num(ex.total), h('span', { class: 'pill pill--preto' }, nf(ex.neutras) + ' neutras')),
        h('div', {}, h('small', {}, 'Negativas'), num(ex.negativas), h('span', { class: 'pill pill--amarelo' }, ex.negativas ? 'atenção' : 'nenhuma'))))));
    if (ig && ig.diario) cards.push(cel('dias', 1, h('article', { class: 'bento b-dias', 'data-sc-tilt': '5' },
      h('header', {}, h('h3', {}, ig.diario.rotulo + ' · ' + ig.nome), h('div', { class: 'b-dias-num' }, num(ig.novos), pill(ig.novosVar))),
      barrasDia(ig.diario, { cls: 'barras--finas' }))));
    if (pr) cards.push(cel('anel', 2, h('article', { class: 'bento b-anel', 'data-sc-tilt': '5' },
      h('div', { class: 'anel-box' }, anel(pctBaixo(pr.positivas, pr.total)), h('div', { class: 'anel-num' }, num(pctBaixo(pr.positivas, pr.total), { suf: '%' }), h('small', {}, 'favoráveis'))),
      h('p', {}, 'Menções nas redes da prefeitura (', nf(pr.total), ')'))));
    if (redes.length) cards.push(cel('seg', 3, h('article', { class: 'bento b-seg', 'data-sc-tilt': '5' },
      h('header', {}, h('h3', {}, 'Seguidores'), h('span', {}, 'nas ' + redes.length + ' redes')),
      h('div', { class: 'b-seg-num' }, num(totSeg, { cheio: true })),
      h('ul', {}, redes.map(r => h('li', {}, ic(r.rede), h('span', {}, r.nome), h('b', {}, nf(r.seguidores)),
        r.novos != null ? h('em', {}, '+' + nf(r.novos)) : r.seguidoresAnt != null ? h('em', {}, '+' + nf(r.seguidores - r.seguidoresAnt)) : null))))));
    if (vis.length) cards.push(cel('vis', 4, h('article', { class: 'bento b-vis', 'data-sc-tilt': '5' },
      h('header', {}, h('h3', {}, 'Visualizações por rede')),
      h('div', { class: 'b-vis-num' }, num(totVis)),
      h('div', { class: 'colunas' }, vis.map(([r, m], i) => {
        const p = varPct(m.v, m.ant);
        return h('div', { class: 'coluna' + (m.v === maxVis ? ' is-top' : ''), style: '--h:' + Math.max(8, m.v / maxVis * 100) + '%;--i:' + i },
          h('span', { class: 'coluna-pct' }, p == null ? '' : (p > 0 ? '+' : '') + nf(p, 0) + '%'),
          h('div', { class: 'coluna-barra' }, h('span', { class: 'coluna-tag' }, txtNum(m.v))), h('small', {}, r.nome));
      })))));
    if (!cards.length) return null;
    return cena(h('section', { class: 'sec sec--numeros', id: 'numeros', 'data-sec': 'numeros', 'aria-labelledby': 't-num' },
      h('header', { class: 'sec-cab', 'data-sc-cue': '0.06' }, h('h2', { id: 't-num' }, 'Números ' + DA[D.tipo]),
        h('p', {}, 'Comparação com a ' + (D.periodo.anterior || 'período anterior') + ' quando houver.')),
      h('div', { class: 'bento-grade' }, cards)));
  }

  function rede(r, i, D) {
    const estilo = ['claro', 'amarelo', 'preto'][i % 3];
    const novos = r.novos != null ? r.novos : r.seguidoresAnt != null ? r.seguidores - r.seguidoresAnt : null;
    const anterior = D.periodo.anterior || 'período anterior';
    const presa = estilo === 'preto';                       // TikTok: cena presa, os números chegam um a um
    const c = (pin, flow) => presa && PRESO ? pin : flow;
    const metricas = (r.metricas || []).map((m, k) => {
      const p = varPct(m.v, m.ant);
      return quadro(h('article', { class: 'metrica', 'data-sc-tilt': '5' },
        h('small', {}, m.k, m.sub ? h('em', {}, ' · ' + m.sub) : null),
        h('div', { class: 'metrica-num' }, num(m.v)),
        h('div', { class: 'metrica-rodape' }, pill(p), m.ant != null ? h('span', {}, txtNum(m.ant) + ' na ' + anterior) : null)),
        c((0.22 + k * 0.12).toFixed(2), (0.18 + k * 0.05).toFixed(2)));
    });
    const sec = h('section', { class: 'sec sec--rede rede--' + estilo + (i % 2 ? ' rede--inv' : ''), id: 'rede-' + r.rede, 'data-sec': 'rede', 'aria-labelledby': 't-' + r.rede },
      h('div', { class: 'rede-fundo', 'data-sc-reveal': estilo === 'amarelo' ? 'left' : null, 'data-sc-reveal-at': estilo === 'amarelo' ? '0.04 0.42' : null }),
      h('div', { class: 'rede-grade' },
        h('div', { class: 'rede-principal' },
          h('h2', { class: 'rede-nome', id: 't-' + r.rede, 'data-sc-cue': c('0', '0.1') }, h('span', { class: 'rede-ic' }, ic(r.rede)), r.nome),
          h('div', { class: 'rede-seg', 'data-sc-cue': c('0.06', '0.14') },
            h('small', {}, 'Seguidores'),
            h('div', { class: 'rede-seg-linha' },
              h('div', { class: 'rede-seg-num', 'data-sc-parallax': estilo === 'claro' && PRESO ? '-0.5' : null }, num(r.seguidores, { cheio: true })),
              novos != null ? h('div', { class: 'rede-novos' }, h('b', {}, (novos >= 0 ? '+' : '') + nf(novos)), h('span', {}, novos === 1 ? 'novo' : 'novos'), pill(r.novosVar)) : null)),
          r.destaque ? h('a', { class: 'rede-post', href: '#publicacoes', 'data-ir': 'publicacoes', 'data-sc-cue': c('0.62', '0.3') },
            h('small', {}, 'Post que mais engajou'), h('b', {}, r.destaque.tema), h('span', {}, 'ver nas publicações ', ic('seta'))) : null),
        h('div', { class: 'rede-dados' },
          h('div', { class: 'rede-metricas' }, metricas),
          r.diario ? quadro(h('article', { class: 'metrica metrica--dias', 'data-sc-tilt': '4' },
            h('small', {}, r.diario.rotulo), barrasDia(r.diario)), c('0.46', '0.26')) : null)));
    return cena(sec, presa ? 1.5 : null);
  }

  /* leque: a pilha de prints abre conduzida pela rolagem (pico da página) */
  function publicacoes(D, ctx) {
    const posts = (D.redes || []).filter(r => r.destaque && r.destaque.print);
    if (!posts.length) return null;
    const ord = posts.slice().sort((a, b) => (b.destaque.visualizacoes || 0) - (a.destaque.visualizacoes || 0));
    const meio = [];                                       // a de mais visualizações no meio
    ord.forEach((p, i) => i % 2 ? meio.unshift(p) : meio.push(p));
    const c = (meio.length - 1) / 2;
    const cartas = meio.map((r, i) => h('button', { type: 'button', class: 'carta', 'data-off': i - c, 'data-rede': r.rede, 'aria-label': 'Ampliar o post de ' + r.nome + ': ' + r.destaque.tema, onclick: () => abrePost(r) },
      h('img', { src: r.destaque.print, alt: 'Print do post de ' + r.nome })));
    const legendas = meio.map((r, i) => {
      const p = r.destaque;
      return h('div', { class: 'leg', 'data-off': i - c },
        h('span', { class: 'leg-rede' }, ic(r.rede), r.nome), h('b', {}, p.tema),
        h('span', { class: 'leg-nums' }, p.visualizacoes != null ? txtNum(p.visualizacoes) + ' visualizações' : '', p.curtidas != null ? ' · ' + nf(p.curtidas) + ' curtidas' : ''));
    });
    const sec = h('section', { class: 'sec sec--leque', id: 'publicacoes', 'data-sec': 'leque', 'aria-labelledby': 't-pub' },
      h('header', { class: 'leque-cab' }, h('h2', { id: 't-pub' }, 'O que mais engajou'),
        h('p', {}, 'O post de cada rede com mais visualizações. ', h('span', { class: 'so-tela' }, 'Clique para ver o post.'))),
      h('div', { class: 'leque' }, cartas),
      h('div', { class: 'leque-legs' }, legendas));
    ctx.leque = sec;
    return cena(sec, 2.6);
  }

  /* endereço de incorporação oficial de cada rede, a partir do link do post */
  function embed(link) {
    if (!link) return null;
    let m;
    if ((m = link.match(/instagram\.com\/(?:p|reel|tv)\/([\w-]+)/))) return { src: 'https://www.instagram.com/p/' + m[1] + '/embed/captioned/', w: 400, h: 720 };
    if ((m = link.match(/tiktok\.com\/.*\/video\/(\d+)/))) return { src: 'https://www.tiktok.com/embed/v2/' + m[1] + '?lang=pt-BR', w: 340, h: 740 };
    if (/facebook\.com\//.test(link)) {
      // o plugin do Facebook não aceita o link com o título no meio (/posts/titulo-do-post/ID/): fica só /posts/ID
      const f = link.match(/facebook\.com\/([^/?#]+)\/posts\/(?:[^/?#]+\/)?(\d+|pfbid[\w]+)/);
      const href = f ? 'https://www.facebook.com/' + f[1] + '/posts/' + f[2] : link;
      return { src: 'https://www.facebook.com/plugins/post.php?href=' + encodeURIComponent(href) + '&show_text=true&width=440', w: 440, h: 720 };
    }
    return null;
  }

  function abrePost(r) {
    const p = r.destaque;
    const volta = document.activeElement;
    const fecha = () => { caixa.classList.remove('is-on'); setTimeout(() => caixa.remove(), 250); document.removeEventListener('keydown', tecla); volta && volta.focus && volta.focus(); };
    const tecla = e => { if (e.key === 'Escape') fecha(); };
    const nums = [['olho', p.visualizacoes, 'visualizações'], ['coracao', p.curtidas, 'curtidas'], ['balao', p.comentarios, 'comentários'], ['compartilhar', p.compartilhamentos, 'compartilhamentos']].filter(x => x[1] != null);
    const E = embed(p.link);
    const midia = h('div', { class: 'modal-midia' + (E ? ' tem-embed' : '') },
      h('img', { class: 'modal-print', src: p.print, alt: 'Print do post de ' + r.nome }),
      E ? h('iframe', { class: 'modal-embed', src: E.src, title: 'Post de ' + r.nome + ' na rede', allow: 'encrypted-media; picture-in-picture; clipboard-write', allowfullscreen: true, style: '--w:' + E.w + 'px', onload: e => e.target.classList.add('is-ok') }) : null);
    const alterna = E ? h('button', { type: 'button', class: 'modal-alt', onclick: () => { const v = midia.classList.toggle('ver-print'); alterna.lastChild.textContent = v ? 'Ver o post' : 'Ver o print'; } }, ic('imagem'), h('span', {}, 'Ver o print')) : null;
    const bx = h('button', { class: 'modal-x', type: 'button', 'aria-label': 'Fechar', onclick: fecha }, ic('fechar'));
    const caixa = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Post de ' + r.nome, onclick: e => { if (e.target === caixa) fecha(); } },
      h('div', { class: 'modal-corpo' },
        midia,
        h('div', { class: 'modal-txt' },
          h('span', { class: 'modal-rede' }, ic(r.rede), r.nome + ' · post que mais engajou'),
          h('b', { class: 'modal-tema' }, p.tema),
          h('div', { class: 'modal-nums' }, nums.map(([i, v, t]) => h('div', {}, h('b', {}, txtNum(v)), h('small', {}, ic(i), t)))),
          p.legenda ? h('p', {}, '“' + p.legenda + '”') : null,
          h('div', { class: 'modal-acoes' },
            p.link ? h('a', { class: 'botao', href: p.link, target: '_blank', rel: 'noopener' }, ic('link'), 'Abrir na rede') : null,
            alterna)),
        bx));
    document.body.append(caixa);
    document.addEventListener('keydown', tecla);
    requestAnimationFrame(() => { caixa.classList.add('is-on'); bx.focus(); });
  }

  /* sentimento: blocos (50 quadrados) por fonte; o preenchimento segue a rolagem */
  function blocos(S, de, ate) {
    const t = S.total || 1, partes = [['p', S.positivas], ['n', S.negativas], ['u', S.neutras], ['s', S.sem || 0]];
    const N = 50, cel = partes.map(([k, v]) => { const x = v / t * N; return [k, Math.floor(x), x - Math.floor(x)]; });
    let falta = N - cel.reduce((s, x) => s + x[1], 0);
    cel.slice().sort((a, b) => b[2] - a[2]).forEach(x => { if (falta > 0 && x[2] > 0) { x[1]++; falta--; } });
    const lista = [];
    cel.forEach(([k, q]) => { for (let i = 0; i < q; i++) lista.push(k); });
    return h('div', { class: 'blocos', 'aria-hidden': 'true', 'data-de': de, 'data-ate': ate }, lista.map((k, i) => h('i', { class: 'b-' + k, style: '--i:' + i })));
  }
  function board(S, chave, k) {
    const pp = pctBaixo(S.positivas, S.total);
    const neu = S.rotuloNeutras || 'neutras';
    const de = PRESO ? 0.04 + k * 0.3 : 0.14, ate = PRESO ? 0.42 + k * 0.3 : 0.4;
    return quadro(h('article', { class: 'board', 'data-sc-tilt': '4', 'aria-label': S.titulo },
      h('header', {}, h('h3', {}, S.titulo), h('span', {}, nf(S.total) + (chave === 'externas' ? ' ocorrências' : ' menções'))),
      h('div', { class: 'board-num' }, num(pp, { suf: '%' }), h('small', {}, 'positivas')),
      blocos(S, de, ate),
      h('ul', { class: 'board-leg' },
        h('li', {}, h('i', { class: 'b-p' }), 'Positivas', h('b', {}, nf(S.positivas)), h('em', {}, pctBaixo(S.positivas, S.total) + '%')),
        h('li', {}, h('i', { class: 'b-n' }), 'Negativas', h('b', {}, nf(S.negativas)), h('em', {}, pctBaixo(S.negativas, S.total) + '%')),
        h('li', {}, h('i', { class: 'b-u' }), neu[0].toUpperCase() + neu.slice(1), h('b', {}, nf(S.neutras)), h('em', {}, pctBaixo(S.neutras, S.total) + '%'))),
      S.canais ? h('p', { class: 'board-canais' }, S.canais.map(c => h('span', {}, c.canal + ': ', h('b', {}, nf(c.p)), ' pos · ', h('b', {}, nf(c.n)), ' neg · ', h('b', {}, nf(c.u)), ' ' + (chave === 'prefeitura' ? neu : 'neu')))) : null,
      S.nota ? h('p', { class: 'board-nota' }, S.nota) : null), cue((k * 0.3).toFixed(2), (0.1 + k * 0.06).toFixed(2)));
  }
  function sentimento(D) {
    const S = D.sentimento;
    if (!S || (!S.externas && !S.prefeitura)) return null;
    let k = 0;
    return cena(h('section', { class: 'sec sec--sent', id: 'sentimento', 'data-sec': 'sent', 'aria-labelledby': 't-sent' },
      h('header', { class: 'sec-cab' }, h('h2', { id: 't-sent' }, 'Sentimento'),
        h('p', {}, 'Como as pessoas reagiram, fora e dentro das redes da prefeitura.')),
      h('div', { class: 'boards' }, S.externas ? board(S.externas, 'externas', k++) : null, S.prefeitura ? board(S.prefeitura, 'prefeitura', k++) : null)), 1.9);
  }

  function temasLista(S, titulo, k) {
    if (!S || !S.temas) return null;
    const max = Math.max(...S.temas.map(t => t[1] + t[2] + t[3]));
    return quadro(h('article', { class: 'board board--temas', 'data-sc-tilt': '4' },
      h('header', {}, h('h3', {}, 'Temas · ' + titulo)),
      h('ul', { class: 'temas' }, S.temas.map(([nome, p, n, u], i) => {
        const t = p + n + u;
        return h('li', { style: '--i:' + i },
          h('span', { class: 'tema-nome' }, nome),
          h('span', { class: 'tema-barra', style: '--w:' + (t / max * 100) + '%' },
            h('i', { class: 'b-p', style: 'flex:' + p }), h('i', { class: 'b-n', style: 'flex:' + n }), h('i', { class: 'b-u', style: 'flex:' + u })),
          h('b', {}, nf(t)));
      }))), (0.14 + k * 0.05).toFixed(2));
  }
  function publicadores(D) {
    const P = D.publicadores, S = D.sentimento || {};
    if (!P && !S.externas) return null;
    const lista = P ? P.lista.slice(0, 8) : [];
    const max = lista.length ? lista[0].pct : 1;
    return cena(h('section', { class: 'sec sec--pub', id: 'publicadores', 'data-sec': 'pub', 'aria-labelledby': 't-pub2' },
      h('header', { class: 'sec-cab', 'data-sc-cue': '0.06' }, h('h2', { id: 't-pub2' }, 'Publicadores e temas'), P && P.nota ? h('p', {}, P.nota) : null),
      h('div', { class: 'pub-grade' },
        P ? quadro(h('article', { class: 'board board--cinza', 'data-sc-tilt': '4' },
          h('header', {}, h('h3', {}, 'Principais publicadores'), h('span', {}, '% das impressões')),
          h('ol', { class: 'publ' }, lista.map((p, i) => h('li', { style: '--i:' + i },
            h('span', { class: 'publ-bola' + (i === 0 ? ' is-top' : '') }, iniciais(p.nome)),
            h('span', { class: 'publ-nome' }, h('b', {}, p.nome), h('small', {}, '@' + p.handle + ' · alcance ' + txtNum(p.alcance))),
            h('span', { class: 'publ-barra', style: '--w:' + (p.pct / max * 100) + '%' }),
            h('em', {}, nf(p.pct, 1) + '%'))))), '0.1') : null,
        temasLista(S.prefeitura, 'redes da prefeitura', 1),
        temasLista(S.externas, 'redes externas', 2)),
      h('p', { class: 'leg-sent' }, h('i', { class: 'b-p' }), 'Positivas', h('i', { class: 'b-n' }), 'Negativas', h('i', { class: 'b-u' }), 'Neutras ou dúvidas')));
  }

  function termos(D) {
    if (!D.nuvem || !D.nuvem.length) return null;
    const ord = D.nuvem.slice().sort((a, b) => b[1] - a[1]);
    const meio = [];  // maiores no centro
    ord.forEach((w, i) => i % 2 ? meio.unshift(w) : meio.push(w));
    const max = ord[0][1], n = meio.length;
    // as palavras chegam da maior para a menor, conforme a rolagem
    const posicao = w => ord.findIndex(x => x[0] === w);
    return cena(h('section', { class: 'sec sec--termos', id: 'termos', 'data-sec': 'termos', 'aria-labelledby': 't-termos' },
      h('header', { class: 'sec-cab' }, h('h2', { id: 't-termos' }, 'Termos mais citados'), h('p', {}, 'Palavras que mais apareceram nas menções ' + DA[D.tipo] + '.')),
      h('ul', { class: 'nuvem' }, meio.map(([w, p]) => {
        const o = posicao(w);
        return h('li', { class: o < 3 ? 'is-top' : '', style: '--s:' + (p / max).toFixed(3), 'data-sc-cue': cue((0.02 + o / n * 0.5).toFixed(3), (0.12 + o / n * 0.22).toFixed(3)), 'data-sc-rise': '1.6' }, w);
      }))), 1.6);
  }

  function fechamento(D, cfg) {
    const ano = (D.periodo.fim || '').slice(0, 4);
    const f = h('footer', { class: 'sec sec--fim', id: 'fim', 'data-sec': 'fim' },
      h('div', { class: 'fim-marcas', 'data-sc-cue': '0.14' },
        (cfg.logoE3Escuro || cfg.logoE3) ? h('img', { class: 'fim-e3', src: cfg.logoE3Escuro || cfg.logoE3, alt: 'E3 Comunicação Integrada' }) : null,
        h('span', { class: 'fim-x', 'aria-hidden': 'true' }, '×'),
        (cfg.marcaPreta || cfg.marcaBranca) ? h('img', { class: 'fim-cliente', src: cfg.marcaPreta || cfg.marcaBranca, alt: D.cliente.nome }) : h('b', {}, D.cliente.nome)),
      h('p', { class: 'fim-txt', 'data-sc-cue': '0.2' }, tituloDe(D) + ' · ' + D.cliente.nome + ' · ' + D.periodo.texto + (ano ? ' de ' + ano : '')),
      D.cliente.slogan ? h('p', { class: 'fim-slogan', 'data-sc-cue': '0.24' }, D.cliente.slogan) : null,
      h('p', { class: 'fim-nota', 'data-sc-cue': '0.26' }, D.notaFim || 'Produzido pela E3 Comunicação Integrada. Valores por dia, temas, publicadores e pesos dos termos lidos dos gráficos de origem (aproximados).'),
      h('a', { class: 'fim-topo so-tela', href: '#inicio', 'data-ir': 'inicio' }, ic('topo'), 'Voltar ao início'));
    return cena(f);
  }

  /* ---------------- diário: calendário, números do dia e notícias por tema ---------------- */
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const isoDe = (a, m, d) => a + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  const redeDe = link => /facebook\.com/.test(link || '') ? 'facebook' : /tiktok\.com/.test(link || '') ? 'tiktok' : 'instagram';

  /* calendário de consulta: dias com edição abrem o relatório; os outros ficam apagados */
  function calendario(D, ctx) {
    if (D.tipo !== 'diario') return null;
    const datas = (ctx.edicoes.diario || []).slice().sort();
    const meses = [...new Set(datas.map(x => x.slice(0, 7)))];
    let atual = (ctx.data || datas[datas.length - 1]).slice(0, 7);
    const hoje = new Date(), hojeIso = isoDe(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const titulo = h('h3', { class: 'cal-mes', 'aria-live': 'polite' });
    const grade = h('div', { class: 'cal-grade', role: 'grid' });
    const ant = h('button', { type: 'button', class: 'cal-nav', 'aria-label': 'Mês anterior', onclick: () => anda(-1) }, '‹');
    const prox = h('button', { type: 'button', class: 'cal-nav', 'aria-label': 'Próximo mês', onclick: () => anda(1) }, '›');
    const conta = h('p', { class: 'cal-conta' });
    function anda(k) { const i = meses.indexOf(atual) + k; if (i >= 0 && i < meses.length) { atual = meses[i]; pinta(); } }
    function pinta() {
      const [a, m] = atual.split('-').map(Number), m0 = m - 1;
      titulo.textContent = MESES[m0][0].toUpperCase() + MESES[m0].slice(1) + ' de ' + a;
      const i = meses.indexOf(atual);
      ant.disabled = i <= 0; prox.disabled = i < 0 || i >= meses.length - 1;
      const inicio = new Date(a, m0, 1).getDay(), dias = new Date(a, m + 0, 0).getDate();
      const doMes = datas.filter(x => x.startsWith(atual)).length;
      conta.textContent = doMes === 1 ? '1 edição neste mês' : doMes + ' edições neste mês';
      grade.replaceChildren(
        ...['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(s => h('span', { class: 'cal-sem', 'aria-hidden': 'true' }, s)),
        ...Array.from({ length: inicio }, () => h('span', { class: 'cal-vazio' })),
        ...Array.from({ length: dias }, (_, k) => {
          const iso = isoDe(a, m0, k + 1), tem = datas.includes(iso), esta = iso === ctx.data;
          const cls = 'cal-dia' + (tem ? ' is-ok' : ' is-off') + (esta ? ' is-atual' : '') + (iso === hojeIso ? ' is-hoje' : '');
          const rot = (k + 1) + ' de ' + MESES[m0] + (tem ? (esta ? ', edição aberta' : ', abrir edição') : ', sem edição');
          return tem && !esta
            ? h('button', { type: 'button', class: cls, 'aria-label': rot, onclick: () => ctx.abrir('diario', iso) }, String(k + 1))
            : h('span', { class: cls, 'aria-label': rot, 'aria-current': esta ? 'date' : null }, String(k + 1));
        }));
    }
    pinta();
    return cena(h('section', { class: 'sec sec--cal so-tela', id: 'calendario', 'data-sec': 'cal', 'aria-labelledby': 't-cal' },
      h('div', { class: 'cal-wrap' },
        h('div', { class: 'cal-txt', 'data-sc-cue': '0.08' },
          h('h2', { id: 't-cal' }, 'Calendário'),
          h('p', {}, 'Escolha um dia para abrir o relatório. Os dias apagados ainda não têm edição.'),
          h('ul', { class: 'cal-leg' },
            h('li', {}, h('i', { class: 'is-atual' }), 'Dia aberto'),
            h('li', {}, h('i', { class: 'is-ok' }), 'Com edição'),
            h('li', {}, h('i', { class: 'is-off' }), 'Sem edição'))),
        h('div', { class: 'cal-card', 'data-sc-cue': '0.14' },
          h('header', {}, ant, titulo, prox),
          grade, conta))));
  }

  function numerosDia(D) {
    if (!D.temas) return null;
    const pags = (D.paginas || []).slice().sort((a, b) => b.n - a.n);
    const tot = pags.reduce((s, p) => s + p.n, 0);
    const ass = D.temas.reduce((s, t) => s + t.noticias.length, 0);
    const rep = D.temas.reduce((s, t) => s + t.noticias.filter(n => n.fontes.length > 1).length, 0);
    const pubT = t => t.noticias.reduce((s, n) => s + n.fontes.length, 0);
    const maxP = pags.length ? pags[0].n : 1, maxT = Math.max(...D.temas.map(pubT));
    const cel = (area, i, card) => h('div', { class: 'cel cel--' + area, 'data-sc-cue': cue((0.1 + i * 0.05).toFixed(3), (0.12 + i * 0.04).toFixed(3)) }, card);
    return cena(h('section', { class: 'sec sec--numeros sec--dia', id: 'numeros', 'data-sec': 'numeros', 'aria-labelledby': 't-num' },
      h('header', { class: 'sec-cab', 'data-sc-cue': '0.06' }, h('h2', { id: 't-num' }, 'O dia em números'),
        h('p', {}, 'Monitoramento web: ' + (D.periodo.coleta || D.periodo.texto) + '.')),
      h('div', { class: 'dia-grade' },
        cel('pub', 0, h('article', { class: 'bento d-pub', 'data-sc-tilt': '5' },
          h('header', {}, h('h3', {}, 'Publicações'), h('span', { class: 'bento-tag' }, 'externas')),
          h('div', { class: 'd-num' }, num(tot)), h('p', {}, 'sobre Hortolândia, em ', h('b', {}, pags.length + ' páginas'), ' monitoradas'))),
        cel('ass', 1, h('article', { class: 'bento d-ass', 'data-sc-tilt': '5' },
          h('header', {}, h('h3', {}, 'Assuntos')),
          h('div', { class: 'd-num' }, num(ass)), h('p', {}, rep ? [h('b', {}, rep + (rep === 1 ? ' saiu' : ' saíram')), ' em mais de uma página'] : 'cada um em uma página'))),
        cel('pag', 2, h('article', { class: 'bento d-lista', 'data-sc-tilt': '4' },
          h('header', {}, h('h3', {}, 'Publicações por página'), h('span', { class: 'bento-tag' }, pags.length + ' páginas')),
          h('ol', { class: 'd-barras' }, pags.map((p, i) => h('li', { style: '--i:' + i },
            h('span', {}, p.nome), h('b', {}, nf(p.n)), h('i', { style: '--w:' + (p.n / maxP * 100) + '%' })))))),
        cel('tem', 3, h('article', { class: 'bento d-lista d-temas', 'data-sc-tilt': '4' },
          h('header', {}, h('h3', {}, 'Publicações por tema'), h('span', { class: 'bento-tag' }, D.temas.length + ' temas')),
          h('ol', { class: 'd-barras' }, D.temas.map((t, i) => h('li', { style: '--i:' + i },
            h('a', { href: '#tema-' + t.id, 'data-ir': 'tema-' + t.id }, t.nome), h('b', {}, nf(pubT(t))), h('i', { style: '--w:' + (pubT(t) / maxT * 100) + '%' })))))))));
  }

  const ESTILOS_TEMA = ['preto', 'claro', 'amarelo', 'cinza'];
  function temaSec(t, i) {
    const estilo = ESTILOS_TEMA[i % ESTILOS_TEMA.length];
    const pubs = t.noticias.reduce((s, n) => s + n.fontes.length, 0), q = t.noticias.length;
    const cols = q <= 2 ? 2 : q <= 4 ? 2 : q <= 6 ? 3 : 4;
    const cards = t.noticias.map((n, k) => quadro(h('button', { type: 'button', class: 'noticia', 'data-sc-tilt': '4', 'aria-label': n.titulo + ' · ver o post', onclick: () => abreNoticia(n, t) },
      h('span', { class: 'noticia-fontes' }, n.fontes.map(f => h('span', { class: 'fonte' }, ic(redeDe(f.link)), f.pagina)),
        n.fontes.length > 1 ? h('span', { class: 'pill pill--amarelo noticia-rep' }, 'em ' + n.fontes.length + ' páginas') : null),
      h('b', { class: 'noticia-tit' }, n.titulo),
      h('span', { class: 'noticia-txt' }, n.fontes[0].texto),
      h('span', { class: 'noticia-ver so-tela' }, 'Ver o post ', ic('seta'))), cue((0.08 + k * 0.035).toFixed(3), (0.1 + (k % cols) * 0.04).toFixed(3))));
    return cena(h('section', { class: 'sec sec--tema tema--' + estilo + (q <= 2 ? ' tema--poucos' : ''), id: 'tema-' + t.id, 'data-sec': 'tema', 'aria-labelledby': 't-tema-' + t.id },
      h('header', { class: 'sec-cab', 'data-sc-cue': '0.06' },
        h('div', {}, h('small', { class: 'tema-num' }, 'Tema ' + (i + 1)), h('h2', { id: 't-tema-' + t.id }, t.nome)),
        h('p', {}, t.desc ? t.desc + ' ' : '', h('b', {}, pubs + (pubs === 1 ? ' publicação' : ' publicações')), ' · ' + q + (q === 1 ? ' assunto' : ' assuntos'))),
      h('div', { class: 'noticias', style: '--cols:' + cols }, cards)));
  }

  function abreNoticia(n, t) {
    let atual = 0;
    const volta = document.activeElement;
    const fecha = () => { caixa.classList.remove('is-on'); setTimeout(() => caixa.remove(), 250); document.removeEventListener('keydown', tecla); volta && volta.focus && volta.focus(); };
    const tecla = e => { if (e.key === 'Escape') fecha(); };
    const midia = h('div', { class: 'modal-midia modal-midia--noticia' });
    const texto = h('p', {});
    const abrir = h('a', { class: 'botao', target: '_blank', rel: 'noopener' }, ic('link'), 'Abrir na rede');
    const abas = n.fontes.length > 1 ? h('div', { class: 'modal-fontes', role: 'group', 'aria-label': 'Páginas que publicaram' },
      n.fontes.map((f, k) => h('button', { type: 'button', class: 'modal-alt', 'aria-pressed': 'false', onclick: () => mostra(k) }, ic(redeDe(f.link)), f.pagina))) : null;
    function mostra(k) {
      atual = k;
      const f = n.fontes[k], rede = redeDe(f.link);
      // links de compartilhamento do Facebook (/share/) não abrem no plugin: fica o aviso com o botão
      const E = /facebook\.com\/share\//.test(f.link) ? null : embed(f.link);
      midia.replaceChildren(E
        ? h('iframe', { class: 'modal-embed', src: E.src, title: 'Post de ' + f.pagina + ' na rede', allow: 'encrypted-media; picture-in-picture; clipboard-write', allowfullscreen: true, onload: e => e.target.classList.add('is-ok') })
        : h('div', { class: 'modal-sem' }, h('span', { class: 'rede-ic' }, ic(rede)), h('p', {}, 'Este post do ' + (rede === 'facebook' ? 'Facebook' : 'perfil') + ' abre direto na rede.'),
            h('a', { class: 'botao', href: f.link, target: '_blank', rel: 'noopener' }, ic('link'), 'Abrir o post')));
      texto.textContent = '“' + f.texto + '”';
      abrir.href = f.link;
      rotulo.lastChild.textContent = f.pagina + ' · ' + t.nome;
      rotulo.firstChild.replaceWith(ic(rede));
      if (abas) [...abas.children].forEach((b, j) => { b.classList.toggle('is-ativo', j === k); b.setAttribute('aria-pressed', j === k ? 'true' : 'false'); });
    }
    const rotulo = h('span', { class: 'modal-rede' }, ic('instagram'), h('span', {}, ''));
    const bx = h('button', { class: 'modal-x', type: 'button', 'aria-label': 'Fechar', onclick: fecha }, ic('fechar'));
    const caixa = h('div', { class: 'modal modal--noticia', role: 'dialog', 'aria-modal': 'true', 'aria-label': n.titulo, onclick: e => { if (e.target === caixa) fecha(); } },
      h('div', { class: 'modal-corpo' },
        midia,
        h('div', { class: 'modal-txt' },
          rotulo,
          h('b', { class: 'modal-tema' }, n.titulo),
          abas ? h('small', { class: 'modal-rep' }, 'Saiu em ' + n.fontes.length + ' páginas:') : null,
          abas,
          texto,
          h('div', { class: 'modal-acoes' }, abrir)),
        bx));
    mostra(0);
    document.body.append(caixa);
    document.addEventListener('keydown', tecla);
    requestAnimationFrame(() => { caixa.classList.add('is-on'); bx.focus(); });
  }

  /* ---------------- menu flutuante ---------------- */
  function menu(ctx) {
    const painel = h('div', { class: 'menu-painel', id: 'menu-painel', role: 'menu', hidden: true },
      h('p', { class: 'menu-tit' }, 'Relatório'),
      TIPOS.map(([t, nome, icn]) => {
        const tem = (ctx.edicoes[t] || []).length > 0, ativo = t === ctx.tipo;
        return h('button', { type: 'button', role: 'menuitemradio', 'aria-checked': ativo ? 'true' : 'false', class: 'menu-it' + (ativo ? ' is-ativo' : ''), disabled: !tem && !ativo,
          onclick: () => { fechar(); tem && !ativo && ctx.trocar(t); } }, ic(icn), nome, !tem ? h('small', {}, 'em breve') : ativo ? ic('check', 'menu-ok') : null);
      }),
      h('hr', {}),
      ctx.tipo === 'diario' ? h('button', { type: 'button', role: 'menuitem', class: 'menu-it', onclick: () => { fechar(); irPara('calendario'); } }, ic('dia'), 'Calendário') : null,
      h('button', { type: 'button', role: 'menuitem', class: 'menu-it', onclick: () => { fechar(); exportaPdf(); } }, ic('pdf'), 'Exportar PDF'),
      h('button', { type: 'button', role: 'menuitem', class: 'menu-it', onclick: () => { fechar(); compartilhar(); } }, ic('compartilhar'), 'Compartilhar'),
      h('button', { type: 'button', role: 'menuitem', class: 'menu-it', onclick: () => { fechar(); irPara('inicio'); } }, ic('topo'), 'Ir para o início'),
      ctx.sair ? h('button', { type: 'button', role: 'menuitem', class: 'menu-it menu-sair', onclick: () => { fechar(); ctx.sair(); } }, ic('sair'), 'Sair') : null);
    const bt = h('button', { type: 'button', class: 'menu-bt', 'aria-label': 'Opções', 'aria-expanded': 'false', 'aria-controls': 'menu-painel' }, ic('opcoes', 'menu-ic-abre'), ic('fechar', 'menu-ic-fecha'));
    const caixa = h('div', { class: 'menu' }, painel, bt);
    function abrir() { painel.hidden = false; requestAnimationFrame(() => caixa.classList.add('is-on')); bt.setAttribute('aria-expanded', 'true'); const f = painel.querySelector('button:not([disabled])'); f && f.focus(); }
    function fechar() { caixa.classList.remove('is-on'); bt.setAttribute('aria-expanded', 'false'); setTimeout(() => { if (!caixa.classList.contains('is-on')) painel.hidden = true; }, 200); }
    bt.onclick = () => caixa.classList.contains('is-on') ? fechar() : abrir();
    document.addEventListener('click', e => { if (caixa.classList.contains('is-on') && !caixa.contains(e.target)) fechar(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && caixa.classList.contains('is-on')) { fechar(); bt.focus(); } });
    return caixa;
  }

  function aviso(txt, ms = 2200) {
    const a = h('div', { class: 'aviso', role: 'status' }, txt);
    document.body.append(a);
    requestAnimationFrame(() => a.classList.add('is-on'));
    setTimeout(() => { a.classList.remove('is-on'); setTimeout(() => a.remove(), 300); }, ms);
  }
  /* PDF: tudo no estado final (números cheios, leque aberto, blocos preenchidos) */
  function estadoFinal() {
    document.documentElement.classList.add('final');
    document.querySelectorAll('.sec').forEach(s => s.classList.add('is-in'));
    document.querySelectorAll('[data-n]').forEach(el => { el.textContent = nf(+el.dataset.n, +el.dataset.d || 0); });
    pinta();
  }
  function volta() { document.documentElement.classList.remove('final'); if (motor) motor.layout(); }
  function exportaPdf() {
    estadoFinal();
    // a impressora "Microsoft Print to PDF" força A4 em pé; o "Salvar como PDF" do navegador respeita a página deitada
    aviso('No destino, escolha “Salvar como PDF” e deixe “Gráficos de fundo” ligado.', 6000);
    setTimeout(() => { try { window.print(); } catch (e) { aviso('Use Ctrl+P para salvar em PDF.'); } }, 450);
  }
  function compartilhar() {
    const url = location.href;
    if (navigator.share) navigator.share({ title: document.title, url }).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => aviso('Link copiado.'), () => aviso(url));
    else aviso(url);
  }
  window.addEventListener('beforeprint', estadoFinal);
  window.addEventListener('afterprint', volta);

  /* ---------------- movimento próprio (sobre o --sc-p do motor) ---------------- */
  function conta(el) {
    const alvo = +el.dataset.n, d = +el.dataset.d || 0;
    if (reduz() || final()) { el.textContent = nf(alvo, d); return; }
    const t0 = performance.now(), dur = 1100;
    const passo = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = nf(alvo * e, d); if (k < 1) requestAnimationFrame(passo); };
    requestAnimationFrame(passo);
  }
  function observa(raiz) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      e.target.querySelectorAll('[data-n]').forEach(conta);
      io.unobserve(e.target);
    }), { threshold: 0.3 });
    raiz.querySelectorAll('.sec').forEach(s => io.observe(s));
  }

  const pDe = el => { const a = el && el.closest('[data-sc-act]'); return a ? parseFloat(a.style.getPropertyValue('--sc-p')) || 0 : 0; };
  const ease = k => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  let pinta = () => {};
  let geracao = 0;
  function movimento(ctx) {
    const minha = ++geracao;
    const capaSec = document.querySelector('.sec--capa');
    const planos = capaSec ? [...capaSec.querySelectorAll('[data-plano]')] : [];
    const leque = ctx.leque, cartas = leque ? [...leque.querySelectorAll('.carta')] : [], legs = leque ? [...leque.querySelectorAll('.leg')] : [];
    const grupos = [...document.querySelectorAll('.blocos')];
    let px = 0, py = 0, tx = 0, ty = 0, hov = null, pMob = 0, mobAberto = false;
    if (mouse() && !reduz() && capaSec) capaSec.addEventListener('pointermove', e => { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; });
    cartas.forEach(c => { c.addEventListener('pointerenter', () => { if (mouse()) hov = c; }); c.addEventListener('pointerleave', () => { if (hov === c) hov = null; }); c.addEventListener('focus', () => hov = c); c.addEventListener('blur', () => { if (hov === c) hov = null; }); });
    if (leque && !PRESO) new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) mobAberto = true; }), { threshold: 0.35 }).observe(leque);

    function frame() {
      const fim = final() || reduz();
      // capa: a câmera aproxima da ponte e os planos se separam com o mouse
      if (capaSec) {
        px += (tx - px) * 0.08; py += (ty - py) * 0.08;
        const k = fim || !PRESO ? 0 : clamp01(pDe(capaSec));
        planos.forEach(p => {
          const f = +p.dataset.plano;
          const zoom = f === 0.6 ? ' scale(' + (1.06 + k * 0.16).toFixed(4) + ')' : f === 0.3 ? ' scale(' + (1 + k * 0.3).toFixed(4) + ')' : '';
          p.style.transform = fim ? '' : `translate3d(${(-px * f * 30).toFixed(1)}px, ${(-py * f * 20 - k * f * 60).toFixed(1)}px, 0)` + zoom;
        });
        capaSec.style.setProperty('--k', k.toFixed(3));
      }
      // blocos de sentimento: enchem conforme a rolagem
      grupos.forEach(g => {
        const de = +g.dataset.de, ate = +g.dataset.ate;
        const f = fim ? 1 : clamp01((pDe(g) - de) / (ate - de));
        g.style.setProperty('--f', f.toFixed(3));
      });
      // leque
      if (leque) {
        let p;
        if (fim) p = 1;
        else if (!PRESO) { pMob += ((mobAberto ? 1 : 0) - pMob) * 0.07; p = pMob; }
        else p = ease(clamp01(pDe(leque) / 0.62));
        const W = leque.querySelector('.leque').offsetWidth, cw = cartas[0] ? cartas[0].offsetWidth : 200;
        const abre = !PRESO ? Math.min(W * 0.3, cw * 0.62) : Math.min(cw * 1.18, W * 0.3);
        cartas.forEach(c => {
          const o = +c.dataset.off, eh = hov === c && p > 0.6;
          const x = o * abre * p, rot = o * (PRESO ? 9 : 7) * p + o * 3 * (1 - p), y = Math.abs(o) * 26 * p - (eh ? 22 : 0) + Math.abs(o) * -6 * (1 - p);
          const ry = -o * 14 * p, s = (eh ? 1.05 : 1) * (o === 0 ? 1 : 0.94 + 0.06 * (1 - p));
          c.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${o === 0 ? 40 : 0}px) rotateZ(${rot.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${s.toFixed(3)})`;
          c.style.zIndex = eh ? 9 : 5 - Math.abs(o);
        });
        leque.style.setProperty('--p', p.toFixed(3));
        legs.forEach(l => { l.style.transform = `translateX(${(+l.dataset.off * abre).toFixed(1)}px)`; });
      }
      if (minha === geracao) requestAnimationFrame(frame);
    }
    pinta = frame;
    requestAnimationFrame(frame);
  }

  /* links internos sem sujar o endereço (o ?r= guarda a edição) */
  function links(raiz) {
    raiz.addEventListener('click', e => {
      const a = e.target.closest('[data-ir]');
      if (!a) return;
      e.preventDefault();
      irPara(a.dataset.ir);
    });
  }

  /* ---------------- página ---------------- */
  let motor = null;
  function monta(D, cfg, ctx) {
    PRESO = !celular();
    document.documentElement.classList.toggle('anima', !reduz());
    document.documentElement.classList.toggle('preso', PRESO);
    document.title = 'Relatório ' + TIPO_TXT[D.tipo] + ' · ' + D.cliente.nome + ' · ' + D.periodo.texto;
    if (motor) { motor.destroy(); motor = null; }
    const main = h('main', { class: 'rel', id: 'rel' },
      capa(D, cfg, ctx), calendario(D, ctx), resumo(D), numeros(D), numerosDia(D),
      (D.redes || []).map((r, i) => rede(r, i, D)),
      (D.temas || []).map((t, i) => temaSec(t, i)),
      publicacoes(D, ctx), sentimento(D), publicadores(D), termos(D), fechamento(D, cfg));
    const antigo = document.getElementById('rel');
    if (antigo) antigo.replaceWith(main); else document.body.prepend(main);
    const m = document.querySelector('.menu'); if (m) m.remove();
    document.body.append(menu(ctx));
    links(main);
    observa(main);
    if (window.ScrollCraft) motor = window.ScrollCraft.mount(main);
    movimento(ctx);
  }

  /* ---------------- acesso: usuário e senha abrem os dados criptografados ---------------- */
  const CHAVE_SESSAO = 'e3-acesso';
  const lerSessao = () => { try { return sessionStorage.getItem(CHAVE_SESSAO); } catch (e) { return null; } };
  const gravarSessao = v => { try { v ? sessionStorage.setItem(CHAVE_SESSAO, v) : sessionStorage.removeItem(CHAVE_SESSAO); } catch (e) {} };
  const segredoDe = (u, s) => u.trim().toLowerCase() + ':' + s;
  async function destranca(T, segredo) {
    const b = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(segredo), 'PBKDF2', false, ['deriveKey']);
    const chave = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b(T.salt), iterations: T.iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const claro = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b(T.iv) }, chave, b(T.ct));
    return new TextDecoder().decode(claro);
  }
  function telaAcesso(cfg, tenta) {
    const erro = h('p', { class: 'acesso-erro', role: 'alert' });
    const usuario = h('input', { id: 'acesso-u', name: 'username', autocomplete: 'username', autocapitalize: 'none', spellcheck: 'false', required: true });
    const senha = h('input', { id: 'acesso-s', name: 'password', type: 'password', autocomplete: 'current-password', required: true });
    const bt = h('button', { type: 'submit', class: 'acesso-bt' }, 'Entrar');
    const form = h('form', { class: 'acesso-form', onsubmit: async e => {
      e.preventDefault();
      bt.disabled = true; bt.textContent = 'Abrindo…'; erro.textContent = '';
      const ok = await tenta(segredoDe(usuario.value, senha.value));
      if (!ok) { bt.disabled = false; bt.textContent = 'Entrar'; erro.textContent = 'Usuário ou senha incorretos.'; senha.value = ''; senha.focus(); }
    } },
      h('label', { for: 'acesso-u' }, 'Usuário'), usuario,
      h('label', { for: 'acesso-s' }, 'Senha'), senha,
      erro, bt);
    const tela = h('main', { class: 'acesso', id: 'acesso' },
      cfg.fundoAcesso ? h('img', { class: 'acesso-fundo', src: cfg.fundoAcesso, alt: '', 'aria-hidden': 'true' }) : null,
      h('div', { class: 'acesso-caixa' },
        h('div', { class: 'acesso-marcas' },
          cfg.logoE3 ? h('img', { src: cfg.logoE3, alt: 'E3 Comunicação Integrada', class: 'acesso-e3' }) : null,
          cfg.marcaBranca ? h('img', { src: cfg.marcaBranca, alt: 'Cliente', class: 'acesso-cliente' }) : null),
        h('h1', {}, 'Relatório de redes sociais'),
        h('p', {}, 'Acesso restrito. Entre com o usuário e a senha que você recebeu.'),
        form));
    document.body.prepend(tela);
    usuario.focus();
    return () => tela.remove();
  }
  function sair() { gravarSessao(null); location.reload(); }

  /* carrega a edição: ?r=tipo/AAAA-MM-DD; sem ?r, a última semanal */
  window.RelatorioE3 = {
    iniciar(cfg) {
      const ed = cfg.edicoes || {};
      const ultima = t => (ed[t] || []).slice().sort().pop();
      function ler() {
        const r = new URLSearchParams(location.search).get('r') || '';
        let [t, d] = r.split('/');
        if (!ed[t] || !ed[t].length) t = ['semanal', 'diario', 'mensal'].find(x => (ed[x] || []).length);
        if (!d || !(ed[t] || []).includes(d)) d = ultima(t);
        return [t, d];
      }
      const script = src => new Promise((ok, falha) => { const s = document.createElement('script'); s.src = src; s.onload = () => { s.remove(); ok(); }; s.onerror = () => { s.remove(); falha(); }; document.head.append(s); });
      async function obtemDados(base) {
        if (!cfg.trancado) { window.DADOS = null; await script(base + 'dados.js'); return window.DADOS; }
        window.DADOS_TRANCADO = null;
        await script(base + 'dados.trancado.js');
        const T = window.DADOS_TRANCADO;
        const abre = async segredo => {
          try { window.DADOS = null; (new Function(await destranca(T, segredo)))(); gravarSessao(segredo); return window.DADOS; }
          catch (e) { return null; }
        };
        const guardado = lerSessao();
        if (guardado) { const D = await abre(guardado); if (D) return D; gravarSessao(null); }
        return new Promise(ok => { const fecha = telaAcesso(cfg, async segredo => { const D = await abre(segredo); if (D) { fecha(); ok(D); } return !!D; }); });
      }
      async function carrega(t, d, troca) {
        const base = t + '/' + d + '/';
        let D;
        try { D = await obtemDados(base); } catch (e) { D = null; }
        if (!D) { document.body.prepend(h('p', { class: 'erro' }, 'Não foi possível carregar esta edição.')); return; }
        const abs = p => p ? new URL(p, new URL(base, location.href)).href : p;
        if (D.capa) { D.capa.foto = abs(D.capa.foto); D.capa.celular = abs(D.capa.celular); }
        (D.redes || []).forEach(r => { if (r.destaque) r.destaque.print = abs(r.destaque.print); });
        const ctx = { edicoes: ed, tipo: t, data: d, sair: cfg.trancado ? sair : null, trocar: novo => { const nd = ultima(novo); if (!nd) return; history.replaceState(null, '', '?r=' + novo + '/' + nd); carrega(novo, nd, true); },
          abrir: (nt, nd) => { if (!(ed[nt] || []).includes(nd)) return; history.replaceState(null, '', '?r=' + nt + '/' + nd); carrega(nt, nd, true); } };
        if (troca) { document.body.classList.add('trocando'); setTimeout(() => { monta(D, cfg, ctx); scrollTo(0, 0); document.body.classList.remove('trocando'); }, 260); }
        else monta(D, cfg, ctx);
      }
      const [t, d] = ler();
      if (!t) { document.body.prepend(h('p', { class: 'erro' }, 'Nenhuma edição disponível.')); return; }
      carrega(t, d);
    }
  };
})();
