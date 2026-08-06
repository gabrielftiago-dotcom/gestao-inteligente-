  (function(){
    if(window.__RDO_MODULE_V1__) return;
    window.__RDO_MODULE_V1__ = true;

    const RDO_STORAGE_KEY = 'obraNovaRdoV1';
    let rdoList = [];
    let rdoEditId = null;
    let rdoImages = [];
    let rdoEquipeList = [];
    let rdoEmpreiteirosList = [];
    let rdoPraticabilidade = { manha: 'praticavel', tarde: 'praticavel' };

    function escapeHtml(value){
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function todayIso(){
      const now = new Date();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      return now.getFullYear() + '-' + m + '-' + d;
    }

    function dateBr(iso){
      if(!iso) return '-';
      const parts = String(iso).split('-');
      if(parts.length !== 3) return iso;
      return parts[2] + '/' + parts[1] + '/' + parts[0];
    }

    function uid(){
      if(window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
      return 'rdo-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
    }

    function safeParse(json){
      try{
        const parsed = JSON.parse(json);
        return Array.isArray(parsed) ? parsed : [];
      }catch(_){
        return [];
      }
    }

    function normalizeList(value){
      if(!Array.isArray(value)) return [];
      return value
        .map(item => {
          if(!item || typeof item !== 'object') return null;
          const nome = String(item.nome || '').trim();
          if(!nome) return null;
          return {
            id: item.id || uid(),
            nome,
            funcao: String(item.funcao || '').trim()
          };
        })
        .filter(Boolean);
    }

    function normalizeRdoItem(item){
      const climaLegacy = String(item?.clima || '').trim();
      return {
        id: item?.id || uid(),
        data: String(item?.data || '').trim(),
        obraId: String(item?.obraId || '').trim(),
        obra: String(item?.obra || '').trim(),
        fase: String(item?.fase || '').trim(),
        turnoManhaClima: String(item?.turnoManhaClima || climaLegacy || '').trim(),
        turnoManhaPraticabilidade: item?.turnoManhaPraticabilidade === 'impraticavel' ? 'impraticavel' : 'praticavel',
        turnoTardeClima: String(item?.turnoTardeClima || climaLegacy || '').trim(),
        turnoTardePraticabilidade: item?.turnoTardePraticabilidade === 'impraticavel' ? 'impraticavel' : 'praticavel',
        equipeList: normalizeList(item?.equipeList),
        empreiteirosList: normalizeList(item?.empreiteirosList),
        atividades: String(item?.atividades || '').trim(),
        ocorrencias: String(item?.ocorrencias || item?.observacoes || '').trim(),
        imagens: Array.isArray(item?.imagens) ? item.imagens : [],
        updatedAt: item?.updatedAt || new Date().toISOString()
      };
    }

    function loadRdoList(){
      rdoList = safeParse(localStorage.getItem(RDO_STORAGE_KEY)).map(normalizeRdoItem);
    }

    function saveRdoList(){
      localStorage.setItem(RDO_STORAGE_KEY, JSON.stringify(rdoList));
    }

    function ensureRdoStyles(){
      if(document.getElementById('rdoStylesV1')) return;
      const style = document.createElement('style');
      style.id = 'rdoStylesV1';
      style.textContent = `
        .rdo-wrap{max-width:900px;margin:0 auto}
        .rdo-header{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}
        .rdo-head-left{display:flex;align-items:center;gap:12px}
        .rdo-head-icon{width:46px;height:46px;border-radius:12px;display:grid;place-items:center;background:rgba(66,203,146,.12);border:1px solid rgba(66,203,146,.45);font-size:20px}
        .rdo-header h2{margin:0;font-size:34px;line-height:1.05}
        .rdo-sub{font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}
        .rdo-card{background:linear-gradient(180deg,rgba(26,34,49,.96),rgba(22,30,44,.96));border:1px solid rgba(55,198,136,.28);border-radius:18px;padding:16px;margin-bottom:14px}
        body.light .rdo-card{background:linear-gradient(180deg,#fff,#f8fbff);border-color:rgba(16,135,92,.28)}
        .rdo-card-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px}
        .rdo-title{margin:0 0 10px;text-transform:uppercase;letter-spacing:.05em;color:#56c996;font-size:13px;font-weight:800}
        .rdo-title.compact{margin:0}
        .rdo-field-label{display:block;margin-bottom:6px;font-size:12px;letter-spacing:.04em;color:#8ca2bc;text-transform:uppercase;font-weight:700}
        .rdo-note{font-size:12px;color:var(--muted)}
        .rdo-turnos{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin-top:8px}
        .rdo-turno{border:1px solid var(--line);border-radius:14px;background:var(--panel-2);padding:12px}
        .rdo-turno h4{margin:0 0 8px;color:#56c996;text-transform:uppercase;letter-spacing:.05em;font-size:12px}
        .rdo-pills{display:grid;grid-template-columns:1fr;gap:8px;margin-top:6px}
        .rdo-pill{border:1px solid var(--line);background:transparent;color:var(--text);border-radius:10px;padding:10px 12px;cursor:pointer;font-weight:700;text-align:left}
        .rdo-pill.active{border-color:#3ecf8e;background:rgba(62,207,142,.18);color:#6de2aa}
        .rdo-list{display:grid;gap:8px}
        .rdo-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 12px;border:1px solid rgba(55,198,136,.22);border-radius:12px;background:rgba(62,207,142,.07)}
        .rdo-row-main{display:flex;align-items:center;gap:10px;min-width:0}
        .rdo-row strong{display:block;line-height:1.1}
        .rdo-check{width:20px;height:20px;border-radius:999px;display:grid;place-items:center;background:rgba(62,207,142,.2);border:1px solid rgba(62,207,142,.55);font-size:12px;color:#6de2aa;flex:0 0 auto}
        .rdo-row-actions{display:flex;align-items:center;gap:8px}
        .rdo-role-badge{font-size:12px;font-weight:700;padding:6px 9px;border-radius:999px;border:1px solid rgba(66,203,146,.45);background:rgba(66,203,146,.14);color:#75e3b2;white-space:nowrap}
        .rdo-remove{width:30px;height:30px;border-radius:9px;border:1px solid rgba(245,87,108,.5);background:rgba(245,87,108,.08);color:#f48394;cursor:pointer;font-size:15px;line-height:1}
        .rdo-empty{color:var(--muted);text-align:center;padding:16px 8px}
        .rdo-actions-inline{display:flex;gap:8px;flex-wrap:wrap}
        .rdo-chip-btn{min-height:38px;border-radius:11px;border:1px solid rgba(66,203,146,.45);background:rgba(62,207,142,.14);color:#67dca5;padding:9px 12px;font-weight:700;cursor:pointer}
        .rdo-chip-btn:hover{filter:brightness(1.05)}
        .rdo-upload-btn{width:100%;border:1px dashed rgba(66,203,146,.55);border-radius:14px;padding:14px;background:rgba(66,203,146,.08);color:#6de2aa;font-size:18px;font-weight:700;cursor:pointer}
        .rdo-preview{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-top:10px}
        .rdo-thumb{border:1px solid var(--line);border-radius:12px;padding:8px;background:var(--panel-2)}
        .rdo-thumb img{width:100%;height:108px;object-fit:cover;border-radius:10px;border:1px solid var(--line)}
        .rdo-thumb small{display:block;margin-top:6px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .rdo-thumb .rdo-remove{margin-top:6px;width:100%}
        .rdo-submit{width:100%;min-height:58px;font-size:22px;font-weight:800}
        .rdo-actions-bottom{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
        .rdo-actions-bottom .btn-secondary{min-height:40px}
        @media (max-width:780px){
          .rdo-header{align-items:flex-start;flex-wrap:wrap}
          .rdo-header h2{font-size:30px}
          .rdo-head-left{width:100%}
          .rdo-turnos{grid-template-columns:1fr}
        }
      `;
      document.head.appendChild(style);
    }

    function ensureRdoMenu(){
      if(document.querySelector('.menu-item[data-section="rdo"]')) return;
      const ref = document.querySelector('.menu-item[data-section="sistema"]');
      const btn = document.createElement('button');
      btn.className = 'menu-item';
      btn.dataset.section = 'rdo';
      btn.textContent = '📋 RDO';
      if(ref && ref.parentElement){
        ref.parentElement.insertBefore(btn, ref);
      }else{
        const drawer = document.getElementById('drawer');
        drawer && drawer.appendChild(btn);
      }
      btn.addEventListener('click', () => {
        if(typeof showSection === 'function'){
          showSection('rdo');
        }else{
          document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
          const section = document.getElementById('rdo');
          if(section) section.classList.add('active');
          document.querySelectorAll('.menu-item').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const pageTitle = document.getElementById('pageTitle');
          if(pageTitle) pageTitle.textContent = 'RDO';
        }
        renderRdoObraOptions();
        updateRdoObraResumo();
      });
    }

    function ensureRdoSection(){
      if(document.getElementById('rdo')) return;
      const main = document.querySelector('main');
      if(!main) return;
      const section = document.createElement('section');
      section.id = 'rdo';
      section.className = 'section';
      section.innerHTML = `
        <div class="rdo-wrap">
          <div class="rdo-header">
            <div class="rdo-head-left">
              <div class="rdo-head-icon">📋</div>
              <div>
                <h2>Novo RDO</h2>
                <div class="rdo-sub" id="rdoObraResumo">Selecione a obra</div>
              </div>
            </div>
            <button class="rdo-chip-btn" type="button" id="btnRdoEquipeAtalho">⚙ Equipe</button>
          </div>

          <div class="rdo-card">
            <div class="rdo-title">🏗 OBRA *</div>
            <div class="form-grid">
              <div>
                <label class="rdo-field-label">Obra</label>
                <select id="rdoObra"><option value="">Selecione...</option></select>
              </div>
              <div>
                <label class="rdo-field-label">Ou informe manualmente</label>
                <input id="rdoObraLivre" placeholder="Nome da obra">
              </div>
            </div>
          </div>

          <div class="rdo-card">
            <div class="rdo-title">🧾 INFORMAÇÕES GERAIS</div>
            <div class="form-grid">
              <div>
                <label class="rdo-field-label">Data *</label>
                <input id="rdoData" type="date">
              </div>
            </div>
            <div class="rdo-turnos">
              <div class="rdo-turno">
                <h4>☀ Manhã</h4>
                <label class="rdo-field-label">Clima</label>
                <select id="rdoClimaManha">
                  <option value="">Selecione</option>
                  <option value="Ensolarado">Ensolarado</option>
                  <option value="Nublado">Nublado</option>
                  <option value="Chuva leve">Chuva leve</option>
                  <option value="Chuva forte">Chuva forte</option>
                  <option value="Vento forte">Vento forte</option>
                </select>
                <label class="rdo-field-label">Praticabilidade</label>
                <div class="rdo-pills" data-rdo-turno="manha">
                  <button class="rdo-pill" type="button" data-rdo-praticabilidade="praticavel">✅ Praticável</button>
                  <button class="rdo-pill" type="button" data-rdo-praticabilidade="impraticavel">⛔ Impraticável</button>
                </div>
              </div>
              <div class="rdo-turno">
                <h4>🌤 Tarde</h4>
                <label class="rdo-field-label">Clima</label>
                <select id="rdoClimaTarde">
                  <option value="">Selecione</option>
                  <option value="Ensolarado">Ensolarado</option>
                  <option value="Nublado">Nublado</option>
                  <option value="Chuva leve">Chuva leve</option>
                  <option value="Chuva forte">Chuva forte</option>
                  <option value="Vento forte">Vento forte</option>
                </select>
                <label class="rdo-field-label">Praticabilidade</label>
                <div class="rdo-pills" data-rdo-turno="tarde">
                  <button class="rdo-pill" type="button" data-rdo-praticabilidade="praticavel">✅ Praticável</button>
                  <button class="rdo-pill" type="button" data-rdo-praticabilidade="impraticavel">⛔ Impraticável</button>
                </div>
              </div>
            </div>
          </div>

          <div class="rdo-card">
            <div class="rdo-card-head">
              <div class="rdo-title compact">👥 EQUIPE PRESENTE — <span id="rdoEquipeCount">0 pessoas</span></div>
              <div class="rdo-actions-inline">
                <button class="rdo-chip-btn" type="button" id="btnAddEquipe">+ Ad-hoc</button>
              </div>
            </div>
            <div id="rdoEquipeLista" class="rdo-list"></div>
          </div>

          <div class="rdo-card">
            <div class="rdo-card-head">
              <div class="rdo-title compact">🧰 EMPREITEIROS</div>
              <div class="rdo-actions-inline">
                <button class="rdo-chip-btn" type="button" id="btnGerenciarEmpreiteiros">⚙ Gerenciar</button>
                <button class="rdo-chip-btn" type="button" id="btnAddEmpreiteiro">+ Ad-hoc</button>
              </div>
            </div>
            <div id="rdoEmpreiteirosLista" class="rdo-list"></div>
            <div class="actions" style="margin-top:10px;">
              <button class="btn-secondary" type="button" id="btnCadastroEmpreiteiro">→ Cadastrar empreiteiros</button>
            </div>
          </div>

          <div class="rdo-card">
            <div class="rdo-title">🗂 FASE(S) DA OBRA</div>
            <div class="form-grid">
              <div>
                <label class="rdo-field-label">Fase</label>
                <select id="rdoFase">
                  <option value="">— Adicionar fase —</option>
                  <option value="Mobilizacao">Mobilização</option>
                  <option value="Fundacao">Fundação</option>
                  <option value="Estrutura">Estrutura</option>
                  <option value="Alvenaria">Alvenaria</option>
                  <option value="Cobertura">Cobertura</option>
                  <option value="Instalacoes">Instalações</option>
                  <option value="Acabamento">Acabamento</option>
                  <option value="Entrega">Entrega</option>
                </select>
              </div>
            </div>
          </div>

          <div class="rdo-card">
            <div class="rdo-title">📝 ATIVIDADES E OCORRÊNCIAS</div>
            <div class="form-grid">
              <div style="grid-column:1 / -1;">
                <label class="rdo-field-label">Descrição das atividades</label>
                <textarea id="rdoAtividades" placeholder="Descreva as atividades realizadas..."></textarea>
              </div>
              <div style="grid-column:1 / -1;">
                <label class="rdo-field-label">Ocorrências / observações</label>
                <textarea id="rdoOcorrencias" placeholder="Alguma ocorrência relevante?"></textarea>
              </div>
            </div>
          </div>

          <div class="rdo-card">
            <div class="rdo-title">📷 FOTOS</div>
            <button class="rdo-upload-btn" type="button" id="btnRdoSelectFotos">📸 Adicionar fotos</button>
            <input id="rdoImagens" type="file" accept="image/*" multiple style="display:none;">
            <div class="rdo-note" style="margin-top:8px;">As imagens são comprimidas automaticamente para facilitar o PDF.</div>
            <div id="rdoImagePreview" class="rdo-preview"></div>
          </div>

          <button class="btn-primary rdo-submit" id="btnSalvarRdo" type="button">🧾 Salvar RDO</button>
          <div class="rdo-actions-bottom">
            <button class="btn-secondary" id="btnLimparRdo" type="button">Limpar</button>
            <button class="btn-secondary" id="btnGerarPdfRdo" type="button">Gerar PDF</button>
          </div>

          <div class="box" style="margin-top:16px;">
            <h3>RDOs salvos</h3>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr><th>Data</th><th>Obra</th><th>Fase</th><th>Clima M/T</th><th>Equipe</th><th>Fotos</th><th>Ações</th></tr>
                </thead>
                <tbody id="rdoTableBody"></tbody>
              </table>
            </div>
          </div>
        </div>
      `;
      main.appendChild(section);
    }

    function getObrasList(){
      if(typeof state !== 'undefined' && state && Array.isArray(state.obras)){
        return state.obras.map(o => ({ id: o.id, nome: o.nome || 'Obra sem nome' }));
      }
      const fallbackSelect = document.getElementById('movObra') || document.getElementById('finObra');
      if(!fallbackSelect) return [];
      return Array.from(fallbackSelect.options || [])
        .filter(opt => opt.value)
        .map(opt => ({ id: opt.value, nome: opt.textContent || opt.value }));
    }

    function currentObraName(){
      const select = document.getElementById('rdoObra');
      const livre = (document.getElementById('rdoObraLivre')?.value || '').trim();
      if(select && select.value){
        const text = select.options[select.selectedIndex]?.textContent || '';
        return text.trim() || livre;
      }
      return livre;
    }

    function updateRdoObraResumo(){
      const el = document.getElementById('rdoObraResumo');
      if(!el) return;
      const obraNome = currentObraName();
      el.textContent = obraNome || 'Selecione a obra';
    }

    function renderRdoObraOptions(){
      const select = document.getElementById('rdoObra');
      if(!select) return;
      const current = select.value;
      const obras = getObrasList();
      select.innerHTML = '<option value="">Selecione...</option>' + obras.map(o => `<option value="${escapeHtml(o.id)}">${escapeHtml(o.nome)}</option>`).join('');
      if(current && obras.some(o => o.id === current)) select.value = current;
      updateRdoObraResumo();
    }

    function renderPraticabilidade(){
      document.querySelectorAll('.rdo-pills').forEach(host => {
        const turno = host.getAttribute('data-rdo-turno');
        const selected = rdoPraticabilidade[turno] || 'praticavel';
        host.querySelectorAll('.rdo-pill').forEach(btn => {
          btn.classList.toggle('active', btn.getAttribute('data-rdo-praticabilidade') === selected);
        });
      });
    }

    function renderEquipe(){
      const host = document.getElementById('rdoEquipeLista');
      const count = document.getElementById('rdoEquipeCount');
      if(count) count.textContent = `${rdoEquipeList.length} pessoa${rdoEquipeList.length === 1 ? '' : 's'}`;
      if(!host) return;
      if(!rdoEquipeList.length){
        host.innerHTML = '<div class="rdo-empty">Nenhuma pessoa adicionada.</div>';
        return;
      }
      host.innerHTML = rdoEquipeList.map(p => `
        <div class="rdo-row">
          <div class="rdo-row-main">
            <span class="rdo-check">✔</span>
            <div>
              <strong>${escapeHtml(p.nome)}</strong>
              <span class="rdo-note">${escapeHtml(p.funcao || 'Função não informada')}</span>
            </div>
          </div>
          <div class="rdo-row-actions">
            <span class="rdo-role-badge">${escapeHtml(p.funcao || 'Ajudante')}</span>
            <button class="rdo-remove" type="button" data-rdo-remove-equipe="${p.id}" title="Remover">✕</button>
          </div>
        </div>
      `).join('');
    }

    function renderEmpreiteiros(){
      const host = document.getElementById('rdoEmpreiteirosLista');
      if(!host) return;
      if(!rdoEmpreiteirosList.length){
        host.innerHTML = '<div class="rdo-empty">Nenhum empreiteiro pré-cadastrado.</div>';
        return;
      }
      host.innerHTML = rdoEmpreiteirosList.map(p => `
        <div class="rdo-row">
          <div class="rdo-row-main">
            <span class="rdo-check">✔</span>
            <div>
              <strong>${escapeHtml(p.nome)}</strong>
              <span class="rdo-note">${escapeHtml(p.funcao || 'Empreiteiro')}</span>
            </div>
          </div>
          <div class="rdo-row-actions">
            <span class="rdo-role-badge">${escapeHtml(p.funcao || 'Empreiteiro')}</span>
            <button class="rdo-remove" type="button" data-rdo-remove-empreiteiro="${p.id}" title="Remover">✕</button>
          </div>
        </div>
      `).join('');
    }

    function renderRdoImagePreview(){
      const host = document.getElementById('rdoImagePreview');
      if(!host) return;
      if(!rdoImages.length){
        host.innerHTML = '<div class="rdo-empty">Nenhuma imagem anexada.</div>';
        return;
      }
      host.innerHTML = rdoImages.map((img, idx) => `
        <div class="rdo-thumb">
          <img src="${img.dataUrl}" alt="Imagem ${idx + 1}">
          <small>${escapeHtml(img.name || ('Imagem ' + (idx + 1)))}</small>
          <button class="rdo-remove" type="button" data-rdo-remove-img="${idx}" title="Remover">Remover</button>
        </div>
      `).join('');
    }

    function resetRdoForm(){
      rdoEditId = null;
      rdoImages = [];
      rdoEquipeList = [];
      rdoEmpreiteirosList = [];
      rdoPraticabilidade = { manha: 'praticavel', tarde: 'praticavel' };
      const ids = ['rdoData','rdoObra','rdoObraLivre','rdoClimaManha','rdoClimaTarde','rdoFase','rdoAtividades','rdoOcorrencias','rdoImagens'];
      ids.forEach(id => {
        const el = document.getElementById(id);
        if(!el) return;
        el.value = '';
      });
      const dateInput = document.getElementById('rdoData');
      if(dateInput) dateInput.value = todayIso();
      renderPraticabilidade();
      renderEquipe();
      renderEmpreiteiros();
      renderRdoImagePreview();
      updateRdoObraResumo();
    }

    async function compressImage(file){
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const maxW = 1400;
            const maxH = 1400;
            let w = img.width || 1;
            let h = img.height || 1;
            const scale = Math.min(1, maxW / w, maxH / h);
            w = Math.max(1, Math.round(w * scale));
            h = Math.max(1, Math.round(h * scale));
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            resolve({
              name: file.name,
              dataUrl: canvas.toDataURL('image/jpeg', 0.82)
            });
          };
          img.onerror = () => reject(new Error('Erro ao processar imagem'));
          img.src = reader.result;
        };
        reader.onerror = () => reject(new Error('Erro ao ler imagem'));
        reader.readAsDataURL(file);
      });
    }

    async function onSelectImages(ev){
      const files = Array.from(ev.target.files || []);
      if(!files.length) return;
      let added = 0;
      for(const file of files){
        if(!file.type || !file.type.startsWith('image/')) continue;
        if(rdoImages.length >= 12) break;
        try{
          const image = await compressImage(file);
          rdoImages.push(image);
          added += 1;
        }catch(_){ }
      }
      ev.target.value = '';
      renderRdoImagePreview();
      if(!added) alert('Nenhuma imagem válida foi adicionada.');
      if(rdoImages.length >= 12) alert('Limite de 12 imagens atingido para este RDO.');
    }

    function askPessoa(titulo){
      const nome = (prompt(`Nome (${titulo})`) || '').trim();
      if(!nome) return null;
      const funcao = (prompt(`Função (${titulo})`) || '').trim();
      return { id: uid(), nome, funcao };
    }

    function formatListaPessoas(list){
      if(!Array.isArray(list) || !list.length) return '-';
      return list.map((p, i) => `${i + 1}. ${p.nome}${p.funcao ? ` (${p.funcao})` : ''}`).join('\\n');
    }

    function getRdoFromForm(){
      const obraSelect = document.getElementById('rdoObra');
      const obraId = obraSelect ? obraSelect.value : '';
      const obra = currentObraName();
      return {
        id: rdoEditId || uid(),
        data: (document.getElementById('rdoData')?.value || '').trim(),
        obraId,
        obra,
        fase: (document.getElementById('rdoFase')?.value || '').trim(),
        turnoManhaClima: (document.getElementById('rdoClimaManha')?.value || '').trim(),
        turnoManhaPraticabilidade: rdoPraticabilidade.manha || 'praticavel',
        turnoTardeClima: (document.getElementById('rdoClimaTarde')?.value || '').trim(),
        turnoTardePraticabilidade: rdoPraticabilidade.tarde || 'praticavel',
        equipeList: rdoEquipeList.slice(),
        empreiteirosList: rdoEmpreiteirosList.slice(),
        atividades: (document.getElementById('rdoAtividades')?.value || '').trim(),
        ocorrencias: (document.getElementById('rdoOcorrencias')?.value || '').trim(),
        imagens: rdoImages.slice(),
        updatedAt: new Date().toISOString()
      };
    }

    function validateRdo(rdo){
      if(!rdo.data) return 'Informe a data do RDO.';
      if(!rdo.obra) return 'Informe a obra (selecionada ou texto livre).';
      if(!rdo.turnoManhaClima && !rdo.turnoTardeClima) return 'Informe o clima de pelo menos um turno (manhã ou tarde).';
      if(!rdo.atividades) return 'Informe as atividades executadas.';
      return '';
    }

    function saveCurrentRdo(){
      const rdo = getRdoFromForm();
      const error = validateRdo(rdo);
      if(error) return alert(error);
      const idx = rdoList.findIndex(x => x.id === rdo.id);
      if(idx >= 0) rdoList[idx] = rdo;
      else rdoList.unshift(rdo);
      saveRdoList();
      renderRdoTable();
      resetRdoForm();
      alert('RDO salvo com sucesso.');
    }

    function loadRdoIntoForm(id){
      const item = rdoList.find(x => x.id === id);
      if(!item) return;
      rdoEditId = item.id;
      document.getElementById('rdoData').value = item.data || todayIso();
      document.getElementById('rdoObra').value = item.obraId || '';
      document.getElementById('rdoObraLivre').value = item.obraId ? '' : (item.obra || '');
      document.getElementById('rdoFase').value = item.fase || '';
      document.getElementById('rdoClimaManha').value = item.turnoManhaClima || '';
      document.getElementById('rdoClimaTarde').value = item.turnoTardeClima || '';
      document.getElementById('rdoAtividades').value = item.atividades || '';
      document.getElementById('rdoOcorrencias').value = item.ocorrencias || '';
      rdoPraticabilidade = {
        manha: item.turnoManhaPraticabilidade === 'impraticavel' ? 'impraticavel' : 'praticavel',
        tarde: item.turnoTardePraticabilidade === 'impraticavel' ? 'impraticavel' : 'praticavel'
      };
      rdoEquipeList = normalizeList(item.equipeList);
      rdoEmpreiteirosList = normalizeList(item.empreiteirosList);
      rdoImages = Array.isArray(item.imagens) ? item.imagens.slice() : [];
      renderPraticabilidade();
      renderEquipe();
      renderEmpreiteiros();
      renderRdoImagePreview();
      updateRdoObraResumo();
      if(typeof showSection === 'function') showSection('rdo');
    }

    function removeRdo(id){
      if(!confirm('Deseja excluir este RDO?')) return;
      rdoList = rdoList.filter(x => x.id !== id);
      saveRdoList();
      renderRdoTable();
    }

    function clearFilename(value){
      return String(value || '')
        .normalize('NFD')
        .replace(/[\\u0300-\\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
    }

    function addPdfField(doc, label, value, ctx){
      const pageH = doc.internal.pageSize.getHeight();
      const maxW = doc.internal.pageSize.getWidth() - (ctx.margin * 2);
      const safeValue = (value && String(value).trim()) ? String(value).trim() : '-';
      const labelLines = doc.splitTextToSize(label + ':', maxW);
      const valueLines = doc.splitTextToSize(safeValue, maxW);
      const blockHeight = (labelLines.length * 4.8) + (valueLines.length * 4.5) + 3;
      if(ctx.y + blockHeight > pageH - ctx.margin){
        doc.addPage();
        ctx.y = ctx.margin;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(labelLines, ctx.margin, ctx.y);
      ctx.y += labelLines.length * 4.8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(valueLines, ctx.margin, ctx.y);
      ctx.y += (valueLines.length * 4.5) + 3;
    }

    function addPdfImage(doc, imgDataUrl, ctx){
      const pageH = doc.internal.pageSize.getHeight();
      const pageW = doc.internal.pageSize.getWidth();
      const maxW = pageW - (ctx.margin * 2);
      const format = imgDataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      const props = doc.getImageProperties(imgDataUrl);
      const ratio = (props.width || 1) / (props.height || 1);
      let w = maxW;
      let h = w / ratio;
      if(h > 120){
        h = 120;
        w = h * ratio;
      }
      if(ctx.y + h > pageH - ctx.margin){
        doc.addPage();
        ctx.y = ctx.margin;
      }
      doc.addImage(imgDataUrl, format, ctx.margin, ctx.y, w, h, undefined, 'FAST');
      ctx.y += h + 4;
    }

    function generateRdoPdf(rdo){
      if(!window.jspdf || !window.jspdf.jsPDF){
        alert('Biblioteca de PDF não carregada. Recarregue a página e tente novamente.');
        return;
      }
      const jsPDF = window.jspdf.jsPDF;
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const ctx = { margin: 12, y: 14 };

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('RDO - Relatório Diário de Obras', ctx.margin, ctx.y);
      ctx.y += 8;

      addPdfField(doc, 'Data', dateBr(rdo.data), ctx);
      addPdfField(doc, 'Obra', rdo.obra, ctx);
      addPdfField(doc, 'Fase da obra', rdo.fase, ctx);
      addPdfField(doc, 'Clima (manhã)', rdo.turnoManhaClima, ctx);
      addPdfField(doc, 'Praticabilidade (manhã)', rdo.turnoManhaPraticabilidade, ctx);
      addPdfField(doc, 'Clima (tarde)', rdo.turnoTardeClima, ctx);
      addPdfField(doc, 'Praticabilidade (tarde)', rdo.turnoTardePraticabilidade, ctx);
      addPdfField(doc, 'Equipe presente', formatListaPessoas(rdo.equipeList), ctx);
      addPdfField(doc, 'Empreiteiros', formatListaPessoas(rdo.empreiteirosList), ctx);
      addPdfField(doc, 'Atividades executadas', rdo.atividades, ctx);
      addPdfField(doc, 'Ocorrências / observações', rdo.ocorrencias, ctx);

      const images = Array.isArray(rdo.imagens) ? rdo.imagens : [];
      if(images.length){
        const pageH = doc.internal.pageSize.getHeight();
        if(ctx.y + 20 > pageH - ctx.margin){
          doc.addPage();
          ctx.y = ctx.margin;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Imagens anexadas', ctx.margin, ctx.y);
        ctx.y += 6;
        images.forEach(img => {
          if(img && img.dataUrl) addPdfImage(doc, img.dataUrl, ctx);
        });
      }

      const obraSafe = clearFilename(rdo.obra || 'obra');
      const dataSafe = clearFilename(rdo.data || todayIso());
      doc.save('RDO_' + dataSafe + '_' + obraSafe + '.pdf');
    }

    function renderRdoTable(){
      const tbody = document.getElementById('rdoTableBody');
      if(!tbody) return;
      if(!rdoList.length){
        tbody.innerHTML = '<tr><td colspan="7" class="empty">Nenhum RDO cadastrado.</td></tr>';
        return;
      }
      tbody.innerHTML = rdoList.map(item => `
        <tr>
          <td>${escapeHtml(dateBr(item.data))}</td>
          <td><strong>${escapeHtml(item.obra || '-')}</strong></td>
          <td>${escapeHtml(item.fase || '-')}</td>
          <td>${escapeHtml((item.turnoManhaClima || '-') + ' / ' + (item.turnoTardeClima || '-'))}</td>
          <td>${Array.isArray(item.equipeList) ? item.equipeList.length : 0}</td>
          <td>${Array.isArray(item.imagens) ? item.imagens.length : 0}</td>
          <td>
            <button class="btn-secondary" type="button" data-rdo-action="load" data-rdo-id="${item.id}">Editar</button>
            <button class="btn-secondary" type="button" data-rdo-action="pdf" data-rdo-id="${item.id}">PDF</button>
            <button class="btn-danger" type="button" data-rdo-action="delete" data-rdo-id="${item.id}">Excluir</button>
          </td>
        </tr>
      `).join('');
    }

    function bindRdoEvents(){
      document.getElementById('btnSalvarRdo')?.addEventListener('click', saveCurrentRdo);
      document.getElementById('btnLimparRdo')?.addEventListener('click', resetRdoForm);
      document.getElementById('btnGerarPdfRdo')?.addEventListener('click', () => {
        const payload = getRdoFromForm();
        const error = validateRdo(payload);
        if(error) return alert(error);
        generateRdoPdf(payload);
      });

      document.getElementById('btnRdoSelectFotos')?.addEventListener('click', () => document.getElementById('rdoImagens')?.click());
      document.getElementById('rdoImagens')?.addEventListener('change', onSelectImages);
      document.getElementById('rdoObra')?.addEventListener('change', updateRdoObraResumo);
      document.getElementById('rdoObraLivre')?.addEventListener('input', updateRdoObraResumo);

      document.getElementById('btnAddEquipe')?.addEventListener('click', () => {
        const pessoa = askPessoa('Equipe');
        if(!pessoa) return;
        rdoEquipeList.push(pessoa);
        renderEquipe();
      });
      document.getElementById('btnRdoEquipeAtalho')?.addEventListener('click', () => {
        const pessoa = askPessoa('Equipe');
        if(!pessoa) return;
        rdoEquipeList.push(pessoa);
        renderEquipe();
      });

      const addEmpreiteiro = () => {
        const pessoa = askPessoa('Empreiteiro');
        if(!pessoa) return;
        rdoEmpreiteirosList.push(pessoa);
        renderEmpreiteiros();
      };
      document.getElementById('btnAddEmpreiteiro')?.addEventListener('click', addEmpreiteiro);
      document.getElementById('btnCadastroEmpreiteiro')?.addEventListener('click', addEmpreiteiro);
      document.getElementById('btnGerenciarEmpreiteiros')?.addEventListener('click', () => alert('Use o botão + Ad-hoc para cadastrar empreiteiros rapidamente.'));

      document.getElementById('rdo')?.addEventListener('click', ev => {
        const pill = ev.target.closest('[data-rdo-praticabilidade]');
        if(!pill) return;
        const host = pill.closest('.rdo-pills');
        const turno = host?.getAttribute('data-rdo-turno');
        const value = pill.getAttribute('data-rdo-praticabilidade');
        if(!turno || !value) return;
        rdoPraticabilidade[turno] = value === 'impraticavel' ? 'impraticavel' : 'praticavel';
        renderPraticabilidade();
      });

      document.getElementById('rdoImagePreview')?.addEventListener('click', ev => {
        const btn = ev.target.closest('[data-rdo-remove-img]');
        if(!btn) return;
        const index = Number(btn.getAttribute('data-rdo-remove-img'));
        if(Number.isNaN(index)) return;
        rdoImages.splice(index, 1);
        renderRdoImagePreview();
      });

      document.getElementById('rdoEquipeLista')?.addEventListener('click', ev => {
        const btn = ev.target.closest('[data-rdo-remove-equipe]');
        if(!btn) return;
        const id = btn.getAttribute('data-rdo-remove-equipe');
        if(!id) return;
        rdoEquipeList = rdoEquipeList.filter(x => x.id !== id);
        renderEquipe();
      });

      document.getElementById('rdoEmpreiteirosLista')?.addEventListener('click', ev => {
        const btn = ev.target.closest('[data-rdo-remove-empreiteiro]');
        if(!btn) return;
        const id = btn.getAttribute('data-rdo-remove-empreiteiro');
        if(!id) return;
        rdoEmpreiteirosList = rdoEmpreiteirosList.filter(x => x.id !== id);
        renderEmpreiteiros();
      });

      document.getElementById('rdoTableBody')?.addEventListener('click', ev => {
        const btn = ev.target.closest('[data-rdo-action]');
        if(!btn) return;
        const action = btn.getAttribute('data-rdo-action');
        const id = btn.getAttribute('data-rdo-id');
        if(!id) return;
        if(action === 'load') return loadRdoIntoForm(id);
        if(action === 'pdf'){
          const item = rdoList.find(x => x.id === id);
          if(item) generateRdoPdf(item);
          return;
        }
        if(action === 'delete') removeRdo(id);
      });
    }

    function initRdo(){
      ensureRdoStyles();
      ensureRdoMenu();
      ensureRdoSection();
      loadRdoList();
      bindRdoEvents();
      renderRdoObraOptions();
      renderRdoTable();
      resetRdoForm();
    }

    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', initRdo);
    }else{
      initRdo();
    }
  })();
