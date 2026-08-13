  (function(){
    if(window.__CLOUD_SYNC_V1__) return;
    window.__CLOUD_SYNC_V1__ = true;

    let ownerId = null;
    let pushTimer = null;
    let pulling = false;

    function db(){ return window.cloud.client; }

    async function pullCloudData(){
      if(!ownerId) return;
      pulling = true;
      try{
        const [clientesRes, obrasRes, itensRes, empresaRes] = await Promise.all([
          db().from('clientes').select('*').eq('owner_id', ownerId).order('created_at', { ascending: false }),
          db().from('obras').select('*').eq('owner_id', ownerId).order('created_at', { ascending: false }),
          db().from('orcamento_itens').select('*').eq('owner_id', ownerId).order('created_at', { ascending: false }),
          db().from('empresa_config').select('*').eq('owner_id', ownerId).maybeSingle()
        ]);

        if(!clientesRes.error && Array.isArray(clientesRes.data)){
          state.clientes = clientesRes.data.map(c => ({
            id: c.id, nome: c.nome || '', documento: c.cpf_cnpj || '', telefone: c.telefone || '', email: c.email || ''
          }));
        }
        if(!obrasRes.error && Array.isArray(obrasRes.data)){
          state.obras = obrasRes.data.map(o => ({
            id: o.id, nome: o.nome || '', status: o.status || 'ativa', codigo: o.codigo || '',
            clienteId: o.cliente_id || '', tipo: o.tipo || 'Residencial', area: o.area_construida || 0
          }));
        }
        if(!itensRes.error && Array.isArray(itensRes.data)){
          state.orcamentos = itensRes.data.map(i => ({
            id: i.id, obraId: i.obra_id || '', etapa: i.etapa || '', composicaoId: i.composicao_id || '',
            codigo: i.codigo || '', descricao: i.descricao || '', quantidade: Number(i.quantidade || 0),
            unitario: Number(i.custo_unitario || 0), total: Number(i.quantidade || 0) * Number(i.custo_unitario || 0),
            tipo: i.tipo || 'COMPOSIÇÃO', referencia: i.referencia || ''
          }));
        }
        if(!empresaRes.error && empresaRes.data){
          const e = empresaRes.data;
          state.brand = {
            nome: e.nome_empresa || 'Obra Nova',
            subtitulo: e.subtitulo || 'Sistema de gestão de obras',
            cor: e.cor_primaria || '#0f2e5e',
            corSecundaria: e.cor_secundaria || '#1f4f95',
            logo: e.logo_url || ''
          };
        }

        localStorage.setItem('obra_nova_v68_real', JSON.stringify(typeof stateForStorage === 'function' ? stateForStorage() : state));

        if(typeof renderAll === 'function') renderAll();
        if(typeof applyBrand === 'function') applyBrand();
        if(typeof renderSelects === 'function') renderSelects();
      }catch(e){
        console.error('Falha ao carregar dados da nuvem.', e);
      }finally{
        pulling = false;
      }
    }

    async function pushClientes(){
      const rows = (state.clientes || []).filter(c => c && c.id).map(c => ({
        id: c.id, owner_id: ownerId, nome: c.nome || '', cpf_cnpj: c.documento || '',
        telefone: c.telefone || '', email: c.email || ''
      }));
      if(rows.length){
        const { error } = await db().from('clientes').upsert(rows);
        if(error) return console.error('Erro ao sincronizar clientes:', error.message);
      }
      const { data: existing } = await db().from('clientes').select('id').eq('owner_id', ownerId);
      const keep = new Set(rows.map(r => r.id));
      const toDelete = (existing || []).map(r => r.id).filter(id => !keep.has(id));
      if(toDelete.length) await db().from('clientes').delete().in('id', toDelete);
    }

    async function pushObras(){
      const rows = (state.obras || []).filter(o => o && o.id).map(o => ({
        id: o.id, owner_id: ownerId, nome: o.nome || '', codigo: o.codigo || '',
        cliente_id: o.clienteId || null, status: o.status || 'ativa', tipo: o.tipo || 'Residencial',
        area_construida: Number(o.area || 0)
      }));
      if(rows.length){
        const { error } = await db().from('obras').upsert(rows);
        if(error) return console.error('Erro ao sincronizar obras:', error.message);
      }
      const { data: existing } = await db().from('obras').select('id').eq('owner_id', ownerId);
      const keep = new Set(rows.map(r => r.id));
      const toDelete = (existing || []).map(r => r.id).filter(id => !keep.has(id));
      if(toDelete.length) await db().from('obras').delete().in('id', toDelete);
    }

    async function pushOrcamentoItens(){
      const rows = (state.orcamentos || []).filter(i => i && i.id).map(i => ({
        id: i.id, owner_id: ownerId, obra_id: i.obraId || null, etapa: i.etapa || '',
        composicao_id: i.composicaoId || null, codigo: i.codigo || '', descricao: i.descricao || '',
        quantidade: Number(i.quantidade || 0), custo_unitario: Number(i.unitario || 0),
        tipo: i.tipo || '', referencia: i.referencia || ''
      }));
      if(rows.length){
        const { error } = await db().from('orcamento_itens').upsert(rows);
        if(error) return console.error('Erro ao sincronizar itens de orçamento:', error.message);
      }
      const { data: existing } = await db().from('orcamento_itens').select('id').eq('owner_id', ownerId);
      const keep = new Set(rows.map(r => r.id));
      const toDelete = (existing || []).map(r => r.id).filter(id => !keep.has(id));
      if(toDelete.length) await db().from('orcamento_itens').delete().in('id', toDelete);
    }

    async function pushEmpresaConfig(){
      const b = state.brand || {};
      const row = {
        owner_id: ownerId, nome_empresa: b.nome || '', subtitulo: b.subtitulo || '',
        cor_primaria: b.cor || '#0f2e5e', cor_secundaria: b.corSecundaria || '#1f4f95', logo_url: b.logo || ''
      };
      const { error } = await db().from('empresa_config').upsert(row, { onConflict: 'owner_id' });
      if(error) console.error('Erro ao sincronizar config da empresa:', error.message);
    }

    async function pushAll(){
      if(!ownerId || pulling) return;
      try{
        await Promise.all([pushClientes(), pushObras(), pushOrcamentoItens(), pushEmpresaConfig()]);
      }catch(e){
        console.error('Falha ao sincronizar com a nuvem.', e);
      }
    }

    function scheduleCloudPush(){
      if(!ownerId || pulling) return;
      clearTimeout(pushTimer);
      pushTimer = setTimeout(pushAll, 800);
    }

    window.onCloudAuthReady = async function(cloudUser){
      ownerId = cloudUser.id;
      await pullCloudData();
    };

    if(typeof window.saveState === 'function'){
      const originalSaveState = window.saveState;
      window.saveState = function(){
        originalSaveState.apply(this, arguments);
        scheduleCloudPush();
      };
    }
  })();
