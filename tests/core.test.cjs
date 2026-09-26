// Optional developer checks. The application itself never needs Node.js.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const code = name => fs.readFileSync(path.join(__dirname, '..', 'js', name), 'utf8');
function context(initial = null, denied = false) {
  let saved = initial;
  const sandbox = { window: {}, console, Date, localStorage: {
    getItem: () => { if (denied) throw new Error('denied'); return saved; },
    setItem: (_, value) => { if (denied) throw new Error('denied'); saved = value; }
  } };
  vm.createContext(sandbox);
  vm.runInContext(code('storage.js'), sandbox);
  vm.runInContext(code('tasks.js'), sandbox);
  return { S: sandbox.window.OrgStorage, T: sandbox.window.OrgTasks, saved: () => saved, denyWrites: () => { denied = true; } };
}
const { T } = context();
const today = '2026-09-26';
function task(offset, prioridade = 'media', extra = {}) {
  return { id: String(offset), titulo: 'Trabalho', disciplinaId: 'mude', tipo: 'trabalho', dataEntrega: T.addDays(offset, today), prioridade, tempoEstimado: 60, status: 'pendente', diaPlanejado: null, horarioPlanejado: '', dataCriacao: '2026-09-20T12:00:00.000Z', ...extra };
}

test('all deadline score bands and all priorities', () => {
  for (const [offset, score] of [[-1,100],[0,80],[1,70],[2,55],[3,55],[4,35],[7,35],[8,15]]) {
    for (const [priority, weight] of [['alta',30],['media',15],['baixa',5]]) assert.equal(T.score(task(offset, priority), today), score + weight);
  }
});
test('overdue precedes today even when its numerical score is lower', () => {
  assert.deepEqual(Array.from(T.ordered([task(0, 'alta'), task(-1, 'baixa')], today), t => t.id), ['-1','0']);
});
test('sorting uses points, then deadline, then creation; completed excluded', () => {
  const items = [task(2,'alta',{id:'new',dataCriacao:'2026-09-22T12:00:00Z'}), task(3,'alta',{id:'later'}), task(2,'alta',{id:'old'}),task(-3,'alta',{id:'done',status:'concluida'}),task(9,'baixa',{id:'low'})];
  assert.deepEqual(Array.from(T.ordered(items,today), t => t.id), ['old','new','later','low']);
});
test('urgent and next-seven-day boundaries only include pending tasks', () => {
  const result = T.counts([-1,0,1,2,3,7,8].map(d=>task(d)).concat(task(0,'alta',{status:'concluida'})),today);
  assert.deepEqual({...result},{pending:7,urgent:4,week:5,done:1});
});
test('calendar arithmetic across leap day, month, year and DST', () => {
  assert.equal(T.addDays(1,'2024-02-28'),'2024-02-29');
  assert.equal(T.addDays(1,'2025-02-28'),'2025-03-01');
  assert.equal(T.addDays(1,'2026-12-31'),'2027-01-01');
  assert.equal(T.daysUntil('2026-03-09','2026-03-07'),2);
  assert.equal(T.validDate('2025-02-29'),false);
  assert.equal(T.validDate('2024-02-29'),true);
});
test('week always starts on Monday and ends on Sunday', () => {
  assert.deepEqual(Array.from(T.week('2026-09-27')), ['2026-09-21','2026-09-22','2026-09-23','2026-09-24','2026-09-25','2026-09-26','2026-09-27']);
  assert.equal(T.week('2027-01-01')[0],'2026-12-28');
});
test('humanized deadlines do not call a distant date next week', () => {
  assert.equal(T.deadline(task(-1),today).text,'⚠ Atrasada');
  assert.equal(T.deadline(task(0),today).text,'Hoje');
  assert.equal(T.deadline(task(1),today).text,'Amanhã');
  assert.equal(T.deadline(task(5),today).text,'Faltam 5 dias');
  assert.equal(T.deadline(task(8),today).text,'Próxima semana');
  assert.equal(T.deadline(task(9),today).text,'Faltam 9 dias');
  assert.equal(T.deadline(task(-1,'alta',{status:'concluida'}),today).text,'Concluída');
});
test('search finds titles and disciplines, ignoring case and accents', () => {
  const items = [task(1,'alta',{titulo:'Revisão de funções',disciplinaId:'prog'}),task(2)];
  const disciplines = [{id:'prog',nome:'Programação'},{id:'mude',nome:'MUDE'}];
  assert.equal(T.search(items,disciplines,'REVISAO').length,1);
  assert.equal(T.search(items,disciplines,'programacao').length,1);
  assert.equal(T.search(items,disciplines,'   ').length,2);
  assert.equal(T.search(items,disciplines,'inexistente').length,0);
});
test('schedule duration handles midnight and open-ended three hours', () => {
  assert.equal(T.timeRange(task(1,'alta',{horarioPlanejado:'23:30',tempoEstimado:60})),'23:30 — 00:30 (dia seguinte)');
  assert.equal(T.timeRange(task(1,'alta',{horarioPlanejado:'19:00',tempoEstimado:180})),'19:00 · 3h+');
  assert.equal(T.timeRange(task(1)),'Sem horário definido');
});
test('demo has requested subjects, dynamic deadlines, plans, and completed tasks', () => {
  const demo = T.demo();
  assert.deepEqual(Array.from(demo.disciplinas,d=>d.nome),['Farmacologia','Microbiologia','MUDE','Programação']);
  assert.deepEqual(Array.from(demo.atividades.slice(0,5),t=>T.daysUntil(t.dataEntrega)),[1,3,5,6,9]);
  assert.ok(demo.atividades.some(t=>t.diaPlanejado===T.dateKey()));
  assert.ok(demo.atividades.some(t=>t.status==='concluida'));
});
test('storage persists all model fields and feedback across reloads', () => {
  const {S,saved} = context();
  const demo = T.demo();
  assert.equal(S.update(state=>Object.assign(state,demo)),true);
  assert.equal(S.update(state=>state.feedback.push({notaUtilidade:5,recursoMaisUtil:'Planejar a semana',intencaoUso:'Sim',comentario:'',dataResposta:new Date().toISOString()})),true);
  const reloaded = context(saved()).S;
  assert.equal(reloaded.get().atividades.length,8);
  assert.equal(reloaded.get().perfil.nome,'Alex');
  assert.equal(reloaded.get().feedback[0].notaUtilidade,5);
  assert.equal(reloaded.warning(),'');
});
test('blocked storage reports failure without pretending data was saved', () => {
  const {S} = context(null,true);
  assert.ok(S.warning());
  assert.equal(S.update(state=>{state.perfil=T.demo().perfil;}),false);
  assert.equal(S.get().perfil,null);
});
test('malformed JSON and malformed records fail safely without overwriting', () => {
  const {S,saved} = context('{invalid');
  assert.ok(S.warning());
  assert.equal(saved(),'{invalid');
  const valid = {versao:1,perfil:null,disciplinas:[],atividades:[null],feedback:[],demonstracao:null};
  const malformed = context(JSON.stringify(valid));
  assert.ok(malformed.S.warning());
  assert.equal(malformed.S.get().atividades.length,0);
});
test('failed writes preserve the previously saved state', () => {
  const {S, saved, denyWrites} = context();
  S.update(state=>Object.assign(state,T.demo()));
  const original = S.get().atividades[0].titulo;
  const persisted = saved();
  denyWrites();
  assert.equal(S.update(state=>{state.atividades[0].titulo='Atualizado';}),false);
  assert.equal(S.get().atividades[0].titulo,original);
  assert.equal(saved(),persisted);
});
