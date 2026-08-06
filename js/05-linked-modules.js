  (function(){
    if(window.__ADV_FEATURES_LINKED_V1__) return;
    window.__ADV_FEATURES_LINKED_V1__ = true;

    if(typeof state === 'undefined') return;

    const RDO_STORAGE_KEY = 'obraNovaRdoV1';
    const SUPR_STATUS = ['solicitado','comprando','comprado','entregue'];
    const ADM_STATUS = ['solicitada','em_analise','aguardando_exame','exame'];
    const DESL_STATUS = ['solicitado','em_analise','aviso_previo','acerto'];
    const POS_STATUS = ['caixa_entrada','analise_tecnica','visita_agendada','visita_realizada'];

    function esc(v){
      return String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
    function idAdv(){
      return 'adv-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8);
    }
    function nrm(v){
      return String(v || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
    }
    function moneyBr(v){
      return Number(v || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
    }
    function dBr(v){
      if(!v) return '-';
      const p = String(v).split('-');
      return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : String(v);
    }
    function todayIsoAdv(){
      return new Date().toISOString().slice(0,10);
    }
    function ensureArray(key){
      if(!Array.isArray(state[key])) state[key] = [];
    }
    function saveLinked(){
      try{
        if(typeof saveState === 'function') saveState();
      }catch(_){}
      try{
        if(typeof renderAll === 'function') renderAll();
      }catch(_){}
      renderLinkedModules();
    }
    function obras(){
      return Array.isArray(state.obras) ? state.obras : [];
    }
    function obraName(obraId){
      return obras().find(o => String(o.id) === String(obraId))?.nome || 'Sem obra';
    }
    function obraOptions(includeAll){
      const first = includeAll ? '<option value="">Todas as obras</option>' : '<option value="">Selecione...</option>';
      return first + obras().map(o => `<option value="${esc(o.id)}">${esc(o.nome)}</option>`).join('');
    }
    function prestadores(){
      return Array.isArray(state.prestadoresServico) ? state.prestadoresServico : [];
    }
    function prestadorName(prestadorId){
      return prestadores().find(p => String(p.id) === String(prestadorId))?.nome || 'Sem prestador';
    }
    function prestadorOptions(includeEmpty){
      const start = includeEmpty ? '<option value="">Selecione...</option>' : '';
      return start + prestadores().map(p => `<option value="${esc(p.id)}">${esc(p.nome)}</option>`).join('');
    }
    function contratos(){
      return Array.isArray(state.contratosMedicao) ? state.contratosMedicao : [];
    }
    function contratoOptions(includeEmpty){
      const start = includeEmpty ? '<option value="">Sem contrato específico</option>' : '';
      return start + contratos().map(c => `<option value="${esc(c.id)}">${esc(c.descricao || 'Contrato')}</option>`).join('');
    }
    function rdoList(){
      try{
        const parsed = JSON.parse(localStorage.getItem(RDO_STORAGE_KEY) || '[]');
        return Array.isArray(parsed) ? parsed : [];
      }catch(_){
        return [];
      }
    }
    function rdoFromObra(obraId){
      const o = obras().find(x => String(x.id) === String(obraId));
      const alvoId = String(obraId);
      const alvoNome = nrm(o?.nome || '');
      return rdoList().filter(r => {
        if(String(r.obraId || '') === alvoId) return true;
        return alvoNome && nrm(r.obra || '') === alvoNome;
      });
    }
    function resumoObraVinculado(obraId){
      const rdos = rdoFromObra(obraId);
      const concre = state.concretagens.filter(x => String(x.obraId) === String(obraId));
      const pedidos = state.suprimentosPedidos.filter(x => String(x.obraId) === String(obraId));
      const meds = state.medicoesServico.filter(x => String(x.obraId) === String(obraId));
      const funcs = state.funcionarios.filter(x => String(x.obraId) === String(obraId) && x.status === 'ativo');
      const empreiteiros = rdos.reduce((acc, r) => acc + (Array.isArray(r.empreiteirosList) ? r.empreiteirosList.length : 0), 0);
      return {
        rdos: rdos.length,
        fotosRdo: rdos.reduce((a, r) => a + (Array.isArray(r.imagens) ? r.imagens.length : 0), 0),
        concretagens: concre.length,
        volume: concre.reduce((a, b) => a + Number(b.volume || 0), 0),
        compras: pedidos.reduce((a, b) => a + Number(b.valor || 0), 0),
        medicao: meds.reduce((a, b) => a + Number(b.total || 0), 0),
        efetivoProprio: funcs.length,
        efetivoEmpreiteiro: empreiteiros
      };
    }

    function ensureLinkedState(){
      [
        'concretagens',
        'suprimentosPedidos',
        'locacoes',
        'prestadoresServico',
        'contratosMedicao',
        'medicoesServico',
        'funcionarios',
        'admissaoCards',
        'desligamentoCards',
        'assistenciaChamados',
        'checklistRepasse',
        'sstChecklists',
        'sstNCs',
        'sstDDS',
        'sstEPIs',
        'sstTreinamentos',
        'sstPTs',
        'sstIncidentes',
        'sstDocumentos',
        'arquivosProjetos',
        'arquivosDocumentos'
      ].forEach(ensureArray);

      if(!state.prestadoresServico.length){
        state.prestadoresServico.push(
          { id:idAdv(), nome:'JOTACON CONSTRUCOES LTDA', cpfCnpj:'00.000.000/0001-00', telefone:'', email:'', tipoServico:'Serviços Gerais', pix:'' },
          { id:idAdv(), nome:'SERGIO VELLOSO PROJETOS LTDA', cpfCnpj:'00.000.000/0001-01', telefone:'', email:'', tipoServico:'Consultoria', pix:'' }
        );
      }
      if(!state.funcionarios.length && obras().length){
        state.funcionarios.push(
          { id:idAdv(), nome:'Gabriel Filipe Tiago', funcao:'Encarregado', obraId:obras()[0].id, status:'ativo', cpf:'' },
          { id:idAdv(), nome:'Bruno Junior de Andrade', funcao:'Ajudante', obraId:obras()[0].id, status:'ativo', cpf:'' }
        );
      }
      if(!state.contratosMedicao.length && obras().length && prestadores().length){
        state.contratosMedicao.push({
          id:idAdv(),
          obraId:obras()[0].id,
          prestadorId:prestadores()[0].id,
          descricao:'Execução de Serviços Diversos',
          valorContratado:1050000,
          status:'em_andamento',
          createdAt:todayIsoAdv()
        });
      }
      if(!state.sstTreinamentos.length && obras().length){
        state.sstTreinamentos.push(
          { id:idAdv(), obraId:obras()[0].id, titulo:'NR-18 - Canteiro de Obras', data:'2026-02-07', validade:'2026-02-06', horas:4, participantes:4, status:'vencido' },
          { id:idAdv(), obraId:obras()[0].id, titulo:'NR-12 - Máquinas e Equipamentos', data:'2026-03-16', validade:'2028-03-16', horas:2, participantes:1, status:'valido' }
        );
      }
      saveLinked();
    }

    function sectionWrap(title, subtitle, actionsHtml, bodyHtml){
      return `
        <div class="adv-shell">
          <div class="adv-head">
            <div><h2>${title}</h2><p>${subtitle}</p></div>
            <div class="adv-actions-head">${actionsHtml || ''}</div>
          </div>
          ${bodyHtml}
        </div>
      `;
    }

    function bindSimpleSection(config){
      const btn = document.getElementById(config.btnId);
      if(!btn) return;
      btn.addEventListener('click', () => {
        const obraId = document.getElementById(config.obraId)?.value || '';
        const titulo = (document.getElementById(config.tituloId)?.value || '').trim();
        const status = document.getElementById(config.statusId)?.value || 'ativo';
        const obs = (document.getElementById(config.obsId)?.value || '').trim();
        const data = document.getElementById(config.dataId)?.value || todayIsoAdv();
        if(!obraId || !titulo) return alert('Informe obra e título.');
        state[config.key].unshift({ id:idAdv(), obraId, titulo, status, obs, data });
        saveLinked();
      });
    }

    function renderSimpleRegisterModule(sectionId, opts){
      const sec = document.getElementById(sectionId);
      if(!sec) return;
      const list = state[opts.key];
      const cards = list.length ? `
        <div class="mini-list">
          ${list.map(item => `
            <div class="mini-item">
              <div>
                <strong>${esc(item.titulo)}</strong>
                <div class="adv-muted">${esc(obraName(item.obraId))} • ${esc(dBr(item.data))} • ${esc(item.status || '-')}</div>
                ${item.obs ? `<div class="adv-muted">${esc(item.obs)}</div>` : ''}
              </div>
              <button class="btn-danger" data-linked-del="${opts.key}" data-linked-id="${item.id}">Excluir</button>
            </div>
          `).join('')}
        </div>
      ` : '<div class="adv-empty-box">Nenhum registro cadastrado.</div>';
      sec.innerHTML = sectionWrap(
        opts.title,
        opts.subtitle,
        '',
        `
          <div class="adv-box">
            <div class="adv-grid adv-grid-4">
              <div><label>Obra</label><select id="${opts.obraId}">${obraOptions(false)}</select></div>
              <div><label>Título</label><input id="${opts.tituloId}" placeholder="${esc(opts.placeholder || 'Nome do registro')}"></div>
              <div><label>Status</label><select id="${opts.statusId}"><option value="ativo">Ativo</option><option value="pendente">Pendente</option><option value="concluido">Concluído</option></select></div>
              <div><label>Data</label><input id="${opts.dataId}" type="date" value="${todayIsoAdv()}"></div>
            </div>
            <div style="margin-top:10px;"><label>Observações</label><textarea id="${opts.obsId}" placeholder="Detalhes"></textarea></div>
            <div class="actions"><button class="btn-primary" id="${opts.btnId}">Salvar</button></div>
          </div>
          <div class="adv-box">${cards}</div>
        `
      );
      bindSimpleSection(opts);
    }

    function renderConcretagem(){
      const sec = document.getElementById('concretagem');
      if(!sec) return;
      const rows = state.concretagens.length ? state.concretagens.map(c => `
        <tr>
          <td>${esc(dBr(c.data))}</td>
          <td>${esc(obraName(c.obraId))}</td>
          <td>${esc(c.elemento || '-')}</td>
          <td>${Number(c.volume || 0).toLocaleString('pt-BR')} m³</td>
          <td>${esc(c.responsavel || '-')}</td>
          <td><button class="btn-danger" data-linked-del="concretagens" data-linked-id="${c.id}">Excluir</button></td>
        </tr>
      `).join('') : '<tr><td colspan="6">Nenhuma concretagem registrada.</td></tr>';
      sec.innerHTML = sectionWrap(
        'Concretagem',
        'Rastreabilidade vinculada à obra e consolidada nos relatórios.',
        '',
        `
          <div class="adv-box">
            <div class="adv-grid adv-grid-4">
              <div><label>Obra</label><select id="concObra">${obraOptions(false)}</select></div>
              <div><label>Data</label><input id="concData" type="date" value="${todayIsoAdv()}"></div>
              <div><label>Elemento / Peça</label><input id="concElemento" placeholder="Ex.: Pilares térreo"></div>
              <div><label>Área / Pavimento</label><input id="concArea" placeholder="Ex.: Térreo"></div>
              <div><label>FCK (MPA)</label><input id="concFck" type="number" step="0.1"></div>
              <div><label>Volume (m³)</label><input id="concVolume" type="number" step="0.1"></div>
              <div><label>Placa</label><input id="concPlaca"></div>
              <div><label>NF / Conhecimento</label><input id="concNf"></div>
              <div><label>Slump (cm)</label><input id="concSlump"></div>
              <div><label>Responsável</label><input id="concResp"></div>
            </div>
            <div style="margin-top:10px;"><label>Observações</label><textarea id="concObs" placeholder="Observações"></textarea></div>
            <div class="actions"><button class="btn-primary" id="btnSalvarConcretagem">Salvar concretagem</button></div>
          </div>
          <div class="adv-box">
            <div class="table-wrap">
              <table><thead><tr><th>Data</th><th>Obra</th><th>Elemento</th><th>Volume</th><th>Responsável</th><th>Ações</th></tr></thead><tbody>${rows}</tbody></table>
            </div>
          </div>
        `
      );
      document.getElementById('btnSalvarConcretagem')?.addEventListener('click', () => {
        const payload = {
          id: idAdv(),
          obraId: document.getElementById('concObra')?.value || '',
          data: document.getElementById('concData')?.value || todayIsoAdv(),
          elemento: (document.getElementById('concElemento')?.value || '').trim(),
          area: (document.getElementById('concArea')?.value || '').trim(),
          fck: Number(document.getElementById('concFck')?.value || 0),
          volume: Number(document.getElementById('concVolume')?.value || 0),
          placa: (document.getElementById('concPlaca')?.value || '').trim(),
          nf: (document.getElementById('concNf')?.value || '').trim(),
          slump: (document.getElementById('concSlump')?.value || '').trim(),
          responsavel: (document.getElementById('concResp')?.value || '').trim(),
          obs: (document.getElementById('concObs')?.value || '').trim()
        };
        if(!payload.obraId || !payload.elemento || payload.volume <= 0) return alert('Informe obra, elemento e volume.');
        state.concretagens.unshift(payload);
        saveLinked();
      });
    }

    function renderInteligencia(){
      const sec = document.getElementById('inteligencia');
      if(!sec) return;
      const obraId = sec.dataset.obraId || obras()[0]?.id || '';
      const resumo = obraId ? resumoObraVinculado(obraId) : { rdos:0,fotosRdo:0,concretagens:0,volume:0,compras:0,medicao:0,efetivoProprio:0,efetivoEmpreiteiro:0 };
      sec.innerHTML = sectionWrap(
        'Inteligência Executiva',
        'Consolidação automática dos módulos vinculados por obra.',
        `
          <button class="btn-secondary" id="btnGerarParecerIA">Gerar Parecer</button>
          <button class="btn-secondary" id="btnResumoMensal">Resumo Mensal</button>
        `,
        `
          <div class="adv-box">
            <div class="adv-grid adv-grid-3">
              <div><label>Obra</label><select id="intelObra">${obraOptions(false)}</select></div>
              <div><label>Última atualização</label><input value="${dBr(todayIsoAdv())}" disabled></div>
              <div><label>Registros vinculados</label><input value="${resumo.rdos + resumo.concretagens + state.suprimentosPedidos.length + state.medicoesServico.length}" disabled></div>
            </div>
          </div>
          <div class="adv-grid adv-grid-3">
            <div class="adv-stat adv-stat-green"><span>Medições Realizadas</span><strong>${moneyBr(resumo.medicao)}</strong></div>
            <div class="adv-stat adv-stat-gold"><span>Compras / Suprimentos</span><strong>${moneyBr(resumo.compras)}</strong></div>
            <div class="adv-stat adv-stat-blue"><span>Concreto Realizado</span><strong>${Number(resumo.volume).toLocaleString('pt-BR')} m³</strong></div>
            <div class="adv-stat adv-stat-purple"><span>Efetivo Próprio</span><strong>${resumo.efetivoProprio} pessoas</strong></div>
            <div class="adv-stat adv-stat-pink"><span>Efetivo Empreiteiros</span><strong>${resumo.efetivoEmpreiteiro} pessoas</strong></div>
            <div class="adv-stat"><span>RDOs / Fotos</span><strong>${resumo.rdos} / ${resumo.fotosRdo}</strong></div>
          </div>
          <div class="adv-box adv-night">
            <h3>Parecer da Inteligência Artificial</h3>
            <p id="intelParecerTexto">Use "Gerar Parecer" para consolidar os dados vinculados desta obra.</p>
          </div>
        `
      );
      const sel = document.getElementById('intelObra');
      if(sel){
        sel.value = obraId;
        sel.addEventListener('change', () => {
          sec.dataset.obraId = sel.value;
          renderInteligencia();
        });
      }
      document.getElementById('btnGerarParecerIA')?.addEventListener('click', () => {
        const curObra = sec.dataset.obraId || obras()[0]?.id || '';
        if(!curObra) return;
        const r = resumoObraVinculado(curObra);
        const msg = `Nesta semana, a obra ${obraName(curObra)} possui ${r.rdos} RDO(s), ${r.concretagens} concretagem(ns) com ${Number(r.volume).toLocaleString('pt-BR')} m³, medições de ${moneyBr(r.medicao)} e suprimentos de ${moneyBr(r.compras)}. Efetivo próprio de ${r.efetivoProprio} pessoa(s) e empreiteiros ${r.efetivoEmpreiteiro}.`;
        const out = document.getElementById('intelParecerTexto');
        if(out) out.textContent = msg;
      });
      document.getElementById('btnResumoMensal')?.addEventListener('click', () => {
        alert('Resumo mensal consolidado com base nos vínculos da obra selecionada.');
      });
    }

    function renderKanban(sectionId, key, statuses, labels, formTitle){
      const sec = document.getElementById(sectionId);
      if(!sec) return;
      const list = state[key];
      sec.innerHTML = sectionWrap(
        formTitle,
        'Fluxo com vínculo de obra e histórico por status.',
        '',
        `
          <div class="adv-box">
            <div class="adv-grid adv-grid-4">
              <div><label>Obra</label><select id="${sectionId}_obra">${obraOptions(false)}</select></div>
              <div><label>Título</label><input id="${sectionId}_titulo" placeholder="Descrição"></div>
              <div><label>Responsável</label><input id="${sectionId}_resp" placeholder="Responsável"></div>
              <div><label>Prioridade</label><select id="${sectionId}_prio"><option>Baixa</option><option>Média</option><option>Alta</option></select></div>
            </div>
            <div class="actions"><button class="btn-primary" id="${sectionId}_save">Adicionar</button></div>
          </div>
          <div class="adv-kanban">
            ${statuses.map(st => {
              const cards = list.filter(x => x.status === st);
              return `
                <div class="adv-col">
                  <h4>${esc(labels[st])} <span>${cards.length}</span></h4>
                  ${cards.length ? cards.map(c => `
                    <div class="adv-ticket">
                      <strong>${esc(c.titulo)}</strong><br>
                      <small>${esc(obraName(c.obraId))} • ${esc(c.responsavel || '-')} • ${esc(c.prioridade || '-')}</small>
                      <div class="actions" style="margin-top:8px;">
                        <button class="btn-secondary" data-kanban-move="${key}" data-id="${c.id}" data-dir="-1">◀</button>
                        <button class="btn-secondary" data-kanban-move="${key}" data-id="${c.id}" data-dir="1">▶</button>
                        <button class="btn-danger" data-linked-del="${key}" data-linked-id="${c.id}">Excluir</button>
                      </div>
                    </div>
                  `).join('') : '<div class="adv-empty-box">Nenhum card</div>'}
                </div>
              `;
            }).join('')}
          </div>
        `
      );
      document.getElementById(sectionId + '_save')?.addEventListener('click', () => {
        const obraId = document.getElementById(sectionId + '_obra')?.value || '';
        const titulo = (document.getElementById(sectionId + '_titulo')?.value || '').trim();
        const responsavel = (document.getElementById(sectionId + '_resp')?.value || '').trim();
        const prioridade = document.getElementById(sectionId + '_prio')?.value || 'Média';
        if(!obraId || !titulo) return alert('Informe obra e título.');
        state[key].unshift({ id:idAdv(), obraId, titulo, responsavel, prioridade, status:statuses[0], data:todayIsoAdv() });
        saveLinked();
      });
    }

    function renderSuprimentosIA(){
      const sec = document.getElementById('suprimentos_ia');
      if(!sec) return;
      sec.innerHTML = sectionWrap(
        'Nova Solicitação IA',
        'Transforma texto/áudio em pedido vinculado ao Kanban de suprimentos.',
        '',
        `
          <div class="adv-box adv-center">
            <div class="adv-mic">🎙️</div>
            <h3>Toque e fale o pedido de materiais</h3>
            <div class="adv-help">Descreva itens e quantidades; depois informe a data de necessidade.</div>
          </div>
          <div class="adv-box">
            <div class="adv-grid adv-grid-3">
              <div><label>Obra</label><select id="supIAObra">${obraOptions(false)}</select></div>
              <div><label>Data de necessidade</label><input id="supIAData" type="date" value="${todayIsoAdv()}"></div>
              <div><label>Valor estimado (R$)</label><input id="supIAValor" type="number" step="0.01"></div>
            </div>
            <div style="margin-top:10px;"><label>Pedido</label><textarea id="supIATexto" placeholder="Ex.: 20 sacos de cimento e 5 barras de ferro 10mm para o dia 20/05."></textarea></div>
            <div class="actions"><button class="btn-primary" id="btnSupIACriar">Criar pedido no Kanban</button></div>
          </div>
        `
      );
      document.getElementById('btnSupIACriar')?.addEventListener('click', () => {
        const obraId = document.getElementById('supIAObra')?.value || '';
        const texto = (document.getElementById('supIATexto')?.value || '').trim();
        const dataNec = document.getElementById('supIAData')?.value || todayIsoAdv();
        const valor = Number(document.getElementById('supIAValor')?.value || 0);
        if(!obraId || !texto) return alert('Informe obra e pedido.');
        state.suprimentosPedidos.unshift({
          id:idAdv(),
          obraId,
          descricao:texto,
          titulo:texto.slice(0,70),
          itens:texto,
          valor,
          dataNecessidade:dataNec,
          status:'solicitado',
          responsavel:'IA',
          prioridade:'Média',
          origem:'ia'
        });
        saveLinked();
        if(typeof window.showSection === 'function') window.showSection('suprimentos_kanban');
      });
    }

    function renderRelatoriosCompras(){
      const sec = document.getElementById('relatorios_compras');
      if(!sec) return;
      const obraId = sec.dataset.obraId || '';
      const status = sec.dataset.status || '';
      let data = state.suprimentosPedidos.slice();
      if(obraId) data = data.filter(x => String(x.obraId) === String(obraId));
      if(status) data = data.filter(x => x.status === status);
      const total = data.reduce((a,b) => a + Number(b.valor || 0), 0);
      sec.innerHTML = sectionWrap(
        'Relatórios de Compras',
        'Consolidação de pedidos vinculados por obra e status.',
        `<button class="btn-secondary" id="btnRelCompResumo">Gerar resumo</button>`,
        `
          <div class="adv-box">
            <div class="adv-grid adv-grid-3">
              <div><label>Obra</label><select id="relCompObra">${obraOptions(true)}</select></div>
              <div><label>Status</label><select id="relCompStatus"><option value="">Todos</option>${SUPR_STATUS.map(s => `<option value="${s}">${s}</option>`).join('')}</select></div>
              <div><label>Total filtrado</label><input value="${moneyBr(total)}" disabled></div>
            </div>
          </div>
          <div class="adv-box">
            <div class="table-wrap">
              <table>
                <thead><tr><th>Obra</th><th>Descrição</th><th>Status</th><th>Data</th><th>Valor</th></tr></thead>
                <tbody>
                  ${data.length ? data.map(p => `<tr><td>${esc(obraName(p.obraId))}</td><td>${esc(p.descricao || p.titulo || '-')}</td><td>${esc(p.status)}</td><td>${esc(dBr(p.dataNecessidade || p.data))}</td><td>${moneyBr(p.valor || 0)}</td></tr>`).join('') : '<tr><td colspan="5">Sem dados.</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
        `
      );
      const obraSel = document.getElementById('relCompObra');
      const stSel = document.getElementById('relCompStatus');
      if(obraSel){ obraSel.value = obraId; obraSel.addEventListener('change', () => { sec.dataset.obraId = obraSel.value; renderRelatoriosCompras(); }); }
      if(stSel){ stSel.value = status; stSel.addEventListener('change', () => { sec.dataset.status = stSel.value; renderRelatoriosCompras(); }); }
      document.getElementById('btnRelCompResumo')?.addEventListener('click', () => {
        alert(`Resumo gerado: ${data.length} pedido(s), total ${moneyBr(total)}.`);
      });
    }

    function renderLocacoes(){
      const sec = document.getElementById('gestao_locacoes');
      if(!sec) return;
      sec.innerHTML = sectionWrap(
        'Gestão de Locações',
        'Simulação e controle de locações vinculadas à obra.',
        '',
        `
          <div class="adv-box">
            <div class="adv-grid adv-grid-4">
              <div><label>Obra</label><select id="locObra">${obraOptions(false)}</select></div>
              <div><label>Fornecedor</label><input id="locFornecedor"></div>
              <div><label>Equipamento</label><input id="locEquip"></div>
              <div><label>Período</label><select id="locPeriodo"><option>Mensal (30 dias)</option><option>Semanal</option><option>Diário</option></select></div>
              <div><label>Quantidade</label><input id="locQtd" type="number" min="1"></div>
              <div><label>Custo mensal (R$)</label><input id="locCusto" type="number" step="0.01"></div>
              <div><label>Data necessidade</label><input id="locData" type="date" value="${todayIsoAdv()}"></div>
              <div><label>Status</label><select id="locStatus"><option value="ativa">Ativa</option><option value="devolvida">Devolvida</option></select></div>
            </div>
            <div class="actions"><button class="btn-primary" id="btnLocSalvar">Salvar locação</button></div>
          </div>
          <div class="adv-box">
            <div class="mini-list">
              ${state.locacoes.length ? state.locacoes.map(l => `<div class="mini-item"><div><strong>${esc(l.equipamento)}</strong><div class="adv-muted">${esc(obraName(l.obraId))} • ${esc(l.fornecedor)} • ${esc(l.status)}</div></div><div><strong>${moneyBr(l.custoMensal || 0)}</strong> <button class="btn-danger" data-linked-del="locacoes" data-linked-id="${l.id}">Excluir</button></div></div>`).join('') : '<div class="adv-empty-box">Nenhuma locação cadastrada.</div>'}
            </div>
          </div>
        `
      );
      document.getElementById('btnLocSalvar')?.addEventListener('click', () => {
        const rec = {
          id:idAdv(),
          obraId: document.getElementById('locObra')?.value || '',
          fornecedor: (document.getElementById('locFornecedor')?.value || '').trim(),
          equipamento: (document.getElementById('locEquip')?.value || '').trim(),
          periodo: document.getElementById('locPeriodo')?.value || 'Mensal (30 dias)',
          quantidade: Number(document.getElementById('locQtd')?.value || 0),
          custoMensal: Number(document.getElementById('locCusto')?.value || 0),
          dataNecessidade: document.getElementById('locData')?.value || todayIsoAdv(),
          status: document.getElementById('locStatus')?.value || 'ativa'
        };
        if(!rec.obraId || !rec.fornecedor || !rec.equipamento) return alert('Informe obra, fornecedor e equipamento.');
        state.locacoes.unshift(rec);
        saveLinked();
      });
    }

    function renderInventario(){
      const sec = document.getElementById('inventario');
      if(!sec) return;
      const obraId = sec.dataset.obraId || '';
      let resumo = [];
      try{
        resumo = typeof resumoEstoque === 'function' ? resumoEstoque(obraId) : [];
      }catch(_){
        resumo = [];
      }
      sec.innerHTML = sectionWrap(
        'Inventário',
        'Ajuste de estoque com vínculo em obra e movimentações.',
        '',
        `
          <div class="adv-box">
            <div class="adv-grid adv-grid-4">
              <div><label>Filtrar obra</label><select id="invFiltroObra">${obraOptions(true)}</select></div>
              <div><label>Produto</label><select id="invProd">${(state.produtos || []).map(p => `<option value="${esc(p.id)}">${esc(p.nome)}</option>`).join('')}</select></div>
              <div><label>Tipo ajuste</label><select id="invTipo"><option value="entrada">Entrada</option><option value="saida">Saída</option></select></div>
              <div><label>Quantidade</label><input id="invQtd" type="number" step="0.01"></div>
            </div>
            <div class="actions"><button class="btn-primary" id="btnInvAjustar">Lançar ajuste</button></div>
          </div>
          <div class="adv-box">
            <div class="table-wrap">
              <table><thead><tr><th>Produto</th><th>Saldo</th><th>Mínimo</th><th>Custo médio</th><th>Total</th></tr></thead>
                <tbody>${resumo.length ? resumo.map(r => `<tr><td>${esc(r.nome)}</td><td>${Number(r.saldo || 0).toLocaleString('pt-BR')}</td><td>${Number(r.minimo || 0).toLocaleString('pt-BR')}</td><td>${moneyBr(r.custoMedio || 0)}</td><td>${moneyBr(r.custoTotal || 0)}</td></tr>`).join('') : '<tr><td colspan="5">Sem dados.</td></tr>'}</tbody>
              </table>
            </div>
          </div>
        `
      );
      const invObra = document.getElementById('invFiltroObra');
      if(invObra){
        invObra.value = obraId;
        invObra.addEventListener('change', () => { sec.dataset.obraId = invObra.value; renderInventario(); });
      }
      document.getElementById('btnInvAjustar')?.addEventListener('click', () => {
        const produtoId = document.getElementById('invProd')?.value || '';
        const tipo = document.getElementById('invTipo')?.value || 'entrada';
        const qtd = Number(document.getElementById('invQtd')?.value || 0);
        const obra = document.getElementById('invFiltroObra')?.value || '';
        const prod = (state.produtos || []).find(p => String(p.id) === String(produtoId));
        if(!produtoId || qtd <= 0) return alert('Informe produto e quantidade.');
        state.movimentacoes.unshift({
          id:idAdv(),
          tipo,
          data:todayIsoAdv(),
          obraId:obra,
          produtoId,
          quantidade:qtd,
          valor:Number(prod?.custo || 0),
          observacoes:'Ajuste via Inventário'
        });
        saveLinked();
      });
    }

    function renderPrestadores(){
      const sec = document.getElementById('prestadores_servico');
      if(!sec) return;
      sec.innerHTML = sectionWrap(
        'Prestadores de Serviço',
        'Cadastro base para vínculos de contratos e medições.',
        '',
        `
          <div class="adv-box">
            <div class="adv-grid adv-grid-4">
              <div><label>Nome / Apelido</label><input id="preNome"></div>
              <div><label>CPF / CNPJ</label><input id="preDoc"></div>
              <div><label>Telefone</label><input id="preTel"></div>
              <div><label>Tipo de serviço</label><input id="preTipo"></div>
              <div><label>E-mail</label><input id="preEmail"></div>
              <div><label>PIX</label><input id="prePix"></div>
            </div>
            <div class="actions"><button class="btn-primary" id="btnPreSalvar">Cadastrar Prestador</button></div>
          </div>
          <div class="adv-grid adv-grid-3">
            ${prestadores().map(p => `<div class="adv-box adv-card-item"><h3>${esc(p.nome)}</h3><p>${esc(p.tipoServico || '-')}</p><p>${esc(p.cpfCnpj || '-')}</p><p>${esc(p.email || '-')}</p><div class="actions"><button class="btn-danger" data-linked-del="prestadoresServico" data-linked-id="${p.id}">Excluir</button></div></div>`).join('')}
          </div>
        `
      );
      document.getElementById('btnPreSalvar')?.addEventListener('click', () => {
        const nome = (document.getElementById('preNome')?.value || '').trim();
        if(!nome) return alert('Informe o nome do prestador.');
        state.prestadoresServico.unshift({
          id:idAdv(),
          nome,
          cpfCnpj:(document.getElementById('preDoc')?.value || '').trim(),
          telefone:(document.getElementById('preTel')?.value || '').trim(),
          tipoServico:(document.getElementById('preTipo')?.value || '').trim(),
          email:(document.getElementById('preEmail')?.value || '').trim(),
          pix:(document.getElementById('prePix')?.value || '').trim()
        });
        saveLinked();
      });
    }

    function renderMedicaoContratos(){
      const sec = document.getElementById('medicao_contratos');
      if(!sec) return;
      const totalContratado = contratos().reduce((a,b) => a + Number(b.valorContratado || 0), 0);
      const totalMedido = state.medicoesServico.reduce((a,b) => a + Number(b.total || 0), 0);
      sec.innerHTML = sectionWrap(
        'Medição de Contratos',
        'Contratos vinculados à obra, prestador e medições.',
        '',
        `
          <div class="adv-grid adv-grid-3">
            <div class="adv-stat"><span>Total contratado</span><strong>${moneyBr(totalContratado)}</strong></div>
            <div class="adv-stat"><span>Total medido</span><strong>${moneyBr(totalMedido)}</strong></div>
            <div class="adv-stat"><span>Saldo</span><strong>${moneyBr(totalContratado - totalMedido)}</strong></div>
          </div>
          <div class="adv-box">
            <div class="adv-grid adv-grid-4">
              <div><label>Obra</label><select id="mcObra">${obraOptions(false)}</select></div>
              <div><label>Prestador</label><select id="mcPrest">${prestadorOptions(true)}</select></div>
              <div><label>Descrição</label><input id="mcDesc" placeholder="Ex.: Execução de Serviços Diversos"></div>
              <div><label>Valor contratado (R$)</label><input id="mcValor" type="number" step="0.01"></div>
            </div>
            <div class="actions"><button class="btn-primary" id="btnMcSalvar">Salvar contrato</button></div>
          </div>
          <div class="adv-box">
            <div class="mini-list">
              ${contratos().length ? contratos().map(c => `<div class="mini-item"><div><strong>${esc(c.descricao)}</strong><div class="adv-muted">${esc(obraName(c.obraId))} • ${esc(prestadorName(c.prestadorId))}</div></div><div><strong>${moneyBr(c.valorContratado)}</strong> <button class="btn-danger" data-linked-del="contratosMedicao" data-linked-id="${c.id}">Excluir</button></div></div>`).join('') : '<div class="adv-empty-box">Nenhum contrato cadastrado.</div>'}
            </div>
          </div>
        `
      );
      document.getElementById('btnMcSalvar')?.addEventListener('click', () => {
        const obraId = document.getElementById('mcObra')?.value || '';
        const prestadorId = document.getElementById('mcPrest')?.value || '';
        const descricao = (document.getElementById('mcDesc')?.value || '').trim();
        const valorContratado = Number(document.getElementById('mcValor')?.value || 0);
        if(!obraId || !prestadorId || !descricao || valorContratado <= 0) return alert('Preencha os campos do contrato.');
        state.contratosMedicao.unshift({ id:idAdv(), obraId, prestadorId, descricao, valorContratado, status:'em_andamento', createdAt:todayIsoAdv() });
        saveLinked();
      });
    }

    function renderMedicaoServicos(){
      const sec = document.getElementById('medicao_servicos');
      if(!sec) return;
      sec.innerHTML = sectionWrap(
        'Medição de Serviços',
        'Lançamentos vinculados a prestadores, obras e contratos.',
        '',
        `
          <div class="adv-box">
            <div class="adv-grid adv-grid-4">
              <div><label>Prestador</label><select id="msPrest">${prestadorOptions(true)}</select></div>
              <div><label>Obra</label><select id="msObra">${obraOptions(false)}</select></div>
              <div><label>Contrato</label><select id="msContrato">${contratoOptions(true)}</select></div>
              <div><label>Vencimento</label><input id="msVenc" type="date" value="${todayIsoAdv()}"></div>
              <div><label>Descrição</label><input id="msDesc"></div>
              <div><label>Unidade</label><input id="msUn" value="un"></div>
              <div><label>Quantidade</label><input id="msQtd" type="number" step="0.01"></div>
              <div><label>Valor unitário (R$)</label><input id="msUnit" type="number" step="0.01"></div>
            </div>
            <div class="actions"><button class="btn-primary" id="btnMsSalvar">Salvar medição</button></div>
          </div>
          <div class="adv-box">
            <div class="mini-list">
              ${state.medicoesServico.length ? state.medicoesServico.map(m => `<div class="mini-item"><div><strong>${esc(prestadorName(m.prestadorId))}</strong><div class="adv-muted">${esc(obraName(m.obraId))} • ${esc(dBr(m.data))} • ${esc(m.descricao)}</div></div><div><strong>${moneyBr(m.total)}</strong> <button class="btn-danger" data-linked-del="medicoesServico" data-linked-id="${m.id}">Excluir</button></div></div>`).join('') : '<div class="adv-empty-box">Nenhuma medição cadastrada.</div>'}
            </div>
          </div>
        `
      );
      document.getElementById('btnMsSalvar')?.addEventListener('click', () => {
        const prestadorId = document.getElementById('msPrest')?.value || '';
        const obraId = document.getElementById('msObra')?.value || '';
        const contratoId = document.getElementById('msContrato')?.value || '';
        const descricao = (document.getElementById('msDesc')?.value || '').trim();
        const un = (document.getElementById('msUn')?.value || 'un').trim();
        const qtd = Number(document.getElementById('msQtd')?.value || 0);
        const unit = Number(document.getElementById('msUnit')?.value || 0);
        const vencimento = document.getElementById('msVenc')?.value || todayIsoAdv();
        if(!prestadorId || !obraId || !descricao || qtd <= 0 || unit <= 0) return alert('Preencha os campos da medição.');
        state.medicoesServico.unshift({
          id:idAdv(),
          prestadorId,
          obraId,
          contratoId,
          descricao,
          un,
          qtd,
          valorUnit:unit,
          total:qtd*unit,
          data:todayIsoAdv(),
          vencimento,
          status:'aprovada'
        });
        saveLinked();
      });
    }

    function renderRelatoriosMedicoes(){
      const sec = document.getElementById('relatorios_medicoes');
      if(!sec) return;
      const selectedId = sec.dataset.medId || state.medicoesServico[0]?.id || '';
      const med = state.medicoesServico.find(m => String(m.id) === String(selectedId));
      sec.innerHTML = sectionWrap(
        'Relatórios de Medições',
        'Visualização externa com exportação em PDF.',
        `<button class="btn-primary" id="btnRmPdf">Baixar PDF</button>`,
        `
          <div class="adv-box">
            <label>Medição</label>
            <select id="rmMed">${state.medicoesServico.map(m => `<option value="${esc(m.id)}">${esc(prestadorName(m.prestadorId))} - ${esc(dBr(m.data))}</option>`).join('')}</select>
          </div>
          <div class="adv-box">
            ${med ? `
              <h3>Medição de Serviço</h3>
              <div class="adv-grid adv-grid-4">
                <div><label>Obra</label><strong>${esc(obraName(med.obraId))}</strong></div>
                <div><label>Prestador</label><strong>${esc(prestadorName(med.prestadorId))}</strong></div>
                <div><label>Data</label><strong>${esc(dBr(med.data))}</strong></div>
                <div><label>Vencimento</label><strong>${esc(dBr(med.vencimento))}</strong></div>
                <div><label>Descrição</label><strong>${esc(med.descricao)}</strong></div>
                <div><label>Quantidade</label><strong>${Number(med.qtd).toLocaleString('pt-BR')} ${esc(med.un || '')}</strong></div>
                <div><label>Unitário</label><strong>${moneyBr(med.valorUnit)}</strong></div>
                <div><label>Total</label><strong>${moneyBr(med.total)}</strong></div>
              </div>
            ` : '<div class="adv-empty-box">Nenhuma medição disponível.</div>'}
          </div>
        `
      );
      const sel = document.getElementById('rmMed');
      if(sel){
        sel.value = selectedId;
        sel.addEventListener('change', () => { sec.dataset.medId = sel.value; renderRelatoriosMedicoes(); });
      }
      document.getElementById('btnRmPdf')?.addEventListener('click', () => {
        const current = state.medicoesServico.find(m => String(m.id) === String(sec.dataset.medId || state.medicoesServico[0]?.id || ''));
        if(!current) return alert('Nenhuma medição selecionada.');
        if(!(window.jspdf && window.jspdf.jsPDF)) return alert('Biblioteca PDF indisponível.');
        const doc = new window.jspdf.jsPDF({ unit:'mm', format:'a4' });
        doc.setFont('helvetica','bold');
        doc.setFontSize(16);
        doc.text('Relatório de Medição de Serviço', 14, 16);
        doc.setFont('helvetica','normal');
        doc.setFontSize(11);
        doc.text(`Obra: ${obraName(current.obraId)}`, 14, 28);
        doc.text(`Prestador: ${prestadorName(current.prestadorId)}`, 14, 35);
        doc.text(`Data: ${dBr(current.data)}   Vencimento: ${dBr(current.vencimento)}`, 14, 42);
        doc.text(`Descrição: ${current.descricao}`, 14, 49);
        doc.text(`Quantidade: ${Number(current.qtd).toLocaleString('pt-BR')} ${current.un || ''}`, 14, 56);
        doc.text(`Unitário: ${moneyBr(current.valorUnit)}   Total: ${moneyBr(current.total)}`, 14, 63);
        doc.save(`medicao_${String(current.id).slice(-6)}.pdf`);
      });
    }

    function renderProjetosDocumentos(sectionId, key, title, subtitle, catDefault){
      const sec = document.getElementById(sectionId);
      if(!sec) return;
      sec.innerHTML = sectionWrap(
        title,
        subtitle,
        '',
        `
          <div class="adv-box">
            <div class="adv-grid adv-grid-4">
              <div><label>Obra</label><select id="${sectionId}_obra">${obraOptions(false)}</select></div>
              <div><label>Categoria</label><input id="${sectionId}_cat" value="${esc(catDefault)}"></div>
              <div><label>Nome</label><input id="${sectionId}_nome" placeholder="Nome da pasta/arquivo"></div>
              <div><label>Status</label><select id="${sectionId}_status"><option>ativo</option><option>pendente</option></select></div>
            </div>
            <div class="actions"><button class="btn-primary" id="${sectionId}_save">Salvar</button></div>
          </div>
          <div class="adv-box">
            <div class="mini-list">
              ${state[key].length ? state[key].map(i => `<div class="mini-item"><div><strong>${esc(i.nome)}</strong><div class="adv-muted">${esc(obraName(i.obraId))} • ${esc(i.categoria || '-')} • ${esc(i.status || '-')}</div></div><button class="btn-danger" data-linked-del="${key}" data-linked-id="${i.id}">Excluir</button></div>`).join('') : '<div class="adv-empty-box">Sem itens cadastrados.</div>'}
            </div>
          </div>
        `
      );
      document.getElementById(sectionId + '_save')?.addEventListener('click', () => {
        const obraId = document.getElementById(sectionId + '_obra')?.value || '';
        const categoria = (document.getElementById(sectionId + '_cat')?.value || '').trim();
        const nome = (document.getElementById(sectionId + '_nome')?.value || '').trim();
        const status = document.getElementById(sectionId + '_status')?.value || 'ativo';
        if(!obraId || !nome) return alert('Informe obra e nome.');
        state[key].unshift({ id:idAdv(), obraId, categoria, nome, status, data:todayIsoAdv() });
        saveLinked();
      });
    }

    function renderFuncionarios(){
      const sec = document.getElementById('painel_funcionarios');
      if(!sec) return;
      sec.innerHTML = sectionWrap(
        'Painel de Funcionários',
        'Gestão de funcionários ativos vinculados à obra.',
        '',
        `
          <div class="adv-box">
            <div class="adv-grid adv-grid-4">
              <div><label>Nome</label><input id="funNome"></div>
              <div><label>Função</label><input id="funFuncao"></div>
              <div><label>Obra</label><select id="funObra">${obraOptions(false)}</select></div>
              <div><label>Status</label><select id="funStatus"><option value="ativo">Ativo</option><option value="inativo">Inativo</option></select></div>
            </div>
            <div class="actions"><button class="btn-primary" id="btnFunSalvar">Salvar funcionário</button></div>
          </div>
          <div class="adv-grid adv-grid-3">
            ${state.funcionarios.map(f => `<div class="adv-box adv-card-item"><h3>${esc(f.nome)}</h3><p>${esc(f.funcao || '-')}</p><p>${esc(obraName(f.obraId))}</p><span class="adv-badge ${f.status === 'ativo' ? 'adv-ok':''}">${esc(f.status || '-')}</span><div class="actions"><button class="btn-danger" data-linked-del="funcionarios" data-linked-id="${f.id}">Excluir</button></div></div>`).join('')}
          </div>
        `
      );
      document.getElementById('btnFunSalvar')?.addEventListener('click', () => {
        const nome = (document.getElementById('funNome')?.value || '').trim();
        const funcao = (document.getElementById('funFuncao')?.value || '').trim();
        const obraId = document.getElementById('funObra')?.value || '';
        const status = document.getElementById('funStatus')?.value || 'ativo';
        if(!nome || !obraId) return alert('Informe nome e obra.');
        state.funcionarios.unshift({ id:idAdv(), nome, funcao, obraId, status, data:todayIsoAdv() });
        saveLinked();
      });
    }

    function renderChecklistRepasse(){
      renderSimpleRegisterModule('checklist_repasse', {
        key:'checklistRepasse',
        title:'Checklist de Repasse',
        subtitle:'Checklists vinculados por obra para vistoria final.',
        placeholder:'Ex.: Checklist apto 302',
        obraId:'crObra',
        tituloId:'crTitulo',
        statusId:'crStatus',
        dataId:'crData',
        obsId:'crObs',
        btnId:'btnCrSalvar'
      });
    }

    function renderSstDashboard(){
      const sec = document.getElementById('sst_dashboard');
      if(!sec) return;
      const ncAbertas = state.sstNCs.filter(x => x.status === 'aberta').length;
      const checkHoje = state.sstChecklists.filter(x => x.data === todayIsoAdv()).length;
      const ddsSemana = state.sstDDS.filter(x => String(x.data || '').slice(0,7) === todayIsoAdv().slice(0,7)).length;
      sec.innerHTML = sectionWrap(
        'SS&T - Saúde e Segurança do Trabalho',
        'Painel consolidado a partir dos módulos SST vinculados.',
        '',
        `
          <div class="adv-grid adv-grid-3">
            <div class="adv-stat"><span>Checklists hoje</span><strong>${checkHoje}</strong></div>
            <div class="adv-stat"><span>NCs abertas</span><strong>${ncAbertas}</strong></div>
            <div class="adv-stat"><span>DDS no mês</span><strong>${ddsSemana}</strong></div>
          </div>
          <div class="adv-grid adv-grid-4">
            <button class="adv-tile" data-linked-goto="sst_checklists">Novo Checklist</button>
            <button class="adv-tile" data-linked-goto="sst_nc">Registrar NC</button>
            <button class="adv-tile" data-linked-goto="sst_dds">Registrar DDS</button>
            <button class="adv-tile" data-linked-goto="sst_epis">Controle de EPIs</button>
            <button class="adv-tile" data-linked-goto="sst_treinamentos">Treinamentos NR</button>
            <button class="adv-tile" data-linked-goto="sst_pt">Permissão de Trabalho</button>
            <button class="adv-tile" data-linked-goto="sst_incidentes">Incidentes</button>
            <button class="adv-tile" data-linked-goto="sst_documentos">Documentos SST</button>
          </div>
        `
      );
    }

    function renderSstTreinamentos(){
      const sec = document.getElementById('sst_treinamentos');
      if(!sec) return;
      const today = todayIsoAdv();
      state.sstTreinamentos = state.sstTreinamentos.map(t => ({ ...t, status: t.validade && t.validade < today ? 'vencido' : 'valido' }));
      const vencidos = state.sstTreinamentos.filter(t => t.status === 'vencido').length;
      sec.innerHTML = sectionWrap(
        'Treinamentos NR',
        'Controle de validade e necessidade de reciclagem.',
        '',
        `
          <div class="adv-box">
            <div class="adv-grid adv-grid-4">
              <div><label>Obra</label><select id="sstTreObra">${obraOptions(false)}</select></div>
              <div><label>Título</label><input id="sstTreTitulo"></div>
              <div><label>Data</label><input id="sstTreData" type="date" value="${today}"></div>
              <div><label>Validade</label><input id="sstTreVal" type="date"></div>
              <div><label>Horas</label><input id="sstTreHoras" type="number"></div>
              <div><label>Participantes</label><input id="sstTrePart" type="number"></div>
            </div>
            <div class="actions"><button class="btn-primary" id="btnSstTreSalvar">Salvar treinamento</button></div>
          </div>
          ${vencidos ? `<div class="adv-alert">${vencidos} treinamento(s) vencido(s) — programe requalificação.</div>` : ''}
          <div class="adv-box">
            <div class="mini-list">
              ${state.sstTreinamentos.length ? state.sstTreinamentos.map(t => `<div class="mini-item"><div><strong>${esc(t.titulo)}</strong><div class="adv-muted">${esc(obraName(t.obraId))} • ${esc(dBr(t.data))} • válido até ${esc(dBr(t.validade))}</div></div><span class="adv-badge ${t.status === 'vencido' ? 'adv-danger':'adv-ok'}">${esc(t.status)}</span></div>`).join('') : '<div class="adv-empty-box">Sem treinamentos.</div>'}
            </div>
          </div>
        `
      );
      document.getElementById('btnSstTreSalvar')?.addEventListener('click', () => {
        const rec = {
          id:idAdv(),
          obraId: document.getElementById('sstTreObra')?.value || '',
          titulo: (document.getElementById('sstTreTitulo')?.value || '').trim(),
          data: document.getElementById('sstTreData')?.value || todayIsoAdv(),
          validade: document.getElementById('sstTreVal')?.value || '',
          horas: Number(document.getElementById('sstTreHoras')?.value || 0),
          participantes: Number(document.getElementById('sstTrePart')?.value || 0),
          status:'valido'
        };
        if(!rec.obraId || !rec.titulo || !rec.validade) return alert('Informe obra, título e validade.');
        state.sstTreinamentos.unshift(rec);
        saveLinked();
      });
    }

    function renderLinkedModules(){
      ensureArray('suprimentosPedidos');
      renderConcretagem();
      renderInteligencia();
      renderKanban('suprimentos_kanban','suprimentosPedidos',SUPR_STATUS,{solicitado:'Solicitado',comprando:'Comprando',comprado:'Comprado',entregue:'Entregue Obra'},'Kanban de Pedidos Mestre');
      renderSuprimentosIA();
      renderRelatoriosCompras();
      renderLocacoes();
      renderInventario();
      renderMedicaoContratos();
      renderMedicaoServicos();
      renderPrestadores();
      renderRelatoriosMedicoes();
      renderProjetosDocumentos('projetos_docs','arquivosProjetos','Projetos','Diretórios técnicos vinculados por obra.','Disciplina');
      renderProjetosDocumentos('documentos','arquivosDocumentos','Documentos','Categorias documentais vinculadas por obra.','Categoria');
      renderFuncionarios();
      renderKanban('kanban_admissao','admissaoCards',ADM_STATUS,{solicitada:'Solicitada',em_analise:'Em análise RH',aguardando_exame:'Aguardando exame',exame:'Exame'},'Kanban de Admissão');
      renderKanban('kanban_desligamento','desligamentoCards',DESL_STATUS,{solicitado:'Solicitado',em_analise:'Em análise RH',aviso_previo:'Aviso Prévio',acerto:'Acerto'},'Kanban de Desligamento');
      renderKanban('assistencia_tecnica','assistenciaChamados',POS_STATUS,{caixa_entrada:'Caixa de Entrada',analise_tecnica:'Análise Técnica',visita_agendada:'Visita Agendada',visita_realizada:'Visita Realizada'},'Pós-Obra / Assistência Técnica');
      renderChecklistRepasse();
      renderSstDashboard();
      renderSimpleRegisterModule('sst_checklists', { key:'sstChecklists', title:'Checklists NR', subtitle:'Registro e histórico de inspeções vinculadas.', placeholder:'Ex.: Espaço confinado NR33', obraId:'scObra', tituloId:'scTitulo', statusId:'scStatus', dataId:'scData', obsId:'scObs', btnId:'btnScSalvar' });
      renderSimpleRegisterModule('sst_nc', { key:'sstNCs', title:'Não Conformidades', subtitle:'Ciclo de vida das NCs por obra.', placeholder:'Ex.: Equipamento sem proteção', obraId:'snObra', tituloId:'snTitulo', statusId:'snStatus', dataId:'snData', obsId:'snObs', btnId:'btnSnSalvar' });
      renderSimpleRegisterModule('sst_dds', { key:'sstDDS', title:'DDS', subtitle:'Diálogo semanal com presença e tema.', placeholder:'Ex.: Produção x Segurança', obraId:'sdObra', tituloId:'sdTitulo', statusId:'sdStatus', dataId:'sdData', obsId:'sdObs', btnId:'btnSdSalvar' });
      renderSimpleRegisterModule('sst_epis', { key:'sstEPIs', title:'Controle de EPIs', subtitle:'Entrega de EPI vinculada por obra.', placeholder:'Ex.: Capacete e luvas', obraId:'seObra', tituloId:'seTitulo', statusId:'seStatus', dataId:'seData', obsId:'seObs', btnId:'btnSeSalvar' });
      renderSstTreinamentos();
      renderSimpleRegisterModule('sst_pt', { key:'sstPTs', title:'Permissão de Trabalho', subtitle:'PTs emitidas e status por obra.', placeholder:'Ex.: PT trabalho em altura', obraId:'spObra', tituloId:'spTitulo', statusId:'spStatus', dataId:'spData', obsId:'spObs', btnId:'btnSpSalvar' });
      renderSimpleRegisterModule('sst_incidentes', { key:'sstIncidentes', title:'Incidentes', subtitle:'Registro de incidentes e quase-acidentes.', placeholder:'Ex.: Quase queda em andaime', obraId:'siObra', tituloId:'siTitulo', statusId:'siStatus', dataId:'siData', obsId:'siObs', btnId:'btnSiSalvar' });
      renderProjetosDocumentos('sst_documentos','sstDocumentos','Documentos SST','Arquivos e categorias SST vinculados por obra.','Categoria SST');
    }

    function moveKanbanItem(key, id, dir){
      let order = SUPR_STATUS;
      if(key === 'admissaoCards') order = ADM_STATUS;
      if(key === 'desligamentoCards') order = DESL_STATUS;
      if(key === 'assistenciaChamados') order = POS_STATUS;
      const item = state[key].find(x => String(x.id) === String(id));
      if(!item) return;
      const idx = order.indexOf(item.status);
      if(idx < 0) return;
      const next = idx + Number(dir || 0);
      if(next < 0 || next >= order.length) return;
      item.status = order[next];
      saveLinked();
    }

    function bindGlobalLinkedEvents(){
      if(document.body.dataset.linkedBound === '1') return;
      document.body.dataset.linkedBound = '1';

      document.body.addEventListener('click', ev => {
        const del = ev.target.closest('[data-linked-del]');
        if(del){
          const key = del.getAttribute('data-linked-del');
          const id = del.getAttribute('data-linked-id');
          if(!key || !id || !Array.isArray(state[key])) return;
          if(!confirm('Deseja excluir este registro?')) return;
          state[key] = state[key].filter(x => String(x.id) !== String(id));
          saveLinked();
          return;
        }
        const move = ev.target.closest('[data-kanban-move]');
        if(move){
          moveKanbanItem(move.getAttribute('data-kanban-move'), move.getAttribute('data-id'), Number(move.getAttribute('data-dir') || 0));
          return;
        }
        const go = ev.target.closest('[data-linked-goto]');
        if(go){
          const sectionId = go.getAttribute('data-linked-goto');
          if(sectionId && typeof window.showSection === 'function') window.showSection(sectionId);
          return;
        }
      });
    }

    function watchNavigationAndRefresh(){
      if(window.__linkedMenuObserver__) return;
      const drawer = document.getElementById('drawer');
      if(!drawer) return;
      window.__linkedMenuObserver__ = true;
      drawer.addEventListener('click', ev => {
        const item = ev.target.closest('.menu-item[data-section]');
        if(!item) return;
        const section = item.getAttribute('data-section');
        if(!section) return;
        if([
          'concretagem','inteligencia','suprimentos_kanban','suprimentos_ia','relatorios_compras','gestao_locacoes','inventario',
          'medicao_contratos','medicao_servicos','prestadores_servico','relatorios_medicoes','projetos_docs','documentos',
          'painel_funcionarios','kanban_admissao','kanban_desligamento','assistencia_tecnica','checklist_repasse',
          'sst_dashboard','sst_checklists','sst_nc','sst_dds','sst_epis','sst_treinamentos','sst_pt','sst_incidentes','sst_documentos'
        ].includes(section)){
          setTimeout(renderLinkedModules, 120);
        }
      });
    }

    function initLinkedFeatures(){
      ensureLinkedState();
      bindGlobalLinkedEvents();
      watchNavigationAndRefresh();
      renderLinkedModules();
    }

    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', initLinkedFeatures);
    }else{
      initLinkedFeatures();
    }
  })();
