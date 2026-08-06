  (function(){
    if(window.__EXPANDED_SUITE_V2026__) return;
    window.__EXPANDED_SUITE_V2026__ = true;

    const MODULE_GROUPS = [
      {
        key: 'engenharia',
        title: 'Engenharia',
        items: [
          { id: 'concretagem', icon: '🧱', label: 'Concretagem' },
          { id: 'inteligencia', icon: '🧠', label: 'Inteligência Executiva' }
        ]
      },
      {
        key: 'suprimentos',
        title: 'Gestão de Suprimentos',
        items: [
          { id: 'suprimentos_kanban', icon: '🧾', label: 'Painel Kanban' },
          { id: 'suprimentos_ia', icon: '🎙️', label: 'Nova Solicitação IA' },
          { id: 'relatorios_compras', icon: '📊', label: 'Relatórios de Compras' },
          { id: 'gestao_locacoes', icon: '🛠️', label: 'Gestão de Locações' },
          { id: 'inventario', icon: '📦', label: 'Inventário' }
        ]
      },
      {
        key: 'medicoes',
        title: 'Contratos e Medições',
        items: [
          { id: 'medicao_contratos', icon: '📄', label: 'Medição de Contratos' },
          { id: 'medicao_servicos', icon: '🧮', label: 'Medição de Serviços' },
          { id: 'prestadores_servico', icon: '👷', label: 'Prestadores de Serviço' },
          { id: 'relatorios_medicoes', icon: '📑', label: 'Relatórios de Medições' }
        ]
      },
      {
        key: 'projetos',
        title: 'Projetos e Doc.',
        items: [
          { id: 'projetos_docs', icon: '📁', label: 'Projetos' },
          { id: 'documentos', icon: '🗂️', label: 'Documentos' }
        ]
      },
      {
        key: 'rh',
        title: 'DP & RH',
        items: [
          { id: 'painel_funcionarios', icon: '👤', label: 'Painel de Funcionários' },
          { id: 'kanban_admissao', icon: '🧩', label: 'Kanban de Admissão' },
          { id: 'kanban_desligamento', icon: '🧾', label: 'Kanban de Desligamento' }
        ]
      },
      {
        key: 'posobra',
        title: 'Pós-Obra',
        items: [
          { id: 'assistencia_tecnica', icon: '🛎️', label: 'Assistência Técnica' },
          { id: 'checklist_repasse', icon: '☑️', label: 'Checklist de Repasse' }
        ]
      },
      {
        key: 'sst',
        title: 'SS&T',
        items: [
          { id: 'sst_dashboard', icon: '🛡️', label: 'Dashboard SST' },
          { id: 'sst_checklists', icon: '📝', label: 'Checklists NR' },
          { id: 'sst_nc', icon: '⚠️', label: 'Não Conformidades' },
          { id: 'sst_dds', icon: '👥', label: 'DDS' },
          { id: 'sst_epis', icon: '⛑️', label: 'Controle de EPIs' },
          { id: 'sst_treinamentos', icon: '🎓', label: 'Treinamentos NR' },
          { id: 'sst_pt', icon: '📋', label: 'Permissão de Trabalho' },
          { id: 'sst_incidentes', icon: '🚨', label: 'Incidentes' },
          { id: 'sst_documentos', icon: '🗄️', label: 'Documentos SST' }
        ]
      }
    ];

    function esc(v){
      return String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function money(value){
      const n = Number(value || 0);
      return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function getObrasSafe(){
      try{
        if(typeof state !== 'undefined' && Array.isArray(state.obras) && state.obras.length){
          return state.obras;
        }
      }catch(_){}
      return [
        { id: 'obra_demo_1', nome: 'EASY RESIDENCE', codigo: '001' },
        { id: 'obra_demo_2', nome: 'BRISA RESIDENCIAL', codigo: '002' },
        { id: 'obra_demo_3', nome: 'VALENET ITABIRA', codigo: '116' },
        { id: 'obra_demo_4', nome: '26° BATALHÃO PMMG', codigo: '204' }
      ];
    }

    function obraOptions(includeTodas){
      const obras = getObrasSafe();
      const first = includeTodas ? '<option value="">Todas as obras</option>' : '<option value="">Selecione...</option>';
      return first + obras.map(o => `<option value="${esc(o.id)}">${esc(o.nome)}</option>`).join('');
    }

    function obraRowsExecutivo(){
      return getObrasSafe().slice(0, 8).map((obra, idx) => `
        <tr>
          <td><input type="checkbox"></td>
          <td><strong>${esc(obra.nome)}</strong><div class="adv-muted">Cód: ${esc(obra.codigo || ('0' + (idx + 1)))}</div></td>
          <td><span class="adv-badge adv-ok">2026-W${String((idx % 5) + 18)}</span></td>
          <td><button class="btn-secondary" data-adv-msg="Relatório da obra aberto.">Abrir Relatório</button></td>
        </tr>
      `).join('');
    }

    function readRdoImages(){
      try{
        const raw = localStorage.getItem('obraNovaRdoV1');
        const parsed = JSON.parse(raw || '[]');
        const images = [];
        parsed.forEach(item => {
          (item?.imagens || []).forEach(img => {
            if(img?.dataUrl) images.push(img.dataUrl);
          });
        });
        return images.slice(0, 6);
      }catch(_){
        return [];
      }
    }

    function fotosGridHtml(){
      const images = readRdoImages();
      if(!images.length){
        return `
          <div class="adv-empty-box">
            Nenhuma foto em RDO ainda. As imagens anexadas no RDO aparecerão aqui.
          </div>
        `;
      }
      return `
        <div class="adv-gallery">
          ${images.map(src => `<img src="${src}" alt="registro">`).join('')}
        </div>
      `;
    }

    function sectionShell(title, subtitle, actions, content){
      return `
        <div class="adv-shell">
          <div class="adv-head">
            <div>
              <h2>${title}</h2>
              <p>${subtitle}</p>
            </div>
            <div class="adv-actions-head">${actions || ''}</div>
          </div>
          ${content}
        </div>
      `;
    }

    function buildSectionHtml(id){
      const obraSelect = obraOptions(true);
      const obraPick = obraOptions(false);
      const commonFilters = `
        <div class="adv-box">
          <div class="adv-grid adv-grid-3">
            <div><label>Obra</label><select>${obraSelect}</select></div>
            <div><label>Status</label><select><option>Todos os status</option><option>Ativo</option><option>Pendente</option><option>Concluído</option></select></div>
            <div><label>Buscar</label><input placeholder="Buscar por nome ou código"></div>
          </div>
        </div>
      `;

      const defaults = {
        concretagem: sectionShell(
          'Concretagem',
          'Rastreabilidade dos caminhões e anexos da usina.',
          `<button class="btn-secondary" data-adv-msg="Fluxo de rastreabilidade continuado.">Continuar Rastreabilidade</button>`,
          `
            <div class="adv-box">
              <h3>Caminhões / Betoneiras</h3>
              <div class="adv-row">
                <span class="adv-dot"></span><strong>Caminhão 1 - HGL-8684 - 7 m³</strong>
              </div>
              <div class="adv-row">
                <span class="adv-dot adv-dot-green"></span><strong>Caminhão 2 - OQL-9C74 - 6,5 m³</strong>
              </div>
            </div>
            <div class="adv-box">
              <h3>Identificação desta concretagem</h3>
              <div class="adv-grid adv-grid-3">
                <div><label>Elemento / Peça concretada</label><input value="Pilares Térreo"></div>
                <div><label>Área / Pavimento</label><input value="Térreo"></div>
                <div><label>FCK de projeto (MPA)</label><input value="25"></div>
                <div><label>Placa</label><input value="OQL - 9C74"></div>
                <div><label>NF / Conhecimento</label><input value="113123"></div>
                <div><label>Volume (m³)</label><input value="6,5"></div>
              </div>
              <div class="adv-grid adv-grid-4" style="margin-top:10px;">
                <div><label>Chegada</label><input value="12:01"></div>
                <div><label>Início</label><input value="12:19"></div>
                <div><label>Final</label><input value="13:37"></div>
                <div><label>Moldagem CP</label><input value="12:15"></div>
              </div>
              <div class="adv-grid adv-grid-2" style="margin-top:10px;">
                <div><label>Slump (cm)</label><input value="13"></div>
                <div><label>Responsável</label><input value="Gabriel Filipe Tiago"></div>
              </div>
              <div style="margin-top:10px;"><label>Observações</label><textarea placeholder="Observações deste caminhão..."></textarea></div>
            </div>
            <div class="adv-grid adv-grid-2">
              <div class="adv-box">
                <h3>Relatório da usina</h3>
                <div class="adv-drop">Clique para anexar relatório da usina<br><small>PDF, imagem ou qualquer arquivo</small></div>
              </div>
              <div class="adv-box">
                <h3>Foto do mapa de rastreabilidade</h3>
                <div class="adv-drop">Clique para anexar foto do mapa<br><small>Será incluída no relatório PDF</small></div>
              </div>
            </div>
            <div class="actions">
              <button class="btn-secondary" data-adv-msg="Rascunho salvo.">← Salvar parcial e voltar</button>
              <button class="btn-primary" data-adv-msg="Rastreabilidade fechada.">🔒 Fechar Rastreabilidade</button>
            </div>
          `
        ),
        inteligencia: sectionShell(
          'Inteligência Executiva',
          'Central de emissão de relatórios executivos com consolidação automática.',
          `
            <button class="btn-secondary" data-adv-msg="Resumo mensal gerado.">Resumo Mensal (Empresa)</button>
            <button class="btn-secondary" data-adv-msg="Fluxo de e-mail acionado.">Enviar E-mail</button>
          `,
          `
            <div class="adv-grid adv-grid-2">
              <div class="adv-box">
                <h3>Obras Ativas</h3>
                <div class="table-wrap">
                  <table>
                    <thead><tr><th></th><th>Obra</th><th>Último relatório</th><th>Ação</th></tr></thead>
                    <tbody>${obraRowsExecutivo()}</tbody>
                  </table>
                </div>
              </div>
              <div class="adv-box">
                <h3>Como funciona?</h3>
                <ul class="adv-list">
                  <li>IA Avançada: resumo com base nos RDOs.</li>
                  <li>Financeiro: consolidação de medições e suprimentos.</li>
                  <li>Produção Física: resumo de concretagens e terraplanagem.</li>
                  <li>Visualização externa pronta para diretoria.</li>
                </ul>
              </div>
            </div>
            <div class="adv-box adv-night">
              <h3>Parecer da Inteligência Artificial</h3>
              <p>"Nesta semana, a obra enfrentou desafios operacionais. O sistema consolida RDO, medições e suprimentos para apoiar decisões executivas com foco em produtividade."</p>
            </div>
            <div class="adv-grid adv-grid-3">
              <div class="adv-stat adv-stat-green"><span>Medições Realizadas</span><strong>${money(0)}</strong></div>
              <div class="adv-stat adv-stat-gold"><span>Locações Ativas</span><strong>${money(790)}</strong></div>
              <div class="adv-stat adv-stat-yellow"><span>Materiais Entregues</span><strong>${money(0)}</strong></div>
              <div class="adv-stat adv-stat-blue"><span>Concreto Realizado</span><strong>0 m³</strong></div>
              <div class="adv-stat adv-stat-purple"><span>Efetivo (Próprio)</span><strong>3 pessoas</strong></div>
              <div class="adv-stat adv-stat-pink"><span>Efetivo (Empreiteiros)</span><strong>0 pessoas</strong></div>
            </div>
            <div class="adv-grid adv-grid-3">
              <div class="adv-box">
                <h3>Progresso Financeiro</h3>
                <div class="adv-money-row"><span>Medido</span><strong>${money(48510.76)}</strong></div>
                <div class="adv-money-row"><span>Contratado</span><strong>${money(55000)}</strong></div>
                <div class="adv-progress"><span style="width:88.2%"></span></div>
                <small>88.2% executado</small>
              </div>
              <div class="adv-box">
                <h3>Cronograma</h3>
                <div class="adv-donut">72%</div>
                <div class="adv-row-between"><span>131 d decorridos</span><span>50 d a decorrer</span></div>
              </div>
              <div class="adv-box">
                <h3>Intercorrências</h3>
                <ul class="adv-list"><li>Dia 2026-05-08: não foi possível fazer registro fotográfico.</li></ul>
              </div>
            </div>
            <div class="adv-box">
              <h3>Registros da Semana</h3>
              ${fotosGridHtml()}
            </div>
          `
        ),
        suprimentos_kanban: sectionShell(
          'Kanban de Pedidos Mestre',
          'Arraste ou clique para mover os pedidos inteiros.',
          `
            <button class="btn-secondary" data-adv-msg="Filtro de visão aplicado.">Filtrar</button>
          `,
          `
            <div class="adv-box">
              <div class="adv-grid adv-grid-3">
                <div><label>Obra</label><select>${obraSelect}</select></div>
                <div><label>Status</label><select><option>Todos os status</option><option>Solicitado</option><option>Comprando</option><option>Comprado</option></select></div>
                <div><label>Buscar pedido ou item</label><input placeholder="Buscar por código (BR-001) ou item"></div>
              </div>
            </div>
            <div class="adv-kanban">
              <div class="adv-col"><h4>Solicitado <span>0</span></h4><div class="adv-empty-box">Nenhum pedido aqui.</div></div>
              <div class="adv-col"><h4>Comprando <span>1</span></h4><div class="adv-ticket">EA-014<br><small>EASY RESIDENCE • Gabriel • R$ 5.215,00</small></div></div>
              <div class="adv-col"><h4>Comprado <span>15</span></h4><div class="adv-ticket">VA-009<br><small>VALENET ITABIRA • Pedido em 19/05</small></div></div>
              <div class="adv-col"><h4>Entregue Obra <span>24</span></h4><div class="adv-ticket">EA-014<br><small>Entrega prevista 20/05/2026</small></div></div>
            </div>
          `
        ),
        suprimentos_ia: sectionShell(
          'Nova Solicitação IA',
          'Solicite materiais por texto ou voz.',
          `<button class="btn-secondary" data-adv-msg="Mudança de obra disponível.">Trocar obra</button>`,
          `
            <div class="adv-box adv-center">
              <div class="adv-mic">🎙️</div>
              <h3>Toque e fale o pedido de materiais</h3>
              <div class="adv-help">
                Fale itens e quantidades, depois informe a data da necessidade.<br>
                Ex.: "20 sacos de cimento e 5 barras de ferro 10mm para o dia 20/05".
              </div>
            </div>
            <div class="adv-box">
              <label>Passo 1: digite ou grave seu pedido</label>
              <textarea placeholder="Descreva os materiais necessários..."></textarea>
            </div>
            <div class="adv-box">
              <div class="adv-row-between">
                <h3>Anexos da solicitação</h3>
                <button class="btn-secondary" data-adv-msg="Upload de anexo aberto.">Adicionar arquivo</button>
              </div>
              <div class="adv-empty-box">Nenhum arquivo anexado.</div>
            </div>
          `
        ),
        relatorios_compras: sectionShell(
          'Relatórios de Compras',
          'Consolidação de compras por obra, período e fornecedor.',
          `<button class="btn-primary" data-adv-msg="Relatório gerado em PDF.">Gerar relatório</button>`,
          `${commonFilters}<div class="adv-box"><div class="adv-empty-box">Nenhum relatório gerado no período.</div></div>`
        ),
        gestao_locacoes: sectionShell(
          'Gestão de Locações',
          'Simulação de custos, monitoramento de prazos e fluxo de devolução.',
          `<button class="btn-secondary" data-adv-msg="Aba Em Obra aberta.">Em Obra (24)</button>`,
          `
            <div class="adv-box">
              <h3>Simular Nova Locação</h3>
              <div class="adv-grid adv-grid-2">
                <div><label>Obra destino</label><select>${obraPick}</select></div>
                <div><label>Fornecedor</label><input value="Construloc"></div>
                <div><label>Equipamento a ser locado</label><input placeholder="Selecione o equipamento..."></div>
                <div><label>Tipo de período</label><select><option>Mensal (30 dias)</option><option>Semanal</option><option>Diário</option></select></div>
                <div><label>Quantidade (mensais)</label><input placeholder="Ex: 1"></div>
                <div><label>Nº patrimônio / ID</label><input placeholder="Ex: PAT-0042"></div>
                <div><label>Data de necessidade</label><input type="date"></div>
                <div><label>Observações</label><input placeholder="Ex: Serra com disco diamantado"></div>
              </div>
              <div class="actions"><button class="btn-primary" data-adv-msg="Solicitação de locação enviada.">Solicitar Locação</button></div>
            </div>
          `
        ),
        inventario: sectionShell(
          'Inventário',
          'Conciliação entre estoque físico e estoque lançado.',
          `<button class="btn-primary" data-adv-msg="Nova contagem iniciada.">+ Nova contagem</button>`,
          `${commonFilters}<div class="adv-box"><div class="adv-empty-box">Sem divergências no inventário atual.</div></div>`
        ),
        medicao_contratos: sectionShell(
          'Contratos e Medições',
          'Todos os contratos da construtora.',
          `
            <button class="btn-secondary" data-adv-msg="Relatório gráfico aberto.">Relatório Gráfico</button>
            <button class="btn-primary" data-adv-msg="Fluxo de novo contrato aberto.">+ Novo Contrato</button>
          `,
          `
            <div class="adv-grid adv-grid-3">
              <div class="adv-stat"><span>Total contratado</span><strong>${money(2647690)}</strong></div>
              <div class="adv-stat"><span>Total medido</span><strong>${money(642337.78)}</strong></div>
              <div class="adv-stat"><span>Saldo financeiro</span><strong>${money(2005352.22)}</strong></div>
            </div>
            <div class="adv-box">
              <h3>Todos os Contratos (14)</h3>
              <div class="mini-list">
                <div class="mini-item"><div><strong>Execução de Serviços Diversos</strong><div class="muted-sm">Prestador: JOTACON CONSTRUCOES LTDA • 7 boletins</div></div><strong>${money(1050000)}</strong></div>
                <div class="mini-item"><div><strong>Consultoria Geotécnica</strong><div class="muted-sm">Prestador: SERGIO VELLOSO PROJETOS LTDA • 2 boletins</div></div><strong>${money(67010)}</strong></div>
                <div class="mini-item"><div><strong>Elaboração de Projetos de Proteção Coletiva</strong><div class="muted-sm">Prestador: ISAAC PROJETOS • Em andamento</div></div><strong>${money(3500)}</strong></div>
              </div>
            </div>
          `
        ),
        medicao_servicos: sectionShell(
          'Medição de Serviços',
          'Medições avulsas e pontuais sem contrato recorrente.',
          `<button class="btn-primary" data-adv-msg="Modal de nova medição aberto.">+ Nova Medição de Serviço</button>`,
          `
            ${commonFilters}
            <div class="adv-box">
              <div class="mini-list">
                <div class="mini-item"><div><strong>HERICK AUGUSTO DE BRITO DA SILVA</strong><div class="muted-sm">26/05/2026 • BRISA RESIDENCIAL</div></div><strong>${money(200)}</strong></div>
                <div class="mini-item"><div><strong>MARCELO SANTOS DE SÁ</strong><div class="muted-sm">25/05/2026 • BRISA RESIDENCIAL</div></div><strong>${money(6)}</strong></div>
                <div class="mini-item"><div><strong>PEDRO HENRIQUE SANTOS INOCENTES</strong><div class="muted-sm">21/05/2026 • BRISA RESIDENCIAL</div></div><strong>${money(100)}</strong></div>
              </div>
            </div>
          `
        ),
        prestadores_servico: sectionShell(
          'Prestadores',
          'Cadastro geral de prestadores e dados de pagamento.',
          `<button class="btn-primary" data-adv-msg="Formulário de novo prestador aberto.">+ Novo Prestador</button>`,
          `
            <div class="adv-grid adv-grid-3">
              <div class="adv-box adv-card-item"><h3>GEOVANNA SOARES BOTELHO</h3><p>Estágio de Engenharia Civil</p><p>CPF/CNPJ: 154.490.946-20</p><div class="actions"><button class="btn-secondary">Editar</button><button class="btn-secondary">Ver Dados de Pagamento</button></div></div>
              <div class="adv-box adv-card-item"><h3>JMFORMAS LTDA</h3><p>Carpintaria</p><p>CPF/CNPJ: 36.146.154/0001-33</p><div class="actions"><button class="btn-secondary">Editar</button><button class="btn-secondary">+ Dados de Pagamento</button></div></div>
              <div class="adv-box adv-card-item"><h3>AFONSO BOMBEIRO</h3><p>Hidráulica</p><p>CPF/CNPJ: 110.477.136-59</p><div class="actions"><button class="btn-secondary">Editar</button><button class="btn-secondary">Ver Dados de Pagamento</button></div></div>
            </div>
          `
        ),
        relatorios_medicoes: sectionShell(
          'Relatórios de Medições',
          'Visualização da medição aprovada com exportação e anexos.',
          `
            <button class="btn-secondary">✅ Aprovado</button>
            <button class="btn-secondary" data-adv-msg="Fluxo de e-mail iniciado.">Enviar E-mail</button>
            <button class="btn-primary" data-adv-msg="Download de PDF iniciado.">Baixar PDF</button>
          `,
          `
            <div class="adv-box">
              <h3>MEDIÇÃO DE SERVIÇO</h3>
              <div class="adv-grid adv-grid-4">
                <div><label>Valor bruto</label><strong>${money(200)}</strong></div>
                <div><label>Total a pagar</label><strong>${money(200)}</strong></div>
                <div><label>Data da medição</label><strong>22/05/2026</strong></div>
                <div><label>Vencimento</label><strong>26/05/2026</strong></div>
              </div>
              <div class="table-wrap" style="margin-top:10px;">
                <table>
                  <thead><tr><th>Descrição</th><th>Unid.</th><th>Qtd</th><th>V. Unit.</th><th>Subtotal</th></tr></thead>
                  <tbody><tr><td>Prestação de serviços de ajudante de pedreiro</td><td>un</td><td>2</td><td>${money(100)}</td><td>${money(200)}</td></tr></tbody>
                </table>
              </div>
            </div>
            <div class="adv-grid adv-grid-2">
              <div class="adv-box"><div class="adv-row-between"><h3>Fotos do Serviço</h3><button class="btn-secondary">Adicionar fotos</button></div>${fotosGridHtml()}</div>
              <div class="adv-box"><div class="adv-row-between"><h3>Arquivos</h3><button class="btn-secondary">Anexar arquivo</button></div><div class="adv-empty-box">Nenhum arquivo ainda.</div></div>
            </div>
          `
        ),
        projetos_docs: sectionShell(
          'Projetos',
          'Diretórios técnicos por disciplina.',
          '',
          `
            <div class="adv-grid adv-grid-2">
              <div class="adv-box">
                <h3>Diretórios</h3>
                <div class="mini-list">
                  ${getObrasSafe().map(o => `<div class="mini-item"><strong>${esc(o.nome)}</strong><span class="muted-sm">0 arqs</span></div>`).join('')}
                </div>
              </div>
              <div class="adv-box">
                <h3>Disciplinas</h3>
                <div class="mini-list">
                  <div class="mini-item"><strong>01 Arquitetura</strong><span class="muted-sm">0 arqs</span></div>
                  <div class="mini-item"><strong>02 Contenção</strong><span class="muted-sm">0 arqs</span></div>
                  <div class="mini-item"><strong>03 Fundação</strong><span class="muted-sm">0 arqs</span></div>
                  <div class="mini-item"><strong>04 Estrutura</strong><span class="muted-sm">0 arqs</span></div>
                  <div class="mini-item"><strong>05 Hidráulica</strong><span class="muted-sm">0 arqs</span></div>
                  <div class="mini-item"><strong>06 Elétrica</strong><span class="muted-sm">0 arqs</span></div>
                </div>
              </div>
            </div>
          `
        ),
        documentos: sectionShell(
          'Documentos',
          'Sistema de arquivos e categorias por obra.',
          '',
          `
            <div class="adv-grid adv-grid-2">
              <div class="adv-box">
                <h3>Sistema de Arquivos</h3>
                <div class="mini-list">
                  ${getObrasSafe().map(o => `<div class="mini-item"><strong>${esc(o.nome)}</strong><span class="muted-sm">Pasta</span></div>`).join('')}
                </div>
              </div>
              <div class="adv-box">
                <h3>Categorias</h3>
                <div class="mini-list">
                  <div class="mini-item"><strong>Contabilidade</strong><span class="muted-sm">0 itens</span></div>
                  <div class="mini-item"><strong>Contratos</strong><span class="muted-sm">0 itens</span></div>
                  <div class="mini-item"><strong>Dia a Dia</strong><span class="muted-sm">1 item</span></div>
                  <div class="mini-item"><strong>Orçamentos</strong><span class="muted-sm">0 itens</span></div>
                  <div class="mini-item"><strong>Pré - As Built</strong><span class="muted-sm">0 itens</span></div>
                </div>
              </div>
            </div>
          `
        ),
        painel_funcionarios: sectionShell(
          'Painel de Funcionários',
          'Gestão de funcionários ativos vinculados às obras.',
          '',
          `
            <div class="adv-box"><input placeholder="Buscar por nome ou CPF..."></div>
            <div class="adv-grid adv-grid-3">
              <div class="adv-box adv-card-item"><h3>João da Silva</h3><p>Ajudante</p><p>Obra Desconhecida • Regime CLT</p><span class="adv-badge adv-ok">Ativo</span></div>
              <div class="adv-box adv-card-item"><h3>Julio Cesar</h3><p>Ajudante</p><p>BRISA RESIDENCIAL • Regime CLT</p><span class="adv-badge adv-ok">Ativo</span></div>
              <div class="adv-box adv-card-item"><h3>Maurício</h3><p>Ajudante</p><p>BRISA RESIDENCIAL • Regime CLT</p><span class="adv-badge adv-ok">Ativo</span></div>
            </div>
          `
        ),
        kanban_admissao: sectionShell(
          'Kanban de Admissão',
          'Acompanhamento do fluxo de contratação e fichamento.',
          `<button class="btn-primary" data-adv-msg="Nova solicitação de admissão criada.">👥 Nova Solicitação</button>`,
          `
            <div class="adv-kanban">
              <div class="adv-col"><h4>Solicitada <span>0</span></h4><div class="adv-empty-box">Nenhum card</div></div>
              <div class="adv-col"><h4>Em análise RH <span>0</span></h4><div class="adv-empty-box">Nenhum card</div></div>
              <div class="adv-col"><h4>Aguardando exame <span>0</span></h4><div class="adv-empty-box">Nenhum card</div></div>
              <div class="adv-col"><h4>Exame <span>0</span></h4><div class="adv-empty-box">Nenhum card</div></div>
            </div>
          `
        ),
        kanban_desligamento: sectionShell(
          'Kanban de Desligamento',
          'Acompanhamento do fluxo de rescisão e arquivamento.',
          `<button class="btn-danger" data-adv-msg="Solicitação de desligamento criada.">👥 Solicitar Desligamento</button>`,
          `
            <div class="adv-kanban">
              <div class="adv-col"><h4>Solicitado <span>0</span></h4><div class="adv-empty-box">Nenhum card</div></div>
              <div class="adv-col"><h4>Em análise RH <span>0</span></h4><div class="adv-empty-box">Nenhum card</div></div>
              <div class="adv-col"><h4>Aviso prévio <span>0</span></h4><div class="adv-empty-box">Nenhum card</div></div>
              <div class="adv-col"><h4>Acerto <span>0</span></h4><div class="adv-empty-box">Nenhum card</div></div>
            </div>
          `
        ),
        assistencia_tecnica: sectionShell(
          'Pós-Obra / Assistência Técnica',
          'Kanban de chamados com status e prioridade.',
          `<button class="btn-primary" data-adv-msg="Novo chamado aberto.">+ Novo Chamado</button>`,
          `
            <div class="adv-kanban">
              <div class="adv-col"><h4>Caixa de Entrada <span>2</span></h4><div class="adv-ticket">Entrada de água pela base da parede de drywall...</div></div>
              <div class="adv-col"><h4>Análise Técnica <span>1</span></h4><div class="adv-ticket">Infiltração na parede e manchando a área externa</div></div>
              <div class="adv-col"><h4>Visita Agendada <span>3</span></h4><div class="adv-ticket">Retorno de água e possível entupimento</div></div>
              <div class="adv-col"><h4>Visita Realizada <span>11</span></h4><div class="adv-ticket">Reinstalação e reparos na bancada</div></div>
            </div>
          `
        ),
        checklist_repasse: sectionShell(
          'Checklist de Repasse',
          'Gerencie as vistorias de entrega de chaves.',
          `<button class="btn-primary" data-adv-msg="Novo checklist iniciado.">+ Novo Checklist</button>`,
          `
            <div class="adv-box"><label>Filtrar por obra</label><select>${obraSelect}</select></div>
            <div class="adv-box"><div class="adv-empty-box">Nenhum checklist criado.</div></div>
          `
        ),
        sst_dashboard: sectionShell(
          'SS&T — Saúde e Segurança do Trabalho',
          'Status do canteiro em tempo real.',
          '',
          `
            <div class="adv-box"><select>${obraSelect}</select></div>
            <div class="adv-grid adv-grid-3">
              <div class="adv-stat"><span>Checklists hoje</span><strong>—</strong></div>
              <div class="adv-stat"><span>NCs abertas</span><strong>—</strong></div>
              <div class="adv-stat"><span>DSS esta semana</span><strong>—</strong></div>
            </div>
            <div class="adv-grid adv-grid-4">
              <button class="adv-tile" data-adv-goto="sst_checklists">Novo Checklist</button>
              <button class="adv-tile" data-adv-goto="sst_nc">Registrar NC</button>
              <button class="adv-tile" data-adv-goto="sst_dds">Registrar DSS</button>
              <button class="adv-tile" data-adv-goto="sst_epis">Controle de EPIs</button>
              <button class="adv-tile" data-adv-goto="sst_pt">Permissão de Trabalho</button>
              <button class="adv-tile" data-adv-goto="sst_incidentes">Registrar Incidente</button>
              <button class="adv-tile" data-adv-goto="sst_documentos">Documentos SST</button>
              <button class="adv-tile" data-adv-goto="sst_treinamentos">Treinamentos NR</button>
            </div>
          `
        ),
        sst_checklists: sectionShell(
          'Checklists de Segurança',
          'Registro e histórico de inspeções.',
          `<button class="btn-primary" data-adv-msg="Novo checklist SST criado.">+ Novo</button>`,
          `
            <div class="adv-box"><div class="mini-list">
              <div class="mini-item"><div><strong>Espaço Confinado (NR33)</strong><div class="muted-sm">2026-05-20 • Luã Machado</div></div><span><span class="adv-badge adv-warn">3 NCs</span> <span class="adv-badge adv-ok">Concluído</span></span></div>
              <div class="mini-item"><div><strong>Trabalho em Altura (NR35)</strong><div class="muted-sm">2026-04-16 • Luã</div></div><span><span class="adv-badge adv-warn">25%</span> <span class="adv-badge">Pendente</span></span></div>
              <div class="mini-item"><div><strong>EPIs em Uso</strong><div class="muted-sm">2026-03-16</div></div><span><span class="adv-badge adv-ok">Concluído</span></span></div>
            </div></div>
          `
        ),
        sst_nc: sectionShell(
          'Não Conformidades',
          'Registro e ciclo de vida completo.',
          `<button class="btn-primary" data-adv-msg="Nova NC cadastrada.">+ Nova NC</button>`,
          `
            ${commonFilters}
            <div class="adv-box">
              <div class="mini-list">
                <div class="mini-item"><div><strong>Equipamentos de resgate disponíveis</strong><div class="muted-sm">Condição insegura</div></div><span><span class="adv-badge adv-danger">Crítica</span> <span class="adv-badge">Aberta</span></span></div>
                <div class="mini-item"><div><strong>Trabalhadores com NR33 válida</strong><div class="muted-sm">Condição insegura</div></div><span><span class="adv-badge adv-warn">Média</span> <span class="adv-badge">Aberta</span></span></div>
                <div class="mini-item"><div><strong>Medição de atmosfera realizada</strong><div class="muted-sm">Condição insegura</div></div><span><span class="adv-badge adv-warn">Média</span> <span class="adv-badge">Aberta</span></span></div>
              </div>
            </div>
          `
        ),
        sst_dds: sectionShell(
          'DSS — Diálogo Semanal de Segurança',
          'Registro semanal de presença, assinaturas e documentação.',
          `<button class="btn-primary" data-adv-msg="Novo DSS criado.">+ Novo DSS</button>`,
          `
            <div class="adv-box"><select>${obraSelect}</select></div>
            <div class="adv-box"><div class="mini-list">
              <div class="mini-item"><div><strong>Espaço confinado — NR33</strong><div class="muted-sm">qui., 21 de mai. de 2026 • BRISA RESIDENCIAL • 06:49</div></div><span class="adv-badge adv-ok">0 presentes</span></div>
              <div class="mini-item"><div><strong>5s no canteiro de obra</strong><div class="muted-sm">qua., 20 de mai. de 2026 • 10:11</div></div><span class="adv-badge adv-ok">4 presentes</span></div>
              <div class="mini-item"><div><strong>Produção X Segurança</strong><div class="muted-sm">seg., 18 de mai. de 2026 • 07:15</div></div><span class="adv-badge adv-ok">12 presentes</span></div>
            </div></div>
          `
        ),
        sst_epis: sectionShell(
          'Controle de EPIs',
          'Distribuição e validade dos equipamentos.',
          `<button class="btn-primary" data-adv-msg="Nova entrega de EPI criada.">+ Nova Entrega</button>`,
          `
            ${commonFilters}
            <div class="adv-box"><div class="mini-list">
              <div class="mini-item"><strong>Gabriel Filipe Tiago</strong><span class="muted-sm">0 EPI(s) ativo(s) • todos ok</span></div>
              <div class="mini-item"><strong>Bruno Junior de Andrade</strong><span class="muted-sm">2 EPI(s) ativo(s) • todos ok</span></div>
              <div class="mini-item"><strong>Benedito Filomeno Junior</strong><span class="muted-sm">1 EPI(s) ativo(s) • todos ok</span></div>
              <div class="mini-item"><strong>Alexandre Oliveira Silva</strong><span class="muted-sm">1 EPI(s) ativo(s) • todos ok</span></div>
            </div></div>
          `
        ),
        sst_treinamentos: sectionShell(
          'Treinamentos NR',
          'Controle de vencimentos e requalificação.',
          `<button class="btn-primary" data-adv-msg="Novo treinamento criado.">+ Novo Treinamento</button>`,
          `
            <div class="adv-box">
              <div class="adv-alert">1 treinamento(s) com NR vencida — programe requalificação.</div>
              <div class="mini-list">
                <div class="mini-item"><div><strong>NR-18 — Canteiro de Obras</strong><div class="muted-sm">07/02/2026 • válido até 06/02/2026 • 4h</div></div><span class="adv-badge adv-danger">Vencido</span></div>
                <div class="mini-item"><div><strong>NR-12 — Máquinas e Equipamentos</strong><div class="muted-sm">16/03/2026 • válido até 16/03/2028 • 2h</div></div><span class="adv-badge adv-ok">Válido</span></div>
              </div>
            </div>
          `
        ),
        sst_pt: sectionShell(
          'Permissão de Trabalho',
          'Emissão, acompanhamento e encerramento de PTs.',
          `<button class="btn-danger" data-adv-msg="Nova PT iniciada.">+ Nova PT</button>`,
          `${commonFilters}<div class="adv-box"><div class="adv-empty-box">Nenhuma Permissão de Trabalho emitida.</div></div>`
        ),
        sst_incidentes: sectionShell(
          'Registro de Incidentes',
          'Quase-acidentes, incidentes e plano de ação.',
          `<button class="btn-danger" data-adv-msg="Novo incidente registrado.">+ Registrar Incidente</button>`,
          `${commonFilters}<div class="adv-box"><div class="adv-empty-box">Nenhum incidente registrado — bom sinal.</div></div>`
        ),
        sst_documentos: sectionShell(
          'Documentos SST',
          'Organização documental de saúde e segurança.',
          '',
          `
            <div class="adv-grid adv-grid-2">
              <div class="adv-box">
                <h3>Obras</h3>
                <div class="mini-list">${getObrasSafe().map(o => `<div class="mini-item"><strong>${esc(o.nome)}</strong><span class="muted-sm">Pasta</span></div>`).join('')}</div>
              </div>
              <div class="adv-box">
                <h3>Categorias SST</h3>
                <div class="mini-list">
                  <div class="mini-item"><strong>Norma Regulamentadora</strong><span class="muted-sm">0 itens</span></div>
                  <div class="mini-item"><strong>PCMSO</strong><span class="muted-sm">0 itens</span></div>
                  <div class="mini-item"><strong>PPRA</strong><span class="muted-sm">0 itens</span></div>
                  <div class="mini-item"><strong>PGR</strong><span class="muted-sm">0 itens</span></div>
                  <div class="mini-item"><strong>Laudo Técnico</strong><span class="muted-sm">0 itens</span></div>
                  <div class="mini-item"><strong>ASO - Atestado</strong><span class="muted-sm">0 itens</span></div>
                </div>
              </div>
            </div>
          `
        ),
        sistema: ''
      };

      return defaults[id] || sectionShell('Módulo', 'Sem conteúdo.', '', `<div class="adv-box"><div class="adv-empty-box">Conteúdo em construção.</div></div>`);
    }

    function ensureStyles(){
      if(document.getElementById('advSuiteStylesV2026')) return;
      const style = document.createElement('style');
      style.id = 'advSuiteStylesV2026';
      style.textContent = `
        .adv-shell{display:grid;gap:14px}
        .adv-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}
        .adv-head h2{margin:0;font-size:42px;line-height:1.05}
        .adv-head p{margin:6px 0 0;color:var(--muted);font-size:16px}
        .adv-actions-head{display:flex;gap:8px;flex-wrap:wrap}
        .adv-box{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:14px}
        .adv-box h3{margin:0 0 10px;font-size:24px}
        .adv-grid{display:grid;gap:10px}
        .adv-grid-2{grid-template-columns:repeat(2,minmax(0,1fr))}
        .adv-grid-3{grid-template-columns:repeat(3,minmax(0,1fr))}
        .adv-grid-4{grid-template-columns:repeat(4,minmax(0,1fr))}
        .adv-kanban{display:grid;grid-template-columns:repeat(4,minmax(240px,1fr));gap:10px;overflow:auto}
        .adv-col{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:10px;min-height:220px}
        .adv-col h4{margin:0 0 8px;font-size:22px;display:flex;justify-content:space-between;align-items:center}
        .adv-ticket{border:1px solid var(--line);border-radius:12px;padding:10px;background:var(--panel-2);margin-bottom:8px;font-weight:700}
        .adv-empty-box{border:1px dashed var(--line);border-radius:12px;padding:22px;text-align:center;color:var(--muted)}
        .adv-drop{border:1px dashed var(--line);border-radius:12px;padding:20px;text-align:center;background:var(--panel-2);font-weight:700}
        .adv-stat{background:var(--panel-2);border:1px solid var(--line);border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:6px}
        .adv-stat span{font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}
        .adv-stat strong{font-size:28px}
        .adv-stat-green{background:linear-gradient(135deg,rgba(23,190,125,.14),rgba(23,190,125,.05))}
        .adv-stat-gold{background:linear-gradient(135deg,rgba(244,173,46,.14),rgba(244,173,46,.05))}
        .adv-stat-yellow{background:linear-gradient(135deg,rgba(245,195,56,.14),rgba(245,195,56,.05))}
        .adv-stat-blue{background:linear-gradient(135deg,rgba(68,130,255,.14),rgba(68,130,255,.05))}
        .adv-stat-purple{background:linear-gradient(135deg,rgba(169,95,255,.14),rgba(169,95,255,.05))}
        .adv-stat-pink{background:linear-gradient(135deg,rgba(242,109,182,.14),rgba(242,109,182,.05))}
        .adv-row{display:flex;align-items:center;gap:8px;padding:10px;border:1px solid var(--line);border-radius:12px;background:var(--panel-2);margin-bottom:8px}
        .adv-row-between{display:flex;justify-content:space-between;align-items:center;gap:10px}
        .adv-dot{width:10px;height:10px;border-radius:999px;background:#4d9fff;display:inline-block}
        .adv-dot-green{background:#32d583}
        .adv-badge{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:999px;background:var(--panel-2);border:1px solid var(--line);font-size:12px;font-weight:700}
        .adv-ok{background:rgba(50,213,131,.18);border-color:rgba(50,213,131,.4)}
        .adv-warn{background:rgba(253,176,34,.2);border-color:rgba(253,176,34,.45)}
        .adv-danger{background:rgba(249,112,102,.2);border-color:rgba(249,112,102,.45)}
        .adv-muted{font-size:12px;color:var(--muted)}
        .adv-list{margin:0;padding-left:18px;display:grid;gap:8px}
        .adv-night{background:linear-gradient(135deg,#101e43,#1a2754);border-color:#2b3d71}
        .adv-night h3{color:#9faeff}
        .adv-night p{font-size:20px;line-height:1.5}
        .adv-progress{width:100%;height:10px;border-radius:999px;background:rgba(255,255,255,.09);overflow:hidden}
        .adv-progress span{display:block;height:100%;background:linear-gradient(135deg,#27d3aa,#38ef7d)}
        .adv-donut{width:96px;height:96px;border-radius:999px;border:10px solid #fdb022;display:grid;place-items:center;font-size:28px;font-weight:800;margin:0 auto 8px}
        .adv-gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
        .adv-gallery img{width:100%;height:170px;object-fit:cover;border-radius:12px;border:1px solid var(--line);background:var(--panel-2)}
        .adv-center{text-align:center}
        .adv-mic{width:90px;height:90px;border-radius:999px;display:grid;place-items:center;margin:0 auto 8px;border:2px solid #f59e0b;background:rgba(245,158,11,.12);font-size:30px}
        .adv-help{max-width:520px;margin:0 auto;padding:12px;border-radius:12px;border:1px solid rgba(245,158,11,.4);background:rgba(245,158,11,.09);color:var(--muted)}
        .adv-alert{padding:10px 12px;border-radius:10px;border:1px solid rgba(249,112,102,.35);background:rgba(249,112,102,.12);color:#ff8e85;font-weight:700;margin-bottom:10px}
        .adv-actions-head .btn-secondary,.adv-actions-head .btn-primary,.adv-actions-head .btn-danger{min-height:42px}
        .adv-tile{border:1px solid var(--line);border-radius:12px;background:var(--panel-2);color:var(--text);font-weight:700;padding:16px 12px;cursor:pointer}
        .adv-card-item p{margin:.35rem 0}
        .adv-money-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed var(--line)}
        @media (max-width:1024px){
          .adv-grid-3,.adv-grid-4{grid-template-columns:repeat(2,minmax(0,1fr))}
          .adv-gallery{grid-template-columns:repeat(2,minmax(0,1fr))}
          .adv-head h2{font-size:36px}
        }
        @media (max-width:760px){
          .adv-grid-2,.adv-grid-3,.adv-grid-4{grid-template-columns:1fr}
          .adv-kanban{grid-template-columns:1fr}
          .adv-gallery{grid-template-columns:1fr}
          .adv-head h2{font-size:30px}
        }
      `;
      document.head.appendChild(style);
    }

    function ensureMenu(){
      const drawer = document.getElementById('drawer');
      if(!drawer) return;
      const sistemaBtn = drawer.querySelector('.menu-item[data-section="sistema"]');

      MODULE_GROUPS.forEach(group => {
        let titleEl = drawer.querySelector('[data-adv-title="' + group.key + '"]');
        if(!titleEl){
          titleEl = document.createElement('div');
          titleEl.className = 'menu-title';
          titleEl.dataset.advTitle = group.key;
          titleEl.textContent = group.title;
          drawer.insertBefore(titleEl, sistemaBtn || null);
        }

        group.items.forEach(item => {
          if(drawer.querySelector('.menu-item[data-section="' + item.id + '"]')) return;
          const btn = document.createElement('button');
          btn.className = 'menu-item';
          btn.dataset.section = item.id;
          btn.textContent = item.icon + ' ' + item.label;
          btn.addEventListener('click', () => {
            if(typeof window.showSection === 'function'){
              window.showSection(item.id);
            }
          });
          drawer.insertBefore(btn, sistemaBtn || null);
        });
      });
    }

    function ensureSections(){
      const main = document.querySelector('main');
      if(!main) return;
      const ids = MODULE_GROUPS.flatMap(g => g.items.map(i => i.id));
      ids.forEach(id => {
        if(document.getElementById(id)) return;
        const section = document.createElement('section');
        section.id = id;
        section.className = 'section';
        section.innerHTML = buildSectionHtml(id);
        main.appendChild(section);
      });
    }

    function bindAdvInteractions(){
      if(document.body.dataset.advSuiteBound === '1') return;
      document.body.dataset.advSuiteBound = '1';

      document.body.addEventListener('click', ev => {
        const goto = ev.target.closest('[data-adv-goto]');
        if(goto){
          const sectionId = goto.getAttribute('data-adv-goto');
          if(sectionId && typeof window.showSection === 'function') window.showSection(sectionId);
          return;
        }
        const msg = ev.target.closest('[data-adv-msg]');
        if(msg){
          const text = msg.getAttribute('data-adv-msg');
          if(text) alert(text);
        }
      });
    }

    function initSuite(){
      ensureStyles();
      ensureSections();
      ensureMenu();
      bindAdvInteractions();
    }

    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', initSuite);
    }else{
      initSuite();
    }
  })();
