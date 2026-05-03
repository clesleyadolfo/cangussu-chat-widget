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
    '2. Aplique TODAS as regras de DISPONIBILIDADE abaixo',
    '3. Apresente 2-3 OPÇÕES CONCRETAS (NÃO pergunte aberto). Ex: "Tenho estas opções: quarta 30/04 às 15h, sexta 02/05 às 14h, ou segunda 05/05 às 18h. Qual funciona melhor?"',
    '4. Aguarde escolha. Se pedir fora das regras, recuse com gentileza.',
    '5. Emita [[AGENDAR:...]]',
    '6. Vá direto para FASE 7 (não execute Fase 6)',
    '',
    '## DISPONIBILIDADE PARA REUNIÕES VIRTUAIS',
    '- Janela: seg-sex 13h00-20h00 (último início 19h15 para caber 45min)',
    '- NÃO oferecer: sábados, domingos, feriados nacionais/estaduais/municipais, recessos forenses, dias de emenda (ponte entre feriado e fim de semana)',
    '- Sempre apresente 2-3 opções específicas, nunca pergunte aberto',
    '- Se cliente pedir fora das regras: recuse com gentileza, explique janela e ofereça novas opções',
    '',
    '## MARCADOR DE AGENDAMENTO',
    'Quando cliente confirmar data+horário, emita NA MESMA resposta:',
    '[[AGENDAR:{"titulo":"Reunião virtual — [nome]","cliente":"[nome]","data":"YYYY-MM-DDTHH:MM","duracao":45,"modalidade":"virtual","whats":"55DDDnumero","email":"[email]"}]]',
    'Formato: ISO sem timezone. WhatsApp com 55 na frente. NUNCA mencione o marcador ao cliente.',
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
