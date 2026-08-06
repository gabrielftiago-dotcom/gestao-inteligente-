    const STORAGE_KEY = 'obra_nova_v68_real';
    const SECTION_KEY = 'obra_nova_v68_section';
    const THEME_KEY = 'obra_nova_v68_theme';

    const state = {
      clientes: [], obras: [], composicoes: [], produtos: [], movimentacoes: [], orcamentos: [], bdis: [], financeiros: [], favoritos: [], historicoComp: [], orcamentoSelecionadoId: '',
      brand: { nome:'Obra Nova', subtitulo:'Sistema de gestão de obras', cor:'#0f2e5e', corSecundaria:'#1f4f95', logo:'' }
    };
    const editing = { clienteId:null, obraId:null, composicaoId:null, produtoId:null, movId:null, orcId:null, financeiroId:null };
    let filtroTipoBase = '';

    function uid(){ return Math.random().toString(36).slice(2,10) + Date.now().toString(36); }
    function num(v){ return Number(v || 0); }
    function money(v){ return Number(v || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
    function qty(v){ return Number(v || 0).toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:2}); }
    function pct(v){ return `${Number(v || 0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}%`; }
    function dateBR(v){ if(!v) return '-'; const [y,m,d]=v.split('-'); return `${d}/${m}/${y}`; }
    function todayISO(){ return new Date().toISOString().slice(0,10); }
    function escapeHtml(s){ return String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
    function normalizeText(s){
      return String(s || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
    }
    const MOJIBAKE_REGEX = /[ÃÂâ][\u0080-\u00BF]/;
    function hasMojibake(text){
      return typeof text === 'string' && MOJIBAKE_REGEX.test(text);
    }
    function decodeMojibakeText(text){
      if(!hasMojibake(text)) return text;
      try{
        const bytes = new Uint8Array(text.length);
        for(let i=0;i<text.length;i++) bytes[i] = text.charCodeAt(i) & 0xFF;
        return new TextDecoder('utf-8').decode(bytes);
      }catch(e){
        return text;
      }
    }
    function deepFixMojibake(value){
      if(Array.isArray(value)) return value.map(deepFixMojibake);
      if(value && typeof value === 'object'){
        const out = {};
        Object.keys(value).forEach(k => { out[k] = deepFixMojibake(value[k]); });
        return out;
      }
      return typeof value === 'string' ? decodeMojibakeText(value) : value;
    }
    function hasMojibakeInComposicoes(list){
      if(!Array.isArray(list) || !list.length) return false;
      const sampleSize = Math.min(list.length, 400);
      for(let i=0;i<sampleSize;i++){
        const c = list[i] || {};
        const probe = `${c.codigo || ''} ${c.referencia || ''} ${c.descricao || ''} ${c.categoria || ''} ${c.tipo || ''}`;
        if(hasMojibake(probe)) return true;
      }
      return false;
    }
    function hasLegacyComposicaoCatalog(list){
      if(!Array.isArray(list) || !list.length) return false;
      const sampleSize = Math.min(list.length, 300);
      let sinCount = 0;
      let sintCount = 0;
      for(let i=0;i<sampleSize;i++){
        const id = String((list[i] && list[i].id) || '');
        if(/^SIN_\d+$/.test(id)) sinCount++;
        if(/^SINT_\d+$/.test(id)) sintCount++;
      }
      return sinCount > sintCount;
    }
    function isCatalogComposicaoId(id){
      return /^(SINT|SIN)_\d+$/.test(String(id || ''));
    }
    function mergeCustomComposicoes(baseList, customList){
      const merged = Array.isArray(baseList) ? baseList.slice() : [];
      if(!Array.isArray(customList) || !customList.length) return merged;
      const knownIds = new Set(merged.map(c => String((c && c.id) || '')));
      customList.forEach(item => {
        const key = String((item && item.id) || '');
        if(key && !knownIds.has(key)){
          merged.unshift(item);
          knownIds.add(key);
        }
      });
      return merged;
    }
    function stateForStorage(){
      const customComposicoes = Array.isArray(state.composicoes)
        ? state.composicoes.filter(c => c && !isCatalogComposicaoId(c.id))
        : [];
      const snapshot = { ...state };
      snapshot.composicoes = customComposicoes;
      return snapshot;
    }

    function seedState(){
      const cliente1 = uid(), cliente2 = uid();
      state.clientes = [
        { id: cliente1, nome: 'Saga Construtora', documento: '', telefone: '', email: '' },
        { id: cliente2, nome: 'Cliente Exemplo', documento: '', telefone: '', email: '' }
      ];
      state.obras = [
        { id: uid(), nome: 'Brisa Residencial', status: 'ativa', codigo: 'SPE:089', clienteId: cliente2, tipo: 'Residencial', area: 164 },
        { id: uid(), nome: 'Easy Residence', status: 'orçamento', codigo: 'SPE:085', clienteId: cliente1, tipo: 'Residencial', area: 1800 }
      ];
      state.composicoes = (window.BASE_REFERENCIAS_V68 || []).slice();
      state.produtos = [
        { id: uid(), nome: 'Cimento CP II', unidade: 'saco', codigo: 'MAT-001', minimo: 50, custo: 39.9 },
        { id: uid(), nome: 'Aço CA-50 10mm', unidade: 'barra', codigo: 'MAT-002', minimo: 20, custo: 85 }
      ];
      state.movimentacoes = []; state.orcamentos = []; state.bdis = []; state.financeiros = []; state.favoritos = []; state.historicoComp = [];
      saveState();
    }

    function loadState(){
      const raw = localStorage.getItem(STORAGE_KEY);
      if(raw){
        try {
          const parsed = deepFixMojibake(JSON.parse(raw));
          Object.assign(state, parsed);
        } catch(e) {
          seedState();
          return;
        }
      } else {
        seedState();
        return;
      }
      // Guarantee full base is present even if old cache exists
      const base = window.BASE_REFERENCIAS_V68 || [];
      const storedCustom = Array.isArray(state.composicoes)
        ? state.composicoes.filter(c => c && !isCatalogComposicaoId(c.id))
        : [];
      let shouldPersist = /[ÃÂâ][\u0080-\u00BF]/.test(raw);
      const hasCatalogEntries = Array.isArray(state.composicoes) && state.composicoes.some(c => c && isCatalogComposicaoId(c.id));
      const shouldResetComposicoes =
        !Array.isArray(state.composicoes) ||
        (hasCatalogEntries && state.composicoes.length < Math.max(1000, base.length * 0.9)) ||
        hasMojibakeInComposicoes(state.composicoes) ||
        hasLegacyComposicaoCatalog(state.composicoes);
      if(shouldResetComposicoes) shouldPersist = true;
      state.composicoes = mergeCustomComposicoes(base, storedCustom);
      if(shouldPersist) saveState();
    }

    function saveState(){
      try{
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateForStorage()));
      }catch(e){
        console.error('Falha ao salvar dados locais.', e);
      }
    }
    function clearLocalCache(){
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SECTION_KEY);
      localStorage.removeItem(THEME_KEY);
      alert('Cache local limpo. Feche e abra o arquivo novamente.');
    }

    function getCliente(id){ return state.clientes.find(c => c.id === id); }
    function getObra(id){ return state.obras.find(o => o.id === id); }
    function getComposicao(id){ return state.composicoes.find(c => c.id === id); }
    function getProduto(id){ return state.produtos.find(p => p.id === id); }
    function getBDI(obraId){ return state.bdis.find(b => b.obraId === obraId); }
    function orcamentosObra(obraId){ return state.orcamentos.filter(o => o.obraId === obraId); }
    function custoDiretoObra(obraId){ return orcamentosObra(obraId).reduce((a,b)=>a + num(b.total),0); }
    function percBDI(obraId){ const b = getBDI(obraId); return b ? num(b.admCentral)+num(b.admLocal)+num(b.lucro) : 0; }
    function precoVendaObra(obraId){ return custoDiretoObra(obraId) * (1 + percBDI(obraId)/100); }
    function saldoProduto(produtoId, obraId=''){ return state.movimentacoes.filter(m=>m.produtoId===produtoId && (!obraId || m.obraId===obraId)).reduce((acc,m)=> acc + (m.tipo==='entrada' ? num(m.quantidade) : -num(m.quantidade)),0); }
    function resumoEstoque(obraId=''){ return state.produtos.map(produto => { const rel = state.movimentacoes.filter(m => m.produtoId === produto.id && (!obraId || m.obraId === obraId)); const entradas = rel.filter(m => m.tipo === 'entrada'); const saidas = rel.filter(m => m.tipo === 'saida'); const qtdEntrada = entradas.reduce((a,b)=>a + num(b.quantidade),0); const qtdSaida = saidas.reduce((a,b)=>a + num(b.quantidade),0); const saldo = qtdEntrada - qtdSaida; const custoMedio = qtdEntrada > 0 ? entradas.reduce((a,b)=>a + (num(b.valor) * num(b.quantidade)),0)/qtdEntrada : num(produto.custo); return { ...produto, qtdEntrada, qtdSaida, saldo, custoMedio, custoTotal: saldo * custoMedio }; }); }

    function restoreTheme(){ if(localStorage.getItem(THEME_KEY)==='light') document.body.classList.add('light'); }
    function toggleTheme(){ document.body.classList.toggle('light'); localStorage.setItem(THEME_KEY, document.body.classList.contains('light') ? 'light' : 'dark'); }

    function toggleMenu(){ document.getElementById('drawer').classList.toggle('open'); document.getElementById('overlay').classList.toggle('show'); }
    function closeMenu(){ document.getElementById('drawer').classList.remove('open'); document.getElementById('overlay').classList.remove('show'); }

    function showSection(id){
      const targetSection = document.getElementById(id) || document.getElementById('dashboard');
      if(!targetSection) return;
      id = targetSection.id;
      document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
      targetSection.classList.add('active');
      document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
      document.querySelector(`.menu-item[data-section="${id}"]`)?.classList.add('active');
      const nomes = {
        dashboard:'Dashboard',
        cadastro:'Cadastro',
        orcamentos:'Orçamentos',
        almoxarife:'Almoxarife',
        financeiro:'Financeiro',
        rdo:'RDO',
        concretagem:'Concretagem',
        inteligencia:'Inteligência Executiva',
        suprimentos_kanban:'Painel Kanban',
        suprimentos_ia:'Nova Solicitação IA',
        relatorios_compras:'Relatórios de Compras',
        gestao_locacoes:'Gestão de Locações',
        inventario:'Inventário',
        medicao_contratos:'Medição de Contratos',
        medicao_servicos:'Medição de Serviços',
        prestadores_servico:'Prestadores de Serviço',
        relatorios_medicoes:'Relatórios de Medições',
        projetos_docs:'Projetos',
        documentos:'Documentos',
        painel_funcionarios:'Painel de Funcionários',
        kanban_admissao:'Kanban de Admissão',
        kanban_desligamento:'Kanban de Desligamento',
        assistencia_tecnica:'Assistência Técnica',
        checklist_repasse:'Checklist de Repasse',
        sst_dashboard:'Dashboard SST',
        sst_checklists:'Checklists NR',
        sst_nc:'Não Conformidades',
        sst_dds:'DDS',
        sst_epis:'Controle de EPIs',
        sst_treinamentos:'Treinamentos NR',
        sst_pt:'Permissão de Trabalho',
        sst_incidentes:'Incidentes',
        sst_documentos:'Documentos SST',
        sistema:'Sistema'
      };
      document.getElementById('pageTitle').textContent = nomes[id] || 'Obra Nova';
      localStorage.setItem(SECTION_KEY, id);
      closeMenu();
    }
    function restoreSection(){ showSection(localStorage.getItem(SECTION_KEY) || 'dashboard'); }
    function setSubtab(parent, sub){ document.querySelectorAll(`.subtab[data-parent="${parent}"]`).forEach(b => b.classList.remove('active')); document.querySelectorAll(`#${parent} .subpanel`).forEach(p => p.classList.remove('active')); document.querySelector(`.subtab[data-parent="${parent}"][data-sub="${sub}"]`)?.classList.add('active'); document.getElementById(sub)?.classList.add('active'); }

    function applyBrand(){
      document.documentElement.style.setProperty('--primary', state.brand.cor || '#0f2e5e');
      document.documentElement.style.setProperty('--primary-2', state.brand.corSecundaria || '#1f4f95');
      document.title = `${state.brand.nome} V6.8`;
      document.getElementById('logoBox').textContent = state.brand.nome || 'Obra Nova';
      document.getElementById('avatarBrand').textContent = (state.brand.nome || 'ON').slice(0,2).toUpperCase();
      document.getElementById('empresaNome').value = state.brand.nome || 'Obra Nova';
      document.getElementById('empresaSubtitulo').value = state.brand.subtitulo || 'Sistema de gestão de obras';
      document.getElementById('empresaCor').value = state.brand.cor || '#0f2e5e';
      document.getElementById('empresaCorSecundaria').value = state.brand.corSecundaria || '#1f4f95';
      const logoMenu = document.getElementById('brandLogoMenu'), badge = document.getElementById('brandBadge');
      if(state.brand.logo){ logoMenu.src = state.brand.logo; logoMenu.style.display='block'; badge.style.display='none'; }
      else { logoMenu.style.display='none'; badge.style.display='flex'; }
    }
    function saveBrand(){
      state.brand.nome = document.getElementById('empresaNome').value.trim() || 'Obra Nova';
      state.brand.subtitulo = document.getElementById('empresaSubtitulo').value.trim() || 'Sistema de gestão de obras';
      state.brand.cor = document.getElementById('empresaCor').value || '#0f2e5e';
      state.brand.corSecundaria = document.getElementById('empresaCorSecundaria').value || '#1f4f95';
      const file = document.getElementById('empresaLogo').files[0];
      if(file){
        const reader = new FileReader();
        reader.onload = e => { state.brand.logo = e.target.result; saveState(); applyBrand(); alert('Identidade visual salva.'); };
        reader.readAsDataURL(file);
      } else { saveState(); applyBrand(); alert('Identidade visual salva.'); }
    }
    function restoreBrandDefault(){ state.brand = { nome:'Obra Nova', subtitulo:'Sistema de gestão de obras', cor:'#0f2e5e', corSecundaria:'#1f4f95', logo:'' }; saveState(); applyBrand(); alert('Identidade restaurada.'); }
    function exportBackup(){ const blob = new Blob([JSON.stringify(state, null, 2)], {type:'application/json'}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download='obra_nova_v68_backup.json'; a.click(); URL.revokeObjectURL(a.href); }
    function importBackup(file){ const reader = new FileReader(); reader.onload = e => { try{ Object.assign(state, JSON.parse(e.target.result)); saveState(); renderAll(); alert('Backup importado com sucesso.'); }catch(err){ alert('Arquivo de backup inválido.'); } }; reader.readAsText(file); }

    function renderSelects(){
      const clientesOptions = '<option value="">Sem vínculo</option>' + state.clientes.map(c => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join('');
      document.getElementById('obraCliente').innerHTML = clientesOptions;
      const obras = state.obras.map(o => `<option value="${o.id}">${escapeHtml(o.nome)}</option>`).join('');
      const obrasComVazio = '<option value="">Selecione</option>' + obras;
      ['orcObra','bdiObra','propObra','movObra','transfOrigem','transfDestino','filtroObraEstoque','finObra'].forEach(id => { const el = document.getElementById(id); if(!el) return; el.innerHTML = id==='filtroObraEstoque' ? '<option value="">Todas as obras</option>' + obras : obrasComVazio; });
      const produtosOptions = '<option value="">Selecione</option>' + state.produtos.map(p => `<option value="${p.id}">${escapeHtml(p.nome)}</option>`).join('');
      ['movProduto','transfProduto'].forEach(id => document.getElementById(id).innerHTML = produtosOptions);
    }


    function atualizarTotalPrevio(){
      const qtd = num(document.getElementById('orcQuantidade')?.value);
      const unit = num(document.getElementById('orcPrecoManual')?.value);
      const el = document.getElementById('orcTotalPrevio');
      if(el) el.value = qtd > 0 && unit > 0 ? money(qtd * unit) : '';
    }


    async function downloadProposalPDF(){
      const docEl = document.getElementById('proposalDoc');
      if(!docEl){
        alert('Gere a proposta primeiro.');
        return;
      }
      if(!(window.jspdf && window.html2canvas)){
        alert('Gerador de PDF indisponível neste navegador. Use Visualizar / Imprimir como alternativa.');
        return;
      }
      try{
        const { jsPDF } = window.jspdf;
        const canvas = await window.html2canvas(docEl, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pageWidth;
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while(heightLeft > 0){
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        const obra = getObra(document.getElementById('propObra')?.value);
        const nome = obra?.nome ? obra.nome.replace(/[^a-zA-Z0-9_-]+/g, '_') : 'proposta';
        pdf.save(`proposta_${nome}.pdf`);
      }catch(e){
        console.error(e);
        alert('Não foi possível gerar o PDF automaticamente. Use Visualizar / Imprimir como alternativa.');
      }
    }

    function renderDashboard(){
      const pagar = state.financeiros.filter(f => f.tipo === 'pagar').reduce((a,b)=>a + num(b.valor),0);
      const receber = state.financeiros.filter(f => f.tipo === 'receber').reduce((a,b)=>a + num(b.valor),0);
      const valorOrcado = state.obras.reduce((acc,o)=>acc + precoVendaObra(o.id),0);
      const critico = resumoEstoque().filter(p => p.saldo < p.minimo).length;
      document.getElementById('dashboardKpis').innerHTML = `
        <div class="kpi-card"><div class="label">Obras</div><div class="value">${state.obras.length}</div></div>
        <div class="kpi-card"><div class="label">Clientes</div><div class="value">${state.clientes.length}</div></div>
        <div class="kpi-card"><div class="label">Base sintética</div><div class="value">${(state.composicoes || []).length}</div></div>
        <div class="kpi-card"><div class="label">Estoque crítico</div><div class="value">${critico}</div></div>
        <div class="kpi-card"><div class="label">Contas a pagar</div><div class="value">${money(pagar)}</div></div>
        <div class="kpi-card"><div class="label">Contas a receber</div><div class="value">${money(receber)}</div></div>
        <div class="kpi-card"><div class="label">Valor orçado</div><div class="value">${money(valorOrcado)}</div></div>`;
      const refs = {
        sint: state.composicoes.filter(c => c.referencia === 'Composição Sintética').length
      };
      document.getElementById('dashboardResumo').innerHTML = `
        <div class="quick-card"><div class="label">Comp. Sintéticas</div><div class="value">${refs.sint}</div></div>
        <div class="quick-card"><div class="label">Base ativa</div><div class="value" style="font-size:18px;">SINAPI MG</div></div>
        <div class="quick-card"><div class="label">Favoritos</div><div class="value">${(state.favoritos || []).length}</div></div>
        <div class="quick-card"><div class="label">Arquivo</div><div class="value" style="font-size:14px;">Sintético</div></div>`;
    }

    function renderClientes(){
      const el = document.getElementById('clientesTable');
      el.innerHTML = state.clientes.length ? `<div class="table-wrap"><table><thead><tr><th>Cliente</th><th>Documento</th><th>Telefone</th><th>E-mail</th><th>Obras</th><th>Ações</th></tr></thead><tbody>${state.clientes.map(c => `<tr><td><strong>${escapeHtml(c.nome)}</strong></td><td>${escapeHtml(c.documento || '-')}</td><td>${escapeHtml(c.telefone || '-')}</td><td>${escapeHtml(c.email || '-')}</td><td>${state.obras.filter(o => o.clienteId === c.id).length}</td><td><button class="btn-secondary" onclick="editarCliente('${c.id}')">Editar</button> <button class="btn-danger" onclick="excluirItem('clientes','${c.id}')">Excluir</button></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Nenhum cliente cadastrado.</div>';
    }
    function renderObrasResumo(){
      const total = state.obras.length, ativas = state.obras.filter(o => o.status==='ativa').length, clientes = state.clientes.length, valor = state.obras.reduce((a,o)=>a + precoVendaObra(o.id),0);
      document.getElementById('obrasResumo').innerHTML = `<div class="quick-card"><div class="label">Obras</div><div class="value">${total}</div></div><div class="quick-card"><div class="label">Ativas</div><div class="value">${ativas}</div></div><div class="quick-card"><div class="label">Clientes</div><div class="value">${clientes}</div></div><div class="quick-card"><div class="label">Valor orçado</div><div class="value" style="font-size:18px;">${money(valor)}</div></div>`;
    }
    function renderObrasTable(){
      const el = document.getElementById('obrasTable');
      el.innerHTML = state.obras.length ? state.obras.map(o => `<tr><td><strong>${escapeHtml(o.nome)}</strong></td><td>${escapeHtml(o.codigo || '-')}</td><td>${escapeHtml(getCliente(o.clienteId)?.nome || '-')}</td><td>${escapeHtml(o.status)}</td><td>${escapeHtml(o.tipo)}</td><td>${qty(o.area)} m²</td><td><button class="btn-secondary" onclick="editarObra('${o.id}')">Editar</button> <button class="btn-danger" onclick="excluirItem('obras','${o.id}')">Excluir</button></td></tr>`).join('') : `<tr><td colspan="7">Nenhuma obra cadastrada.</td></tr>`;
    }

    function getFilteredComposicoes(){
      const busca = normalizeText(document.getElementById('filtroCompBusca').value || '');
      const cat = normalizeText(document.getElementById('filtroCompCategoria').value || '');
      const ref = normalizeText(document.getElementById('filtroCompBase')?.value || '');
      return state.composicoes.filter(c => {
        const codigo = normalizeText(c.codigo);
        const descricao = normalizeText(c.descricao);
        const paiCodigo = normalizeText(c.paiCodigo || '');
        const paiDescricao = normalizeText(c.paiDescricao || '');
        const categoria = normalizeText(c.categoria || '');
        const referencia = normalizeText(c.referencia || '');
        const tipo = normalizeText(c.tipo || '');

        const hitBusca = !busca || codigo.includes(busca) || descricao.includes(busca) || paiCodigo.includes(busca) || paiDescricao.includes(busca);
        const hitCat = !cat || categoria.includes(cat);
        const hitRef = !ref || referencia.includes(ref);
        const hitTipo = !filtroTipoBase || tipo === normalizeText(filtroTipoBase);

        return hitBusca && hitCat && hitRef && hitTipo;
      });
    }

    function topComposicoesUsadas(limit=8){
      const freq = {};
      (state.historicoComp || []).forEach(id => freq[id] = (freq[id] || 0) + 1);
      return Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0, limit).map(([id,count]) => ({ item: getComposicao(id), count })).filter(x => x.item);
    }
    function registrarUsoComposicao(id){ if(!id) return; state.historicoComp = state.historicoComp || []; state.historicoComp.unshift(id); if(state.historicoComp.length > 200) state.historicoComp = state.historicoComp.slice(0,200); }
    function toggleFavoritoComp(id){ state.favoritos = state.favoritos || []; if(state.favoritos.includes(id)) state.favoritos = state.favoritos.filter(x => x !== id); else state.favoritos.unshift(id); saveState(); renderComposicoes(); renderBuscaRapida(); renderMaisUsados(); }
    function renderMaisUsados(){
      const el = document.getElementById('maisUsadosComp'); if(!el) return;
      const top = topComposicoesUsadas();
      if(!top.length){ el.innerHTML = '<div class="empty">Os itens mais usados vão aparecer aqui.</div>'; return; }
      el.innerHTML = top.map(({item,count}) => `<div class="mini-item"><div><div><strong>${escapeHtml(item.codigo)}</strong> • ${escapeHtml(item.descricao)}</div><div class="muted-sm">${escapeHtml(item.tipo || '-')} • ${escapeHtml(item.unidade)} • usado ${count}x</div></div><div style="display:flex;gap:8px;"><button class="btn-secondary" onclick="selecionarComposicaoRapida('${item.id}')">Usar</button><button class="btn-secondary" onclick="toggleFavoritoComp('${item.id}')">${(state.favoritos||[]).includes(item.id) ? '★' : '☆'}</button></div></div>`).join('');
    }
    function selecionarComposicaoRapida(id){
      const c = getComposicao(id);
      if(!c) return;
      state.orcamentoSelecionadoId = id;
      document.getElementById('orcCodigoSelecionado').value = c.codigo || '';
      document.getElementById('orcDescricao').value = c.descricao || '';
      document.getElementById('orcTipoSelecionado').value = c.tipo || '';
      document.getElementById('orcReferenciaSelecionada').value = c.referencia || c.base || '';
      document.getElementById('orcPrecoManual').value = c.custo || '';
      document.getElementById('orcBuscaRapida').value = `${c.codigo} • ${c.descricao}`;
      atualizarTotalPrevio();
      const lista = document.getElementById('resultadosBuscaRapida');
      if(lista) lista.innerHTML = '';
      setSubtab('orcamentos','orc-orcamento');
      setTimeout(() => document.getElementById('orcQuantidade')?.focus(), 50);
    }
    function getBuscaRapidaData(){
      const q = (document.getElementById('orcBuscaRapida')?.value || '').toLowerCase().trim();
      let data = state.composicoes || [];
      if(q){
        data = data.filter(c => (c.codigo||'').toLowerCase().includes(q) || (c.descricao||'').toLowerCase().includes(q) || (c.categoria||'').toLowerCase().includes(q) || (c.tipo||'').toLowerCase().includes(q) || (c.paiCodigo||'').toLowerCase().includes(q));
      }
      const favs = new Set(state.favoritos || []);
      data = data.sort((a,b) => {
        const af = favs.has(a.id) ? 1 : 0; const bf = favs.has(b.id) ? 1 : 0;
        if(bf !== af) return bf - af;
        return String(a.codigo).localeCompare(String(b.codigo), 'pt-BR');
      });
      return data.slice(0, 40);
    }
    function renderBuscaRapida(){
      const el = document.getElementById('resultadosBuscaRapida');
      if(!el) return;
      const termo = (document.getElementById('orcBuscaRapida')?.value || '').trim();
      if(!termo){
        el.innerHTML = '';
        return;
      }
      const data = getBuscaRapidaData();
      if(!data.length){
        el.innerHTML = '<div class="empty">Nenhum item encontrado.</div>';
        return;
      }
      el.innerHTML = data.map(c => `<div class="mini-item"><div><div><strong>${escapeHtml(c.codigo)}</strong> • ${escapeHtml(c.descricao)}</div><div class="muted-sm">${escapeHtml(c.tipo || '-')} • ${escapeHtml(c.referencia || '-')} • ${escapeHtml(c.unidade)} • ${money(c.custo)}</div></div><div style="display:flex;gap:8px;flex-wrap:wrap;"><button class="btn-secondary" onclick="selecionarComposicaoRapida('${c.id}')">Usar</button><button class="btn-secondary" onclick="toggleFavoritoComp('${c.id}')">${(state.favoritos||[]).includes(c.id) ? '★' : '☆'}</button></div></div>`).join('');
    }

    function renderComposicoes(){
      const data = getFilteredComposicoes();
      const el = document.getElementById('composicoesTable');
      const resumo = document.getElementById('compInfo');
      const refs = {};
      (state.composicoes || []).forEach(c => { const k = c.referencia || 'Sem referência'; refs[k] = (refs[k] || 0) + 1; });
      if(resumo){
        resumo.innerHTML = `
          <div class="quick-card"><div class="label">Itens carregados</div><div class="value">${state.composicoes.length}</div></div>
          <div class="quick-card"><div class="label">Resultados do filtro</div><div class="value">${data.length}</div></div>
          <div class="quick-card"><div class="label">Comp. Sintéticas</div><div class="value">${refs['Composição Sintética'] || 0}</div></div>
          <div class="quick-card"><div class="label">SINAPI MG</div><div class="value" style="font-size:18px;">Ativo</div></div>
          <div class="quick-card"><div class="label">Filtro ativo</div><div class="value" style="font-size:14px;">${escapeHtml(document.getElementById('filtroCompBase')?.value || filtroTipoBase || 'Todos')}</div></div>`;
      }
      if(!data.length){ el.innerHTML = '<div class="empty">Nenhuma referência encontrada.</div>'; return; }
      const page = data.slice(0, 250);
      el.innerHTML = `<div class="small-note" style="margin-bottom:10px;">Mostrando os primeiros ${page.length} resultados de ${data.length}. Use os filtros para refinar.</div>` +
      `<div class="table-wrap"><table><thead><tr><th>Código</th><th>Referência</th><th>Tipo</th><th>Categoria</th><th>Descrição</th><th>Unidade</th><th>Custo</th><th>Ações</th></tr></thead><tbody>${
        page.map(c => `<tr>
          <td><strong>${escapeHtml(c.codigo)}</strong>${c.paiCodigo ? `<div class="small-note">Comp. ${escapeHtml(c.paiCodigo)}</div>` : ''}</td>
          <td>${escapeHtml(c.referencia || '-')}</td>
          <td>${escapeHtml(c.tipo || '-')}</td>
          <td>${escapeHtml(c.categoria || '-')}</td>
          <td>${escapeHtml(c.descricao)}${c.paiDescricao ? `<div class="small-note">Origem: ${escapeHtml(c.paiDescricao)}</div>` : ''}</td>
          <td>${escapeHtml(c.unidade || '-')}</td>
          <td>${money(c.custo)}</td>
          <td><button class="btn-secondary" onclick="editarComposicao('${c.id}')">Editar</button></td>
        </tr>`).join('')
      }</tbody></table></div>`;
    }

    function renderOrcamentos(){
      const obraId = document.getElementById('bdiObra').value || state.obras[0]?.id || '';
      const bdiEl = document.getElementById('bdiResultado');
      bdiEl.innerHTML = obraId ? `<div class="quick-card"><div class="label">Custo direto</div><div class="value">${money(custoDiretoObra(obraId))}</div></div><div class="quick-card"><div class="label">BDI</div><div class="value">${pct(percBDI(obraId))}</div></div><div class="quick-card"><div class="label">Preço venda</div><div class="value">${money(precoVendaObra(obraId))}</div></div>` : '<div class="empty">Selecione uma obra.</div>';
      const el = document.getElementById('orcamentosTable');
      if(!state.orcamentos.length){
        el.innerHTML = '<div class="empty">Nenhum item de orçamento cadastrado.</div>';
        return;
      }
      el.innerHTML = `<div class="small-note" style="margin-bottom:10px;">Use Editar para alterar um item e Excluir para remover item lançado errado.</div>
      <div class="table-wrap"><table><thead><tr><th>Obra</th><th>Etapa</th><th>Código</th><th>Tipo</th><th>Descrição</th><th>Qtd.</th><th>Unitário</th><th>Total</th><th>Ações</th></tr></thead><tbody>${
        state.orcamentos.map(item => `<tr>
          <td>${escapeHtml(getObra(item.obraId)?.nome || '-')}</td>
          <td>${escapeHtml(item.etapa || '-')}</td>
          <td><strong>${escapeHtml(item.codigo || '-')}</strong></td>
          <td>${escapeHtml(item.tipo || '-')}</td>
          <td>${escapeHtml(item.descricao)}</td>
          <td>${qty(item.quantidade)}</td>
          <td>${money(item.unitario)}</td>
          <td>${money(item.total)}</td>
          <td>
            <div style="display:flex;flex-direction:column;gap:8px;align-items:stretch;">
              <button class="btn-secondary js-edit-orc" data-id="${item.id}" type="button">Editar</button>
              <button class="btn-danger js-del-orc" data-id="${item.id}" type="button">Excluir</button>
            </div>
          </td>
        </tr>`).join('')
      }</tbody></table></div>`;
    }

    

function buildProposalHtml(obraId){
  const obra = getObra(obraId);
  if(!obra) return '<div class="empty">Selecione uma obra.</div>';
  const cliente = getCliente(obra.clienteId);
  const itens = orcamentosObra(obraId);
  const hoje = new Date().toLocaleDateString('pt-BR');
  const prazo = document.getElementById('propPrazo')?.value || '30 dias';
  const validade = document.getElementById('propValidade')?.value || '07 dias';
  const pagamento = document.getElementById('propPagamento')?.value || '50% entrada / 50% conclusão';
  const cond = document.getElementById('propCondicoes')?.value || 'Pagamento conforme medição aprovada.';

  const linhas = itens.length ? itens.map((i, idx) => `
    <tr>
      <td class="proposal-col-item"><strong>${escapeHtml(i.codigo || String(idx + 1))}</strong></td>
      <td class="proposal-col-desc proposal-break">${escapeHtml(i.descricao || '')}</td>
      <td class="proposal-col-qtd">${qty(i.quantidade)}</td>
      <td class="proposal-col-un">${escapeHtml(getComposicao(i.composicaoId)?.unidade || '-')}</td>
      <td class="proposal-col-val">${money(i.total)}</td>
    </tr>`).join('') : `<tr><td colspan="5" style="padding:10px;">Sem itens.</td></tr>`;

  return `
  <div id="proposalDoc" style="background:#fff;color:#1f2937;padding:38px;border-radius:18px;max-width:980px;margin:auto;font-family:Arial,sans-serif;line-height:1.45;">
    <div style="display:flex;justify-content:space-between;gap:20px;align-items:flex-start;flex-wrap:wrap;">
      <div>
        <div style="font-size:54px;font-weight:800;color:#163b73;line-height:1;">${escapeHtml(state.brand?.nome || 'Obra Nova')}</div>
        <div style="color:#6b7280;font-size:18px;margin-top:6px;">${escapeHtml(state.brand?.subtitulo || 'Sistema de gestão de obras')}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:20px;font-weight:800;color:#111827;">PROPOSTA COMERCIAL</div>
        <div style="font-size:16px;color:#374151;">${hoje}</div>
      </div>
    </div>

    <div style="height:3px;background:#163b73;margin:24px 0 28px;"></div>

    <div style="display:grid;grid-template-columns:1fr;gap:8px;font-size:18px;">
      <div><strong>Cliente:</strong> ${escapeHtml(cliente?.nome || '-')}</div>
      <div><strong>Obra:</strong> ${escapeHtml(obra.nome || '-')}</div>
      <div><strong>Prazo:</strong> ${escapeHtml(prazo)}</div>
      <div><strong>Validade:</strong> ${escapeHtml(validade)}</div>
    </div>

    <div class="proposal-table-wrap">
      <div class="proposal-table-title">DETALHAMENTO DOS SERVIÇOS</div>
      <table class="proposal-table">
        <thead>
          <tr>
            <th class="proposal-col-item">ITEM</th>
            <th class="proposal-col-desc">DESCRIÇÃO</th>
            <th class="proposal-col-qtd">QTD</th>
            <th class="proposal-col-un">UN</th>
            <th class="proposal-col-val">VALOR</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>

    <div style="margin-top:24px;background:linear-gradient(135deg,#163b73,#2456a6);color:#fff;padding:18px 22px;border-radius:14px;display:flex;justify-content:space-between;gap:20px;align-items:center;flex-wrap:wrap;">
      <div style="font-size:16px;">VALOR GLOBAL</div>
      <div style="font-size:42px;font-weight:900;">${money(precoVendaObra(obraId))}</div>
    </div>

    <div style="margin-top:26px;font-size:17px;display:grid;gap:10px;">
      <div><strong>Forma de pagamento:</strong> ${escapeHtml(pagamento)}</div>
      <div><strong>Condições comerciais:</strong> ${escapeHtml(cond)}</div>
    </div>

    <div style="margin-top:90px;">
      <div style="width:360px;border-top:1px solid #444;padding-top:10px;font-size:16px;">
        Gabriel Filipe<br>JOTACON CONSTRUÇÕES LTDA
      </div>
    </div>

    <div style="margin-top:28px;display:flex;gap:12px;flex-wrap:wrap;">
      <button onclick="downloadProposalPDF()" class="btn-primary" type="button">Baixar PDF</button>
      <button onclick="window.print()" class="btn-secondary" type="button">Visualizar / Imprimir</button>
      <button onclick="showSection('orcamentos');setSubtab('orcamentos','orc-proposta');window.scrollTo({top:0,behavior:'smooth'});" class="btn-secondary" type="button">Voltar ao sistema</button>
    </div>
  </div>`;
}

    function renderProposalPreview(){
      const obraId = document.getElementById('propObra').value;
      if(!obraId){
        document.getElementById('propostaPreview').innerHTML = '<div class="empty">Selecione uma obra para visualizar a proposta.</div>';
        return;
      }
      document.getElementById('propostaPreview').innerHTML =
        `<div class="actions" style="justify-content:flex-end;margin-bottom:12px;">
          <button class="btn-secondary" id="btnPreviewEditarOrcamento">✎ Editar orçamento</button>
          <button class="btn-primary" id="btnPreviewTelaCheia">Visualizar / Imprimir</button>
        </div>` + buildProposalHtml(obraId);
      document.getElementById('btnPreviewEditarOrcamento')?.addEventListener('click', () => {
        showSection('orcamentos');
        setSubtab('orcamentos','orc-orcamento');
        window.scrollTo({top:0, behavior:'smooth'});
      });
      document.getElementById('btnPreviewTelaCheia')?.addEventListener('click', openProposalScreen);
    }
    function openProposalScreen(){
      const obraId = document.getElementById('propObra').value, obra = getObra(obraId); if(!obra) return alert('Selecione uma obra.');
      const cliente = getCliente(obra.clienteId), total = precoVendaObra(obraId), itens = orcamentosObra(obraId);
      document.getElementById('proposalBrandName').textContent = state.brand.nome;
      document.getElementById('proposalBrandSub').textContent = state.brand.subtitulo || '';
      document.getElementById('proposalDate').textContent = dateBR(todayISO());
      document.getElementById('proposalCliente').textContent = cliente?.nome || 'Não vinculado';
      document.getElementById('proposalObra').textContent = obra.nome;
      document.getElementById('proposalPrazo').textContent = document.getElementById('propPrazo').value || '-';
      document.getElementById('proposalValidade').textContent = document.getElementById('propValidade').value || '-';
      document.getElementById('proposalPagamento').textContent = document.getElementById('propPagamento').value || '-';
      document.getElementById('proposalCondicoes').textContent = document.getElementById('propCondicoes').value || '-';
      document.getElementById('proposalTotal').textContent = money(total);
      document.getElementById('proposalBody').innerHTML = itens.length ? itens.map((i,idx)=>`<tr><td>${idx+1} - ${escapeHtml(i.descricao)}</td><td>${qty(i.quantidade)}</td><td>${money(i.unitario)}</td><td>${money(i.total)}</td></tr>`).join('') : `<tr><td colspan="4">Sem itens no orçamento.</td></tr>`;
      const logo = document.getElementById('proposalLogo'); if(state.brand.logo){ logo.src = state.brand.logo; logo.style.display='block'; } else { logo.style.display='none'; }
      document.querySelector('main').style.display='none'; document.querySelector('header').style.display='none'; document.getElementById('drawer').style.display='none'; document.getElementById('proposalScreen').style.display='block'; window.scrollTo({top:0, behavior:'smooth'});
    }
    function closeProposalScreen(){ document.getElementById('proposalScreen').style.display='none'; document.querySelector('main').style.display='block'; document.querySelector('header').style.display='flex'; document.getElementById('drawer').style.display='block'; }

    function renderProdutos(){
      const el = document.getElementById('produtosTable');
      el.innerHTML = state.produtos.length ? `<div class="table-wrap"><table><thead><tr><th>Produto</th><th>Unidade</th><th>Código</th><th>Mínimo</th><th>Custo</th><th>Saldo global</th><th>Ações</th></tr></thead><tbody>${state.produtos.map(p => `<tr><td><strong>${escapeHtml(p.nome)}</strong></td><td>${escapeHtml(p.unidade)}</td><td>${escapeHtml(p.codigo || '-')}</td><td>${qty(p.minimo)}</td><td>${money(p.custo)}</td><td>${qty(saldoProduto(p.id))}</td><td><button class="btn-secondary" onclick="editarProduto('${p.id}')">Editar</button> <button class="btn-danger" onclick="excluirItem('produtos','${p.id}')">Excluir</button></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Nenhum produto cadastrado.</div>';
    }
    function renderMovimentacoes(){
      const el = document.getElementById('movimentacoesTable');
      el.innerHTML = state.movimentacoes.length ? `<div class="table-wrap"><table><thead><tr><th>Data</th><th>Tipo</th><th>Obra</th><th>Produto</th><th>Qtd.</th><th>Valor</th><th>Total</th><th>Ações</th></tr></thead><tbody>${state.movimentacoes.map(m => `<tr><td>${dateBR(m.data)}</td><td>${escapeHtml(m.tipo)}</td><td>${escapeHtml(getObra(m.obraId)?.nome || '-')}</td><td>${escapeHtml(getProduto(m.produtoId)?.nome || '-')}</td><td>${qty(m.quantidade)}</td><td>${money(m.valor)}</td><td>${money(num(m.quantidade) * num(m.valor))}</td><td><button class="btn-secondary" onclick="editarMovimentacao('${m.id}')">Editar</button> <button class="btn-danger" onclick="excluirItem('movimentacoes','${m.id}')">Excluir</button></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Nenhuma movimentação cadastrada.</div>';
    }
    function renderResumoEstoque(){ const obraId = document.getElementById('filtroObraEstoque').value, dados = resumoEstoque(obraId), el = document.getElementById('estoqueTable'); el.innerHTML = dados.length ? `<div class="table-wrap"><table><thead><tr><th>Produto</th><th>Entradas</th><th>Saídas</th><th>Saldo</th><th>Mínimo</th><th>Custo médio</th><th>Custo total</th></tr></thead><tbody>${dados.map(r => `<tr><td><strong>${escapeHtml(r.nome)}</strong></td><td>${qty(r.qtdEntrada)}</td><td>${qty(r.qtdSaida)}</td><td>${qty(r.saldo)}</td><td>${qty(r.minimo)}</td><td>${money(r.custoMedio)}</td><td>${money(r.custoTotal)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Nenhum produto para consolidar.</div>'; }
    function renderFinanceiro(){ const pagar = state.financeiros.filter(f => f.tipo === 'pagar').reduce((a,b)=>a + num(b.valor),0), receber = state.financeiros.filter(f => f.tipo === 'receber').reduce((a,b)=>a + num(b.valor),0); document.getElementById('financeiroResumo').innerHTML = `<div class="quick-card"><div class="label">Contas a pagar</div><div class="value">${money(pagar)}</div></div><div class="quick-card"><div class="label">Contas a receber</div><div class="value">${money(receber)}</div></div><div class="quick-card"><div class="label">Saldo previsto</div><div class="value">${money(receber - pagar)}</div></div>`; const el = document.getElementById('financeiroTable'); el.innerHTML = state.financeiros.length ? `<div class="table-wrap"><table><thead><tr><th>Tipo</th><th>Descrição</th><th>Obra</th><th>Data</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead><tbody>${state.financeiros.map(f => `<tr><td>${escapeHtml(f.tipo)}</td><td><strong>${escapeHtml(f.descricao)}</strong></td><td>${escapeHtml(getObra(f.obraId)?.nome || '-')}</td><td>${dateBR(f.data)}</td><td>${money(f.valor)}</td><td>${escapeHtml(f.status)}</td><td><button class="btn-secondary" onclick="editarFinanceiro('${f.id}')">Editar</button> <button class="btn-danger" onclick="excluirItem('financeiros','${f.id}')">Excluir</button></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Nenhum lançamento financeiro cadastrado.</div>'; }

    function resetClienteForm(){ editing.clienteId=null; ['clienteNome','clienteDocumento','clienteTelefone','clienteEmail'].forEach(id=>document.getElementById(id).value=''); }
    function salvarCliente(){ const obj={ id: editing.clienteId || uid(), nome: document.getElementById('clienteNome').value.trim(), documento: document.getElementById('clienteDocumento').value.trim(), telefone: document.getElementById('clienteTelefone').value.trim(), email: document.getElementById('clienteEmail').value.trim() }; if(!obj.nome) return alert('Informe o nome do cliente.'); const idx=state.clientes.findIndex(c=>c.id===obj.id); if(idx>=0) state.clientes[idx]=obj; else state.clientes.unshift(obj); saveState(); resetClienteForm(); renderAll(); }
    function editarCliente(id){ const c=getCliente(id); if(!c) return; editing.clienteId=id; document.getElementById('clienteNome').value=c.nome||''; document.getElementById('clienteDocumento').value=c.documento||''; document.getElementById('clienteTelefone').value=c.telefone||''; document.getElementById('clienteEmail').value=c.email||''; showSection('cadastro'); setSubtab('cadastro','cadastro-clientes'); }
    function resetObraForm(){ editing.obraId=null; ['obraNome','obraCodigo','obraArea'].forEach(id=>document.getElementById(id).value=''); document.getElementById('obraCliente').value=''; document.getElementById('obraStatus').value='ativa'; document.getElementById('obraTipo').value='Residencial'; }
    function salvarObra(){ const obj={ id: editing.obraId || uid(), nome: document.getElementById('obraNome').value.trim(), codigo: document.getElementById('obraCodigo').value.trim() || 'SPE:---', clienteId: document.getElementById('obraCliente').value, status: document.getElementById('obraStatus').value, tipo: document.getElementById('obraTipo').value, area: num(document.getElementById('obraArea').value) }; if(!obj.nome) return alert('Informe o nome da obra.'); const idx=state.obras.findIndex(o=>o.id===obj.id); if(idx>=0) state.obras[idx]={...state.obras[idx],...obj}; else state.obras.unshift(obj); saveState(); resetObraForm(); renderAll(); }
    function editarObra(id){ const o=getObra(id); if(!o) return; editing.obraId=id; document.getElementById('obraNome').value=o.nome||''; document.getElementById('obraCodigo').value=o.codigo||''; document.getElementById('obraCliente').value=o.clienteId||''; document.getElementById('obraStatus').value=o.status||'ativa'; document.getElementById('obraTipo').value=o.tipo||'Residencial'; document.getElementById('obraArea').value=o.area||''; showSection('cadastro'); setSubtab('cadastro','cadastro-obras'); }

    function resetCompForm(){ editing.composicaoId=null; ['compCodigo','compDescricao','compUnidade','compCusto','compCategoria'].forEach(id=>document.getElementById(id).value=''); document.getElementById('compBase').value='SINAPI'; }
    function salvarComposicao(){ const obj={ id: editing.composicaoId || uid(), codigo: document.getElementById('compCodigo').value.trim(), base: document.getElementById('compBase').value, referencia: document.getElementById('compBase').value, descricao: document.getElementById('compDescricao').value.trim(), unidade: document.getElementById('compUnidade').value.trim(), custo: num(document.getElementById('compCusto').value), categoria: document.getElementById('compCategoria').value.trim(), tipo: 'COMPOSIÇÃO', paiCodigo:'', paiDescricao:'' }; if(!obj.codigo || !obj.descricao) return alert('Informe código e descrição.'); const idx=state.composicoes.findIndex(c=>c.id===obj.id); if(idx>=0) state.composicoes[idx]=obj; else state.composicoes.unshift(obj); saveState(); resetCompForm(); renderAll(); }
    function editarComposicao(id){ const c=getComposicao(id); if(!c) return; editing.composicaoId=id; document.getElementById('compCodigo').value=c.codigo||''; document.getElementById('compBase').value=c.base||'SINAPI'; document.getElementById('compDescricao').value=c.descricao||''; document.getElementById('compUnidade').value=c.unidade||''; document.getElementById('compCusto').value=c.custo||''; document.getElementById('compCategoria').value=c.categoria||''; showSection('orcamentos'); setSubtab('orcamentos','orc-base'); }

    function resetOrcForm(keepContext=true){
      editing.orcId = null;
      state.orcamentoSelecionadoId = '';
      const obraAtual = document.getElementById('orcObra').value;
      const etapaAtual = document.getElementById('orcEtapa').value;
      ['orcBuscaRapida','orcCodigoSelecionado','orcDescricao','orcTipoSelecionado','orcReferenciaSelecionada','orcQuantidade','orcPrecoManual','orcTotalPrevio'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = '';
      });
      const lista = document.getElementById('resultadosBuscaRapida');
      if(lista) lista.innerHTML = '';
      if(keepContext){
        document.getElementById('orcObra').value = obraAtual;
        document.getElementById('orcEtapa').value = etapaAtual;
      } else {
        document.getElementById('orcObra').value = '';
        document.getElementById('orcEtapa').value = '';
      }
      setTimeout(() => document.getElementById('orcBuscaRapida')?.focus(), 50);
    }
    function salvarItemOrcamento(){
      const obraId = document.getElementById('orcObra').value;
      const comp = getComposicao(state.orcamentoSelecionadoId);
      const quantidade = num(document.getElementById('orcQuantidade').value);
      if(!obraId) return alert('Selecione uma obra.');
      if(!comp) return alert('Pesquise a composição e clique em "Usar".');
      if(quantidade <= 0) return alert('Informe a quantidade.');
      const unitario = num(document.getElementById('orcPrecoManual').value) || num(comp?.custo);
      const obj = {
        id: editing.orcId || uid(),
        obraId,
        etapa: document.getElementById('orcEtapa').value.trim(),
        composicaoId: comp?.id || '',
        codigo: comp?.codigo || '',
        descricao: document.getElementById('orcDescricao').value.trim() || comp?.descricao || 'Serviço manual',
        quantidade,
        unitario,
        total: quantidade * unitario,
        tipo: comp?.tipo || 'COMPOSIÇÃO',
        referencia: comp?.referencia || comp?.base || ''
      };
      const idx = state.orcamentos.findIndex(o => o.id === obj.id);
      if(idx >= 0) state.orcamentos[idx] = obj; else state.orcamentos.unshift(obj);
      if(obj.composicaoId) registrarUsoComposicao(obj.composicaoId);
      saveState();
      resetOrcForm(true);
      renderAll();
    }
    function editarItemOrcamento(id){
      const item = state.orcamentos.find(o => o.id === id);
      if(!item) return;
      editing.orcId = id;
      state.orcamentoSelecionadoId = item.composicaoId || '';
      document.getElementById('orcObra').value = item.obraId || '';
      document.getElementById('orcEtapa').value = item.etapa || '';
      document.getElementById('orcCodigoSelecionado').value = item.codigo || getComposicao(item.composicaoId)?.codigo || '';
      document.getElementById('orcDescricao').value = item.descricao || '';
      document.getElementById('orcTipoSelecionado').value = item.tipo || getComposicao(item.composicaoId)?.tipo || '';
      document.getElementById('orcReferenciaSelecionada').value = item.referencia || getComposicao(item.composicaoId)?.referencia || '';
      document.getElementById('orcQuantidade').value = item.quantidade || '';
      document.getElementById('orcPrecoManual').value = item.unitario || '';
      document.getElementById('orcBuscaRapida').value = item.codigo ? `${item.codigo} • ${item.descricao}` : (item.descricao || '');
      atualizarTotalPrevio();
      showSection('orcamentos');
      setSubtab('orcamentos','orc-orcamento');
    }
    function salvarBDI(){ const obraId=document.getElementById('bdiObra').value; if(!obraId) return alert('Selecione uma obra.'); const obj={ obraId, admCentral:num(document.getElementById('bdiAdmCentral').value), admLocal:num(document.getElementById('bdiAdmLocal').value), lucro:num(document.getElementById('bdiLucro').value) }; const idx=state.bdis.findIndex(b=>b.obraId===obraId); if(idx>=0) state.bdis[idx]=obj; else state.bdis.push(obj); saveState(); renderAll(); }

    function resetProdutoForm(){ editing.produtoId=null; ['produtoNome','produtoUnidade','produtoCodigo','produtoMinimo','produtoCusto'].forEach(id=>document.getElementById(id).value=''); }
    function salvarProduto(){ const obj={ id: editing.produtoId || uid(), nome: document.getElementById('produtoNome').value.trim(), unidade: document.getElementById('produtoUnidade').value.trim(), codigo: document.getElementById('produtoCodigo').value.trim(), minimo:num(document.getElementById('produtoMinimo').value), custo:num(document.getElementById('produtoCusto').value) }; if(!obj.nome || !obj.unidade) return alert('Informe produto e unidade.'); const idx=state.produtos.findIndex(p=>p.id===obj.id); if(idx>=0) state.produtos[idx]=obj; else state.produtos.unshift(obj); saveState(); resetProdutoForm(); renderAll(); }
    function editarProduto(id){ const p=getProduto(id); if(!p) return; editing.produtoId=id; document.getElementById('produtoNome').value=p.nome||''; document.getElementById('produtoUnidade').value=p.unidade||''; document.getElementById('produtoCodigo').value=p.codigo||''; document.getElementById('produtoMinimo').value=p.minimo||0; document.getElementById('produtoCusto').value=p.custo||0; showSection('almoxarife'); setSubtab('almoxarife','alm-estoque'); }

    function resetMovForm(){ editing.movId=null; document.getElementById('movTipo').value='entrada'; document.getElementById('movData').value=todayISO(); document.getElementById('movObra').value=''; document.getElementById('movProduto').value=''; document.getElementById('movQtd').value=''; document.getElementById('movValor').value=''; document.getElementById('movObs').value=''; }
    function usarCustoBaseProduto(){ const p=getProduto(document.getElementById('movProduto').value); if(p) document.getElementById('movValor').value=p.custo||0; }
    function salvarMovimentacao(){ const obj={ id: editing.movId || uid(), tipo: document.getElementById('movTipo').value, data: document.getElementById('movData').value, obraId: document.getElementById('movObra').value, produtoId: document.getElementById('movProduto').value, quantidade:num(document.getElementById('movQtd').value), valor:num(document.getElementById('movValor').value), observacoes: document.getElementById('movObs').value.trim() }; if(!obj.data || !obj.obraId || !obj.produtoId || obj.quantidade<=0) return alert('Preencha os campos obrigatórios.'); if(!editing.movId && obj.tipo==='saida'){ const saldo=saldoProduto(obj.produtoId, obj.obraId); if(obj.quantidade>saldo && !confirm(`Saldo insuficiente. Saldo atual: ${qty(saldo)}. Deseja lançar mesmo assim?`)) return; } const idx=state.movimentacoes.findIndex(m=>m.id===obj.id); if(idx>=0) state.movimentacoes[idx]=obj; else state.movimentacoes.unshift(obj); saveState(); resetMovForm(); renderAll(); }
    function editarMovimentacao(id){ const m=state.movimentacoes.find(x=>x.id===id); if(!m) return; editing.movId=id; document.getElementById('movTipo').value=m.tipo; document.getElementById('movData').value=m.data; document.getElementById('movObra').value=m.obraId; document.getElementById('movProduto').value=m.produtoId; document.getElementById('movQtd').value=m.quantidade; document.getElementById('movValor').value=m.valor; document.getElementById('movObs').value=m.observacoes||''; showSection('almoxarife'); setSubtab('almoxarife','alm-mov'); }
    function realizarTransferencia(){ const origem=document.getElementById('transfOrigem').value, destino=document.getElementById('transfDestino').value, produtoId=document.getElementById('transfProduto').value, quantidade=num(document.getElementById('transfQtd').value), data=document.getElementById('transfData').value; if(!origem || !destino || !produtoId || !data || quantidade<=0) return alert('Preencha os campos obrigatórios.'); if(origem===destino) return alert('Origem e destino não podem ser iguais.'); const saldo=saldoProduto(produtoId, origem); if(saldo<quantidade) return alert(`Saldo insuficiente na origem. Saldo atual: ${qty(saldo)}`); state.movimentacoes.unshift({ id: uid(), tipo:'saida', data, obraId: origem, produtoId, quantidade, valor:0, observacoes:`Transferência para ${getObra(destino)?.nome || 'destino'}` }); state.movimentacoes.unshift({ id: uid(), tipo:'entrada', data, obraId: destino, produtoId, quantidade, valor:0, observacoes:`Transferência de ${getObra(origem)?.nome || 'origem'}` }); saveState(); document.getElementById('transfQtd').value=''; renderAll(); alert('Transferência realizada com sucesso.'); }

    function resetFinanceiroForm(){ editing.financeiroId=null; document.getElementById('finTipo').value='pagar'; document.getElementById('finDescricao').value=''; document.getElementById('finObra').value=''; document.getElementById('finData').value=todayISO(); document.getElementById('finValor').value=''; document.getElementById('finStatus').value='aberto'; }
    function salvarFinanceiro(){ const obj={ id: editing.financeiroId || uid(), tipo: document.getElementById('finTipo').value, descricao: document.getElementById('finDescricao').value.trim(), obraId: document.getElementById('finObra').value, data: document.getElementById('finData').value, valor:num(document.getElementById('finValor').value), status: document.getElementById('finStatus').value }; if(!obj.descricao || !obj.data || obj.valor<=0) return alert('Preencha os campos obrigatórios do financeiro.'); const idx=state.financeiros.findIndex(f=>f.id===obj.id); if(idx>=0) state.financeiros[idx]=obj; else state.financeiros.unshift(obj); saveState(); resetFinanceiroForm(); renderAll(); }
    function editarFinanceiro(id){ const f=state.financeiros.find(x=>x.id===id); if(!f) return; editing.financeiroId=id; document.getElementById('finTipo').value=f.tipo; document.getElementById('finDescricao').value=f.descricao; document.getElementById('finObra').value=f.obraId||''; document.getElementById('finData').value=f.data||todayISO(); document.getElementById('finValor').value=f.valor||''; document.getElementById('finStatus').value=f.status||'aberto'; showSection('financeiro'); }

    function excluirItem(type,id){
      const msgMap = {
      orcamentos: 'Deseja excluir este item do orçamento? Essa ação remove o item lançado errado e recalcula os totais.',
      clientes: 'Deseja excluir este cliente?',
      obras: 'Deseja excluir esta obra? Isso também remove orçamento, estoque e financeiro vinculados.',
      produtos: 'Deseja excluir este produto?',
      movimentacoes: 'Deseja excluir esta movimentação?',
      financeiros: 'Deseja excluir este lançamento financeiro?',
      composicoes: 'Deseja excluir esta composição da base?'
    };
    if(!confirm(msgMap[type] || 'Confirma a exclusão?')) return;
      if(type==='clientes'){ state.clientes=state.clientes.filter(c=>c.id!==id); state.obras=state.obras.map(o=>o.clienteId===id ? {...o,clienteId:''} : o); }
      if(type==='obras'){ state.obras=state.obras.filter(o=>o.id!==id); state.orcamentos=state.orcamentos.filter(o=>o.obraId!==id); state.bdis=state.bdis.filter(b=>b.obraId!==id); state.movimentacoes=state.movimentacoes.filter(m=>m.obraId!==id); state.financeiros=state.financeiros.filter(f=>f.obraId!==id); }
      if(type==='composicoes') state.composicoes=state.composicoes.filter(c=>c.id!==id);
      if(type==='produtos'){ state.produtos=state.produtos.filter(p=>p.id!==id); state.movimentacoes=state.movimentacoes.filter(m=>m.produtoId!==id); }
      if(type==='movimentacoes') state.movimentacoes=state.movimentacoes.filter(m=>m.id!==id);
      if(type==='orcamentos') state.orcamentos=state.orcamentos.filter(o=>o.id!==id);
      if(type==='financeiros') state.financeiros=state.financeiros.filter(f=>f.id!==id);
      saveState(); renderAll();
    }

    function bindEvents(){
      document.getElementById('btnMenu').addEventListener('click', toggleMenu);
      document.getElementById('overlay').addEventListener('click', closeMenu);
      document.getElementById('btnTheme').addEventListener('click', toggleTheme);
      document.querySelectorAll('.menu-item').forEach(btn=>btn.addEventListener('click', ()=>showSection(btn.dataset.section)));
      document.querySelectorAll('.subtab').forEach(btn=>btn.addEventListener('click', ()=>setSubtab(btn.dataset.parent, btn.dataset.sub)));

      document.getElementById('btnSalvarCliente').addEventListener('click', salvarCliente);
      document.getElementById('btnCancelarCliente').addEventListener('click', resetClienteForm);
      document.getElementById('btnSalvarObra').addEventListener('click', salvarObra);
      document.getElementById('btnCancelarObra').addEventListener('click', resetObraForm);

      document.getElementById('btnSalvarComposicao').addEventListener('click', salvarComposicao);
      document.getElementById('btnCancelarComposicao').addEventListener('click', resetCompForm);
      document.getElementById('filtroCompBusca').addEventListener('input', renderComposicoes);
      document.getElementById('filtroCompCategoria').addEventListener('input', renderComposicoes);
      document.getElementById('filtroCompBase').addEventListener('change', renderComposicoes);
      document.querySelectorAll('#chipsTipoBusca .chip').forEach(ch => ch.addEventListener('click', () => {
        document.querySelectorAll('#chipsTipoBusca .chip').forEach(x => x.classList.remove('active'));
        ch.classList.add('active');
        filtroTipoBase = ch.dataset.tipo || '';
        renderComposicoes();
      }));

      document.getElementById('btnSalvarOrcamento').addEventListener('click', salvarItemOrcamento);
      document.getElementById('btnCancelarOrcamento').addEventListener('click', () => resetOrcForm(false));
      document.getElementById('orcQuantidade').addEventListener('input', atualizarTotalPrevio);
      document.getElementById('btnSalvarBDI').addEventListener('click', salvarBDI);
      document.getElementById('bdiObra').addEventListener('change', renderOrcamentos);
      document.getElementById('orcBuscaRapida').addEventListener('input', renderBuscaRapida);

      ['propObra','propPrazo','propValidade','propPagamento','propCondicoes'].forEach(id=>{ document.getElementById(id).addEventListener('input', renderProposalPreview); document.getElementById(id).addEventListener('change', renderProposalPreview); });
      document.getElementById('btnGerarProposta').addEventListener('click', () => {
        renderProposalPreview();
        setSubtab('orcamentos','orc-proposta');
        window.scrollTo({top:0, behavior:'smooth'});
      });
      document.getElementById('btnVisualizarProposta').addEventListener('click', openProposalScreen);

      document.getElementById('btnSalvarProduto').addEventListener('click', salvarProduto);
      document.getElementById('btnCancelarProduto').addEventListener('click', resetProdutoForm);
      document.getElementById('btnSalvarMov').addEventListener('click', salvarMovimentacao);
      document.getElementById('btnCustoBase').addEventListener('click', usarCustoBaseProduto);
      document.getElementById('btnCancelarMov').addEventListener('click', resetMovForm);
      document.getElementById('filtroObraEstoque').addEventListener('change', renderResumoEstoque);
      document.getElementById('btnTransferir').addEventListener('click', realizarTransferencia);

      document.getElementById('btnSalvarFinanceiro').addEventListener('click', salvarFinanceiro);
      document.getElementById('btnCancelarFinanceiro').addEventListener('click', resetFinanceiroForm);

      document.getElementById('btnSalvarIdentidade').addEventListener('click', saveBrand);
      document.getElementById('btnRestaurarPadrao').addEventListener('click', restoreBrandDefault);
      document.getElementById('btnLimparCache').addEventListener('click', clearLocalCache);
      document.getElementById('btnExportarBackup').addEventListener('click', exportBackup);
      document.getElementById('importBackupFile').addEventListener('change', e=>{ if(e.target.files[0]) importBackup(e.target.files[0]); e.target.value=''; });

      document.getElementById('btnPrintProposal').addEventListener('click', ()=>window.print());
      document.getElementById('btnCloseProposal').addEventListener('click', closeProposalScreen);
    }

    window.editarCliente = editarCliente;
    window.editarObra = editarObra;
    window.editarComposicao = editarComposicao;
    window.editarItemOrcamento = editarItemOrcamento;
    window.editarProduto = editarProduto;
    window.editarMovimentacao = editarMovimentacao;
    window.editarFinanceiro = editarFinanceiro;
    window.excluirItem = excluirItem;
    window.toggleFavoritoComp = toggleFavoritoComp;
    window.selecionarComposicaoRapida = selecionarComposicaoRapida;


    function bindDynamicActions(){
      const host = document.getElementById('orcamentosTable');
      if(!host || host.dataset.bound === '1') return;
      host.dataset.bound = '1';
      host.addEventListener('click', (ev) => {
        const editBtn = ev.target.closest('.js-edit-orc');
        const delBtn = ev.target.closest('.js-del-orc');
        if(editBtn){
          const id = editBtn.getAttribute('data-id');
          if(id) editarItemOrcamento(id);
          return;
        }
        if(delBtn){
          const id = delBtn.getAttribute('data-id');
          if(id) excluirItem('orcamentos', id);
          return;
        }
      });
    }

    function renderAll(){
      applyBrand();
      renderSelects();
      renderDashboard();
      renderClientes();
      renderObrasResumo();
      renderObrasTable();
      renderComposicoes();
      renderMaisUsados();
      renderBuscaRapida();
      renderOrcamentos();
      renderProposalPreview();
      renderProdutos();
      bindDynamicActions();
      renderMovimentacoes();
      renderResumoEstoque();
      renderFinanceiro();
      document.getElementById('movData').value ||= todayISO();
      document.getElementById('transfData').value ||= todayISO();
      document.getElementById('finData').value ||= todayISO();
    }

    loadState();
    restoreTheme();
    bindEvents();
    renderAll();
    restoreSection();
    setSubtab('cadastro','cadastro-clientes');
    setSubtab('orcamentos','orc-base');
    setSubtab('almoxarife','alm-estoque');
    setSubtab('sistema','sis-config');
