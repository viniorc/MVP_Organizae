(function () {
  'use strict';
  const DAY = 86400000;
  const priorities = { alta: 30, media: 15, baixa: 5 };
  const priorityNames = { baixa: 'Baixa', media: 'Média', alta: 'Alta' };
  const types = { atividade: ['📄', 'Atividade'], trabalho: ['📝', 'Trabalho'], estudo: ['📚', 'Estudo'], seminario: ['🎤', 'Seminário'], prova: ['🧪', 'Prova'], outro: ['📌', 'Outro'] };

  function dateKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  function fromKey(value) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day, 12);
  }
  function validDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value || '') && dateKey(fromKey(value)) === value && Number(value.slice(0, 4)) >= 1000;
  }
  function addDays(amount, base = dateKey()) {
    const date = fromKey(base);
    date.setDate(date.getDate() + amount);
    return dateKey(date);
  }
  function daysUntil(value, today = dateKey()) {
    // Compare calendar dates, independently of timezone and daylight-saving changes.
    const utcDay = key => { const [y, m, d] = key.split('-').map(Number); return Date.UTC(y, m - 1, d); };
    return Math.round((utcDay(value) - utcDay(today)) / DAY);
  }
  function score(task, today = dateKey()) {
    const days = daysUntil(task.dataEntrega, today);
    const deadline = days < 0 ? 100 : days === 0 ? 80 : days === 1 ? 70 : days <= 3 ? 55 : days <= 7 ? 35 : 15;
    return deadline + priorities[task.prioridade];
  }
  function ordered(tasks, today = dateKey()) {
    return tasks.filter(t => t.status === 'pendente').slice().sort((a, b) => {
      // The explicit rule "overdue first" takes precedence over the suggested points.
      const overdue = Number(daysUntil(b.dataEntrega, today) < 0) - Number(daysUntil(a.dataEntrega, today) < 0);
      return overdue || score(b, today) - score(a, today) || a.dataEntrega.localeCompare(b.dataEntrega) || a.dataCriacao.localeCompare(b.dataCriacao);
    });
  }
  function deadline(task, today = dateKey()) {
    if (task.status === 'concluida') return { text: 'Concluída', tone: 'green' };
    const days = daysUntil(task.dataEntrega, today);
    const nextMonday = addDays(7, week(today)[0]);
    const isNextWeek = task.dataEntrega >= nextMonday && task.dataEntrega <= addDays(6, nextMonday);
    return {
      text: days < 0 ? '⚠ Atrasada' : days === 0 ? 'Hoje' : days === 1 ? 'Amanhã' : days <= 7 ? `Faltam ${days} dias` : isNextWeek ? 'Próxima semana' : `Faltam ${days} dias`,
      tone: days <= 2 ? 'red' : days <= 3 ? 'orange' : days <= 7 ? 'yellow' : 'green'
    };
  }
  function dashboardTasks(tasks, filter, today = dateKey()) {
    if (filter === 'done') return tasks.filter(t => t.status === 'concluida');
    if (!['pending', 'urgent', 'week'].includes(filter)) return tasks;
    return tasks.filter(task => {
      if (task.status !== 'pendente') return false;
      const days = daysUntil(task.dataEntrega, today);
      return filter === 'pending' || (filter === 'urgent' ? days <= 2 : days >= 0 && days <= 7);
    });
  }
  function counts(tasks, today = dateKey()) {
    return {
      pending: dashboardTasks(tasks, 'pending', today).length,
      urgent: dashboardTasks(tasks, 'urgent', today).length,
      week: dashboardTasks(tasks, 'week', today).length,
      done: dashboardTasks(tasks, 'done', today).length
    };
  }
  function week(today = dateKey()) {
    const day = fromKey(today).getDay();
    const monday = addDays(-(day === 0 ? 6 : day - 1), today);
    return Array.from({ length: 7 }, (_, i) => addDays(i, monday));
  }
  function monthStart(value = dateKey()) {
    const date = fromKey(value);
    return dateKey(new Date(date.getFullYear(), date.getMonth(), 1, 12));
  }
  function addMonths(amount, value = dateKey()) {
    const date = fromKey(monthStart(value));
    return dateKey(new Date(date.getFullYear(), date.getMonth() + amount, 1, 12));
  }
  function monthGrid(value = dateKey()) {
    const first = monthStart(value);
    const day = fromKey(first).getDay();
    const gridStart = addDays(-(day === 0 ? 6 : day - 1), first);
    const last = addDays(-1, addMonths(1, first));
    const cells = Math.ceil((daysUntil(last, gridStart) + 1) / 7) * 7;
    return Array.from({ length: cells }, (_, index) => addDays(index, gridStart));
  }
  function filterCalendar(tasks, disciplineId = '', type = '') {
    return tasks.filter(task => (!disciplineId || task.disciplinaId === disciplineId) && (!type || task.tipo === type));
  }
  function calendarEntries(tasks, day) {
    const entries = [];
    tasks.forEach(task => {
      const planned = task.diaPlanejado === day;
      const due = task.dataEntrega === day;
      if (planned) entries.push({ task, context: due ? 'planned-due' : 'planned' });
      else if (due) entries.push({ task, context: 'due' });
    });
    return entries.sort((a, b) => {
      const aKind = a.context.startsWith('planned') ? 0 : 1;
      const bKind = b.context.startsWith('planned') ? 0 : 1;
      const aTime = a.context.startsWith('planned') ? (a.task.horarioPlanejado || '99:99') : '99:99';
      const bTime = b.context.startsWith('planned') ? (b.task.horarioPlanejado || '99:99') : '99:99';
      return aKind - bKind || aTime.localeCompare(bTime) || a.task.titulo.localeCompare(b.task.titulo, 'pt-BR');
    });
  }
  function dayTasks(tasks, day) {
    return Array.from(new Map(calendarEntries(tasks, day).map(entry => [entry.task.id, entry.task])).values());
  }
  function normalize(text) { return String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim(); }
  function search(tasks, disciplines, query) {
    const term = normalize(query);
    return tasks.filter(t => normalize(t.titulo).includes(term) || normalize(disciplines.find(d => d.id === t.disciplinaId)?.nome || '').includes(term));
  }
  function duration(minutes) { return Number(minutes) === 30 ? '30 min' : Number(minutes) === 180 ? '3h+' : `${Number(minutes) / 60}h`; }
  function timeRange(task) {
    if (!task.horarioPlanejado) return 'Sem horário definido';
    if (Number(task.tempoEstimado) >= 180) return `${task.horarioPlanejado} · 3h+`;
    const [hours, minutes] = task.horarioPlanejado.split(':').map(Number);
    const total = hours * 60 + minutes + Number(task.tempoEstimado);
    return `${task.horarioPlanejado} — ${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}${total >= 1440 ? ' (dia seguinte)' : ''}`;
  }
  function formatDate(key, options = { day: 'numeric', month: 'long', year: 'numeric' }) {
    return fromKey(key).toLocaleDateString('pt-BR', options);
  }
  function id() { return globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
  function demo() {
    const disciplinas = ['Farmacologia', 'Microbiologia', 'MUDE', 'Programação'].map(nome => ({ id: id(), nome }));
    const examples = [
      ['Trabalho de MUDE', 2, 'trabalho', 1, 'alta', 120, 0, '19:00', 'pendente'],
      ['Prova de Microbiologia', 1, 'prova', 3, 'alta', 120, 1, '14:00', 'pendente'],
      ['Estudar Farmacologia', 0, 'estudo', 5, 'media', 60, 0, '17:00', 'pendente'],
      ['Exercícios de Programação', 3, 'atividade', 6, 'media', 60, 2, '16:00', 'pendente'],
      ['Seminário de Microbiologia', 1, 'seminario', 9, 'baixa', 180, null, '', 'pendente'],
      ['Revisar anotações de Farmacologia', 0, 'estudo', 2, 'baixa', 30, null, '', 'pendente'],
      ['Leitura para MUDE', 2, 'estudo', -1, 'media', 30, -1, '15:00', 'concluida'],
      ['Lista de lógica de programação', 3, 'atividade', -2, 'baixa', 60, -2, '10:00', 'concluida']
    ];
    const atividades = examples.map(([titulo, d, tipo, offset, prioridade, tempoEstimado, plan, horarioPlanejado, status], i) => ({
      id: id(), titulo, disciplinaId: disciplinas[d].id, tipo, dataEntrega: addDays(offset), prioridade,
      tempoEstimado, status, diaPlanejado: plan === null ? null : addDays(plan), horarioPlanejado,
      dataCriacao: new Date(Date.now() - (examples.length - i) * 60000).toISOString()
    }));
    return {
      perfil: { nome: 'Alex', curso: 'Graduação', semestre: '4', onboardingConcluido: true }, disciplinas, atividades,
      demonstracao: { atividadeIds: atividades.map(t => t.id), disciplinaIds: disciplinas.map(d => d.id) }
    };
  }
  window.OrgTasks = { dateKey, fromKey, validDate, addDays, daysUntil, score, ordered, deadline, dashboardTasks, counts, week, monthStart, addMonths, monthGrid, filterCalendar, calendarEntries, dayTasks, normalize, search, duration, timeRange, formatDate, id, demo, priorityNames, types };
})();
