  (function(){
    if(window.__AUTH_ACCESS_MODULE_V1__) return;
    window.__AUTH_ACCESS_MODULE_V1__ = true;

    const AUTH_KEY = 'obra_nova_auth_v1';
    const SESSION_KEY = 'obra_nova_auth_session_v1';
    const SECTION_STORAGE_KEY = 'obra_nova_v68_section';
    const MENU_CATALOG = [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'cadastro', label: 'Cadastro' },
      { id: 'orcamentos', label: 'Orçamentos' },
      { id: 'almoxarife', label: 'Almoxarife' },
      { id: 'financeiro', label: 'Financeiro' },
      { id: 'rdo', label: 'RDO' },
      { id: 'concretagem', label: 'Concretagem' },
      { id: 'inteligencia', label: 'Inteligência Executiva' },
      { id: 'suprimentos_kanban', label: 'Painel Kanban' },
      { id: 'suprimentos_ia', label: 'Nova Solicitação IA' },
      { id: 'relatorios_compras', label: 'Relatórios de Compras' },
      { id: 'gestao_locacoes', label: 'Gestão de Locações' },
      { id: 'inventario', label: 'Inventário' },
      { id: 'medicao_contratos', label: 'Medição de Contratos' },
      { id: 'medicao_servicos', label: 'Medição de Serviços' },
      { id: 'prestadores_servico', label: 'Prestadores de Serviço' },
      { id: 'relatorios_medicoes', label: 'Relatórios de Medições' },
      { id: 'projetos_docs', label: 'Projetos' },
      { id: 'documentos', label: 'Documentos' },
      { id: 'painel_funcionarios', label: 'Painel de Funcionários' },
      { id: 'kanban_admissao', label: 'Kanban de Admissão' },
      { id: 'kanban_desligamento', label: 'Kanban de Desligamento' },
      { id: 'assistencia_tecnica', label: 'Assistência Técnica' },
      { id: 'checklist_repasse', label: 'Checklist de Repasse' },
      { id: 'sst_dashboard', label: 'Dashboard SST' },
      { id: 'sst_checklists', label: 'Checklists NR' },
      { id: 'sst_nc', label: 'Não Conformidades' },
      { id: 'sst_dds', label: 'DDS' },
      { id: 'sst_epis', label: 'Controle de EPIs' },
      { id: 'sst_treinamentos', label: 'Treinamentos NR' },
      { id: 'sst_pt', label: 'Permissão de Trabalho' },
      { id: 'sst_incidentes', label: 'Incidentes' },
      { id: 'sst_documentos', label: 'Documentos SST' },
      { id: 'sistema', label: 'Sistema' }
    ];
    const SECTION_LABELS = {
      dashboard: 'Dashboard',
      cadastro: 'Cadastro',
      orcamentos: 'Orçamentos',
      almoxarife: 'Almoxarife',
      financeiro: 'Financeiro',
      rdo: 'RDO',
      concretagem: 'Concretagem',
      inteligencia: 'Inteligência Executiva',
      suprimentos_kanban: 'Painel Kanban',
      suprimentos_ia: 'Nova Solicitação IA',
      relatorios_compras: 'Relatórios de Compras',
      gestao_locacoes: 'Gestão de Locações',
      inventario: 'Inventário',
      medicao_contratos: 'Medição de Contratos',
      medicao_servicos: 'Medição de Serviços',
      prestadores_servico: 'Prestadores de Serviço',
      relatorios_medicoes: 'Relatórios de Medições',
      projetos_docs: 'Projetos',
      documentos: 'Documentos',
      painel_funcionarios: 'Painel de Funcionários',
      kanban_admissao: 'Kanban de Admissão',
      kanban_desligamento: 'Kanban de Desligamento',
      assistencia_tecnica: 'Assistência Técnica',
      checklist_repasse: 'Checklist de Repasse',
      sst_dashboard: 'Dashboard SST',
      sst_checklists: 'Checklists NR',
      sst_nc: 'Não Conformidades',
      sst_dds: 'DDS',
      sst_epis: 'Controle de EPIs',
      sst_treinamentos: 'Treinamentos NR',
      sst_pt: 'Permissão de Trabalho',
      sst_incidentes: 'Incidentes',
      sst_documentos: 'Documentos SST',
      sistema: 'Sistema'
    };

    let authState = loadAuthState();
    let currentUser = null;
    let editingUserId = null;
    let authEventsBound = false;

    const originalShowSection = typeof window.showSection === 'function' ? window.showSection : null;

    function uidAuth(){
      if(window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
      return 'auth-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
    }

    function normalizeUsername(value){
      return String(value || '').trim().toLowerCase();
    }

    function allMenuIds(){
      return MENU_CATALOG.map(x => x.id);
    }

    function sanitizeMenus(list){
      const allowed = new Set(allMenuIds());
      const source = Array.isArray(list) ? list : [];
      const cleaned = source.filter(id => allowed.has(id));
      if(!cleaned.includes('dashboard')) cleaned.unshift('dashboard');
      return Array.from(new Set(cleaned));
    }

    function normalizeRole(value){
      return value === 'admin' ? 'admin' : 'usuario';
    }

    function defaultAdminUser(){
      return {
        id: uidAuth(),
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        menus: allMenuIds()
      };
    }

    function loadAuthState(){
      const raw = localStorage.getItem(AUTH_KEY);
      if(!raw){
        const initial = { users: [defaultAdminUser()] };
        localStorage.setItem(AUTH_KEY, JSON.stringify(initial));
        return initial;
      }
      try{
        const parsed = JSON.parse(raw);
        const users = Array.isArray(parsed?.users) ? parsed.users : [];
        const normalizedUsers = users
          .map(u => {
            const username = String(u?.username || '').trim();
            if(!username) return null;
            const role = normalizeRole(u?.role);
            return {
              id: u?.id || uidAuth(),
              username,
              password: String(u?.password || ''),
              role,
              menus: role === 'admin' ? allMenuIds() : sanitizeMenus(u?.menus)
            };
          })
          .filter(Boolean);
        if(!normalizedUsers.length){
          normalizedUsers.push(defaultAdminUser());
        }
        if(!normalizedUsers.some(u => u.role === 'admin')){
          normalizedUsers.push(defaultAdminUser());
        }
        const next = { users: normalizedUsers };
        localStorage.setItem(AUTH_KEY, JSON.stringify(next));
        return next;
      }catch(_){
        const fallback = { users: [defaultAdminUser()] };
        localStorage.setItem(AUTH_KEY, JSON.stringify(fallback));
        return fallback;
      }
    }

    function saveAuthState(){
      localStorage.setItem(AUTH_KEY, JSON.stringify(authState));
    }

    function getSessionUser(){
      const sessionId = localStorage.getItem(SESSION_KEY);
      if(!sessionId) return null;
      return authState.users.find(u => u.id === sessionId) || null;
    }

    function setSession(user){
      if(!user) return;
      currentUser = user;
      localStorage.setItem(SESSION_KEY, user.id);
      updateHeaderUser();
    }

    function clearSession(){
      currentUser = null;
      localStorage.removeItem(SESSION_KEY);
      updateHeaderUser();
    }

    function isAdmin(){
      return currentUser?.role === 'admin';
    }

    function getAllowedMenus(user){
      if(!user) return [];
      if(user.role === 'admin') return allMenuIds();
      return sanitizeMenus(user.menus);
    }

    function canAccessMenu(sectionId){
      return getAllowedMenus(currentUser).includes(sectionId);
    }

    function firstAllowedSection(){
      const allowed = getAllowedMenus(currentUser);
      for(const id of allowed){
        if(document.getElementById(id)) return id;
      }
      return document.getElementById('dashboard') ? 'dashboard' : '';
    }

    function updatePageTitle(sectionId){
      const title = SECTION_LABELS[sectionId] || 'Obra Nova';
      const pageTitle = document.getElementById('pageTitle');
      if(pageTitle) pageTitle.textContent = title;
    }

    function secureShowSection(sectionId, silent){
      if(!currentUser){
        if(!silent) alert('Realize o login para acessar o sistema.');
        showLoginOverlay();
        return;
      }
      if(!canAccessMenu(sectionId)){
        if(!silent) alert('Seu usuário não possui permissão para este menu.');
        const fallback = firstAllowedSection();
        if(fallback){
          if(originalShowSection) originalShowSection(fallback);
          updatePageTitle(fallback);
        }
        return;
      }
      if(originalShowSection) originalShowSection(sectionId);
      updatePageTitle(sectionId);
    }

    function applyMenuPermissions(){
      const allowed = new Set(getAllowedMenus(currentUser));
      document.querySelectorAll('.menu-item[data-section]').forEach(btn => {
        const section = btn.getAttribute('data-section');
        const visible = !!currentUser && allowed.has(section);
        btn.style.display = visible ? '' : 'none';
        btn.disabled = !visible;
        if(!visible) btn.classList.remove('active');
      });

      const activeSection = document.querySelector('.section.active');
      if(activeSection && !allowed.has(activeSection.id)){
        const fallback = firstAllowedSection();
        if(fallback) secureShowSection(fallback, true);
      }

      applyAccessPanelVisibility();
    }

    function applyAccessPanelVisibility(){
      const accessBtn = document.querySelector('.subtab[data-parent="sistema"][data-sub="sis-acessos"]');
      if(accessBtn) accessBtn.style.display = isAdmin() ? '' : 'none';

      const adminPanel = document.getElementById('authAdminPanel');
      const info = document.getElementById('authAdminOnly');
      if(!adminPanel || !info) return;
      if(isAdmin()){
        adminPanel.style.display = '';
        info.textContent = 'Administrador: defina usuários, perfil e menus liberados.';
      }else{
        adminPanel.style.display = 'none';
        info.textContent = 'Somente administradores podem alterar acessos.';
      }

      const activeAccessPanel = document.getElementById('sis-acessos');
      if(activeAccessPanel?.classList.contains('active') && !isAdmin()){
        if(typeof window.setSubtab === 'function') window.setSubtab('sistema', 'sis-config');
      }
    }

    function updateHeaderUser(){
      const label = document.getElementById('authUserLabel');
      const logoutBtn = document.getElementById('btnAuthLogout');
      if(label){
        if(currentUser){
          label.textContent = (currentUser.role === 'admin' ? 'Admin: ' : 'Usuário: ') + currentUser.username;
        }else{
          label.textContent = 'Não autenticado';
        }
      }
      if(logoutBtn){
        logoutBtn.style.display = currentUser ? '' : 'none';
      }
    }

    function ensureAuthStyles(){
      if(document.getElementById('authAccessStylesV1')) return;
      const style = document.createElement('style');
      style.id = 'authAccessStylesV1';
      style.textContent = `
        .auth-overlay{position:fixed;inset:0;background:rgba(5,12,23,.72);backdrop-filter:blur(3px);z-index:9999;display:none;align-items:center;justify-content:center;padding:18px}
        .auth-overlay.show{display:flex}
        .auth-card{width:100%;max-width:460px;background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:22px;box-shadow:var(--shadow)}
        .auth-card h2{margin:0 0 10px}
        .auth-user-tag{font-size:12px;color:var(--muted);max-width:170px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .auth-menu-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-top:8px}
        .auth-menu-item{display:flex;align-items:center;gap:8px;border:1px solid var(--line);background:var(--panel-2);padding:8px 10px;border-radius:10px;font-size:13px}
        .auth-menu-item input{width:auto;min-height:auto}
      `;
      document.head.appendChild(style);
    }

    function ensureHeaderAuthControls(){
      const topRight = document.querySelector('.top-right');
      if(!topRight) return;

      if(!document.getElementById('authUserLabel')){
        const label = document.createElement('div');
        label.id = 'authUserLabel';
        label.className = 'auth-user-tag';
        label.textContent = 'Não autenticado';
        topRight.insertBefore(label, topRight.firstChild);
      }

      if(!document.getElementById('btnAuthLogout')){
        const btn = document.createElement('button');
        btn.className = 'icon-btn';
        btn.id = 'btnAuthLogout';
        btn.type = 'button';
        btn.title = 'Sair';
        btn.textContent = '↩';
        topRight.appendChild(btn);
      }
    }

    function ensureLoginOverlay(){
      if(document.getElementById('authOverlay')) return;
      const overlay = document.createElement('div');
      overlay.id = 'authOverlay';
      overlay.className = 'auth-overlay';
      overlay.innerHTML = `
        <div class="auth-card">
          <h2>Login</h2>
          <div class="small-note" style="margin-bottom:12px;">Entre com seu e-mail e senha da conta na nuvem.</div>
          <div class="form-grid">
            <div><label>E-mail</label><input id="authLoginUser" type="email" autocomplete="username"></div>
            <div><label>Senha</label><input id="authLoginPass" type="password" autocomplete="current-password"></div>
          </div>
          <div id="authLoginError" class="small-note" style="color:var(--danger);display:none;"></div>
          <div class="actions">
            <button class="btn-primary" id="btnAuthLogin" type="button">Entrar</button>
            <button class="btn-secondary" id="btnAuthSignup" type="button">Criar conta</button>
          </div>
          <div class="small-note">Primeiro acesso? Informe e-mail e senha (mín. 6 caracteres) e clique em "Criar conta".</div>
        </div>
      `;
      document.body.appendChild(overlay);
    }

    function ensureAccessPanel(){
      const sistema = document.getElementById('sistema');
      if(!sistema) return;
      const subtabs = sistema.querySelector('.subtabs');
      if(subtabs && !subtabs.querySelector('.subtab[data-parent="sistema"][data-sub="sis-acessos"]')){
        const btn = document.createElement('button');
        btn.className = 'subtab';
        btn.dataset.parent = 'sistema';
        btn.dataset.sub = 'sis-acessos';
        btn.textContent = 'Acessos';
        btn.addEventListener('click', () => typeof window.setSubtab === 'function' && window.setSubtab('sistema', 'sis-acessos'));
        subtabs.appendChild(btn);
      }

      if(!document.getElementById('sis-acessos')){
        const panel = document.createElement('div');
        panel.id = 'sis-acessos';
        panel.className = 'subpanel';
        panel.innerHTML = `
          <div class="box">
            <h2>Acessos e Usuários</h2>
            <div id="authAdminOnly" class="small-note"></div>
            <div id="authAdminPanel">
              <div class="form-grid">
                <div><label>Usuário</label><input id="authUsuarioNome" placeholder="Nome de login"></div>
                <div><label>Senha</label><input id="authUsuarioSenha" type="password" placeholder="Nova senha"></div>
                <div><label>Perfil</label><select id="authUsuarioPerfil"><option value="usuario">Usuário</option><option value="admin">Administrador</option></select></div>
              </div>
              <div style="margin-top:12px;">
                <label>Menus liberados para usuário</label>
                <div id="authMenusChecks" class="auth-menu-grid"></div>
                <div class="small-note">Para administrador todos os menus são liberados automaticamente.</div>
              </div>
              <div class="actions">
                <button class="btn-primary" id="btnSalvarUsuarioAcesso" type="button">Salvar usuário</button>
                <button class="btn-secondary" id="btnNovoUsuarioAcesso" type="button">Novo usuário</button>
              </div>
            </div>
          </div>
          <div class="box">
            <h3>Usuários cadastrados</h3>
            <div id="authUsuariosTableWrap"></div>
          </div>
        `;
        sistema.appendChild(panel);
      }
    }

    function showLoginOverlay(){
      const overlay = document.getElementById('authOverlay');
      if(!overlay) return;
      overlay.classList.add('show');
      const userInput = document.getElementById('authLoginUser');
      const passInput = document.getElementById('authLoginPass');
      if(userInput) userInput.value = '';
      if(passInput) passInput.value = '';
      setTimeout(() => userInput?.focus(), 30);
    }

    function hideLoginOverlay(){
      const overlay = document.getElementById('authOverlay');
      if(!overlay) return;
      overlay.classList.remove('show');
    }

    function readSelectedMenus(){
      const checked = Array.from(document.querySelectorAll('input[name="authMenuItem"]:checked')).map(x => x.value);
      return sanitizeMenus(checked);
    }

    function renderAuthMenuChecks(preselected){
      const host = document.getElementById('authMenusChecks');
      if(!host) return;
      const role = document.getElementById('authUsuarioPerfil')?.value || 'usuario';
      const selectedSet = new Set(preselected || readSelectedMenus() || []);
      if(!selectedSet.size){
        selectedSet.add('dashboard');
        selectedSet.add('rdo');
      }
      const isRoleAdmin = role === 'admin';
      host.innerHTML = MENU_CATALOG.map(menu => {
        const checked = isRoleAdmin || selectedSet.has(menu.id);
        const disabled = isRoleAdmin || menu.id === 'dashboard';
        return `
          <label class="auth-menu-item">
            <input type="checkbox" name="authMenuItem" value="${menu.id}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}>
            <span>${menu.label}</span>
          </label>
        `;
      }).join('');
    }

    function resetAccessUserForm(){
      editingUserId = null;
      const name = document.getElementById('authUsuarioNome');
      const pass = document.getElementById('authUsuarioSenha');
      const role = document.getElementById('authUsuarioPerfil');
      if(name) name.value = '';
      if(pass) pass.value = '';
      if(role) role.value = 'usuario';
      renderAuthMenuChecks(['dashboard', 'rdo']);
    }

    function renderUsersTable(){
      const wrap = document.getElementById('authUsuariosTableWrap');
      if(!wrap) return;
      if(!isAdmin()){
        wrap.innerHTML = '<div class="empty">Somente administradores podem gerenciar usuários.</div>';
        return;
      }
      if(!authState.users.length){
        wrap.innerHTML = '<div class="empty">Nenhum usuário cadastrado.</div>';
        return;
      }
      wrap.innerHTML = `
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Usuário</th><th>Perfil</th><th>Menus</th><th>Ações</th></tr>
            </thead>
            <tbody>
              ${authState.users.map(user => {
                const menus = user.role === 'admin'
                  ? 'Todos'
                  : sanitizeMenus(user.menus).map(id => MENU_CATALOG.find(m => m.id === id)?.label || id).join(', ');
                const isCurrent = currentUser && user.id === currentUser.id;
                return `
                  <tr>
                    <td><strong>${user.username}</strong>${isCurrent ? ' <small>(você)</small>' : ''}</td>
                    <td>${user.role === 'admin' ? 'Administrador' : 'Usuário'}</td>
                    <td>${menus || '-'}</td>
                    <td>
                      <button class="btn-secondary" type="button" data-auth-action="edit" data-auth-id="${user.id}">Editar</button>
                      <button class="btn-danger" type="button" data-auth-action="delete" data-auth-id="${user.id}">Excluir</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    function loadUserForEdit(id){
      const user = authState.users.find(u => u.id === id);
      if(!user) return;
      editingUserId = id;
      const name = document.getElementById('authUsuarioNome');
      const pass = document.getElementById('authUsuarioSenha');
      const role = document.getElementById('authUsuarioPerfil');
      if(name) name.value = user.username;
      if(pass) pass.value = '';
      if(role) role.value = user.role;
      renderAuthMenuChecks(user.role === 'admin' ? allMenuIds() : sanitizeMenus(user.menus));
      if(typeof window.showSection === 'function') window.showSection('sistema');
      if(typeof window.setSubtab === 'function') window.setSubtab('sistema', 'sis-acessos');
    }

    function saveAccessUser(){
      if(!isAdmin()) return alert('Somente administradores podem salvar usuários.');

      const usernameRaw = document.getElementById('authUsuarioNome')?.value || '';
      const username = usernameRaw.trim();
      const passwordInput = document.getElementById('authUsuarioSenha')?.value || '';
      const role = normalizeRole(document.getElementById('authUsuarioPerfil')?.value);
      const usernameKey = normalizeUsername(username);
      if(username.length < 3) return alert('Informe um usuário com pelo menos 3 caracteres.');

      const duplicated = authState.users.find(u => normalizeUsername(u.username) === usernameKey && u.id !== editingUserId);
      if(duplicated) return alert('Já existe um usuário com esse nome.');

      const menus = role === 'admin' ? allMenuIds() : sanitizeMenus(readSelectedMenus());
      const isEditing = !!editingUserId;
      let target = isEditing ? authState.users.find(u => u.id === editingUserId) : null;
      if(isEditing && !target){
        editingUserId = null;
        return alert('Usuário não encontrado para edição.');
      }

      if(!isEditing && passwordInput.trim().length < 3){
        return alert('Informe uma senha com pelo menos 3 caracteres.');
      }
      if(isEditing && target.role === 'admin' && role !== 'admin'){
        const admins = authState.users.filter(u => u.role === 'admin' && u.id !== target.id);
        if(!admins.length) return alert('Precisa existir ao menos um administrador no sistema.');
      }

      if(!target){
        target = {
          id: uidAuth(),
          username,
          password: passwordInput.trim(),
          role,
          menus
        };
        authState.users.unshift(target);
      }else{
        target.username = username;
        target.role = role;
        target.menus = menus;
        if(passwordInput.trim()) target.password = passwordInput.trim();
      }

      saveAuthState();
      if(currentUser && currentUser.id === target.id){
        setSession(target);
      }
      resetAccessUserForm();
      renderUsersTable();
      applyMenuPermissions();
      alert('Usuário salvo com sucesso.');
    }

    function deleteAccessUser(id){
      if(!isAdmin()) return alert('Somente administradores podem excluir usuários.');
      const user = authState.users.find(u => u.id === id);
      if(!user) return;
      if(currentUser && currentUser.id === user.id) return alert('Não é permitido excluir o usuário logado.');
      if(user.role === 'admin'){
        const admins = authState.users.filter(u => u.role === 'admin');
        if(admins.length <= 1) return alert('Não é possível excluir o último administrador.');
      }
      if(!confirm(`Deseja excluir o usuário "${user.username}"?`)) return;
      authState.users = authState.users.filter(u => u.id !== id);
      saveAuthState();
      renderUsersTable();
      resetAccessUserForm();
    }

    function showAuthError(msg){
      const el = document.getElementById('authLoginError');
      if(!el) return;
      if(!msg){ el.style.display = 'none'; el.textContent = ''; return; }
      el.textContent = msg;
      el.style.display = '';
    }

    function provisionLocalUserForCloudSession(cloudUser){
      const username = normalizeUsername(cloudUser.email);
      let user = authState.users.find(u => normalizeUsername(u.username) === username);
      if(!user){
        user = { id: cloudUser.id, username: cloudUser.email, password: '', role: 'admin', menus: allMenuIds() };
        authState.users.unshift(user);
        saveAuthState();
      }
      return user;
    }

    async function completeCloudLogin(cloudUser){
      const user = provisionLocalUserForCloudSession(cloudUser);
      setSession(user);
      hideLoginOverlay();
      showAuthError('');
      applyMenuPermissions();
      renderUsersTable();
      if(typeof window.onCloudAuthReady === 'function'){
        await window.onCloudAuthReady(cloudUser);
      }
      const desired = localStorage.getItem(SECTION_STORAGE_KEY) || firstAllowedSection();
      secureShowSection(desired, true);
      closeMenuIfOpen();
    }

    async function attemptLogin(){
      const email = (document.getElementById('authLoginUser')?.value || '').trim();
      const password = document.getElementById('authLoginPass')?.value || '';
      if(!email || !password) return showAuthError('Informe e-mail e senha.');
      const btn = document.getElementById('btnAuthLogin');
      if(btn) btn.disabled = true;
      try{
        const { data, error } = await window.cloud.signIn(email, password);
        if(error) return showAuthError(error.message === 'Invalid login credentials' ? 'E-mail ou senha inválidos.' : error.message);
        await completeCloudLogin(data.user);
      }catch(e){
        showAuthError('Falha ao conectar. Verifique sua internet.');
      }finally{
        if(btn) btn.disabled = false;
      }
    }

    async function attemptSignup(){
      const email = (document.getElementById('authLoginUser')?.value || '').trim();
      const password = document.getElementById('authLoginPass')?.value || '';
      if(!email || !password) return showAuthError('Informe e-mail e senha.');
      if(password.length < 6) return showAuthError('A senha precisa ter ao menos 6 caracteres.');
      const btn = document.getElementById('btnAuthSignup');
      if(btn) btn.disabled = true;
      try{
        const { data, error } = await window.cloud.signUp(email, password);
        if(error) return showAuthError(error.message);
        if(data.session && data.user){
          await completeCloudLogin(data.user);
        }else{
          showAuthError('Conta criada. Verifique seu e-mail para confirmar o acesso, depois faça login.');
        }
      }catch(e){
        showAuthError('Falha ao conectar. Verifique sua internet.');
      }finally{
        if(btn) btn.disabled = false;
      }
    }

    function closeMenuIfOpen(){
      const drawer = document.getElementById('drawer');
      const overlay = document.getElementById('overlay');
      drawer?.classList.remove('open');
      overlay?.classList.remove('show');
    }

    function bindAuthEvents(){
      if(authEventsBound) return;
      authEventsBound = true;

      document.getElementById('btnAuthLogin')?.addEventListener('click', attemptLogin);
      document.getElementById('btnAuthSignup')?.addEventListener('click', attemptSignup);
      document.getElementById('authLoginPass')?.addEventListener('keydown', ev => {
        if(ev.key === 'Enter') attemptLogin();
      });
      document.getElementById('authLoginUser')?.addEventListener('keydown', ev => {
        if(ev.key === 'Enter') attemptLogin();
      });

      document.getElementById('btnAuthLogout')?.addEventListener('click', async () => {
        if(!confirm('Deseja sair da conta atual?')) return;
        try{ await window.cloud.signOut(); }catch(e){}
        clearSession();
        applyMenuPermissions();
        showLoginOverlay();
      });

      document.getElementById('btnSalvarUsuarioAcesso')?.addEventListener('click', saveAccessUser);
      document.getElementById('btnNovoUsuarioAcesso')?.addEventListener('click', resetAccessUserForm);
      document.getElementById('authUsuarioPerfil')?.addEventListener('change', () => renderAuthMenuChecks());

      document.getElementById('authUsuariosTableWrap')?.addEventListener('click', ev => {
        const btn = ev.target.closest('[data-auth-action]');
        if(!btn) return;
        const action = btn.getAttribute('data-auth-action');
        const id = btn.getAttribute('data-auth-id');
        if(!id) return;
        if(action === 'edit') loadUserForEdit(id);
        if(action === 'delete') deleteAccessUser(id);
      });

      const drawer = document.getElementById('drawer');
      if(drawer){
        const observer = new MutationObserver(() => applyMenuPermissions());
        observer.observe(drawer, { childList: true, subtree: true });
      }
    }

    async function initializeAuthModule(){
      ensureAuthStyles();
      ensureHeaderAuthControls();
      ensureLoginOverlay();
      ensureAccessPanel();
      bindAuthEvents();

      resetAccessUserForm();
      renderUsersTable();
      updateHeaderUser();

      window.showSection = function(sectionId){
        secureShowSection(sectionId, false);
      };
      window.restoreSection = function(){
        const desired = localStorage.getItem(SECTION_STORAGE_KEY) || firstAllowedSection();
        secureShowSection(desired, true);
      };

      applyMenuPermissions();

      try{
        const session = await window.cloud.getSession();
        if(session && session.user){
          await completeCloudLogin(session.user);
          return;
        }
      }catch(e){}
      showLoginOverlay();
    }

    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', initializeAuthModule);
    }else{
      initializeAuthModule();
    }
  })();
