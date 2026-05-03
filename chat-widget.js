/* CANGUSSU ADVOCACIA — Widget de Chat com IA
 * Auto-injeta uma janela de chat na página, conectada à Edge Function do Supabase.
 * Uso: <script src=".../chat-widget.js" data-trigger="#meuBotao"></script>
 * Se data-trigger não for passado, cria uma bolha flutuante no canto inferior direito.
 */
(function () {
  'use strict';
  if (window.__cangussuChatLoaded) return;
  window.__cangussuChatLoaded = true;

  const ENDPOINT = 'https://kxvtftxjwnosqvbqxudd.supabase.co/functions/v1/chat';

  // ============= System prompt do Dr. Adolfo (7 fases) =============
  const SYSTEM_PROMPT = [
    '## IDENTIDADE',
    'Você é o Dr. Adolfo, advogado titular do escritório CANGUSSU ADVOCACIA (OAB/SP 37.884).',
    '',
    '## INSTRUÇÃO OBRIGATÓRIA',
    'Você DEVE seguir o fluxo de atendimento abaixo FASE POR FASE, na ordem exata. NUNCA pule fases.',
    '',
    '## REGRAS ABSOLUTAS',
    '1. Português do Brasil, primeira pessoa, tom humano, acolhedor e profissional.',
    '2. UMA pergunta por vez. ESPERE a resposta antes de avançar.',
    '3. NUNCA invente dados do cliente. Sempre pergunte.',
    '4. Mantenha sigilo absoluto.',
    '5. Na PRIMEIRA mensagem, comece OBRIGATORIAMENTE com a saudação da FASE 1.',
    '',
    '━━━ FASE 1 — SAUDAÇÃO E CREDENCIAL OAB ━━━',
    'Envie EXATAMENTE este texto na primeira resposta:',
    '"Opa, tudo bem! Sou o Dr. Adolfo, advogado do escritório Cangussu Advocacia. Estou aqui para te ouvir e entender melhor a sua situação antes de qualquer coisa.',
    'E para que você já comece com toda a segurança, saiba que o escritório Cangussu Advocacia está devidamente inscrito na OAB/SP. Você pode confirmar minha idoneidade acessando www.oabsp.org.br, na aba CONSULTA DE INSCRITOS, número 37884 em SOCIEDADE DE ADVOGADOS.',
    'Me diz — você já foi atendido pelo nosso escritório antes, ou é a primeira vez?"',
    '',
    'Após resposta:',
    '- NOVO → "Seja muito bem-vindo! Tudo que me contar é sigiloso. Me conta o que está acontecendo."',
    '- RECORRENTE → "Que bom ter você de volta! Me conta o que surgiu."',
    '',
    '━━━ FASE 2 — EXPOSIÇÃO DO CASO ━━━',
    'Escute o relato. Se faltar info, pergunte UMA coisa por vez (quando aconteceu, tentou resolver antes, há documentos). Avance quando tiver fatos+contexto+período.',
    '',
    '━━━ FASE 3 — ESCLARECIMENTO ━━━',
    'Diga: "Entendi. Seu caso envolve a área de [identifique]." Explique a lei, prazos, possibilidades. Pergunte se tem dúvida.',
    '',
    '━━━ FASE 4 — COLETA DE DADOS (uma pergunta por vez) ━━━',
    '1. Nome completo  2. CPF  3. RG (com órgão)  4. Nacionalidade  5. Estado civil  6. Profissão  7. Endereço completo+CEP  8. Telefone/WhatsApp+e-mail',
    '',
    'Ao coletar TODOS, emita NA MESMA resposta:',
    '[[DADOS_CLIENTE:{"nome":"...","cpf":"...","rg":"...","nacionalidade":"...","estado_civil":"...","profissao":"...","endereco":"...","cep":"...","cidade":"...","estado":"...","telefone":"...","email":"...","area_direito":"...","descricao_caso":"..."}]]',
    'Use EXATAMENTE os dados que o cliente informou. NÃO invente.',
    '',
    '━━━ FASE 5 — CONTRATO ━━━',
    'Diga: "Perfeito! Com seus dados o sistema preparou todos os documentos. Vou te explicar:"',
    '"1. Contrato de Honorários  2. Procuração  3. Hipossuficiência  4. Isenção IR"',
    '"Os links aparecerão no chat. Leia com atenção antes de assinar."',
    '',
    'SE OBJEÇÃO: empatize e reforce verificação OAB (oabsp.org.br → CONSULTA DE INSCRITOS → 37884).',
    '',
    'AGENDAMENTO: quando cliente confirmar data/horário, emita:',
    '[[AGENDAR:{"titulo":"Reunião inicial — [nome]","cliente":"[nome]","data":"YYYY-MM-DDTHH:MM","duracao":45,"whats":"55DDDnúmero","email":"[email]"}]]',
    'NUNCA mencione marcadores ao cliente.',
    '',
    '━━━ FASE 6 — DOCUMENTOS FÍSICOS ━━━',
    '"Preciso que envie: 1. Foto RG/CNH frente e verso  2. Comprovante de residência. Pode mandar aqui mesmo no chat."',
    '',
    '━━━ FASE 7 — ENCERRAMENTO ━━━',
    '"Recebi tudo! Resumo: Caso, Área, Contrato assinado, Documentos, Reunião, Protocolo #CANG-[número]."',
    '"Vou analisar e iniciar os trabalhos. Pode contar comigo!"'
  ].join('\n');

  // ============= CSS =============
  const css = `
    .cgw-bubble{position:fixed;bottom:20px;right:20px;width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#9d6bff,#6b3fc9);box-shadow:0 8px 24px rgba(157,107,255,.4);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:28px;color:#fff;z-index:999998;transition:transform .2s;border:none}
    .cgw-bubble:hover{transform:scale(1.08)}
    .cgw-bubble.online::after{content:"";position:absolute;bottom:6px;right:6px;width:14px;height:14px;border-radius:50%;background:#37d39b;border:2px solid #fff}
    .cgw-window{position:fixed;bottom:90px;right:20px;width:360px;height:560px;max-height:80vh;background:#0d0a17;border:1px solid #2a2142;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.5);display:none;flex-direction:column;overflow:hidden;z-index:999999;font-family:'Inter',-apple-system,Segoe UI,Roboto,sans-serif;color:#ece8f5}
    .cgw-window.open{display:flex;animation:cgwIn .3s ease}
    @keyframes cgwIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    .cgw-head{padding:14px 16px;background:linear-gradient(135deg,#1a1528,#241935);border-bottom:1px solid #2a2142;display:flex;align-items:center;gap:10px}
    .cgw-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#9d6bff,#6b3fc9);display:flex;align-items:center;justify-content:center;font-size:18px;color:#fff;font-weight:700;position:relative}
    .cgw-avatar::after{content:"";position:absolute;bottom:0;right:0;width:10px;height:10px;border-radius:50%;background:#37d39b;border:2px solid #1a1528}
    .cgw-title{flex:1;line-height:1.2}
    .cgw-title b{display:block;font-size:14px}
    .cgw-title small{font-size:11px;color:#8a84a0}
    .cgw-close{background:none;border:none;color:#ece8f5;font-size:22px;cursor:pointer;padding:4px;opacity:.7}
    .cgw-close:hover{opacity:1}
    .cgw-chat{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#08060d}
    .cgw-chat::-webkit-scrollbar{width:6px}
    .cgw-chat::-webkit-scrollbar-thumb{background:#2a2142;border-radius:3px}
    .cgw-bubble-msg{max-width:85%;padding:10px 14px;font-size:13px;line-height:1.5;white-space:pre-wrap;word-wrap:break-word}
    .cgw-bubble-msg.user{align-self:flex-end;background:linear-gradient(135deg,#9d6bff,#6b3fc9);color:#fff;border-radius:12px 12px 2px 12px}
    .cgw-bubble-msg.bot{align-self:flex-start;background:#1a1528;border:1px solid #2a2142;border-radius:12px 12px 12px 2px}
    .cgw-bubble-msg.typing{font-style:italic;color:#8a84a0;font-size:11px;padding:8px 14px}
    .cgw-input-row{padding:12px;border-top:1px solid #2a2142;background:#0d0a17;display:flex;gap:8px}
    .cgw-input{flex:1;padding:10px 12px;background:#0f0f17;border:1px solid #2a2142;border-radius:10px;color:#ece8f5;font-size:13px;outline:none;font-family:inherit}
    .cgw-input:focus{border-color:#9d6bff}
    .cgw-send{padding:10px 16px;background:linear-gradient(135deg,#9d6bff,#b88bff);border:none;border-radius:10px;color:#1a1005;font-weight:600;font-size:13px;cursor:pointer}
    .cgw-send:disabled{opacity:.5;cursor:not-allowed}
    .cgw-docs{align-self:flex-start;width:95%;padding:12px;background:linear-gradient(135deg,#1a1528,#241935);border:1px solid #9d6bff;border-radius:12px}
    .cgw-docs h4{margin:0 0 8px;color:#b88bff;font-size:13px}
    .cgw-docs button{display:flex;align-items:center;gap:8px;width:100%;padding:8px 10px;margin:3px 0;background:#0f0f17;border:1px solid #2a2142;border-radius:8px;color:#ece8f5;font-size:12px;cursor:pointer;text-align:left;font-family:inherit}
    .cgw-docs button:hover{border-color:#9d6bff}
    .cgw-foot{padding:6px 14px;font-size:10px;color:#8a84a0;text-align:center;background:#0d0a17;border-top:1px solid #2a2142}
    .cgw-foot a{color:#9d6bff;text-decoration:none}
    @media(max-width:480px){
      .cgw-window{width:100vw;height:100vh;max-height:100vh;bottom:0;right:0;border-radius:0;border:none}
      .cgw-bubble{bottom:14px;right:14px}
    }
  `;

  // ============= DOM injection =============
  function el(tag, attrs, html) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'style') e.style.cssText = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    if (html != null) e.innerHTML = html;
    return e;
  }

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // Bolha flutuante
  const bubble = el('button', { class: 'cgw-bubble online', 'aria-label': 'Falar com Dr. Adolfo' }, '⚖️');

  // Janela
  const win = el('div', { class: 'cgw-window', role: 'dialog' });
  win.innerHTML =
    '<div class="cgw-head">' +
      '<div class="cgw-avatar">DA</div>' +
      '<div class="cgw-title"><b>Dr. Adolfo</b><small>● Online — responde em segundos</small></div>' +
      '<button class="cgw-close" aria-label="Fechar">✕</button>' +
    '</div>' +
    '<div class="cgw-chat" id="cgw-chat"></div>' +
    '<div class="cgw-input-row">' +
      '<input class="cgw-input" id="cgw-input" placeholder="Digite sua mensagem..." autocomplete="off"/>' +
      '<button class="cgw-send" id="cgw-send">Enviar</button>' +
    '</div>' +
    '<div class="cgw-foot">🔒 Conversa protegida — <a href="https://www.oabsp.org.br" target="_blank" rel="noopener">OAB/SP 37.884</a></div>';

  document.body.appendChild(bubble);
  document.body.appendChild(win);

  const chat = win.querySelector('#cgw-chat');
  const input = win.querySelector('#cgw-input');
  const sendBtn = win.querySelector('#cgw-send');
  const closeBtn = win.querySelector('.cgw-close');

  let history = [];
  let isOpen = false;
  let seeded = false;

  function addBubble(text, role) {
    const b = el('div', { class: 'cgw-bubble-msg ' + (role === 'user' ? 'user' : 'bot') });
    b.textContent = text;
    chat.appendChild(b);
    chat.scrollTop = chat.scrollHeight;
    return b;
  }

  function addTyping() {
    const t = el('div', { class: 'cgw-bubble-msg bot typing' }, '✍️ digitando...');
    chat.appendChild(t);
    chat.scrollTop = chat.scrollHeight;
    return t;
  }

  // ============= Geração de documentos =============
  function dataExtenso() {
    const m = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
    const n = new Date();
    return 'Araçatuba, ' + n.getDate() + ' de ' + m[n.getMonth()] + ' de ' + n.getFullYear();
  }

  function gerarDocHTML(tipo, d) {
    const data = dataExtenso();
    const nome = (d.nome||'').toUpperCase();
    const css = 'body{font-family:Arial,sans-serif;font-size:14px;line-height:1.8;color:#222;max-width:700px;margin:40px auto;padding:20px}h1{text-align:center;font-size:18px;margin-bottom:30px}.assinatura{margin-top:60px;text-align:center}.linha{border-top:1px solid #333;width:350px;margin:0 auto 5px;padding-top:5px}.rodape{text-align:center;margin-top:10px;font-size:12px;color:#888}p{text-align:justify;text-indent:40px}@media print{body{margin:0}}';

    if (tipo === 'contrato') {
      return '<html><head><meta charset="UTF-8"><title>Contrato de Honorários</title><style>'+css+'</style></head><body>'
        +'<h1>CONTRATO DE HONORÁRIOS PROFISSIONAIS</h1>'
        +'<p><strong>CANGUSSU ADVOCACIA E CONSULTORIA JURÍDICA</strong>, CNPJ 44.007.353/0001-99, na Rua São Fidélis - 817, Jardim Paraíso, Araçatuba/SP e <strong>'+nome+'</strong>, '+(d.nacionalidade||'brasileiro(a)')+', '+(d.estado_civil||'')+', '+(d.profissao||'')+', CPF '+(d.cpf||'')+' e RG '+(d.rg||'')+', residente a '+(d.endereco||'')+', CEP '+(d.cep||'')+', '+(d.cidade||'')+'/'+(d.estado||'SP')+'.</p>'
        +'<p><strong>I -</strong> O contratado obriga-se à propositura e acompanhamento da ação de '+(d.descricao_caso||d.area_direito||'')+'.</p>'
        +'<p><strong>II -</strong> Prestação de serviços advocatícios judiciais, extrajudiciais e acessória jurídica.</p>'
        +'<p><strong>III -</strong> Honorários: 30% dos benefícios no êxito da ação, mais as 3 primeiras parcelas em demandas previdenciárias.</p>'
        +'<p><strong>IV -</strong> Mesmo em revogação ou desistência, o Contratado faz jus aos honorários.</p>'
        +'<p><strong>V -</strong> Em caso de renúncia justa, o Contratado mantém o exercício até substituição.</p>'
        +'<p><strong>VI -</strong> Obrigação de meio: empregar todos os meios legais e éticos.</p>'
        +'<p><strong>VII -</strong> Autoriza levantamento de honorários nos próprios autos e em acordo extrajudicial.</p>'
        +'<p><strong>VIII -</strong> Negócio processual (art. 190 CPC): inadimplemento autoriza arresto e penhora de até 30% do salário/aposentadoria.</p>'
        +'<p><strong>IX -</strong> Foro da comarca do contratante.</p>'
        +'<p style="text-align:center;margin-top:30px">'+data+'</p>'
        +'<div class="assinatura"><div class="linha">'+nome+'</div></div>'
        +'<div class="assinatura" style="margin-top:30px"><div class="linha">CANGUSSU ADVOCACIA</div></div>'
        +'<div class="rodape">Cangussu Advocacia — OAB/SP 37.884</div>'
        +'</body></html>';
    }
    if (tipo === 'procuracao') {
      return '<html><head><meta charset="UTF-8"><title>Procuração</title><style>'+css+'</style></head><body>'
        +'<h1>PROCURAÇÃO AD JUDICIA</h1>'
        +'<p><strong>OUTORGANTE:</strong> '+nome+', '+(d.nacionalidade||'brasileiro(a)')+', '+(d.estado_civil||'')+', '+(d.profissao||'')+', CPF '+(d.cpf||'')+' e RG '+(d.rg||'')+', residente a '+(d.endereco||'')+', CEP '+(d.cep||'')+', '+(d.cidade||'')+'/'+(d.estado||'SP')+'.</p>'
        +'<p><strong>OUTORGADO:</strong> CLESLEY ADOLFO RAMOS CANGUSSU, brasileiro, casado, advogado, OAB/SP 412.855, CPF 266.479.678-00, escritório na Rua São Fidélis - 817, Jardim Paraíso, CEP 16.074-275, Araçatuba/SP.</p>'
        +'<p><strong>PODERES:</strong> amplos poderes para o foro em geral, com cláusula "ad-judicia et extra", em qualquer Juízo, Instância ou Tribunal, podendo propor e defender ações, receber citação, confessar, desistir, transigir, firmar acordos, receber e dar quitação, substabelecer com ou sem reservas.</p>'
        +'<p style="text-align:center;margin-top:30px">'+data+'</p>'
        +'<div class="assinatura"><div class="linha">'+nome+'</div></div>'
        +'<div class="rodape">Cangussu Advocacia — OAB/SP 37.884</div>'
        +'</body></html>';
    }
    if (tipo === 'hipossuficiencia') {
      return '<html><head><meta charset="UTF-8"><title>Hipossuficiência</title><style>'+css+'</style></head><body>'
        +'<h1>DECLARAÇÃO DE HIPOSSUFICIÊNCIA</h1>'
        +'<p>'+nome+', '+(d.nacionalidade||'brasileiro(a)')+', '+(d.estado_civil||'')+', '+(d.profissao||'')+', RG '+(d.rg||'')+', CPF '+(d.cpf||'')+', domiciliado(a) na '+(d.endereco||'')+', CEP '+(d.cep||'')+', '+(d.cidade||'Araçatuba')+'/'+(d.estado||'SP')+', declara para os fins do art. 5º LXXIV CF, Lei 1.060/50, art. 1º Lei 7.115/83 e art. 98 e segs CPC, sob as penas da lei, não ter condições financeiras de arcar com custas e despesas processuais sem prejuízo do próprio sustento e família, requerendo o deferimento dos benefícios da <strong>JUSTIÇA GRATUITA</strong>, abrangendo todos os atos do processo.</p>'
        +'<p style="text-align:center;margin-top:30px">'+data+'</p>'
        +'<div class="assinatura"><div class="linha">'+nome+'</div></div>'
        +'<div class="rodape">Cangussu Advocacia — OAB/SP 37.884</div>'
        +'</body></html>';
    }
    if (tipo === 'declaracao_ir') {
      return '<html><head><meta charset="UTF-8"><title>Isenção IR</title><style>'+css+'</style></head><body>'
        +'<h1>DECLARAÇÃO DE ISENÇÃO DO IMPOSTO DE RENDA (IRPF)</h1>'
        +'<p>Eu, '+nome+', '+(d.nacionalidade||'brasileiro(a)')+', '+(d.estado_civil||'')+', '+(d.profissao||'')+', CPF '+(d.cpf||'')+' e RG '+(d.rg||'')+', residente a '+(d.endereco||'')+', CEP '+(d.cep||'')+', '+(d.cidade||'')+'/'+(d.estado||'SP')+', DECLARO ser isento(a) da apresentação da DIRPF por não incorrer em nenhuma hipótese de obrigatoriedade da Receita Federal.</p>'
        +'<p>Conforme IN RFB 1548/2015 e Lei 7.115/83. Declaro sob as penas da lei a veracidade das informações.</p>'
        +'<p style="text-align:center;margin-top:30px">'+data+'</p>'
        +'<div class="assinatura"><div class="linha">'+nome+'</div></div>'
        +'<div class="rodape">Cangussu Advocacia — OAB/SP 37.884</div>'
        +'</body></html>';
    }
    return '';
  }

  function abrirDoc(tipo, dados) {
    const html = gerarDocHTML(tipo, dados);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  function painelDocs(dados) {
    const docs = [
      { tipo: 'contrato', label: '📄 Contrato de Honorários' },
      { tipo: 'procuracao', label: '📋 Procuração Ad Judicia' },
      { tipo: 'hipossuficiencia', label: '📜 Declaração de Hipossuficiência' },
      { tipo: 'declaracao_ir', label: '📑 Declaração Isenção IR' }
    ];
    const panel = el('div', { class: 'cgw-docs' });
    panel.innerHTML = '<h4>📂 Documentos Gerados</h4>';
    docs.forEach(d => {
      const btn = el('button', null, d.label + ' <span style="margin-left:auto;color:#9d6bff">Abrir ↗</span>');
      btn.style.justifyContent = 'space-between';
      btn.addEventListener('click', () => abrirDoc(d.tipo, dados));
      panel.appendChild(btn);
    });
    chat.appendChild(panel);
    chat.scrollTop = chat.scrollHeight;
  }

  // ============= Marcadores [[...]] =============
  function processMarkers(reply) {
    let out = reply;

    // DADOS_CLIENTE
    const dadosRe = /\[\[DADOS_CLIENTE:\s*(\{[\s\S]*?\})\s*\]\]/g;
    const dadosMatches = [...reply.matchAll(dadosRe)];
    for (const m of dadosMatches) {
      try {
        const dados = JSON.parse(m[1]);
        // Salva no Supabase via REST
        salvarCliente(dados);
        // Renderiza painel após split
        setTimeout(() => painelDocs(dados), 1200);
        out = out.replace(m[0], '\n📂 Preparei seus documentos. Veja abaixo:');
      } catch (e) {
        console.error('[cgw] DADOS_CLIENTE parse error:', e);
        out = out.replace(m[0], '');
      }
    }

    // AGENDAR
    const agRe = /\[\[AGENDAR:\s*(\{[\s\S]*?\})\s*\]\]/g;
    const agMatches = [...out.matchAll(agRe)];
    for (const m of agMatches) {
      try {
        const p = JSON.parse(m[1]);
        const slug = (p.cliente || 'cliente').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '-');
        const meetLink = 'https://meet.jit.si/CangussuAdvocacia-' + slug + '-' + Date.now();
        const when = new Date(p.data).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' });
        salvarReuniao(p, meetLink);
        const conf = '\n\n━━━━━━━━━━━━━━━━━━━━━━━━\n✅ REUNIÃO AGENDADA\n━━━━━━━━━━━━━━━━━━━━━━━━\n📌 ' + (p.titulo || 'Reunião') + '\n📅 ' + when + '\n⏱ ' + (p.duracao || 45) + ' minutos\n🎥 ' + meetLink + '\n━━━━━━━━━━━━━━━━━━━━━━━━';
        out = out.replace(m[0], conf);
      } catch (e) {
        console.error('[cgw] AGENDAR parse error:', e);
      }
    }

    return out;
  }

  // ============= Salvar no Supabase =============
  const SB_URL = 'https://kxvtftxjwnosqvbqxudd.supabase.co';
  const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4dnRmdHhqd25vc3F2YnF4dWRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMzU3MDUsImV4cCI6MjA5MTYxMTcwNX0.CM8hl7HTDPe-tiU-bf8X2diT7M7rB6TtEKlByGEHIKA';

  async function salvarCliente(d) {
    if (!SB_ANON) return;
    try {
      await fetch(SB_URL + '/rest/v1/clientes', {
        method: 'POST',
        headers: {
          'apikey': SB_ANON,
          'Authorization': 'Bearer ' + SB_ANON,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          nome: d.nome, cpf: d.cpf, estado_civil: d.estado_civil,
          endereco: d.endereco, cep: d.cep, telefone: d.telefone,
          email: d.email, whatsapp: d.telefone, area_direito: d.area_direito,
          observacoes: d.descricao_caso || ''
        })
      });
    } catch (e) { console.warn('[cgw] salvar cliente:', e); }
  }

  async function salvarReuniao(p, meetLink) {
    if (!SB_ANON) return;
    try {
      await fetch(SB_URL + '/rest/v1/reunioes', {
        method: 'POST',
        headers: {
          'apikey': SB_ANON,
          'Authorization': 'Bearer ' + SB_ANON,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          titulo: p.titulo, cliente_nome: p.cliente, data_hora: p.data,
          duracao: p.duracao || 45, tipo: 'jitsi', meet_link: meetLink,
          whats: p.whats, email: p.email, status: 'agendada'
        })
      });
    } catch (e) { console.warn('[cgw] salvar reuniao:', e); }
  }

  // ============= Quebra em bolhas =============
  async function addSplitBubbles(fullText) {
    const lines = fullText.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
    const parts = [];
    let buf = '';
    for (const line of lines) {
      if (buf && (buf.length > 80 || line.length > 80 || /^[━─═\-•\d📄📋📜📑📂✅📌📅⏱🎥⚠]/.test(line))) {
        parts.push(buf);
        buf = line;
      } else {
        buf = buf ? buf + '\n' + line : line;
      }
    }
    if (buf) parts.push(buf);
    if (parts.length <= 1) {
      addBubble(fullText, 'bot');
      return;
    }
    for (let i = 0; i < parts.length; i++) {
      if (i > 0) {
        const t = addTyping();
        await new Promise(r => setTimeout(r, 1200));
        t.remove();
      }
      addBubble(parts[i], 'bot');
    }
  }

  // ============= Chamada à Edge Function =============
  async function callAI(userMsg) {
    history.push({ role: 'user', content: userMsg });
    const recent = history.slice(-20);
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: recent, system: SYSTEM_PROMPT })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data.reply || '(sem resposta)';
    } catch (e) {
      return '⚠️ Erro: ' + e.message;
    }
  }

  async function send(text) {
    if (!text || !text.trim()) return;
    const msg = text.trim();
    addBubble(msg, 'user');
    sendBtn.disabled = true;
    const typing = addTyping();
    const reply = await callAI(msg);
    typing.remove();
    sendBtn.disabled = false;
    if (reply) {
      const processed = processMarkers(reply);
      history.push({ role: 'assistant', content: processed });
      if (history.length > 20) history.splice(0, history.length - 20);
      await addSplitBubbles(processed);
    }
    input.focus();
  }

  // Auto-seed: dispara FASE 1 ao abrir
  async function seedV2() {
    if (seeded) return;
    seeded = true;
    sendBtn.disabled = true;
    const typing = addTyping();
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'Olá' }], system: SYSTEM_PROMPT })
      });
      const data = await res.json();
      typing.remove();
      sendBtn.disabled = false;
      if (data.reply) {
        history.push({ role: 'user', content: 'Olá' }, { role: 'assistant', content: data.reply });
        const processed = processMarkers(data.reply);
        await addSplitBubbles(processed);
      } else {
        addBubble('Olá! Como posso ajudar?', 'bot');
      }
    } catch (e) {
      typing.remove();
      sendBtn.disabled = false;
      addBubble('⚠️ Não consegui conectar agora. Tenta de novo daqui a pouco.', 'bot');
    }
  }

  // ============= Open/close =============
  function open() {
    if (isOpen) return;
    isOpen = true;
    win.classList.add('open');
    bubble.style.display = 'none';
    setTimeout(() => input.focus(), 100);
    if (!seeded) seedV2();
  }
  function close() {
    isOpen = false;
    win.classList.remove('open');
    bubble.style.display = 'flex';
  }

  bubble.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  sendBtn.addEventListener('click', () => { const t = input.value; input.value = ''; send(t); });
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); const t = input.value; input.value = ''; send(t); } });

  // ============= Trigger externo (botão da landing) =============
  const script = document.currentScript || document.querySelector('script[src*="chat-widget"]');
  const triggerSel = script && script.dataset.trigger;

  // Texto-padrão para auto-detectar (case insensitive, normalize accents)
  const AUTO_TEXTS = [
    'tire suas duvidas',
    'tire suas dúvidas',
    'falar com dr',
    'falar com adolfo',
    'falar com advogado',
    'atendimento online',
    'fale conosco',
    'iniciar atendimento',
    'tirar duvida',
    'tirar dúvida'
  ];

  function normalize(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  }

  const wired = new WeakSet();
  function wireBtn(btn) {
    if (wired.has(btn)) return;
    wired.add(btn);
    btn.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); open(); });
  }

  function autoDetectAndWire() {
    let found = 0;
    // 1) Selector custom (data-trigger)
    if (triggerSel) {
      document.querySelectorAll(triggerSel).forEach(b => { wireBtn(b); found++; });
    }
    // 2) Detecção por texto (botões + links)
    const candidates = document.querySelectorAll('button, a, [role="button"]');
    candidates.forEach(el => {
      const txt = normalize(el.textContent);
      if (!txt) return;
      if (AUTO_TEXTS.some(t => txt.includes(t))) {
        wireBtn(el);
        found++;
      }
    });
    return found;
  }

  function init() {
    const found = autoDetectAndWire();
    // Se encontrou trigger(s), esconde a bolha flutuante
    if (found > 0) bubble.style.display = 'none';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  // Re-tentativas para SPAs que renderizam tarde (React, Lovable, Vite)
  setTimeout(init, 800);
  setTimeout(init, 2000);
  setTimeout(init, 5000);

  // Observer: pega botões que aparecem dinamicamente (scroll, modais, etc.)
  if (window.MutationObserver) {
    const mo = new MutationObserver(() => { autoDetectAndWire(); });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  // API pública
  window.CangussuChat = { open: open, close: close };
})();
