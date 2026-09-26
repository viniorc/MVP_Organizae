(function () {
  'use strict';
  const KEY = 'organizae.v1';
  const empty = () => ({ versao: 1, perfil: null, disciplinas: [], atividades: [], feedback: [], demonstracao: null });
  let warning = '';

  function validState(data) {
    const text = value => typeof value === 'string' && value.trim().length > 0;
    const date = value => {
      if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const [y, m, d] = value.split('-').map(Number);
      const parsed = new Date(y, m - 1, d, 12);
      return y >= 1000 && parsed.getFullYear() === y && parsed.getMonth() === m - 1 && parsed.getDate() === d;
    };
    if (!data || data.versao !== 1 || !Array.isArray(data.disciplinas) || !Array.isArray(data.atividades) || !Array.isArray(data.feedback)) return false;
    if (data.perfil !== null && (!data.perfil || !text(data.perfil.nome) || !text(data.perfil.curso) || !/^(?:[1-9]|10)$/.test(data.perfil.semestre) || typeof data.perfil.onboardingConcluido !== 'boolean')) return false;
    if (!data.disciplinas.every(d => d && text(d.id) && text(d.nome))) return false;
    if (new Set(data.disciplinas.map(d => d.id)).size !== data.disciplinas.length) return false;
    if (!data.atividades.every(t => t && text(t.id) && text(t.titulo) && data.disciplinas.some(d => d.id === t.disciplinaId) &&
      ['atividade', 'trabalho', 'estudo', 'seminario', 'prova', 'outro'].includes(t.tipo) && date(t.dataEntrega) &&
      ['baixa', 'media', 'alta'].includes(t.prioridade) && [30, 60, 120, 180].includes(t.tempoEstimado) &&
      ['pendente', 'concluida'].includes(t.status) && (t.diaPlanejado === null || date(t.diaPlanejado)) &&
      (!t.horarioPlanejado || /^([01]\d|2[0-3]):[0-5]\d$/.test(t.horarioPlanejado)) && text(t.dataCriacao) && Number.isFinite(Date.parse(t.dataCriacao)))) return false;
    if (new Set(data.atividades.map(t => t.id)).size !== data.atividades.length) return false;
    if (!data.feedback.every(f => f && [1, 2, 3, 4, 5].includes(f.notaUtilidade) && text(f.recursoMaisUtil) && ['Sim', 'Talvez', 'Não'].includes(f.intencaoUso) && typeof f.comentario === 'string' && text(f.dataResposta))) return false;
    return !data.demonstracao || (Array.isArray(data.demonstracao.atividadeIds) && Array.isArray(data.demonstracao.disciplinaIds));
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return empty();
      const data = JSON.parse(raw);
      if (!validState(data)) {
        throw new Error('invalid-storage');
      }
      return { ...empty(), ...data };
    } catch (_) {
      warning = 'Não foi possível ler os dados salvos. Os dados existentes não serão substituídos automaticamente.';
      return empty();
    }
  }

  let state = load();
  function save(next) {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      state = next;
      warning = '';
      return true;
    } catch (_) {
      warning = 'Não foi possível salvar no navegador. Verifique se o armazenamento está permitido e tente novamente.';
      return false;
    }
  }

  window.OrgStorage = {
    key: KEY,
    get: () => state,
    warning: () => warning,
    update(change) {
      const next = JSON.parse(JSON.stringify(state));
      change(next);
      return save(next);
    },
    reload() { state = load(); return state; }
  };
})();
