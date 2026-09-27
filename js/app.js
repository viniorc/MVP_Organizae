(function () {
  'use strict';
  const S = window.OrgStorage;
  const T = window.OrgTasks;
  const app = document.getElementById('app');
  const modal = document.getElementById('modal');
  let screen = 'inicio';
  let selectedDiscipline = null;
  let selectedDay = T.dateKey();
  let calendarAnchor = T.dateKey();
  let calendarMode = 'agenda';
  let calendarDiscipline = '';
  let calendarType = '';
  let query = '';
  let dashboardFilter = null;
  const dashboardFilterLabels = { pending: 'Pendentes', urgent: 'Urgentes', week: 'Esta semana', done: 'Concluídas' };
  let onboardingStep = 'welcome';
  let previousFocus = null;
  let toastTimer;
  let lastDay = T.dateKey();

  const paths = {
    check: '<path d="m5 12 4 4L19 6"/>',
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 11h18m-13 5h2m4 0h2"/>',
    book: '<path d="M12 5v16M12 5C8 2 4 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-2-1-6-2-10 1Z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
    back: '<path d="m14 5-7 7 7 7"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    fire: '<path d="M13 2c1 6-5 6-3 11-3-1-4-3-4-5-5 5-3 13 5 14 9 0 11-9 7-13 0 4-2 4-3 5 1-5 1-8-2-12Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
    message: '<path d="M21 11a8 8 0 0 1-8 8H8l-5 3V6a3 3 0 0 1 3-3h7a8 8 0 0 1 8 8Z"/><path d="M7 8h9M7 12h6"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-11v1"/>',
    trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
    edit: '<path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14Z"/>',
    sparkle: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/>',
    leaf: '<path d="M20 3C8 2 3 8 5 15s15 5 15-12ZM5 21l10-12"/>'
  };
  function icon(name, cls = '') { return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.book}</svg>`; }
  function esc(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
  function brand() { return `<span class="brand"><span class="brand-mark">${icon('check')}</span><span>organiza<span class="brand-accent">ê</span><span class="brand-dot">.</span></span></span>`; }
  function disciplineName(id) { return S.get().disciplinas.find(d => d.id === id)?.nome || 'Disciplina'; }
  function disciplineColor(id) { return ['purple', 'teal', 'peach', 'blue'][Math.max(0, S.get().disciplinas.findIndex(d => d.id === id)) % 4]; }
  function pill(task) { return `<span class="priority priority-${esc(task.prioridade)}"><span class="tiny-dot"></span>${T.priorityNames[task.prioridade]} prioridade</span>`; }
  function due(task) { const d = T.deadline(task); return `<span class="due ${d.tone}"><span class="tiny-dot"></span>${d.text}</span>`; }
  function toast(message) {
    clearTimeout(toastTimer);
    const region = document.getElementById('toasts');
    region.innerHTML = `<div class="toast">${esc(message)}</div>`;
    toastTimer = setTimeout(() => { region.innerHTML = ''; }, 3400);
  }
  function commit(change) {
    if (S.update(change)) return true;
    toast(S.warning());
    return false;
  }
  function emptyState(title, description, action = '') {
    return `<div class="empty-state"><span class="empty-icon">${icon('leaf')}</span><h3>${title}</h3><p>${description}</p>${action}</div>`;
  }
  function button(label, action, style = 'primary', extra = '', symbol = 'plus') {
    return `<button type="button" class="button ${style}" data-action="${action}" ${extra}>${symbol ? icon(symbol) : ''}${label}</button>`;
  }
  function taskCard(task, extraClass = '') {
    return `<button class="task-card ${extraClass} tone-${T.deadline(task).tone}" data-action="details" data-id="${esc(task.id)}"><span class="task-title">${esc(task.titulo)}</span><span class="discipline-label"><span class="subject-dot ${disciplineColor(task.disciplinaId)}"></span>${esc(disciplineName(task.disciplinaId))}</span><span class="task-meta">${due(task)}<span class="meta-separator">·</span><span>${icon('clock')}${T.duration(task.tempoEstimado)}</span></span>${pill(task)}</button>`;
  }
  function taskRow(task, checkbox = false) {
    return `<div class="task-row ${task.status === 'concluida' ? 'is-complete' : ''}" data-task-row="${esc(task.id)}">${checkbox ? `<input class="task-checkbox" type="checkbox" data-complete="${esc(task.id)}" aria-label="Concluir ${esc(task.titulo)}" ${task.status === 'concluida' ? 'checked disabled' : ''}>` : `<span class="type-icon ${disciplineColor(task.disciplinaId)}" aria-hidden="true">${T.types[task.tipo]?.[0] || '📄'}</span>`}<button class="row-content" data-action="details" data-id="${esc(task.id)}"><span class="row-title">${esc(task.titulo)}</span><span class="row-subtitle">${esc(disciplineName(task.disciplinaId))}<span>·</span>${T.duration(task.tempoEstimado)}${task.horarioPlanejado && checkbox ? `<span>·</span>${esc(task.horarioPlanejado)}` : ''}</span></button>${checkbox ? '' : `<span class="row-due">${due(task)}</span>`}</div>`;
  }
  function renderWelcome() {
    app.innerHTML = `<div class="onboarding"><header class="welcome-header">${brand()}<span class="prototype-label">Um passo de cada vez.</span></header><main id="main" class="welcome-main" tabindex="-1"><div class="welcome-copy"><span class="eyebrow">MAIS CLAREZA. MENOS CORRERIA.</span><h1>Sua vida acadêmica sem virar uma <span class="highlight-word">bagunça.</span></h1><p class="welcome-description">Centralize atividades, acompanhe prazos e descubra o que precisa da sua atenção primeiro.</p><div class="welcome-actions">${button('Começar gratuitamente', 'start', 'primary', '', 'arrow')}${button('Experimentar com dados de exemplo', 'demo', 'secondary', '', 'sparkle')}</div><p class="welcome-note">Sua rotina acadêmica em ordem.</p></div><div class="welcome-preview" aria-hidden="true"><div class="preview-heading"><span class="preview-mark">${icon('sun')}</span><div><strong>Espaço para focar.</strong><span>Um dia de cada vez.</span></div><span class="preview-stamp">${icon('check')}</span></div><div class="preview-window"><div class="preview-window-top"><span>Seu próximo passo</span><span class="tiny-dot"></span></div><div class="preview-task"><span class="preview-check"></span><div><strong>Trabalho de MUDE</strong><span>MUDE · 2h</span></div><span class="preview-tag">Amanhã</span></div><div class="preview-task"><span class="preview-check checked">${icon('check')}</span><div><strong class="strike">Revisar anotações</strong><span>Mais uma coisa em ordem.</span></div></div><div class="preview-week">${['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, i) => `<span class="${i === 2 ? 'selected' : ''}">${d}<b>${icon(i === 2 ? 'check' : 'plus')}</b></span>`).join('')}</div></div><div class="preview-caption">${icon('leaf')} Menos na cabeça. Mais no seu ritmo.</div></div></main><section class="benefits" aria-label="Por que usar o Organizaê"><div><span class="benefit-icon purple">${icon('book')}</span><h2>Tudo em um lugar</h2><p>Suas atividades acadêmicas organizadas.</p></div><div><span class="benefit-icon peach">${icon('clock')}</span><h2>Prazos visíveis</h2><p>Veja rapidamente o que está próximo da entrega.</p></div><div><span class="benefit-icon teal">${icon('target')}</span><h2>Prioridades claras</h2><p>Saiba o que precisa da sua atenção primeiro.</p></div></section><footer class="welcome-footer">Organizaê · Protótipo acadêmico MUDE</footer></div>`;
  }
  function profileFields() {
    return `<div class="field"><label for="profile-name">Como podemos chamar você?</label><input id="profile-name" name="nome" placeholder="Seu nome ou apelido" autocomplete="given-name" maxlength="60" required></div><div class="field"><label for="profile-course">Qual seu curso?</label><input id="profile-course" name="curso" placeholder="Ex.: Ciência da Computação" maxlength="100" required></div><div class="field"><label for="profile-semester">Em qual semestre está?</label><select id="profile-semester" name="semestre" required><option value="">Selecione seu semestre</option>${Array.from({ length: 10 }, (_, i) => `<option value="${i + 1}">${i + 1}º semestre${i === 9 ? ' ou mais' : ''}</option>`).join('')}</select></div>`;
  }
  function renderProfile() {
    app.innerHTML = `<div class="onboarding"><header class="welcome-header">${brand()}</header><main id="main" class="profile-main" tabindex="-1">${button('Voltar', 'welcome', 'text-button', '', 'back')}<div class="profile-card"><span class="large-icon purple">${icon('sparkle')}</span><span class="eyebrow">VAMOS NOS CONHECER</span><h1>Antes de começar...</h1><p>Deixe esse espaço com a sua cara.</p><form id="profile-form" novalidate>${profileFields()}<p class="form-error" role="alert"></p><button class="button primary full-width" type="submit">Organizar minha rotina${icon('arrow')}</button></form></div></main></div>`;
  }
  const navigation = [['inicio', 'home', 'Início'], ['prioridades', 'target', 'Prioridades'], ['calendario', 'calendar', 'Calendário'], ['disciplinas', 'book', 'Disciplinas']];
  function navItem([route, symbol, label]) {
    const active = screen === route || (screen === 'disciplina' && route === 'disciplinas');
    return `<button class="nav-item ${active ? 'active' : ''}" data-action="navigate" data-screen="${route}" ${active ? 'aria-current="page"' : ''}>${icon(symbol)}<span>${label}</span>${active ? '<span class="nav-dot"></span>' : ''}</button>`;
  }
  function render() {
    if (!S.get().perfil?.onboardingConcluido) {
      if (onboardingStep === 'profile') renderProfile(); else renderWelcome();
      return;
    }
    const profile = S.get().perfil;
    app.innerHTML = `<aside class="sidebar">${brand()}<p class="sidebar-slogan">Sua rotina acadêmica em ordem.</p><span class="nav-caption">MEU ESPAÇO</span><nav aria-label="Navegação principal">${navigation.map(navItem).join('')}</nav>${button('Nova atividade', 'new-task', 'primary sidebar-add')}<div class="sidebar-bottom"><div class="sidebar-message"><span>${icon('leaf')}</span><strong>Um passo de cada vez.</strong><p>Organize o que precisa fazer.<br>Abra espaço para o resto.</p></div><button class="feedback-link" data-action="feedback">${icon('message')}Avaliar experiência</button>${S.get().demonstracao ? '<button class="demo-clear" data-action="clear-demo">Limpar dados de demonstração</button>' : ''}<div class="sidebar-profile"><span class="avatar">${esc(profile.nome[0]?.toUpperCase() || 'O')}</span><span><strong>${esc(profile.nome)}</strong><small>${esc(profile.curso)} · ${esc(profile.semestre)}º semestre</small></span><span class="profile-dot"></span></div></div></aside><div class="workspace"><header class="topbar"><div class="mobile-brand">${brand()}</div><div class="breadcrumb">Meu espaço <span>/</span> <strong>${screen === 'disciplina' ? 'Disciplinas' : navigation.find(n => n[0] === screen)?.[2] || 'Início'}</strong></div><div class="topbar-date">${icon('calendar')}<span>${T.formatDate(T.dateKey(), { weekday: 'short', day: 'numeric', month: 'long' })}</span></div><button class="mobile-feedback icon-button" data-action="feedback" aria-label="Avaliar experiência">${icon('message')}</button></header><main id="main" class="main-content" tabindex="-1">${screenContent()}</main><footer class="app-footer"><span>Feito para uma rotina com mais clareza.</span><span>Organizaê · MVP acadêmico</span>${S.get().demonstracao ? '<button class="mobile-demo-clear" data-action="clear-demo">Limpar dados de demonstração</button>' : ''}</footer></div><nav class="bottom-nav" aria-label="Navegação principal no celular">${navigation.slice(0, 2).map(navItem).join('')}<button class="mobile-add" data-action="new-task" aria-label="Nova atividade">${icon('plus')}</button>${navigation.slice(2).map(navItem).join('')}</nav>`;
    document.title = `${screen === 'disciplina' ? disciplineName(selectedDiscipline) : navigation.find(n => n[0] === screen)?.[2] || 'Organizaê'} · Organizaê`;
  }
  function screenContent() {
    if (screen === 'prioridades') return prioritiesView();
    if (screen === 'calendario') return calendarView();
    if (screen === 'disciplinas') return disciplinesView();
    if (screen === 'disciplina') return disciplineView();
    return dashboardView();
  }
  function dashboardView() {
    const state = S.get();
    const counts = T.counts(state.atividades);
    return `<div class="page-heading dashboard-heading"><div><div class="eyebrow">SUA ROTINA, COM MAIS LEVEZA</div><h1>Olá, ${esc(state.perfil.nome)} <span class="wave">👋</span></h1><p>Veja como está sua semana.</p></div><span class="today-tag">${icon('sun')} Um bom dia para se organizar</span></div><div class="search-wrap">${icon('search')}<label class="sr-only" for="task-search">Buscar atividade ou disciplina</label><input id="task-search" type="search" placeholder="Buscar atividade ou disciplina" value="${esc(query)}" autocomplete="off"><span class="search-hint">Tudo no seu lugar</span></div><div class="stats">${[['pending', 'book', 'Pendentes', 'purple', 'Para colocar em dia'], ['urgent', 'fire', 'Urgentes', 'red', 'Pedem sua atenção'], ['week', 'calendar', 'Esta semana', 'blue', 'Entregas nos próximos 7 dias'], ['done', 'check', 'Concluídas', 'teal', 'Uma coisa a menos']].map(([key, symbol, label, color, caption]) => `<button type="button" class="stat-card ${dashboardFilter === key ? 'is-active' : ''}" data-action="filter-dashboard" data-filter="${key}" aria-pressed="${dashboardFilter === key}" aria-controls="dashboard-results"><span class="stat-icon ${color}">${icon(symbol)}</span><span class="stat-label">${label}</span><strong data-count="${key}">${counts[key]}</strong><small>${caption}</small></button>`).join('')}</div><div id="dashboard-results">${dashboardResults()}</div>`;
  }
  function dashboardResults() {
    const state = S.get();
    if (dashboardFilter) {
      const filtered = T.dashboardTasks(state.atividades, dashboardFilter);
      const sorted = dashboardFilter === 'done' ? filtered : T.ordered(filtered);
      const found = T.search(sorted, state.disciplinas, query);
      const messages = {
        pending: 'Nenhuma atividade pendente no momento.',
        urgent: 'Nenhum prazo urgente no momento.',
        week: 'Nenhuma atividade pendente com entrega nos próximos 7 dias.',
        done: 'As atividades que você concluir vão aparecer aqui.'
      };
      return `<section class="section"><div class="section-heading dashboard-filter-heading"><h2>${dashboardFilterLabels[dashboardFilter]}<span class="count-badge" role="status">${found.length}</span></h2><button class="text-link" data-action="clear-dashboard-filter">${icon('back')}Voltar à visão geral</button></div>${found.length ? `<div class="task-grid">${found.map(task => taskCard(task)).join('')}</div>` : emptyState('Nenhuma atividade encontrada.', query.trim() ? 'Tente buscar por outro título ou disciplina neste filtro.' : messages[dashboardFilter])}</section>`;
    }
    if (query.trim()) {
      const found = T.search(state.atividades, state.disciplinas, query);
      return `<section class="section"><div class="section-heading"><h2>Resultados da busca <span class="count-badge">${found.length}</span></h2></div>${found.length ? `<div class="task-grid search-results">${found.map(t => taskCard(t)).join('')}</div>` : emptyState('Nenhuma atividade encontrada.', 'Tente buscar por outro título ou disciplina.')}</section>`;
    }
    if (!state.atividades.length) return emptyState('👋 Sua rotina ainda está vazia.', 'Cadastre sua primeira atividade e comece a organizar sua semana.', button('Adicionar primeira atividade', 'new-task'));
    const ordered = T.ordered(state.atividades);
    const today = state.atividades.filter(t => t.diaPlanejado === T.dateKey()).sort((a, b) => a.status.localeCompare(b.status) || (a.horarioPlanejado || '99').localeCompare(b.horarioPlanejado || '99'));
    const noUrgency = !T.counts(state.atividades).urgent;
    return `${noUrgency ? '<div class="calm-banner"><span>🎉</span><div><strong>Tudo tranquilo por aqui.</strong><p>Nenhum prazo urgente no momento.</p></div></div>' : ''}<section class="section attention-section"><div class="section-heading"><h2>${icon('fire', 'red-text')}Precisa da sua atenção</h2><button class="text-link" data-action="navigate" data-screen="prioridades">Ver prioridades${icon('arrow')}</button></div>${ordered.length ? `<div class="attention-grid">${ordered.slice(0, 3).map(t => taskCard(t)).join('')}</div>` : '<div class="small-empty">Todas as atividades estão concluídas. Aproveite esse respiro! 🌿</div>'}</section><div class="dashboard-columns"><section class="panel today-panel"><div class="section-heading"><h2>${icon('sun', 'orange-text')}Para hoje<span class="count-badge">${today.filter(t => t.status === 'pendente').length}</span></h2><span class="section-date">${T.formatDate(T.dateKey(), { day: 'numeric', month: 'short' })}</span></div>${today.length ? `<div class="today-list">${today.map(t => taskRow(t, true)).join('')}</div>` : '<div class="small-empty">Seu dia tem espaço.<br>Escolha uma atividade e planeje seu próximo passo.</div>'}<button class="panel-bottom-link" data-action="plan">${icon('plus')}Planejar atividade para hoje</button></section><section class="panel deadlines-panel"><div class="section-heading"><h2>${icon('clock', 'purple-text')}Próximos prazos</h2><span class="subtle-label">NO SEU RADAR</span></div>${deadlineGroups(ordered)}</section></div><div class="feedback-banner"><span class="feedback-banner-icon">${icon('message')}</span><div><strong>Sua opinião ajuda a dar o próximo passo.</strong><p>Como o Organizaê pode fazer parte da sua rotina?</p></div><button class="text-link" data-action="feedback">Avaliar experiência${icon('arrow')}</button></div>`;
  }
  function deadlineGroups(tasks) {
    if (!tasks.length) return '<div class="small-empty">Nenhum prazo pendente por aqui.</div>';
    const groups = new Map();
    tasks.slice().sort((a, b) => a.dataEntrega.localeCompare(b.dataEntrega)).forEach(task => {
      const label = T.deadline(task).text.replace('Faltam ', 'Em ');
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(task);
    });
    return `<div class="deadline-timeline">${Array.from(groups).map(([label, tasks]) => `<div class="deadline-group"><span class="timeline-dot ${T.deadline(tasks[0]).tone}"></span><h3>${label}</h3>${tasks.map(t => `<button class="deadline-entry" data-action="details" data-id="${esc(t.id)}"><span><strong>${esc(t.titulo)}</strong><small>${esc(disciplineName(t.disciplinaId))}</small></span>${icon('chevron')}</button>`).join('')}</div>`).join('')}</div>`;
  }
  function prioritiesView() {
    const tasks = T.ordered(S.get().atividades);
    const groups = [tasks.filter(t => T.daysUntil(t.dataEntrega) < 0 || T.score(t) >= 85), tasks.filter(t => T.daysUntil(t.dataEntrega) >= 0 && T.score(t) >= 50 && T.score(t) < 85), tasks.filter(t => T.daysUntil(t.dataEntrega) >= 0 && T.score(t) < 50)];
    return `<div class="page-heading"><div class="eyebrow">UM PASSO DE CADA VEZ</div><h1>🎯 O que fazer primeiro?</h1><p>Uma ordem para ajudar você a começar.</p></div><details class="calculation"><summary>${icon('info')}Como isso foi calculado?</summary><p>Consideramos o prazo da atividade e a prioridade informada por você para ajudar a organizar a ordem das tarefas.</p><p>Atividades atrasadas aparecem primeiro. Depois, seguimos a pontuação de prazo e prioridade; em empate, o prazo mais próximo e a atividade criada primeiro.</p></details>${tasks.length ? groups.map((group, index) => group.length ? `<section class="section priority-section"><div class="section-heading"><h2><span class="step-marker step-${index}">${icon(['fire', 'arrow', 'leaf'][index])}</span>${['Faça primeiro', 'Faça em seguida', 'Pode esperar'][index]}<span class="count-badge">${group.length}</span></h2></div><div class="task-grid">${group.map(t => taskCard(t)).join('')}</div></section>` : '').join('') : emptyState('🎉 Tudo tranquilo por aqui.', 'Você não tem atividades pendentes.', button('Nova atividade', 'new-task'))}`;
  }
  function filteredCalendarTasks() {
    return T.filterCalendar(S.get().atividades, calendarDiscipline, calendarType);
  }
  function activityCount(count) { return `${count} ${count === 1 ? 'atividade' : 'atividades'}`; }
  function calendarContext(entry) {
    if (entry.context === 'planned-due') return 'Planejado · Entrega';
    return entry.context === 'planned' ? 'Planejado' : 'Entrega';
  }
  function calendarEntry(entry, allowComplete = false) {
    const task = entry.task;
    const planned = entry.context.startsWith('planned');
    const time = planned ? T.timeRange(task) : 'Prazo de entrega';
    return `<div class="calendar-entry ${task.status === 'concluida' ? 'is-complete' : ''}">${allowComplete ? `<input class="task-checkbox" type="checkbox" data-complete="${esc(task.id)}" aria-label="Concluir ${esc(task.titulo)}" ${task.status === 'concluida' ? 'checked disabled' : ''}>` : `<span class="type-icon ${disciplineColor(task.disciplinaId)}" aria-hidden="true">${T.types[task.tipo]?.[0] || '📄'}</span>`}<button class="calendar-entry-content" data-action="details" data-id="${esc(task.id)}"><span class="calendar-entry-time">${icon(planned ? 'clock' : 'calendar')}${esc(time)}</span><strong>${esc(task.titulo)}</strong><span>${esc(disciplineName(task.disciplinaId))} · ${T.duration(task.tempoEstimado)}</span></button><span class="calendar-context context-${entry.context}">${calendarContext(entry)}</span></div>`;
  }
  function calendarControls() {
    const activeFilters = Number(Boolean(calendarDiscipline)) + Number(Boolean(calendarType));
    return `<div class="calendar-toolbar"><div class="calendar-modes" role="tablist" aria-label="Visualização do calendário">${[['agenda', 'Agenda'], ['week', 'Semana'], ['month', 'Mês'], ['semester', 'Semestre']].map(([mode, label]) => `<button type="button" role="tab" aria-selected="${calendarMode === mode}" class="calendar-mode ${calendarMode === mode ? 'active' : ''}" data-action="calendar-mode" data-mode="${mode}">${label}</button>`).join('')}</div><div class="calendar-tools">${button('Hoje', 'calendar-today', 'secondary compact-button', '', '')}${button('Ir para data', 'calendar-goto', 'secondary compact-button', '', 'calendar')}<button type="button" class="button secondary compact-button ${activeFilters ? 'has-filter' : ''}" data-action="calendar-filters">${icon('search')}Filtros${activeFilters ? `<span class="filter-count">${activeFilters}</span>` : ''}</button></div></div>`;
  }
  function calendarView() {
    return `<div class="page-heading calendar-heading"><div><div class="eyebrow">SEU TEMPO, EM PERSPECTIVA</div><h1>📅 Calendário</h1><p>Organize seus próximos dias.</p></div></div>${calendarControls()}<div id="calendar-content">${calendarModeContent()}</div>`;
  }
  function calendarModeContent() {
    if (calendarMode === 'week') return calendarWeekView();
    if (calendarMode === 'month') return calendarMonthView();
    if (calendarMode === 'semester') return calendarSemesterView();
    return calendarAgendaView();
  }
  function calendarAgendaView() {
    const tasks = filteredCalendarTasks();
    const today = T.dateKey();
    const entries = [];
    tasks.forEach(task => {
      if (task.diaPlanejado && task.diaPlanejado >= today) entries.push({ task, context: task.diaPlanejado === task.dataEntrega ? 'planned-due' : 'planned', day: task.diaPlanejado });
      if (task.dataEntrega >= today && task.dataEntrega !== task.diaPlanejado) entries.push({ task, context: 'due', day: task.dataEntrega });
    });
    entries.sort((a, b) => a.day.localeCompare(b.day) || (a.task.horarioPlanejado || '99:99').localeCompare(b.task.horarioPlanejado || '99:99'));
    if (!entries.length) return emptyState('Não há atividades futuras neste período.', 'Novos planejamentos e prazos vão aparecer aqui automaticamente.');
    const months = new Map();
    entries.forEach(entry => {
      const month = entry.day.slice(0, 7);
      if (!months.has(month)) months.set(month, new Map());
      const days = months.get(month);
      if (!days.has(entry.day)) days.set(entry.day, []);
      days.get(entry.day).push(entry);
    });
    return `<div class="agenda-list" aria-label="Próximos compromissos">${Array.from(months, ([month, days]) => `<section class="agenda-month"><h2>${T.formatDate(`${month}-01`, { month: 'long', year: 'numeric' })}</h2>${Array.from(days, ([day, dayEntries]) => `<div class="agenda-day" id="agenda-${day}"><div class="agenda-date"><span>${T.formatDate(day, { weekday: 'short' }).replace('.', '')}</span><strong>${T.fromKey(day).getDate()}</strong><small>${activityCount(new Set(dayEntries.map(entry => entry.task.id)).size)}</small></div><div class="agenda-entries">${dayEntries.map(entry => calendarEntry(entry)).join('')}</div></div>`).join('')}</section>`).join('')}</div>`;
  }
  function loadClass(count) { return count === 0 ? 'free' : count === 1 ? 'low' : count === 2 ? 'moderate' : count === 3 ? 'higher' : 'high'; }
  function dayLoadLabel(count) { return count ? activityCount(count) : '🌿 Livre'; }
  function periodHeader(label, previousAction, nextAction, previousLabel, nextLabel) {
    return `<div class="calendar-period"><button class="icon-button" data-action="${previousAction}" aria-label="${previousLabel}">${icon('back')}</button><h2>${label}</h2><button class="icon-button next-icon" data-action="${nextAction}" aria-label="${nextLabel}">${icon('chevron')}</button></div>`;
  }
  function calendarDayDetail(day, tasks, allowComplete = false) {
    const entries = T.calendarEntries(tasks, day);
    const unique = new Set(entries.map(entry => entry.task.id)).size;
    const title = T.formatDate(day, { weekday: 'long', day: 'numeric', month: 'long' });
    if (!entries.length) return `<section class="panel calendar-day-panel"><div class="section-heading"><h2 class="capitalize">${title}</h2><span class="free-badge">🌿 Dia livre</span></div><div class="free-day"><span class="large-icon teal">${icon('leaf')}</span><h3>🌿 Dia livre</h3><p>Nenhuma atividade planejada.</p><p>Você pode deixar esse dia livre ou planejar uma atividade.</p>${button('Planejar neste dia', 'plan-selected-day', 'secondary', `data-day="${day}"`)}</div></section>`;
    return `<section class="panel calendar-day-panel"><div class="section-heading"><div><h2 class="capitalize">${title}</h2><p>${activityCount(unique)} neste dia</p></div><span class="count-badge">${unique}</span></div><div class="calendar-entry-list">${entries.map(entry => calendarEntry(entry, allowComplete)).join('')}</div></section>`;
  }
  function calendarWeekView() {
    const days = T.week(calendarAnchor);
    if (!days.includes(selectedDay)) selectedDay = days.includes(calendarAnchor) ? calendarAnchor : days[0];
    const tasks = filteredCalendarTasks();
    const weekTasks = new Map();
    days.forEach(day => T.dayTasks(tasks, day).forEach(task => weekTasks.set(task.id, task)));
    const planned = tasks.filter(task => task.diaPlanejado && days.includes(task.diaPlanejado));
    const minutes = planned.reduce((sum, task) => sum + Number(task.tempoEstimado || 0), 0);
    const label = `${T.formatDate(days[0], { day: 'numeric' })} — ${T.formatDate(days[6], { day: 'numeric', month: 'short' })}`;
    return `${periodHeader(label, 'previous-week', 'next-week', 'Semana anterior', 'Próxima semana')}<div class="week-strip calendar-week-strip" role="group" aria-label="Todos os dias desta semana">${days.map(day => { const count = T.dayTasks(tasks, day).length; return `<button class="day-button load-${loadClass(count)} ${day === selectedDay ? 'selected' : ''} ${day === T.dateKey() ? 'is-today' : ''}" data-action="select-calendar-day" data-day="${day}" aria-pressed="${day === selectedDay}" aria-label="${T.formatDate(day, { weekday: 'long', day: 'numeric', month: 'long' })}: ${dayLoadLabel(count)}"><span>${T.formatDate(day, { weekday: 'short' }).replace('.', '')}</span><strong>${T.fromKey(day).getDate()}</strong><small>${dayLoadLabel(count)}</small><i aria-hidden="true"></i></button>`; }).join('')}</div><div class="week-summary"><strong>Sua semana</strong><span>${activityCount(weekTasks.size)}${minutes ? ` · aproximadamente ${Math.round(minutes / 6) / 10}h planejadas` : ''}</span></div>${calendarDayDetail(selectedDay, tasks, true)}`;
  }
  function calendarMonthView() {
    const month = T.monthStart(calendarAnchor);
    const tasks = filteredCalendarTasks();
    const days = T.monthGrid(month);
    const label = T.formatDate(month, { month: 'long', year: 'numeric' });
    const weekdays = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];
    return `${periodHeader(label, 'previous-month', 'next-month', 'Mês anterior', 'Próximo mês')}<div class="month-calendar"><div class="month-weekdays" aria-hidden="true">${weekdays.map(day => `<span>${day}</span>`).join('')}</div><div class="month-grid">${days.map(day => { const count = T.dayTasks(tasks, day).length; const outside = day.slice(0, 7) !== month.slice(0, 7); return `<button class="month-day load-${loadClass(count)} ${outside ? 'outside' : ''} ${day === selectedDay ? 'selected' : ''} ${day === T.dateKey() ? 'is-today' : ''}" data-action="select-month-day" data-day="${day}" aria-pressed="${day === selectedDay}" aria-label="${T.formatDate(day, { weekday: 'long', day: 'numeric', month: 'long' })}: ${dayLoadLabel(count)}"><strong>${T.fromKey(day).getDate()}</strong><span>${count ? count : '🌿'}</span><small>${count ? (count === 1 ? 'atividade' : 'atividades') : 'Livre'}</small></button>`; }).join('')}</div></div>${calendarDayDetail(selectedDay, tasks, false)}`;
  }
  function calendarSemesterView() {
    const first = T.monthStart(calendarAnchor);
    const months = Array.from({ length: 6 }, (_, index) => T.addMonths(index, first));
    const tasks = filteredCalendarTasks();
    const last = months[5];
    const label = `${T.formatDate(first, { month: 'long', year: 'numeric' })} — ${T.formatDate(last, { month: 'long', year: 'numeric' })}`;
    const typePlural = { prova: 'provas', trabalho: 'trabalhos', atividade: 'atividades', estudo: 'estudos', seminario: 'seminários', outro: 'outros' };
    return `${periodHeader(label, 'previous-semester', 'next-semester', 'Período anterior', 'Próximo período')}<div class="semester-grid">${months.map(month => { const monthTasks = tasks.filter(task => task.dataEntrega.slice(0, 7) === month.slice(0, 7)); const summaries = Object.keys(T.types).map(type => [type, monthTasks.filter(task => task.tipo === type).length]).filter(([, count]) => count).slice(0, 3); return `<button class="semester-card" data-action="open-calendar-month" data-month="${month}"><span class="semester-card-top"><span>${T.formatDate(month, { month: 'long' })}</span><small>${T.fromKey(month).getFullYear()}</small>${icon('chevron')}</span><strong>${activityCount(monthTasks.length)}</strong><span>${summaries.length ? summaries.map(([type, count]) => `${count} ${typePlural[type]}`).join(' · ') : 'Nenhuma atividade neste mês'}</span></button>`; }).join('')}</div>`;
  }
  function disciplinesView() {
    const state = S.get();
    return `<div class="page-heading heading-with-action"><div><div class="eyebrow">CADA COISA EM SEU LUGAR</div><h1>📚 Minhas disciplinas</h1><p>Um espaço para cada parte da sua jornada.</p></div>${button('Nova disciplina', 'new-discipline')}</div>${state.disciplinas.length ? `<div class="discipline-grid">${state.disciplinas.map(d => { const counts = T.counts(state.atividades.filter(t => t.disciplinaId === d.id)); return `<button class="discipline-card" data-action="open-discipline" data-id="${esc(d.id)}"><span class="discipline-card-top"><span class="large-icon ${disciplineColor(d.id)}">${icon('book')}</span>${icon('chevron')}</span><h2>${esc(d.nome)}</h2><span class="discipline-counts"><span><b>${counts.pending}</b> ${counts.pending === 1 ? 'pendente' : 'pendentes'}</span><span class="done-count">${icon('check')}<b>${counts.done}</b> ${counts.done === 1 ? 'concluída' : 'concluídas'}</span></span></button>`; }).join('')}</div>` : emptyState('Suas disciplinas começam aqui.', 'Adicione uma disciplina para reunir suas atividades.', button('Nova disciplina', 'new-discipline'))}`;
  }
  function disciplineView() {
    const tasks = S.get().atividades.filter(t => t.disciplinaId === selectedDiscipline);
    const pending = T.ordered(tasks);
    const done = tasks.filter(t => t.status === 'concluida');
    return `${button('Minhas disciplinas', 'navigate', 'text-button', 'data-screen="disciplinas"', 'back')}<div class="page-heading heading-with-action"><div><span class="large-icon ${disciplineColor(selectedDiscipline)}">${icon('book')}</span><h1>${esc(disciplineName(selectedDiscipline))}</h1><p>Suas atividades, do próximo passo ao que já foi feito.</p></div>${button('Nova atividade', 'new-task', 'primary', `data-discipline="${esc(selectedDiscipline)}"`)}</div><section class="section"><div class="section-heading"><h2>Próximas<span class="count-badge">${pending.length}</span></h2></div>${pending.length ? `<div class="task-grid">${pending.map(t => taskCard(t)).join('')}</div>` : '<div class="panel small-empty">Nenhuma atividade pendente nesta disciplina.</div>'}</section><section class="section"><div class="section-heading"><h2>${icon('check', 'green-text')}Concluídas<span class="count-badge">${done.length}</span></h2></div>${done.length ? `<div class="panel">${done.map(t => taskRow(t)).join('')}</div>` : '<div class="panel small-empty">As atividades concluídas vão aparecer aqui.</div>'}</section>`;
  }
  function selectDashboardFilter(filter) {
    dashboardFilter = filter;
    document.querySelectorAll('[data-action="filter-dashboard"]').forEach(card => {
      const active = card.dataset.filter === filter;
      card.classList.toggle('is-active', active);
      card.setAttribute('aria-pressed', String(active));
    });
    document.getElementById('dashboard-results').innerHTML = dashboardResults();
  }
  function renderCalendarContent(focusSelector = '') {
    const content = document.getElementById('calendar-content');
    if (content) content.innerHTML = calendarModeContent(); else render();
    if (focusSelector) document.querySelector(focusSelector)?.focus({ preventScroll: true });
  }
  function positionAgenda(day) {
    const exact = document.getElementById(`agenda-${day}`);
    const target = exact || Array.from(document.querySelectorAll('.agenda-day')).find(item => item.id.replace('agenda-', '') >= day);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    target?.setAttribute('tabindex', '-1');
    target?.focus({ preventScroll: true });
  }
  function navigate(next) {
    screen = next;
    query = '';
    dashboardFilter = null;
    if (next === 'calendario') {
      calendarMode = 'agenda';
      selectedDay = T.dateKey();
      calendarAnchor = selectedDay;
    }
    render();
    document.getElementById('main')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function openModal(title, content, cls = '') {
    if (!modal.open) previousFocus = document.activeElement;
    modal.className = cls;
    modal.innerHTML = `<div class="modal-header"><h2 id="modal-title">${title}</h2><button class="icon-button" data-action="close-modal" aria-label="Fechar">${icon('close')}</button></div>${content}`;
    if (!modal.open) modal.showModal();
    document.body.classList.add('modal-open');
    const target = modal.querySelector('input:not([type="radio"]), select, textarea') || modal.querySelector('button');
    target?.focus();
  }
  function closeModal() { modal.close(); }
  function fieldError(form, message, name) {
    form.querySelector('.form-error').textContent = message;
    form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
    const field = form.elements[name];
    if (field instanceof HTMLElement) { field.setAttribute('aria-invalid', 'true'); field.focus(); }
  }
  function taskForm(id = null, disciplineId = '') {
    const task = S.get().atividades.find(t => t.id === id);
    const v = task || { titulo: '', disciplinaId: disciplineId, tipo: 'atividade', dataEntrega: '', prioridade: 'media', tempoEstimado: 60 };
    openModal(task ? 'Editar atividade' : 'Nova atividade', `<p class="modal-intro">${task ? 'Ajuste os detalhes e siga no seu ritmo.' : 'Tire da cabeça. Coloque na sua rotina.'}</p><form id="task-form" data-id="${esc(id || '')}" novalidate><div class="field"><label for="task-title">O que você precisa fazer?</label><input id="task-title" name="titulo" value="${esc(v.titulo)}" placeholder="Ex.: Trabalho de MUDE" maxlength="140" required></div><div class="field"><label for="task-discipline">Disciplina</label><select id="task-discipline" name="disciplinaId" required><option value="">Escolha uma disciplina</option>${S.get().disciplinas.map(d => `<option value="${esc(d.id)}" ${v.disciplinaId === d.id ? 'selected' : ''}>${esc(d.nome)}</option>`).join('')}<option value="__new">+ Nova disciplina</option></select></div><div class="field inline-discipline" id="inline-discipline" hidden><label for="inline-name">Nome da nova disciplina</label><input id="inline-name" name="novaDisciplina" placeholder="Ex.: Microbiologia" maxlength="80"></div><fieldset class="field"><legend>Tipo</legend><div class="type-options">${Object.entries(T.types).map(([value, [emoji, label]]) => `<label class="choice-label"><input type="radio" name="tipo" value="${value}" ${v.tipo === value ? 'checked' : ''}><span><span aria-hidden="true">${emoji}</span>${label}</span></label>`).join('')}</div></fieldset><div class="field"><label for="task-date">Prazo de entrega</label><input id="task-date" type="date" name="dataEntrega" min="1000-01-01" max="9999-12-31" value="${esc(v.dataEntrega)}" required></div><fieldset class="field"><legend>Prioridade</legend><div class="choice-group">${Object.entries(T.priorityNames).map(([value, label]) => `<label class="choice-label"><input type="radio" name="prioridade" value="${value}" ${v.prioridade === value ? 'checked' : ''}><span><i class="tiny-dot dot-${value}"></i>${label}</span></label>`).join('')}</div></fieldset><fieldset class="field"><legend>Tempo estimado</legend><div class="choice-group">${[30, 60, 120, 180].map(value => `<label class="choice-label"><input type="radio" name="tempoEstimado" value="${value}" ${Number(v.tempoEstimado) === value ? 'checked' : ''}><span>${T.duration(value)}</span></label>`).join('')}</div></fieldset><p class="form-error" role="alert"></p><div class="modal-actions">${button('Cancelar', 'close-modal', 'secondary', '', '')}<button type="submit" class="button primary">${icon(task ? 'check' : 'plus')}${task ? 'Salvar alterações' : 'Adicionar atividade'}</button></div></form>`);
  }
  function taskDetails(id) {
    const task = S.get().atividades.find(t => t.id === id);
    if (!task) return;
    openModal('Detalhes da atividade', `<div class="detail-heading"><span class="large-icon ${disciplineColor(task.disciplinaId)}">${T.types[task.tipo]?.[0]}</span><h3>${esc(task.titulo)}</h3><span class="discipline-label">${esc(disciplineName(task.disciplinaId))}</span></div><dl class="detail-grid"><div><dt>Tipo</dt><dd>${T.types[task.tipo]?.[1]}</dd></div><div><dt>Status</dt><dd>${task.status === 'concluida' ? '✓ Concluída' : 'Pendente'}</dd></div><div class="detail-full"><dt>Prazo</dt><dd>${due(task)}<span class="detail-date">${T.formatDate(task.dataEntrega)}</span></dd></div><div><dt>Prioridade</dt><dd>${pill(task)}</dd></div><div><dt>Tempo estimado</dt><dd>${icon('clock')}${T.duration(task.tempoEstimado)}</dd></div>${task.diaPlanejado ? `<div class="detail-full"><dt>Dia planejado</dt><dd>${T.formatDate(task.diaPlanejado)}${task.horarioPlanejado ? ` · ${esc(task.horarioPlanejado)}` : ''}</dd></div>` : ''}</dl>${task.status === 'pendente' ? button('Marcar como concluída', 'complete', 'primary full-width', `data-id="${esc(task.id)}"`, 'check') : '<div class="completed-note">✓ Atividade concluída. Feito!</div>'}<div class="detail-actions">${button('Editar', 'edit-task', 'secondary', `data-id="${esc(task.id)}"`, 'edit')}${button('Excluir', 'delete-task', 'danger-text', `data-id="${esc(task.id)}"`, 'trash')}</div>`);
  }
  function newDiscipline() {
    openModal('Nova disciplina', `<p class="modal-intro">Um lugar para reunir suas atividades.</p><form id="discipline-form" novalidate><div class="field"><label for="discipline-name">Nome da disciplina</label><input id="discipline-name" name="nome" placeholder="Ex.: Farmacologia" maxlength="80" required></div><p class="form-error" role="alert"></p><div class="modal-actions">${button('Cancelar', 'close-modal', 'secondary', '', '')}<button class="button primary" type="submit">${icon('plus')}Criar disciplina</button></div></form>`);
  }
  function planForm(preselectedDay = null) {
    const tasks = T.ordered(S.get().atividades);
    if (!tasks.length) {
      openModal('Planejar atividade', emptyState('Nenhuma atividade pendente.', 'Adicione uma atividade para planejar sua semana.', button('Nova atividade', 'new-task')));
      return;
    }
    const day = preselectedDay || (screen === 'calendario' ? selectedDay : T.dateKey());
    openModal('Planejar atividade', `<p class="modal-intro">Escolha um momento para dar o próximo passo.</p><form id="plan-form" novalidate><div class="field"><label for="plan-task">Atividade</label><select id="plan-task" name="atividadeId" required><option value="">Escolha uma atividade</option>${tasks.map(t => `<option value="${esc(t.id)}">${esc(t.titulo)} — ${esc(disciplineName(t.disciplinaId))}${t.diaPlanejado ? ' (já planejada)' : ''}</option>`).join('')}</select></div><div class="field"><label for="plan-day">Dia</label><input id="plan-day" name="diaPlanejado" type="date" min="1000-01-01" max="9999-12-31" value="${esc(day)}" required></div><div class="field"><label for="plan-time">Horário <span class="optional">(opcional)</span></label><input id="plan-time" name="horarioPlanejado" type="time"></div><p class="form-error" role="alert"></p><div class="modal-actions">${button('Cancelar', 'close-modal', 'secondary', '', '')}<button type="submit" class="button primary">${icon('calendar')}Planejar atividade</button></div></form>`);
  }
  function goToDateForm() {
    openModal('Ir para data', `<p class="modal-intro">Escolha a data que você quer visualizar.</p><form id="goto-date-form" novalidate><div class="field"><label for="goto-date">Data</label><input id="goto-date" name="data" type="date" min="1000-01-01" max="9999-12-31" value="${esc(selectedDay)}" required></div><p class="form-error" role="alert"></p><div class="modal-actions">${button('Cancelar', 'close-modal', 'secondary', '', '')}<button type="submit" class="button primary">${icon('calendar')}Ir para data</button></div></form>`);
  }
  function calendarFiltersForm() {
    openModal('Filtros do calendário', `<p class="modal-intro">Mostre somente o que você quer acompanhar.</p><form id="calendar-filters-form"><div class="field"><label for="calendar-discipline">Disciplina</label><select id="calendar-discipline" name="disciplina"><option value="">Todas</option>${S.get().disciplinas.map(discipline => `<option value="${esc(discipline.id)}" ${calendarDiscipline === discipline.id ? 'selected' : ''}>${esc(discipline.nome)}</option>`).join('')}</select></div><div class="field"><label for="calendar-type">Tipo</label><select id="calendar-type" name="tipo"><option value="">Todos</option>${Object.entries(T.types).map(([value, [emoji, label]]) => `<option value="${value}" ${calendarType === value ? 'selected' : ''}>${emoji} ${label}</option>`).join('')}</select></div><div class="modal-actions">${button('Limpar filtros', 'clear-calendar-filters', 'secondary', '', '')}<button type="submit" class="button primary">${icon('check')}Aplicar filtros</button></div></form>`);
  }
  const feedbackResources = ['Ver todos os prazos', 'Saber o que fazer primeiro', 'Planejar a semana', 'Separar por disciplina', 'Visualizar atividades pendentes'];
  function feedbackForm() {
    openModal('💬 Avaliar experiência', `<p class="modal-intro">Este é um protótipo acadêmico. Sua opinião ajuda a entender o que faz sentido para você.</p><form id="feedback-form" novalidate><fieldset class="field"><legend>Este protótipo ajudaria você a organizar melhor sua rotina acadêmica?</legend><div class="choice-group rating-options">${[1, 2, 3, 4, 5].map(n => `<label class="choice-label"><input type="radio" name="notaUtilidade" value="${n}" required><span>${n}</span></label>`).join('')}</div><div class="rating-caption"><span>1 = nada</span><span>5 = muito</span></div></fieldset><div class="field"><label for="feedback-resource">Qual recurso parece mais útil?</label><select id="feedback-resource" name="recursoMaisUtil" required><option value="">Escolha um recurso</option>${feedbackResources.map(r => `<option>${r}</option>`).join('')}</select></div><fieldset class="field"><legend>Você usaria algo assim na sua rotina acadêmica?</legend><div class="choice-group">${['Sim', 'Talvez', 'Não'].map(value => `<label class="choice-label"><input type="radio" name="intencaoUso" value="${value}" required><span>${value}</span></label>`).join('')}</div></fieldset><div class="field"><label for="feedback-comment">O que faria essa ferramenta ser realmente útil para você? <span class="optional">(opcional)</span></label><textarea id="feedback-comment" name="comentario" rows="3" maxlength="2000" placeholder="Conte pra gente..."></textarea></div><p class="feedback-local-note">A avaliação fica salva apenas neste navegador.</p><p class="form-error" role="alert"></p><button type="submit" class="button primary full-width">Enviar avaliação${icon('arrow')}</button></form>`);
  }
  function completeTask(id, trigger) {
    const task = S.get().atividades.find(t => t.id === id);
    if (!task || task.status === 'concluida') return;
    if (!commit(state => { state.atividades.find(t => t.id === id).status = 'concluida'; })) {
      if (trigger?.type === 'checkbox') trigger.checked = false;
      return;
    }
    const completionModal = modal.open;
    if (completionModal) {
      modal.classList.add('completing');
      const completeButton = modal.querySelector('[data-action="complete"]');
      if (completeButton) { completeButton.disabled = true; completeButton.textContent = '✓ Feito!'; }
    }
    trigger?.closest('[data-task-row]')?.classList.add('completing');
    const counts = T.counts(S.get().atividades);
    document.querySelectorAll('[data-count]').forEach(el => { el.textContent = counts[el.dataset.count]; });
    toast('✓ Feito!');
    setTimeout(() => { if (completionModal && modal.open) closeModal(); render(); const main = document.getElementById('main'); if (trigger && !trigger.isConnected) main?.focus({ preventScroll: true }); }, 220);
  }
  function demoLoad() {
    const demo = T.demo();
    if (!commit(state => { state.perfil = demo.perfil; state.disciplinas.push(...demo.disciplinas); state.atividades.push(...demo.atividades); state.demonstracao = demo.demonstracao; })) return;
    navigate('inicio');
    toast('Tudo pronto! Explore os dados de exemplo.');
  }
  function confirmDelete(id) {
    openModal('Excluir atividade', `<div class="confirm-content"><span class="large-icon red">${icon('trash')}</span><p>Tem certeza que deseja excluir esta atividade?</p><span class="muted">${esc(S.get().atividades.find(t => t.id === id)?.titulo)}</span></div><div class="modal-actions">${button('Cancelar', 'cancel-delete', 'secondary', `data-id="${esc(id)}"`, '')}${button('Excluir atividade', 'confirm-delete', 'danger', `data-id="${esc(id)}"`, 'trash')}</div>`);
  }
  function confirmClearDemo() {
    openModal('Limpar dados de demonstração', `<div class="confirm-content"><span class="large-icon purple">${icon('info')}</span><p>Remover os exemplos e o perfil fictício?</p><span class="muted">As atividades que você criou e suas avaliações serão mantidas. Disciplinas usadas por essas atividades também ficam. Depois, você poderá criar seu perfil.</span></div><div class="modal-actions">${button('Cancelar', 'close-modal', 'secondary', '', '')}${button('Limpar demonstração', 'confirm-clear-demo', 'danger', '', 'trash')}</div>`);
  }
  function clearDemo() {
    if (!commit(state => {
      const demo = state.demonstracao;
      if (!demo) return;
      state.atividades = state.atividades.filter(t => !demo.atividadeIds.includes(t.id));
      state.disciplinas = state.disciplinas.filter(d => !demo.disciplinaIds.includes(d.id) || state.atividades.some(t => t.disciplinaId === d.id));
      state.perfil = null;
      state.demonstracao = null;
    })) return;
    closeModal();
    onboardingStep = 'welcome';
    screen = 'inicio';
    render();
    toast('Dados de demonstração removidos.');
  }
  function saveTask(form) {
    const data = new FormData(form);
    const titulo = data.get('titulo').trim();
    let disciplinaId = data.get('disciplinaId');
    const dataEntrega = data.get('dataEntrega');
    if (!titulo) return fieldError(form, 'Informe o nome da atividade.', 'titulo');
    if (!disciplinaId) return fieldError(form, 'Escolha uma disciplina.', 'disciplinaId');
    const newName = data.get('novaDisciplina').trim();
    if (disciplinaId === '__new' && !newName) return fieldError(form, 'Informe o nome da nova disciplina.', 'novaDisciplina');
    if (!T.validDate(dataEntrega)) return fieldError(form, 'Informe o prazo.', 'dataEntrega');
    const id = form.dataset.id;
    const existing = S.get().atividades.find(t => t.id === id);
    if (id && !existing) return fieldError(form, 'Esta atividade não está mais disponível. Feche e tente novamente.', 'titulo');
    if (!commit(state => {
      if (disciplinaId === '__new') {
        const duplicate = state.disciplinas.find(d => T.normalize(d.nome) === T.normalize(newName));
        disciplinaId = duplicate?.id || T.id();
        if (!duplicate) state.disciplinas.push({ id: disciplinaId, nome: newName });
      }
      const task = { ...(existing || { id: T.id(), status: 'pendente', diaPlanejado: null, horarioPlanejado: '', dataCriacao: new Date().toISOString() }), titulo, disciplinaId, tipo: data.get('tipo'), dataEntrega, prioridade: data.get('prioridade'), tempoEstimado: Number(data.get('tempoEstimado')) };
      if (existing) state.atividades[state.atividades.findIndex(t => t.id === id)] = task; else state.atividades.push(task);
    })) return;
    closeModal(); render(); toast(existing ? 'Alterações salvas!' : 'Atividade adicionada!');
  }
  document.addEventListener('click', event => {
    const el = event.target.closest('[data-action]');
    if (!el) return;
    const { action, id } = el.dataset;
    switch (action) {
      case 'start': onboardingStep = 'profile'; render(); document.getElementById('profile-name').focus(); break;
      case 'welcome': onboardingStep = 'welcome'; render(); break;
      case 'demo': demoLoad(); break;
      case 'navigate': navigate(el.dataset.screen); break;
      case 'filter-dashboard': selectDashboardFilter(dashboardFilter === el.dataset.filter ? null : el.dataset.filter); break;
      case 'clear-dashboard-filter': {
        const previousFilter = dashboardFilter;
        query = '';
        document.getElementById('task-search').value = '';
        selectDashboardFilter(null);
        document.querySelector(`[data-filter="${previousFilter}"]`)?.focus({ preventScroll: true });
        break;
      }
      case 'new-task': taskForm(null, el.dataset.discipline || ''); break;
      case 'details': taskDetails(id); break;
      case 'edit-task': taskForm(id); break;
      case 'delete-task': confirmDelete(id); break;
      case 'cancel-delete': taskDetails(id); break;
      case 'confirm-delete': if (commit(state => { state.atividades = state.atividades.filter(t => t.id !== id); })) { closeModal(); render(); toast('Atividade excluída.'); } break;
      case 'complete': completeTask(id, el); break;
      case 'close-modal': closeModal(); break;
      case 'new-discipline': newDiscipline(); break;
      case 'open-discipline': selectedDiscipline = id; navigate('disciplina'); break;
      case 'calendar-mode':
        calendarMode = el.dataset.mode;
        calendarAnchor = selectedDay;
        render();
        document.querySelector(`[data-mode="${calendarMode}"]`)?.focus({ preventScroll: true });
        break;
      case 'calendar-today':
        selectedDay = T.dateKey(); calendarAnchor = selectedDay; render();
        if (calendarMode === 'agenda') positionAgenda(selectedDay);
        break;
      case 'calendar-goto': goToDateForm(); break;
      case 'calendar-filters': calendarFiltersForm(); break;
      case 'clear-calendar-filters':
        calendarDiscipline = ''; calendarType = ''; closeModal(); render(); toast('Filtros removidos.');
        break;
      case 'previous-week': calendarAnchor = T.addDays(-7, calendarAnchor); selectedDay = T.week(calendarAnchor)[0]; renderCalendarContent('[data-action="previous-week"]'); break;
      case 'next-week': calendarAnchor = T.addDays(7, calendarAnchor); selectedDay = T.week(calendarAnchor)[0]; renderCalendarContent('[data-action="next-week"]'); break;
      case 'previous-month': calendarAnchor = T.addMonths(-1, calendarAnchor); selectedDay = calendarAnchor; renderCalendarContent('[data-action="previous-month"]'); break;
      case 'next-month': calendarAnchor = T.addMonths(1, calendarAnchor); selectedDay = calendarAnchor; renderCalendarContent('[data-action="next-month"]'); break;
      case 'previous-semester': calendarAnchor = T.addMonths(-6, calendarAnchor); selectedDay = calendarAnchor; renderCalendarContent('[data-action="previous-semester"]'); break;
      case 'next-semester': calendarAnchor = T.addMonths(6, calendarAnchor); selectedDay = calendarAnchor; renderCalendarContent('[data-action="next-semester"]'); break;
      case 'select-calendar-day': selectedDay = el.dataset.day; calendarAnchor = selectedDay; renderCalendarContent(`[data-day="${selectedDay}"]`); break;
      case 'select-month-day': selectedDay = el.dataset.day; calendarAnchor = T.monthStart(selectedDay); renderCalendarContent(`[data-day="${selectedDay}"]`); break;
      case 'open-calendar-month': calendarMode = 'month'; calendarAnchor = el.dataset.month; selectedDay = calendarAnchor; render(); document.querySelector('[data-mode="month"]')?.focus({ preventScroll: true }); break;
      case 'plan-selected-day': planForm(el.dataset.day); break;
      case 'plan': planForm(); break;
      case 'feedback': feedbackForm(); break;
      case 'clear-demo': confirmClearDemo(); break;
      case 'confirm-clear-demo': clearDemo(); break;
    }
  });
  document.addEventListener('input', event => {
    if (event.target.id === 'task-search') {
      query = event.target.value;
      document.getElementById('dashboard-results').innerHTML = dashboardResults();
    }
  });
  document.addEventListener('change', event => {
    const el = event.target;
    if (el.id === 'task-discipline') {
      const inline = document.getElementById('inline-discipline');
      inline.hidden = el.value !== '__new';
      document.getElementById('inline-name').required = !inline.hidden;
      if (!inline.hidden) document.getElementById('inline-name').focus();
    }
    if (el.dataset.complete) completeTask(el.dataset.complete, el);
    if (el.id === 'plan-task') {
      const task = S.get().atividades.find(t => t.id === el.value);
      document.getElementById('plan-time').value = task?.horarioPlanejado || '';
    }
  });
  document.addEventListener('submit', event => {
    const form = event.target;
    event.preventDefault();
    const data = new FormData(form);
    if (form.id === 'task-form') return saveTask(form);
    if (form.id === 'profile-form') {
      if (!data.get('nome').trim()) return fieldError(form, 'Conte como podemos chamar você.', 'nome');
      if (!data.get('curso').trim()) return fieldError(form, 'Informe seu curso.', 'curso');
      if (!data.get('semestre')) return fieldError(form, 'Escolha seu semestre.', 'semestre');
      if (commit(state => { state.perfil = { nome: data.get('nome').trim(), curso: data.get('curso').trim(), semestre: data.get('semestre'), onboardingConcluido: true }; })) navigate('inicio');
    }
    if (form.id === 'discipline-form') {
      const nome = data.get('nome').trim();
      if (!nome) return fieldError(form, 'Informe o nome da disciplina.', 'nome');
      if (S.get().disciplinas.some(d => T.normalize(d.nome) === T.normalize(nome))) return fieldError(form, 'Essa disciplina já está na sua lista.', 'nome');
      if (commit(state => { state.disciplinas.push({ id: T.id(), nome }); })) { closeModal(); render(); toast('Disciplina adicionada!'); }
    }
    if (form.id === 'plan-form') {
      const task = S.get().atividades.find(t => t.id === data.get('atividadeId') && t.status === 'pendente');
      if (!task) return fieldError(form, 'Escolha uma atividade pendente.', 'atividadeId');
      const day = data.get('diaPlanejado');
      if (!T.validDate(day)) return fieldError(form, 'Escolha uma data válida.', 'diaPlanejado');
      if (commit(state => { const planned = state.atividades.find(t => t.id === task.id); planned.diaPlanejado = day; planned.horarioPlanejado = data.get('horarioPlanejado') || ''; })) {
        selectedDay = day; calendarAnchor = day; closeModal(); render(); toast('Atividade planejada!');
      }
    }
    if (form.id === 'goto-date-form') {
      const day = data.get('data');
      if (!T.validDate(day)) return fieldError(form, 'Escolha uma data válida.', 'data');
      selectedDay = day;
      calendarAnchor = calendarMode === 'month' || calendarMode === 'semester' ? T.monthStart(day) : day;
      closeModal(); render();
      if (calendarMode === 'agenda') positionAgenda(day);
    }
    if (form.id === 'calendar-filters-form') {
      calendarDiscipline = data.get('disciplina') || '';
      calendarType = data.get('tipo') || '';
      closeModal(); render(); toast('Filtros aplicados.');
    }
    if (form.id === 'feedback-form') {
      if (!data.get('notaUtilidade')) { fieldError(form, 'Escolha uma nota de 1 a 5.', 'notaUtilidade'); form.querySelector('[name="notaUtilidade"]').focus(); return; }
      if (!data.get('recursoMaisUtil')) return fieldError(form, 'Escolha o recurso que parece mais útil.', 'recursoMaisUtil');
      if (!data.get('intencaoUso')) { fieldError(form, 'Conte se você usaria o Organizaê.', 'intencaoUso'); form.querySelector('[name="intencaoUso"]').focus(); return; }
      if (commit(state => { state.feedback.push({ notaUtilidade: Number(data.get('notaUtilidade')), recursoMaisUtil: data.get('recursoMaisUtil'), intencaoUso: data.get('intencaoUso'), comentario: data.get('comentario').trim(), dataResposta: new Date().toISOString() }); })) {
        closeModal(); toast('Obrigado pelo feedback! 💜');
      }
    }
  });
  modal.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true }); else document.getElementById('main')?.focus({ preventScroll: true });
  });
  modal.addEventListener('click', event => {
    if (event.target === modal) { const rect = modal.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeModal(); }
  });
  window.addEventListener('storage', event => {
    if (event.key !== S.key && event.key !== null) return;
    S.reload();
    if (modal.open) { closeModal(); toast('Os dados mudaram em outra aba. Abra a atividade novamente.'); }
    render();
  });
  function refreshDate() {
    const today = T.dateKey();
    if (today !== lastDay) {
      const wasViewingToday = selectedDay === lastDay;
      lastDay = today;
      if (wasViewingToday) { selectedDay = today; calendarAnchor = today; }
      render();
    }
  }
  window.addEventListener('focus', refreshDate);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshDate(); });
  setInterval(refreshDate, 60000);
  render();
  if (S.warning()) toast(S.warning());
})();
