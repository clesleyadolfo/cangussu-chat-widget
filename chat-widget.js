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

  // ============= System prompt do Dr. Adolfo — Fluxo v3.13 =============
  const SYSTEM_PROMPT = [
    '## IDENTIDADE',
    'Você é o Dr. Adolfo, advogado titular do escritório CANGUSSU ADVOCACIA (OAB/SP 37.884). Atendimento via chat em tempo real.',
    '',
    '## REGRAS ABSOLUTAS',
    '1. Português do Brasil, primeira pessoa, tom humano, acolhedor e profissional.',
    '2. UMA pergunta por vez. ESPERE a resposta. NUNCA repita perguntas que o cliente já respondeu — releia o histórico antes de cada resposta para confirmar.',
    '3. NUNCA invente dados do cliente. Sempre pergunte.',
    '4. Se desviar, acolha e reconduza com gentileza à fase atual.',
    '5. Sigilo absoluto.',
    '6. Na PRIMEIRA mensagem, comece OBRIGATORIAMENTE com a saudação da FASE 1.',
    '7. NUNCA mencione honorários de sucumbência (só fale se o cliente perguntar). Nunca invente leis, doutrinas ou jurisprudências — atenha-se ao direito brasileiro vigente.',
    '8. NUNCA oriente, sugira ou ofereça que o cliente acesse o INSS, "Meu INSS", protocole ou dê entrada no pedido por conta própria. O escritório cuida integralmente dessa etapa após o contrato. Se o cliente perguntar se pode dar entrada sozinho, reforce com gentileza que o escritório fará todo o trâmite.',
    '',
    '## FLUXO',
    'Siga FASE POR FASE, na ordem. NUNCA pule. Estado interno: FASE_ATUAL começa em 1.',
    '',
    '━━━ FASE 1 — SAUDAÇÃO ━━━',
    'Envie EXATAMENTE:',
    '"Opa, tudo bem! Sou o Dr. Adolfo do escritório Cangussu Advocacia."',
    '"Gostaria de te dizer que estou aqui para te ouvir e entender melhor a sua situação antes de qualquer coisa."',
    '"Me diz — você já foi atendido pelo nosso escritório antes, ou é a primeira vez? Você pode responder por áudio ou digitando."',
    '',
    'Após resposta:',
    '- NOVO → "Seja muito bem-vindo! Fico feliz que tenha nos procurado. Pode contar sua causa com total tranquilidade, tudo que me falar é sigiloso. Me conta o que está acontecendo."',
    '- RECORRENTE → "Que bom ter você de volta! Vamos dar continuidade. Me conta o que surgiu de novo."',
    '',
    '━━━ FASE 2 — EXPOSIÇÃO DO CASO ━━━',
    'Escute o relato. Se faltar info, pergunte UMA coisa por vez:',
    '- "Quando exatamente isso aconteceu?"',
    '- "Você já tentou resolver antes de me procurar?"',
    '- "Existe algum contrato, documento ou registro relacionado?"',
    'Avance para FASE 3 quando o relato tiver: fatos + contexto + período + urgência.',
    '',
    '━━━ FASE 3 — ESCLARECIMENTO ━━━',
    '"Entendi muito bem o que você me relatou. Com base no que me contou, o seu caso envolve a área de [identifique a área]."',
    'Explique lei, prazos, possibilidades. Pergunte: "Ficou alguma dúvida? Pode perguntar à vontade."',
    '',
    '## CLASSIFICAÇÃO DO CASO (decida agora):',
    '- **CENÁRIO 1**: Previdenciário OU Trabalhista PROPOSITURA (escritório promove a ação) → contrato no chat',
    '- **CENÁRIO 2**: Trabalhista DEFESA (cliente foi acionado), Cível, Empresarial, Agronegócio, ou demais → reunião virtual antes',
    '',
    '━━━ FASE 4 — DADOS PESSOAIS (APENAS CENÁRIO 1) ━━━',
    'Se for CENÁRIO 2, PULE direto para FASE 5.',
    '',
    'Apresente OAB antes de coletar dados:',
    '"Ótimo! Para formalizar seu atendimento, preciso confirmar algumas informações pessoais."',
    '"E para que você tenha toda a segurança, saiba que o escritório Cangussu Advocacia está devidamente inscrito na OAB/SP. Você pode confirmar nossa idoneidade acessando www.oabsp.org.br, aba CONSULTA DE INSCRITOS, número 37884 em SOCIEDADE DE ADVOGADOS."',
    '"Agora é necessário, para elaborar os papéis (contrato, procuração, etc.) e dar entrada no seu processo, que você me passe alguns dados pessoais. Tudo bem?"',
    '',
    'Colete UMA PERGUNTA POR VEZ (NUNCA repita perguntas — verifique antes se o dado já foi dado):',
    '1. Nome completo',
    '2. CPF',
    '3. Estado civil',
    '4. Endereço completo com CEP',
    '5. E-mail e WhatsApp (com DDD)',
    '',
    'Ao coletar TODOS, emita NA MESMA resposta:',
    '[[DADOS_CLIENTE:{"nome":"...","cpf":"...","estado_civil":"...","endereco":"...","cep":"...","cidade":"...","estado":"...","telefone":"...","email":"...","area_direito":"...","descricao_caso":"...","cenario":1}]]',
    'Use EXATAMENTE os dados informados. NÃO invente. NÃO mencione o marcador.',
    '',
    '━━━ FASE 5 — CONTRATO/AGENDAMENTO ━━━',
    '',
    '🟢 CENÁRIO 1 — CONTRATO NO CHAT:',
    '"Perfeito, obrigado! Quero destacar um ponto importante: você NÃO terá nenhum custo inicial para iniciar o seu caso conosco."',
    '"O escritório só ganha se você ganhar."',
    '"Com base no seu caso, preparei o contrato de honorários para sua apreciação no percentual de 30% sobre os valores obtidos se vencermos a ação — você não desembolsa nada agora; só o percentual no final do que ganharmos."',
    'Se for previdenciário, acrescente: "Caso o benefício venha a ser concedido administrativamente, os honorários correspondem ao valor dos 3 primeiros benefícios recebidos."',
    '"Os links dos documentos aparecerão aqui no chat. Leia com atenção. Se tiver qualquer dúvida sobre alguma cláusula, me pergunte antes de assinar."',
    '',
    'APÓS ASSINATURA: "Contrato formalizado! Se for necessário um encontro virtual para seguirmos com o caso, me diz a data e horário que funciona pra você. Caso contrário, vamos direto à coleta dos documentos."',
    '',
    '🔵 CENÁRIO 2 — REUNIÃO VIRTUAL ANTES:',
    '"Perfeito! Quero destacar que você NÃO terá nenhum custo inicial para marcar a reunião conosco!"',
    '"Agora vamos agendar nossa reunião virtual para eu analisar o seu caso com o detalhamento que ele merece e alinhar juntos as condições dos honorários e estratégias."',
    '"Vou conferir a agenda do escritório e já te passo as próximas opções de data e horário disponíveis — nossos atendimentos virtuais são de segunda a sexta, das 13h às 20h. É só me confirmar qual funciona melhor para você."',
    '',
    'Execução do agendamento Cenário 2 (na ordem):',
    '1. Colete UMA pergunta por vez: nome completo + e-mail/WhatsApp',
    '2. Após coletar TUDO, diga: "Vou conferir a agenda do escritório e te mostrar os horários disponíveis."',
    '3. EMITA O MARCADOR [[CALENDARIO]] em uma linha separada da resposta. O sistema vai exibir um calendário visual ao cliente para escolher data e hora.',
    '4. NÃO ofereça opções de data/hora em texto. NÃO emita [[AGENDAR:...]] manualmente — o sistema cuida disso após o cliente clicar.',
    '5. Após o sistema confirmar o agendamento, prossiga direto para FASE 7 (despedida Cenário 2).',
    '',
    '## DISPONIBILIDADE (já aplicada pelo sistema no calendário)',
    '- Janela: seg-sex 13h00-19h15 (último início)',
    '- Excluídos automaticamente: fins de semana, feriados nacionais e dias de emenda',
    '',
    '## MARCADOR DO CALENDÁRIO',
    'Use APENAS [[CALENDARIO]] para abrir o seletor visual.',
    '',
    '## MARCADOR DE AGENDAMENTO MANUAL (apenas se cliente insistir em outro formato):',
    '[[AGENDAR:{"titulo":"Reunião virtual — [nome]","cliente":"[nome]","data":"YYYY-MM-DDTHH:MM","duracao":45,"modalidade":"virtual","whats":"55DDDnumero","email":"[email]"}]]',
    'NUNCA mencione marcadores ao cliente.',
    '',
    'Cenário 1 → FASE 6. Cenário 2 → FASE 7.',
    '',
    'SE OBJEÇÃO (qualquer cenário): empatize, reforce OAB (oabsp.org.br → CONSULTA DE INSCRITOS → SOCIEDADE DE ADVOGADOS → 37884).',
    '',
    '━━━ FASE 6 — DOCUMENTOS (APENAS CENÁRIO 1) ━━━',
    'Se Cenário 2: PULE para FASE 7.',
    '',
    '"Para adiantar, preciso que me envie alguns documentos:"',
    '- PROCURAÇÃO (link)',
    '- ATESTADO HIPOSSUFICIÊNCIA (link)',
    '- RG ou CNH (frente e verso, foto legível)',
    '- COMPROVANTE DE RESIDÊNCIA',
    'Se trabalhista ou previdenciário: peça também CARTEIRA DE TRABALHO DIGITAL.',
    '"Você pode assinar digitalmente na tela do celular ou computador, e enviar fotos aqui no chat. Dúvida sobre algum documento?"',
    '',
    '━━━ FASE 7 — ENCERRAMENTO ━━━',
    '',
    '🟢 CENÁRIO 1:',
    '"Recebi tudo!"',
    '"Vou analisar tudo com atenção e já inicio os trabalhos no seu processo."',
    '"Em breve sua ação vai ser enviada à justiça e você irá receber um número de protocolo do processo."',
    '"Nosso escritório agradece a confiança depositada e qualquer dúvida, estamos à disposição para esclarecimentos."',
    '"Nos vemos na reunião! Até breve."',
    '',
    '🔵 CENÁRIO 2:',
    '"Ok, reunião agendada com sucesso. Você receberá um link para a reunião virtual no seu WhatsApp e e-mail."',
    '"Nosso escritório agradece a confiança depositada e qualquer dúvida, estamos à disposição para esclarecimentos."',
    '"Nos vemos na reunião! Até breve."'
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
    .cgw-input-row{padding:10px;border-top:1px solid #2a2142;background:#0d0a17;display:flex;gap:6px;align-items:center}
    .cgw-input{flex:1;padding:10px 12px;background:#0f0f17;border:1px solid #2a2142;border-radius:10px;color:#ece8f5;font-size:13px;outline:none;font-family:inherit}
    .cgw-input:focus{border-color:#9d6bff}
    .cgw-icon-btn{width:38px;height:38px;border-radius:10px;background:#0f0f17;border:1px solid #2a2142;color:#ece8f5;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:.15s;padding:0}
    .cgw-icon-btn:hover{border-color:#9d6bff;color:#9d6bff}
    .cgw-icon-btn.recording{background:#ff5a6a;color:#fff;border-color:#ff5a6a;animation:cgwPulse 1s infinite}
    @keyframes cgwPulse{0%,100%{opacity:1}50%{opacity:.6}}
    .cgw-send{padding:10px 14px;background:linear-gradient(135deg,#9d6bff,#b88bff);border:none;border-radius:10px;color:#1a1005;font-weight:600;font-size:13px;cursor:pointer;flex-shrink:0}
    .cgw-send:disabled{opacity:.5;cursor:not-allowed}
    .cgw-img-bubble{align-self:flex-end;max-width:200px;padding:4px;background:#1a1528;border-radius:10px;cursor:pointer}
    .cgw-img-bubble img{width:100%;border-radius:8px;display:block}
    .cgw-cal-buttons{align-self:flex-start;width:95%;padding:10px;background:#1a1528;border:1px solid #2a2142;border-radius:10px;margin:4px 0}
    .cgw-cal-buttons h5{margin:0 0 8px;color:#b88bff;font-size:12px;font-weight:600}
    .cgw-cal-buttons a{display:flex;align-items:center;gap:8px;padding:8px 10px;margin:3px 0;background:#0f0f17;border:1px solid #2a2142;border-radius:8px;color:#ece8f5;font-size:12px;text-decoration:none}
    .cgw-cal-buttons a:hover{border-color:#9d6bff}
    /* Calendário interativo */
    .cgw-picker{align-self:flex-start;width:97%;padding:12px;background:linear-gradient(135deg,#1a1528,#241935);border:1px solid #9d6bff;border-radius:12px;margin:6px 0}
    .cgw-picker h5{margin:0 0 4px;color:#b88bff;font-size:13px;font-weight:700}
    .cgw-picker .cgw-pkr-sub{font-size:11px;color:#8a84a0;margin-bottom:10px}
    .cgw-pkr-days{display:flex;gap:6px;overflow-x:auto;padding:4px 0 8px;scrollbar-width:thin}
    .cgw-pkr-days::-webkit-scrollbar{height:4px}
    .cgw-pkr-days::-webkit-scrollbar-thumb{background:#2a2142;border-radius:2px}
    .cgw-pkr-day{flex-shrink:0;min-width:54px;padding:8px 4px;background:#0f0f17;border:1px solid #2a2142;border-radius:8px;text-align:center;cursor:pointer;transition:.15s}
    .cgw-pkr-day:hover{border-color:#9d6bff}
    .cgw-pkr-day.selected{background:linear-gradient(135deg,#9d6bff,#6b3fc9);border-color:#9d6bff;color:#fff}
    .cgw-pkr-day .dow{font-size:9px;color:#8a84a0;text-transform:uppercase;letter-spacing:.5px}
    .cgw-pkr-day.selected .dow{color:#fff;opacity:.85}
    .cgw-pkr-day .num{font-size:16px;font-weight:700;color:#ece8f5;margin:2px 0}
    .cgw-pkr-day.selected .num{color:#fff}
    .cgw-pkr-day .mon{font-size:9px;color:#8a84a0}
    .cgw-pkr-day.selected .mon{color:#fff;opacity:.85}
    .cgw-pkr-times{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-top:8px}
    .cgw-pkr-time{padding:8px 4px;background:#0f0f17;border:1px solid #2a2142;border-radius:6px;text-align:center;cursor:pointer;font-size:12px;color:#ece8f5;font-weight:600;transition:.15s}
    .cgw-pkr-time:hover{border-color:#9d6bff;color:#9d6bff}
    .cgw-pkr-time.selected{background:linear-gradient(135deg,#37d39b,#2db588);border-color:#37d39b;color:#0a3d2c}
    .cgw-pkr-confirm{margin-top:10px;width:100%;padding:12px;background:linear-gradient(135deg,#37d39b,#2db588);border:none;border-radius:8px;color:#0a3d2c;font-size:13px;font-weight:700;cursor:pointer}
    .cgw-pkr-confirm:disabled{opacity:.4;cursor:not-allowed;background:#2a2142;color:#8a84a0}
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
      '<button class="cgw-icon-btn" id="cgw-attach" title="Enviar foto/documento" aria-label="Anexar">📎</button>' +
      '<button class="cgw-icon-btn" id="cgw-mic" title="Falar (segure para gravar)" aria-label="Microfone">🎤</button>' +
      '<input type="file" id="cgw-file" accept="image/*,application/pdf" style="display:none" capture="environment"/>' +
      '<input class="cgw-input" id="cgw-input" placeholder="Digite ou fale..." autocomplete="off" autocapitalize="sentences" autocorrect="on" inputmode="text" enterkeyhint="send" name="mensagem" type="text"/>' +
      '<button class="cgw-send" id="cgw-send">Enviar</button>' +
    '</div>' +
    '<div class="cgw-foot">🔒 Conversa protegida — <a href="https://www.oabsp.org.br" target="_blank" rel="noopener">OAB/SP 37.884</a></div>';

  document.body.appendChild(bubble);
  document.body.appendChild(win);

  const chat = win.querySelector('#cgw-chat');
  const input = win.querySelector('#cgw-input');
  const sendBtn = win.querySelector('#cgw-send');
  const closeBtn = win.querySelector('.cgw-close');
  const attachBtn = win.querySelector('#cgw-attach');
  const micBtn = win.querySelector('#cgw-mic');
  const fileInp = win.querySelector('#cgw-file');

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
    const css = 'body{font-family:Arial,sans-serif;font-size:11pt;line-height:1.5;color:#000;margin:2.5cm}h1{text-align:center;font-size:13pt;margin-bottom:30pt;text-decoration:underline;font-weight:bold}.linha-dados{margin:8pt 0;line-height:2}.assinatura{margin-top:50pt;text-align:center}.linha{border-top:1px solid #000;width:280pt;margin:0 auto;padding-top:4pt;font-weight:bold;font-size:10pt}p{text-align:justify;margin:8pt 0}@media print{body{margin:0}}';

    if (tipo === 'contrato') {
      return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Contrato de Honorários</title><style>'+css+'</style></head><body>'
        +'<h1>CONTRATO DE HONORÁRIOS PROFISSIONAIS</h1>'
        +'<p><strong>CANGUSSU ADVOCACIA</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº 44.007.353/0001-99, neste ato representada por seu sócio CLESLEY ADOLFO RAMOS CANGUSSU, brasileiro, casado, divorciado, inscrito na OAB/SP sob o nº 412.855 e no CPF sob o nº 266.479.678-00, com endereço profissional na Rua São Fidélis, nº 817, Bairro Amizade, CEP 16.074-275, Araçatuba/SP, e</p>'
        +'<p class="linha-dados"><strong>NOME:</strong> '+nome+'</p>'
        +'<p class="linha-dados"><strong>ESTADO CIVIL:</strong> '+(d.estado_civil||'')+' &nbsp;&nbsp; <strong>PROFISSÃO:</strong> '+(d.profissao||'')+'</p>'
        +'<p class="linha-dados"><strong>RG:</strong> '+(d.rg||'')+' &nbsp;&nbsp; <strong>C.P.F.:</strong> '+(d.cpf||'')+'</p>'
        +'<p class="linha-dados"><strong>ENDEREÇO:</strong> '+(d.endereco||'')+(d.cep?', CEP '+d.cep:'')+(d.cidade?', '+d.cidade:'')+(d.estado?'/'+d.estado:'')+'</p>'
        +'<p><strong>I –</strong> Como advogado devidamente habilitado, o contratado obriga-se a propositura\\acompanhamento do processo de '+(d.descricao_caso||d.area_direito||'')+'.</p>'
        +'<p><strong>II –</strong> O Contratado, por isso tratará de levar a efeito o desejo do contratante, propondo a mesma ação e a acompanhando, com o zelo e a diligência que se fazem mister.</p>'
        +'<p><strong>III –</strong> O (a) Contratante compromete-se a pagar ao Contratado, a títulos de honorários, a quantia de '+(d.valor_honorarios||'30% (trinta por cento) sobre os benefícios econômicos obtidos no êxito da ação, sendo que, em demandas previdenciárias com benefício concedido administrativamente, os honorários correspondem ao valor dos 3 (três) primeiros benefícios recebidos')+'.</p>'
        +'<p><strong>IV –</strong> Mesmo em caso de revogação ou desistência, o Contratado faz juz aos honorários aludidos nesta cláusula.</p>'
        +'<p><strong>V –</strong> No caso de, por justo motivo, ter o segundo Contratado de renunciar ao mandato, deverá manter-se em seu exercício até que possa o contratante substituí-lo, salvo se o próprio renunciante se fizer substituído por outro advogado. Neste caso, o contratado terá direito uma parte proporcional dos honorários, sendo a outra parte devida a seu substituto.</p>'
        +'<p><strong>VI -</strong> A obrigação do advogado é uma obrigação de meio e não de fim, isso significa que o advogado tem obrigação de empregar todos os meios legais e lícitos, bem como os moralmente legítimos e aceitos para defender os interesses do(a)s CONTRATANTE.</p>'
        +'<p><strong>VII –</strong> A contratante autoriza desde já que sejam levantados os honorários advocatícios diretamente nos próprios autos, bem como faz jus o contratado aos honorários contratados em caso de acordo extrajudicial.</p>'
        +'<p><strong>VII-</strong> As partes realizam, neste ato, de livre e espontânea vontade, o seguinte negócio processual, na forma prevista no art. 190 do Código de Processo Civil: caso o CONTRATANTE deixe de cumprir qualquer obrigação de pagar referente à presente contratação, levando o CONTRATADO a ingressar com ação executiva para o recebimento dos valores que lhe são devidos, o CONSTITUINTE autoriza, desde já, a realização de arresto cautelar e de penhora de até 30% do salário/aposentadoria que estiver recebendo, seja por ocupação mantida na iniciativa privada ou mesmo pelo exercício de algum cargo ou função públicos. Por força do presente acordo, o CONTRATANTE abre mão da impenhorabilidade do salário prevista na legislação, até o mencionado limite de 30%.</p>'
        +'<p style="text-align:right;margin-top:30pt"><strong>DATA:</strong> '+data+'</p>'
        +'<table style="width:100%;margin-top:60pt;text-align:center"><tr>'
        +'<td style="width:48%"><div class="linha">CANGUSSU ADVOCACIA</div></td>'
        +'<td style="width:4%"></td>'
        +'<td style="width:48%"><div class="linha">CONTRATANTE</div></td>'
        +'</tr></table>'
        +'</body></html>';
    }
    if (tipo === 'procuracao') {
      return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Procuração</title><style>'+css+'</style></head><body>'
        +'<h1>PROCURAÇÃO AD JUDICIA</h1>'
        +'<p class="linha-dados"><strong>OUTORGANTE:</strong></p>'
        +'<p class="linha-dados"><strong>NOME:</strong> '+nome+'</p>'
        +'<p class="linha-dados"><strong>ESTADO CIVIL:</strong> '+(d.estado_civil||'')+' &nbsp;&nbsp; <strong>PROFISSÃO:</strong> '+(d.profissao||'')+'</p>'
        +'<p class="linha-dados"><strong>RG:</strong> '+(d.rg||'')+' &nbsp;&nbsp; <strong>C.P.F.:</strong> '+(d.cpf||'')+'</p>'
        +'<p class="linha-dados"><strong>ENDEREÇO:</strong> '+(d.endereco||'')+(d.cep?', CEP '+d.cep:'')+(d.cidade?', '+d.cidade:'')+(d.estado?'/'+d.estado:'')+'</p>'
        +'<p style="margin-top:20pt"><strong>OUTORGADO:</strong> CANGUSSU SOCIEDADE INDIVIDUAL DE ADVOCACIA, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº 44.007.353/0001-99, neste ato representada por seu sócio CLESLEY ADOLFO RAMOS CANGUSSU, brasileiro, divorciado, advogado, inscrito na OAB/SP sob o nº 412.855 e no CPF sob o nº 266.479.678-00, com endereço profissional na Rua São Fidélis, nº 817, Bairro Amizade, CEP 16.074-275, Araçatuba/SP.</p>'
        +'<p style="margin-top:20pt"><strong>PODERES:</strong> pelo presente instrumento o outorgante confere ao outorgado amplos poderes para o foro em geral, com cláusula "ad-judicia et extra", em qualquer Juízo, Instância ou Tribunal, podendo propor contra quem de direito, as ações competentes e defendê-lo nas contrárias, seguindo umas e outras, até final decisão, usando os recursos legais e acompanhando-os, conferindo-lhe ainda, poderes especiais para receber citação inicial, confessar, e conhecer a procedência do pedido, desistir, renunciar ao direito, transigir, firmar compromissos ou acordos, receber e dar quitação, podendo agir em Juízo ou fora dele, assim como substabelecer está a outrem, com ou sem reservas de iguais poderes, para agir em conjunto ou separadamente com o substabelecido.</p>'
        +'<p style="text-align:right;margin-top:30pt"><strong>DATA:</strong> '+data+'</p>'
        +'<div class="assinatura" style="margin-top:50pt"><div class="linha">ASS. '+nome+'</div></div>'
        +'</body></html>';
    }
    if (tipo === 'hipossuficiencia') {
      return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Hipossuficiência</title><style>'+css+'</style></head><body>'
        +'<h1>DECLARAÇÃO DE HIPOSSUFICIÊNCIA</h1>'
        +'<p class="linha-dados"><strong>NOME:</strong> '+nome+'</p>'
        +'<p class="linha-dados"><strong>ESTADO CIVIL:</strong> '+(d.estado_civil||'')+' &nbsp;&nbsp; <strong>PROFISSÃO:</strong> '+(d.profissao||'')+'</p>'
        +'<p class="linha-dados"><strong>RG:</strong> '+(d.rg||'')+' &nbsp;&nbsp; <strong>C.P.F.:</strong> '+(d.cpf||'')+'</p>'
        +'<p class="linha-dados"><strong>ENDEREÇO:</strong> '+(d.endereco||'')+(d.cep?', CEP '+d.cep:'')+(d.cidade?', '+d.cidade:'')+(d.estado?'/'+d.estado:'')+'</p>'
        +'<p style="margin-top:20pt"><strong>declara</strong> para os fins específicos do beneplácito previsto no inciso LXXIV, do artigo 5º da Constituição Federal, c/c a Lei nº 1.060/50, artigo 1º da Lei nº 7.115/83 e nos termos do artigo 98 e seguintes da Lei 13.105/2015 (Código de Processo Civil), sob as penas da lei, não ter condições financeiras de arcar com custas e despesas processuais, sem prejuízo do próprio sustento e de sua família, razão pela qual requer o deferimento da concessão dos benefícios da <strong>JUSTIÇA GRATUITA</strong>. Requerendo, ainda, que o benefício abranja todos os atos do processo.</p>'
        +'<p style="text-align:right;margin-top:30pt"><strong>DATA:</strong> '+data+'</p>'
        +'<div class="assinatura" style="margin-top:50pt"><div class="linha">'+nome+'</div></div>'
        +'</body></html>';
    }
    if (tipo === 'declaracao_ir') {
      return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Isenção IR</title><style>'+css+'</style></head><body>'
        +'<h1>DECLARAÇÃO DE ISENÇÃO DO IMPOSTO DE RENDA PESSOA FÍSICA (IRPF)</h1>'
        +'<p>Eu, <strong>'+nome+'</strong>, brasileiro(a), '+(d.estado_civil||'')+', '+(d.profissao||'')+', CPF '+(d.cpf||'')+' e RG '+(d.rg||'')+', residente a '+(d.endereco||'')+', CEP '+(d.cep||'')+', município de '+(d.cidade||'')+'/'+(d.estado||'SP')+', <strong>DECLARO</strong> ser isento(a) da apresentação da Declaração do Imposto de Renda Pessoa Física (DIRPF) por não incorrer em nenhuma das hipóteses de obrigatoriedade estabelecidas pelas Instruções Normativas (IN) da Receita Federal do Brasil (RFB).</p>'
        +'<p>Esta declaração está em conformidade com a IN RFB nº 1548/2015 e a Lei nº 7.115/83. Declaro ainda, sob as penas da lei, serem verdadeiras todas as informações acima prestadas.</p>'
        +'<p style="text-align:right;margin-top:30pt"><strong>DATA:</strong> '+data+'</p>'
        +'<div class="assinatura" style="margin-top:50pt"><div class="linha">'+nome+'</div></div>'
        +'</body></html>';
    }
    return '';
  }

  // ============= ZapSign Integration =============
  const SIGN_ENDPOINT = 'https://kxvtftxjwnosqvbqxudd.supabase.co/functions/v1/sign';
  let html2pdfLoaded = null;

  function loadHtml2Pdf() {
    if (html2pdfLoaded) return html2pdfLoaded;
    html2pdfLoaded = new Promise((resolve, reject) => {
      if (window.html2pdf) return resolve(window.html2pdf);
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      s.onload = () => resolve(window.html2pdf);
      s.onerror = () => reject(new Error('Falha ao carregar html2pdf'));
      document.head.appendChild(s);
    });
    return html2pdfLoaded;
  }

  async function htmlParaBase64Pdf(html) {
    const html2pdf = await loadHtml2Pdf();
    // cria container fora da tela
    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.cssText = 'position:absolute;left:-9999px;top:0;width:210mm;background:#fff;color:#000';
    document.body.appendChild(container);
    try {
      const blob = await html2pdf()
        .from(container)
        .set({
          margin: [10, 10, 10, 10],
          filename: 'doc.pdf',
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        })
        .output('blob');
      // converte blob → base64
      return await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onloadend = () => {
          const b64 = String(r.result).split(',')[1];
          resolve(b64);
        };
        r.onerror = reject;
        r.readAsDataURL(blob);
      });
    } finally {
      container.remove();
    }
  }

  // Cria documento na ZapSign e devolve sign_url
  async function criarAssinaturaZapSign(tipo, dados) {
    const html = gerarDocHTML(tipo, dados);
    const base64_pdf = await htmlParaBase64Pdf(html);
    const dadosComPdf = { ...dados, base64_pdf };
    const res = await fetch(SIGN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, dados: dadosComPdf })
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || 'Erro ZapSign');
    return data;
  }

  function abrirDoc(tipo, dados) {
    // Apenas pré-visualização do HTML antes de assinar
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
      { tipo: 'declaracao_ir', label: '📑 Declaração de Isenção IR' }
    ];
    const panel = el('div', { class: 'cgw-docs' });
    panel.innerHTML = '<h4>📂 Documentos para Assinatura Digital</h4><div style="font-size:11px;color:var(--muted);margin-bottom:8px">Clique em "✍️ Assinar" para gerar o link e assinar online (ZapSign).</div>';

    docs.forEach(d => {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;gap:6px;margin:4px 0';

      const previewBtn = document.createElement('button');
      previewBtn.style.cssText = 'flex:1;padding:8px 10px;background:#0f0f17;border:1px solid #2a2142;border-radius:8px;color:#ece8f5;font-size:12px;cursor:pointer;text-align:left;font-family:inherit;display:flex;align-items:center;justify-content:space-between';
      previewBtn.innerHTML = d.label + ' <span style="color:#8a84a0;font-size:11px">👁 Pré-visualizar</span>';
      previewBtn.addEventListener('click', () => abrirDoc(d.tipo, dados));

      const signBtn = document.createElement('button');
      signBtn.style.cssText = 'padding:8px 12px;background:linear-gradient(135deg,#37d39b,#2db588);border:none;border-radius:8px;color:#0a3d2c;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap';
      signBtn.textContent = '✍️ Assinar';
      signBtn.addEventListener('click', async () => {
        signBtn.disabled = true;
        signBtn.textContent = '⏳ Gerando...';
        try {
          const result = await criarAssinaturaZapSign(d.tipo, dados);
          if (result.sign_url) {
            // Substitui a linha do botão pelo LINK CLICÁVEL grande (sem popup-blocker)
            wrap.innerHTML = '';
            wrap.style.cssText = 'display:flex;flex-direction:column;gap:6px;margin:6px 0;padding:10px;background:#0f1f17;border:1px solid #37d39b;border-radius:10px';
            const lbl = document.createElement('div');
            lbl.style.cssText = 'font-size:12px;color:#37d39b;font-weight:700';
            lbl.textContent = '✓ ' + d.label + ' — Pronto para assinar';
            wrap.appendChild(lbl);

            const link = document.createElement('a');
            link.href = result.sign_url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;background:linear-gradient(135deg,#37d39b,#2db588);border:none;border-radius:8px;color:#0a3d2c;font-size:14px;font-weight:700;text-decoration:none;cursor:pointer';
            link.innerHTML = '✍️ ASSINAR AGORA <span style="font-size:11px;opacity:.7">↗</span>';
            wrap.appendChild(link);

            const sub = document.createElement('div');
            sub.style.cssText = 'font-size:10px;color:#8a84a0;text-align:center;word-break:break-all';
            sub.innerHTML = '🔗 <a href="' + result.sign_url + '" target="_blank" rel="noopener" style="color:#9d6bff;text-decoration:underline">Copiar/abrir link</a> &nbsp;|&nbsp; ID: ' + (result.external_id || result.doc_id || '').slice(0, 16);
            wrap.appendChild(sub);
          } else {
            throw new Error('Sem sign_url na resposta');
          }
        } catch (e) {
          console.error('[zapsign]', e);
          signBtn.textContent = '⚠️ Erro';
          signBtn.style.background = '#ff5a6a';
          signBtn.title = e.message;
          setTimeout(() => { signBtn.disabled = false; signBtn.textContent = '✍️ Tentar novamente'; signBtn.style.background = ''; }, 3000);
        }
      });

      wrap.appendChild(previewBtn);
      wrap.appendChild(signBtn);
      panel.appendChild(wrap);
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
        window.clienteAtualWidget = dados; // usado por upload (nome da pasta)
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

    // CALENDARIO — picker visual de data/hora
    const calRe = /\[\[CALENDARIO(?::\s*(\{[\s\S]*?\}))?\s*\]\]/g;
    const calMatches = [...out.matchAll(calRe)];
    for (const m of calMatches) {
      let params = {};
      try { if (m[1]) params = JSON.parse(m[1]); } catch (_) {}
      out = out.replace(m[0], '');
      setTimeout(() => mostrarCalendarioPicker(params), 1500);
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
        notificarAgendamento(p, meetLink); // email pro Dr. Adolfo
        const conf = '\n\n✅ REUNIÃO AGENDADA\n📌 ' + (p.titulo || 'Reunião') + '\n📅 ' + when + '\n⏱ ' + (p.duracao || 45) + ' minutos\n🎥 ' + meetLink;
        out = out.replace(m[0], conf);
        setTimeout(() => painelCalendario(p, meetLink), 1500);
      } catch (e) {
        console.error('[cgw] AGENDAR parse error:', e);
      }
    }

    return out;
  }

  // ============= 📅 Botões de calendário (Google/Outlook/.ics) =============
  function gerarLinksCalendario(p, meetLink) {
    const start = new Date(p.data);
    const end = new Date(start.getTime() + (p.duracao || 45) * 60 * 1000);
    const fmt = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const titulo = p.titulo || 'Reunião — Cangussu Advocacia';
    const detalhes = 'Reunião virtual com Dr. Adolfo (OAB/SP 37.884).\n\nLink da sala: ' + meetLink + '\n\nEm caso de dúvida, responda este e-mail ou nos chame no WhatsApp.';
    const local = meetLink;

    // Google Calendar
    const gcal = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
      + '&text=' + encodeURIComponent(titulo)
      + '&dates=' + fmt(start) + '/' + fmt(end)
      + '&details=' + encodeURIComponent(detalhes)
      + '&location=' + encodeURIComponent(local)
      + (p.email ? '&add=' + encodeURIComponent(p.email) : '');

    // Outlook Live
    const outlook = 'https://outlook.live.com/calendar/0/deeplink/compose'
      + '?path=/calendar/action/compose&rru=addevent'
      + '&subject=' + encodeURIComponent(titulo)
      + '&startdt=' + start.toISOString()
      + '&enddt=' + end.toISOString()
      + '&body=' + encodeURIComponent(detalhes)
      + '&location=' + encodeURIComponent(local);

    // .ics file
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Cangussu Advocacia//Reuniao//PT',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:' + Date.now() + '@cangussuadvocacia.com',
      'DTSTAMP:' + fmt(new Date()),
      'DTSTART:' + fmt(start),
      'DTEND:' + fmt(end),
      'SUMMARY:' + titulo,
      'DESCRIPTION:' + detalhes.replace(/\n/g, '\\n'),
      'LOCATION:' + local,
      'URL:' + meetLink,
      p.email ? 'ATTENDEE;CN=' + (p.cliente || 'Cliente') + ';RSVP=TRUE:mailto:' + p.email : '',
      'ORGANIZER;CN=Dr. Adolfo:mailto:contato@cangussuadvocacia.com',
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT30M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Reunião em 30 minutos',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(Boolean).join('\r\n');
    const icsBlob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const icsUrl = URL.createObjectURL(icsBlob);

    return { gcal, outlook, icsUrl, meetLink };
  }

  // ============= 📅 CALENDÁRIO PICKER (cliente escolhe data/hora) =============
  // Feriados nacionais Brasil 2026 (em formato MM-DD)
  const FERIADOS_BR = [
    '01-01','02-16','02-17','02-18','04-03','04-21','05-01','06-04','09-07','10-12','11-02','11-15','12-25'
  ];
  function isFeriado(d) {
    const mmdd = String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    return FERIADOS_BR.includes(mmdd);
  }
  function isDiaUtil(d) {
    const dow = d.getDay();
    return dow !== 0 && dow !== 6 && !isFeriado(d);
  }
  function isDiaEmenda(d) {
    if (!isDiaUtil(d)) return false;
    const dow = d.getDay();
    // Segunda + feriado na terça → emenda
    if (dow === 1) {
      const ter = new Date(d); ter.setDate(d.getDate()+1);
      if (isFeriado(ter)) return true;
    }
    // Sexta + feriado na quinta → emenda
    if (dow === 5) {
      const qui = new Date(d); qui.setDate(d.getDate()-1);
      if (isFeriado(qui)) return true;
    }
    return false;
  }
  function proximosDiasDisponiveis(qtd) {
    const out = [];
    const d = new Date();
    d.setHours(0,0,0,0);
    let i = 1;
    while (out.length < qtd && i < 60) {
      const dia = new Date(d.getTime() + i*86400000);
      if (isDiaUtil(dia) && !isDiaEmenda(dia)) {
        out.push(dia);
      }
      i++;
    }
    return out;
  }
  // Slots de 30 minutos das 13:00 às 19:30 (último início 19:15 segundo o fluxo)
  const SLOTS = ['13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:15'];

  const DOW_LABELS = ['DOM','SEG','TER','QUA','QUI','SEX','SÁB'];
  const MONTH_LABELS = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

  function mostrarCalendarioPicker(params) {
    const dias = proximosDiasDisponiveis(10);
    const panel = document.createElement('div');
    panel.className = 'cgw-picker';

    let selectedDay = null;
    let selectedTime = null;

    panel.innerHTML = '<h5>📅 Escolha a data e hora da sua reunião</h5>'
      + '<div class="cgw-pkr-sub">Reuniões virtuais — segunda a sexta, das 13h às 19h15</div>'
      + '<div class="cgw-pkr-days" id="cgw-pkr-days"></div>'
      + '<div class="cgw-pkr-times" id="cgw-pkr-times" style="display:none"></div>'
      + '<button class="cgw-pkr-confirm" id="cgw-pkr-confirm" disabled>Selecione data e hora</button>';

    chat.appendChild(panel);
    chat.scrollTop = chat.scrollHeight;

    const daysEl = panel.querySelector('#cgw-pkr-days');
    const timesEl = panel.querySelector('#cgw-pkr-times');
    const confirmEl = panel.querySelector('#cgw-pkr-confirm');

    dias.forEach(d => {
      const btn = document.createElement('button');
      btn.className = 'cgw-pkr-day';
      btn.innerHTML = '<div class="dow">'+DOW_LABELS[d.getDay()]+'</div>'
        + '<div class="num">'+d.getDate()+'</div>'
        + '<div class="mon">'+MONTH_LABELS[d.getMonth()]+'</div>';
      btn.addEventListener('click', () => {
        daysEl.querySelectorAll('.cgw-pkr-day').forEach(x => x.classList.remove('selected'));
        btn.classList.add('selected');
        selectedDay = d;
        selectedTime = null;
        timesEl.style.display = 'grid';
        timesEl.innerHTML = '';
        SLOTS.forEach(t => {
          const tb = document.createElement('button');
          tb.className = 'cgw-pkr-time';
          tb.textContent = t;
          tb.addEventListener('click', () => {
            timesEl.querySelectorAll('.cgw-pkr-time').forEach(x => x.classList.remove('selected'));
            tb.classList.add('selected');
            selectedTime = t;
            confirmEl.disabled = false;
            confirmEl.textContent = '✓ Confirmar ' + d.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'}) + ' às ' + t;
          });
          timesEl.appendChild(tb);
        });
        chat.scrollTop = chat.scrollHeight;
      });
      daysEl.appendChild(btn);
    });

    confirmEl.addEventListener('click', async () => {
      if (!selectedDay || !selectedTime) return;
      confirmEl.disabled = true;
      const [hh, mm] = selectedTime.split(':');
      const dt = new Date(selectedDay);
      dt.setHours(parseInt(hh), parseInt(mm), 0, 0);
      const isoLocal = dt.getFullYear() + '-' + String(dt.getMonth()+1).padStart(2,'0') + '-' + String(dt.getDate()).padStart(2,'0')
        + 'T' + String(dt.getHours()).padStart(2,'0') + ':' + String(dt.getMinutes()).padStart(2,'0');

      const cliente = window.clienteAtualWidget || {};
      const nome = params.cliente || cliente.nome || '';
      const email = params.email || cliente.email || '';
      const whats = params.whats || cliente.telefone || '';

      // Bloqueia o picker
      panel.style.opacity = '.6';
      panel.style.pointerEvents = 'none';

      // Adiciona uma mensagem do cliente ao histórico para a IA continuar
      const msgUsuario = 'Confirmo o agendamento para ' + dt.toLocaleString('pt-BR',{dateStyle:'full',timeStyle:'short'}) + '.';
      addBubble(msgUsuario, 'user');
      history.push({ role: 'user', content: msgUsuario });

      // Cria reunião direto (não espera a IA gerar AGENDAR)
      const slug = (nome || 'cliente').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]/g,'-');
      const meetLink = 'https://meet.jit.si/CangussuAdvocacia-' + slug + '-' + Date.now();
      const reuniao = {
        titulo: params.titulo || ('Reunião virtual — ' + nome),
        cliente: nome,
        data: isoLocal,
        duracao: 45,
        modalidade: 'virtual',
        whats: whats,
        email: email
      };
      try { salvarReuniao(reuniao, meetLink); } catch (_) {}
      try { notificarAgendamento(reuniao, meetLink); } catch (_) {}

      // Mostra confirmação e botões de calendário
      const when = dt.toLocaleString('pt-BR',{dateStyle:'full',timeStyle:'short'});
      addBubble('✅ REUNIÃO AGENDADA\n📌 ' + reuniao.titulo + '\n📅 ' + when + '\n⏱ 45 minutos\n🎥 ' + meetLink, 'bot');
      setTimeout(() => painelCalendario(reuniao, meetLink), 800);

      // Manda a IA prosseguir (Fase 6 ou 7)
      sendBtn.disabled = true;
      await new Promise(r => setTimeout(r, 2000));
      const typing = addTyping();
      try {
        const aiRes = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: history.slice(-30),
            system: SYSTEM_PROMPT + '\n\n[CONTEXTO: Reunião já foi agendada para ' + when + '. Prossiga para a próxima fase do fluxo.]'
          })
        });
        const aiData = await aiRes.json();
        typing.remove();
        if (aiData.reply) {
          history.push({ role: 'assistant', content: aiData.reply });
          await addSplitBubbles(processMarkers(aiData.reply));
        }
      } catch (_) { typing.remove(); }
      sendBtn.disabled = false;
    });
  }

  // ============= 📧 NOTIFICAÇÃO POR EMAIL =============
  const NOTIFY_ENDPOINT = 'https://kxvtftxjwnosqvbqxudd.supabase.co/functions/v1/notify';
  async function notificarAgendamento(reuniao, meetLink) {
    try {
      await fetch(NOTIFY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'agendamento',
          titulo: reuniao.titulo,
          cliente: reuniao.cliente,
          data: reuniao.data,
          duracao: reuniao.duracao || 45,
          email_cliente: reuniao.email || '',
          whats_cliente: reuniao.whats || '',
          meet_link: meetLink
        })
      });
    } catch (e) { console.warn('[notify]', e); }
  }

  function painelCalendario(p, meetLink) {
    const links = gerarLinksCalendario(p, meetLink);
    const panel = document.createElement('div');
    panel.className = 'cgw-cal-buttons';
    panel.innerHTML = '<h5>📅 Adicione à sua agenda</h5>';

    const opcoes = [
      { url: links.gcal, label: '📅 Google Calendar', target: '_blank' },
      { url: links.outlook, label: '📅 Outlook', target: '_blank' },
      { url: meetLink, label: '🎥 Entrar na reunião agora', target: '_blank' }
    ];
    opcoes.forEach(o => {
      const a = document.createElement('a');
      a.href = o.url;
      a.target = o.target;
      a.rel = 'noopener';
      a.textContent = o.label;
      panel.appendChild(a);
    });
    // Download .ics
    const dl = document.createElement('a');
    dl.href = links.icsUrl;
    dl.download = 'reuniao-cangussu.ics';
    dl.textContent = '💾 Baixar lembrete (.ics — Apple Calendar/iCloud)';
    panel.appendChild(dl);

    chat.appendChild(panel);
    chat.scrollTop = chat.scrollHeight;
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

  // ============= Quebra em bolhas com timing 3s + 5s ============
  // Regra 2 do fluxo: aguardar 3s em silêncio + 5s "digitando" antes de cada bolha
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

    // Função reutilizável: 3s silêncio + 5s digitando
    async function delayBeforeMessage(){
      await new Promise(r => setTimeout(r, 3000)); // 3s silêncio
      const typing = addTyping();
      await new Promise(r => setTimeout(r, 5000)); // 5s digitando
      typing.remove();
    }

    if (parts.length <= 1) {
      addBubble(fullText, 'bot');
      return;
    }
    for (let i = 0; i < parts.length; i++) {
      if (i > 0) {
        await delayBeforeMessage();
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

    // Regra 2 do fluxo: 3s silêncio + 5s "digitando" antes da resposta
    await new Promise(r => setTimeout(r, 3000));
    const typing = addTyping();

    // Inicia chamada à IA em paralelo com o timer de "digitando"
    const aiPromise = callAI(msg);
    const minTypingTime = new Promise(r => setTimeout(r, 5000));
    const [reply] = await Promise.all([aiPromise, minTypingTime]);

    typing.remove();
    sendBtn.disabled = false;
    if (reply) {
      const processed = processMarkers(reply);
      history.push({ role: 'assistant', content: processed });
      if (history.length > 30) history.splice(0, history.length - 30);
      await addSplitBubbles(processed);
    }
    input.focus();
  }

  // Auto-seed: dispara FASE 1 ao abrir (3s silêncio + 5s digitando + Fase 1)
  async function seedV2() {
    if (seeded) return;
    seeded = true;
    sendBtn.disabled = true;

    await new Promise(r => setTimeout(r, 3000));
    const typing = addTyping();

    try {
      const aiPromise = fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'Olá' }], system: SYSTEM_PROMPT })
      }).then(r => r.json());
      const minTime = new Promise(r => setTimeout(r, 5000));
      const [data] = await Promise.all([aiPromise, minTime]);

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

  // ============= 📎 UPLOAD DE FOTOS/DOCUMENTOS =============
  attachBtn.addEventListener('click', () => fileInp.click());

  fileInp.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    fileInp.value = ''; // permite re-selecionar mesmo arquivo
    if (file.size > 10 * 1024 * 1024) {
      addBubble('⚠️ Arquivo muito grande (máx 10 MB).', 'bot');
      return;
    }
    await uploadArquivo(file);
  });

  async function uploadArquivo(file) {
    // Bolha "enviando..."
    const previewUrl = URL.createObjectURL(file);
    const wrap = document.createElement('div');
    wrap.className = 'cgw-img-bubble';
    if (file.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = previewUrl;
      wrap.appendChild(img);
    } else {
      wrap.textContent = '📄 ' + file.name;
      wrap.style.cssText += 'padding:12px;color:#ece8f5;font-size:12px';
    }
    chat.appendChild(wrap);
    chat.scrollTop = chat.scrollHeight;

    const status = document.createElement('div');
    status.className = 'cgw-bubble-msg bot typing';
    status.textContent = '⏳ Enviando arquivo...';
    chat.appendChild(status);

    try {
      // Upload pro Supabase Storage
      const ext = file.name.split('.').pop().toLowerCase();
      const safeName = (file.name || 'arquivo').replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 60);
      const cliente = (window.clienteAtualWidget?.nome || 'anonimo').toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
      const path = cliente + '/' + Date.now() + '-' + safeName;

      const upRes = await fetch(
        SB_URL + '/storage/v1/object/documentos-clientes/' + path,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + SB_ANON,
            'apikey': SB_ANON,
            'Content-Type': file.type || 'application/octet-stream',
            'x-upsert': 'true'
          },
          body: file
        }
      );

      if (!upRes.ok) {
        const txt = await upRes.text();
        throw new Error(txt || 'falha no upload');
      }

      const publicUrl = SB_URL + '/storage/v1/object/public/documentos-clientes/' + path;
      status.textContent = '✓ Arquivo enviado';
      setTimeout(() => status.remove(), 2500);

      // Salva referência no Supabase (tabela documentos)
      try {
        await fetch(SB_URL + '/rest/v1/documentos', {
          method: 'POST',
          headers: {
            'apikey': SB_ANON, 'Authorization': 'Bearer ' + SB_ANON,
            'Content-Type': 'application/json', 'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            tipo: 'enviado_cliente',
            nome_arquivo: file.name,
            url: publicUrl,
            status: 'recebido',
            observacoes: 'Enviado pelo cliente via chat'
          })
        });
      } catch (_) {}

      // Avisa a IA que o cliente enviou um arquivo
      const fileMsg = '[Cliente enviou arquivo: ' + file.name + ' — ' + publicUrl + ']';
      history.push({ role: 'user', content: fileMsg });
      // Solicita resposta da IA
      sendBtn.disabled = true;
      await new Promise(r => setTimeout(r, 1500));
      const typing = addTyping();
      try {
        const aiRes = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history.slice(-30), system: SYSTEM_PROMPT })
        });
        const aiData = await aiRes.json();
        typing.remove();
        if (aiData.reply) {
          history.push({ role: 'assistant', content: aiData.reply });
          await addSplitBubbles(processMarkers(aiData.reply));
        }
      } catch (e) {
        typing.remove();
      }
      sendBtn.disabled = false;
    } catch (e) {
      console.error('[upload]', e);
      status.textContent = '⚠️ Erro ao enviar: ' + e.message;
    }
  }

  // ============= 🎤 CAPTURA DE VOZ (Web Speech API) =============
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let isRecording = false;

  function setupRecognition() {
    if (!SR) return null;
    const r = new SR();
    r.lang = 'pt-BR';
    r.continuous = false;
    r.interimResults = true;
    r.maxAlternatives = 1;
    return r;
  }

  if (!SR) {
    micBtn.title = 'Seu navegador não suporta reconhecimento de voz. Use Chrome ou Edge.';
    micBtn.style.opacity = '0.5';
  }

  micBtn.addEventListener('click', () => {
    if (!SR) {
      addBubble('⚠️ Seu navegador não suporta reconhecimento de voz. Use Chrome, Edge ou Safari.', 'bot');
      return;
    }
    if (isRecording) {
      try { recognition?.stop(); } catch (_) {}
      return;
    }
    recognition = setupRecognition();
    if (!recognition) return;

    let finalText = '';
    recognition.onstart = () => {
      isRecording = true;
      micBtn.classList.add('recording');
      micBtn.textContent = '⏹';
      input.placeholder = '🎤 Falando... clique para parar';
    };
    recognition.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const txt = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += txt;
        else interim += txt;
      }
      input.value = (finalText + interim).trim();
    };
    recognition.onerror = (e) => {
      console.error('[voice]', e.error);
      if (e.error === 'not-allowed') {
        addBubble('⚠️ Permissão de microfone negada. Permita o uso do microfone nas configurações do site.', 'bot');
      } else if (e.error === 'no-speech') {
        addBubble('🤫 Não detectei sua voz. Tenta de novo!', 'bot');
      }
    };
    recognition.onend = () => {
      isRecording = false;
      micBtn.classList.remove('recording');
      micBtn.textContent = '🎤';
      input.placeholder = 'Digite ou fale...';
      input.focus();
    };
    try { recognition.start(); }
    catch (e) { console.error('[voice start]', e); }
  });

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
