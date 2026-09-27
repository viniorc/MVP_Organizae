# Organizaê

**Sua rotina acadêmica em ordem.**

MVP fumaça desenvolvido para a disciplina MUDE, para investigar a dificuldade de estudantes universitários em organizar estudos, atividades, trabalhos e prazos acadêmicos. O protótipo permite experimentar a proposta e registrar a percepção dos participantes; não representa uma solução definitiva ou eficácia já demonstrada.

## Como abrir

1. Mantenha as pastas `css`, `js` e `assets` junto de `index.html`.
2. Abra **`index.html`** em um navegador moderno, como Chrome, Edge, Firefox ou Safari.
3. Escolha **Começar gratuitamente**, preencha nome/apelido, curso e semestre, e clique em **Organizar minha rotina**.

A aplicação não exige instalação, compilação, Node.js, conta ou servidor. Usa HTML semântico, CSS e JavaScript puro, com scripts clássicos carregados por `defer`, caminhos relativos, ícones SVG locais e fonte `Inter` quando instalada, com uma pilha sans-serif como alternativa. Não há fontes, bibliotecas ou recursos obrigatórios baixados da internet.

### Armazenamento e abertura por arquivo

Os dados são salvos no `localStorage` do navegador, na chave **`organizae.v1`**. Permanecem ao atualizar ou reabrir a aplicação no mesmo navegador, perfil e endereço.

O tratamento de `localStorage` em endereços `file://` varia entre navegadores. Mudar o caminho do arquivo pode criar um espaço de armazenamento diferente. Janelas privativas, bloqueio de armazenamento, limpeza de dados do navegador e falta de espaço também afetam a persistência. Quando a leitura ou gravação falha, a aplicação avisa e não confirma uma gravação que não aconteceu.

O código foi preparado para abertura direta, sem módulos ES, `fetch` ou dependências de servidor. **A abertura por `file://` não pôde ser executada pelo navegador de testes deste ambiente, que bloqueia esse tipo de endereço.** Os testes de interface foram feitos em uma prévia HTTP local temporária. A conferência final da abertura direta consiste em abrir `index.html`, criar uma atividade, fechar e reabrir o mesmo arquivo no navegador escolhido.

Dados de `file://`, `http://localhost` e de uma publicação no GitHub Pages pertencem a origens distintas e não são transferidos automaticamente.

## O que está implementado

- Onboarding e perfil rápido; orientação para a primeira atividade.
- Dashboard com indicadores de pendentes, urgentes, entregas nos próximos sete dias e concluídas.
- Clique em um indicador do Dashboard para listar suas atividades. O card selecionado fica destacado, e a busca filtra essa lista por título ou disciplina. Clique novamente no card para desativar o filtro ou use **Voltar à visão geral** para restaurar o Dashboard e limpar a busca.
- Atividades: criação, detalhes, edição, exclusão confirmada e conclusão com animação e toast.
- Seções de atenção, planejamento para hoje e prazos agrupados.
- Priorização determinística por atraso, proximidade do prazo e prioridade informada.
- Busca instantânea por título ou disciplina, desconsiderando caixa e acentuação; inclui concluídas nos resultados.
- Calendário com **Agenda**, **Semana**, **Mês** e **Semestre**; navegação contínua, dias livres, indicadores de carga, filtros e acesso direto a qualquer data.
- Planejamento em qualquer data, com horário opcional, mantendo um único dia planejado por atividade.
- Disciplinas com contagem e listas separadas de próximas e concluídas; criação também dentro do formulário de atividade.
- Feedback de utilidade, recurso mais útil, intenção de uso e comentário opcional.
- Demonstração com perfil fictício, quatro disciplinas e oito atividades.
- Sidebar no desktop e navegação fixa inferior com botão central no celular.
- Formulários com labels, validação amigável, navegação por teclado, foco visível, diálogos nativos e respeito à preferência de movimento reduzido.

Não há backend, autenticação, serviços externos, banco externo, IA, notificações ou integrações. O feedback fica apenas no navegador do participante e **não é enviado ao pesquisador**.

## Usar a demonstração

Na tela inicial, clique em **Experimentar com dados de exemplo**. O perfil Alex e as disciplinas Farmacologia, Microbiologia, MUDE e Programação são criados automaticamente.

As cinco atividades principais têm entrega em amanhã, +3, +5, +6 e +9 dias. Os exemplos incluem atividades planejadas para hoje e atividades concluídas. As datas são geradas no momento do carregamento e depois permanecem salvas: reabrir a aplicação não adia os prazos.

**Limpar dados de demonstração** fica na parte inferior da sidebar ou no rodapé no celular. Após confirmação, remove as atividades de exemplo e o perfil fictício, retornando ao onboarding. Preserva atividades criadas pelo usuário, avaliações e disciplinas necessárias às atividades preservadas. As atividades de exemplo continuam identificadas como exemplos mesmo após serem editadas.

## Como usar

1. Em **Disciplinas**, crie uma disciplina.
2. Clique em **Nova atividade** ou no **+** central do celular. Informe título, disciplina, tipo, prazo, prioridade e tempo estimado.
3. Abra **Prioridades** para consultar a ordem sugerida e **Como isso foi calculado?** para ver a explicação.
4. Em **Calendário**, use a Agenda para acompanhar o que vem pela frente ou alterne entre Semana, Mês e Semestre. Use **Hoje**, **Ir para data** e **Filtros** para ajustar a visualização.
5. Selecione um dia livre e clique em **Planejar neste dia**. Escolha uma pendente e, se quiser, informe o horário. Replanejar a mesma atividade substitui seu planejamento anterior.
6. Conclua pelo checkbox de **Para hoje** ou da visualização semanal, ou pelos detalhes da atividade. A atividade permanece em **Concluídas** da disciplina.
7. Abra uma atividade para editar seus campos ou excluir com confirmação.
8. Use **Avaliar experiência** no Dashboard, na sidebar ou no ícone de conversa do topo no celular.

## Regras de datas e prioridade

Datas de entrega e planejamento usam `AAAA-MM-DD`, interpretadas como datas civis locais. Datas de criação e feedback usam timestamps ISO. A aplicação recalcula os prazos ao abrir, ao voltar à aba e ao mudar o dia. Editar uma atividade preserva ID, criação, status e planejamento.

| Prazo | Pontos |
| --- | ---: |
| Atrasada | 100 |
| Hoje | 80 |
| Amanhã | 70 |
| Entre 2 e 3 dias | 55 |
| Entre 4 e 7 dias | 35 |
| Mais de 7 dias | 15 |

| Prioridade informada | Pontos |
| --- | ---: |
| Alta | 30 |
| Média | 15 |
| Baixa | 5 |

A pontuação é a soma dos dois valores. **A regra explícita de atrasadas no topo prevalece sobre a tabela sugerida**: uma atrasada com baixa prioridade soma 105, enquanto uma para hoje com alta soma 110. Por isso, primeiro separam-se atrasadas das demais; em cada grupo, ordena-se por pontos decrescentes, prazo crescente e criação crescente. Concluídas não entram nessa ordem.

Na tela de prioridades, **Faça primeiro** reúne atrasadas e pontuações a partir de 85; **Faça em seguida**, de 50 a 84; **Pode esperar**, abaixo de 50. Não há competição ou pontuação mostrada ao estudante.

- **Urgentes:** pendentes atrasadas ou com entrega até hoje +2 dias.
- **Esta semana, no indicador:** pendentes com entrega de hoje até hoje +7 dias, inclusive. Atrasadas ficam fora desse indicador.
- **Calendário:** a Semana sempre usa os sete dias da semana civil, de segunda a domingo. Agenda, Mês e Semestre aceitam prazos e planejamentos futuros sem limite semanal.
- **Prazo e planejamento:** `dataEntrega` alimenta todas as visualizações; `diaPlanejado` e `horarioPlanejado` continuam opcionais. Quando planejamento e entrega coincidem, a atividade aparece uma única vez com os dois contextos.
- **Prazos humanizados:** atrasada, hoje, amanhã e “Faltam N dias”. “Próxima semana” é usado para datas além de sete dias que ainda pertençam à próxima semana civil.
- **Tempo estimado:** salvo em minutos: 30, 60, 120 ou 180. O valor 180 representa “3h+”; o planejamento não apresenta um término exato para essa opção. Intervalos que cruzam meia-noite indicam “dia seguinte”.

## Estrutura

```text
organizae/
├── index.html          # Entrada da aplicação, metadados e carregamento local
├── css/
│   └── style.css       # Tema, componentes, responsividade e animações
├── js/
│   ├── storage.js      # Leitura, validação e gravação no localStorage
│   ├── tasks.js        # Datas, prioridade, busca, indicadores e demonstração
│   └── app.js          # Telas, navegação, formulários e interações
├── assets/
│   └── favicon.svg     # Identidade local
├── tests/
│   └── core.test.cjs   # Verificações opcionais para desenvolvimento
└── README.md
```

Os arquivos JavaScript usam IIFEs e os namespaces `OrgStorage` e `OrgTasks`, mantendo responsabilidades separadas e compatibilidade com scripts clássicos.

### Modelo salvo

| Coleção | Campos |
| --- | --- |
| `perfil` | `nome`, `curso`, `semestre`, `onboardingConcluido` |
| `disciplinas[]` | `id`, `nome` |
| `atividades[]` | `id`, `titulo`, `disciplinaId`, `tipo`, `dataEntrega`, `prioridade`, `tempoEstimado`, `status`, `diaPlanejado`, `horarioPlanejado`, `dataCriacao` |
| `feedback[]` | `notaUtilidade`, `recursoMaisUtil`, `intencaoUso`, `comentario`, `dataResposta` |

O envelope tem `versao: 1` e os IDs dos registros de demonstração, usados na limpeza seletiva. Status de atividade: `pendente` ou `concluida`. Cada envio de avaliação gera uma resposta com data. Alterações em outra aba da mesma origem são sincronizadas pelo evento `storage`.

## Limpar todos os dados

Para reiniciar completamente, use as ferramentas de desenvolvedor do navegador, na área de armazenamento local, e remova somente a chave `organizae.v1`. Alternativamente, execute no console da aplicação:

```js
localStorage.removeItem('organizae.v1');
location.reload();
```

Isso remove perfil, disciplinas, atividades e avaliações dessa origem. A ação não tem recuperação dentro do protótipo. Para remover apenas os exemplos, use o botão da demonstração.

## Testes

Os 25 fluxos obrigatórios do Calendário foram percorridos no Chrome em prévia HTTP local. A validação incluiu uma tela móvel real emulada de 320 × 844 CSS px, sem transbordamento horizontal da página, e desktop de 1440 px. A faixa semanal mantém os sete dias em um scroller próprio no celular. O console terminou sem erros ou avisos da aplicação.

| Fluxo | Como reproduzir |
| --- | --- |
| 1–3 | Abrir Calendário com Agenda padrão; conferir atividade de amanhã e outra com prazo três meses à frente na Agenda, no Mês e no Semestre. |
| 4–7 | Abrir Semana, conferir os sete dias e o estado Livre; selecionar um dia livre, abrir o planejamento com a data preenchida e confirmar que a atividade aparece no dia. |
| 8–9 | Navegar para a semana seguinte e retornar à anterior. |
| 10–13 | Abrir o Mês, conferir a grade de segunda a domingo, a contagem de três atividades, o detalhe do dia e a navegação por vários meses. |
| 14–15 | Abrir o Semestre com seis meses e entrar no Mês a partir de um card mensal. |
| 16–17 | Usar Ir para data e Hoje nos modos de calendário. |
| 18–19 | Aplicar e limpar filtros por disciplina e por tipo, inclusive em combinação. |
| 20–22 | Atualizar a página, conferir persistência, atividades anteriores e os dados de demonstração. |
| 23–25 | Conferir mobile de 320 px, desktop de 1440 px e console sem erros. |

A regressão também cobriu Dashboard e seus cards clicáveis, Prioridades, busca, cadastro, edição, cancelamento e confirmação de exclusão, conclusão, Disciplinas, feedback e persistência após recarregar.

Há também **17 testes automatizados**, cobrindo as regras anteriores e os novos cálculos de grade mensal, navegação por mês, contextos de planejamento/entrega sem duplicidade e filtros combinados do Calendário. Para executá-los, desenvolvedores que já tenham Node.js podem usar:

```sh
node --test tests/core.test.cjs
```

Node.js é usado somente nessa verificação opcional e não faz parte dos requisitos para abrir ou usar o Organizaê.

A suíte passou no fuso local e também em `America/New_York` e `Pacific/Kiritimati`. O caso de Nova York confirma que dois dias civis continuam sendo dois dias mesmo quando a mudança de horário de verão reduz o intervalo real a 47 horas.

## Publicação futura no GitHub Pages

O projeto está preparado para hospedagem estática: publique `index.html` e as pastas `css`, `js` e `assets` juntas, preservando a estrutura. Não há etapa de build ou variáveis de ambiente. Os caminhos relativos funcionam sob o subdiretório de um repositório. Nenhuma publicação foi realizada nesta entrega.

## Hipóteses a validar

1. Centralizar atividades e prazos facilita a visualização da rotina acadêmica.
2. Mostrar atividades próximas do prazo ajuda a acompanhar as obrigações.
3. Apresentar prioridades ajuda a decidir o que fazer primeiro.
4. Visualizar Agenda, Semana, Mês e Semestre facilita o planejamento antecipado.
5. Estudantes percebem valor suficiente para considerar o uso na rotina.

O formulário registra percepção de utilidade e intenção de uso. Esses sinais precisam ser analisados no contexto do estudo; não demonstram, por si só, melhoria de desempenho ou organização acadêmica.
