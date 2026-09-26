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
- Atividades: criação, detalhes, edição, exclusão confirmada e conclusão com animação e toast.
- Seções de atenção, planejamento para hoje e prazos agrupados.
- Priorização determinística por atraso, proximidade do prazo e prioridade informada.
- Busca instantânea por título ou disciplina, desconsiderando caixa e acentuação; inclui concluídas nos resultados.
- Planejamento da semana atual, de segunda a domingo, com horário opcional.
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
4. Em **Semana**, selecione um dia e clique em **Planejar atividade**. Escolha uma pendente, o dia da semana atual e, se quiser, o horário. Replanejar a mesma atividade substitui seu planejamento anterior.
5. Conclua pelo checkbox de **Para hoje** ou **Semana**, ou pelos detalhes da atividade. A atividade permanece em **Concluídas** da disciplina.
6. Abra uma atividade para editar seus campos ou excluir com confirmação.
7. Use **Avaliar experiência** no Dashboard, na sidebar ou no ícone de conversa do topo no celular.

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
- **Semana, na tela de planejamento:** os sete dias da semana civil atual, de segunda a domingo.
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

Foram percorridos no Chrome, em prévia HTTP local temporária, os 15 fluxos funcionais da especificação. Foram encontrados e corrigidos um erro no cadastro, a ausência de animação pelos detalhes e o tratamento insuficiente de registros inválidos. Os fluxos corrigidos foram repetidos e o console final ficou sem erros ou avisos. As verificações incluíram a navegação desktop e mobile, com tela estreita de 320 px CSS, diálogo sem transbordamento e semana sem rolagem horizontal.

| Fluxo | Como reproduzir |
| --- | --- |
| 1 | Primeiro acesso → onboarding → perfil → Dashboard vazio. |
| 2 | Criar disciplina → criar atividade; repetir criando disciplina dentro do formulário. Testar obrigatórios vazios. |
| 3 | Criar atividade para amanhã → conferir urgência e texto “Amanhã”. |
| 4 | Criar pendentes com prazos e prioridades diferentes → conferir ordem e explicação em Prioridades. |
| 5 | Planejar para hoje com horário e outro dia sem horário → conferir dia correto na Semana. |
| 6 | Concluir por checkbox e por detalhes → conferir indicadores e seção Concluídas da disciplina. |
| 7 | Editar título, disciplina, tipo, prazo, prioridade e tempo → conferir atualização e planejamento preservado. |
| 8 | Excluir → cancelar e conferir preservação → confirmar e conferir remoção. |
| 9 | Buscar parte do título, sem acentos e em outra caixa; testar termo inexistente. |
| 10 | Buscar disciplina → conferir todas as atividades correspondentes. |
| 11 | Carregar exemplos → conferir indicadores; criar atividade própria → limpar exemplos → conferir preservação. |
| 12 | Enviar avaliação, incluindo comentário vazio → conferir agradecimento; testar obrigatórios. |
| 13 | Atualizar/reabrir o endereço de teste → conferir perfil, disciplinas, atividade editada, planejamento e conclusão. Abertura direta por `file://` pendente conforme limitação descrita acima. |
| 14 | Em celular, conferir navegação inferior, botão central, semana e formulário longo. |
| 15 | Em desktop, conferir sidebar, cards, listas, detalhes, busca e modais. |

Há também **14 testes automatizados**, cobrindo todas as faixas de pontuação, desempates, exclusão de concluídas, limites dos indicadores, mudança de mês/ano, ano bissexto, horário de verão, busca, intervalos, demonstração, persistência e falhas de armazenamento. Para executá-los, desenvolvedores que já tenham Node.js podem usar:

```sh
node --test tests/core.test.cjs
```

Node.js é usado somente nessa verificação opcional e não faz parte dos requisitos para abrir ou usar o Organizaê.

## Publicação futura no GitHub Pages

O projeto está preparado para hospedagem estática: publique `index.html` e as pastas `css`, `js` e `assets` juntas, preservando a estrutura. Não há etapa de build ou variáveis de ambiente. Os caminhos relativos funcionam sob o subdiretório de um repositório. Nenhuma publicação foi realizada nesta entrega.

## Hipóteses a validar

1. Centralizar atividades e prazos facilita a visualização da rotina acadêmica.
2. Mostrar atividades próximas do prazo ajuda a acompanhar as obrigações.
3. Apresentar prioridades ajuda a decidir o que fazer primeiro.
4. Visualizar a semana facilita o planejamento antecipado.
5. Estudantes percebem valor suficiente para considerar o uso na rotina.

O formulário registra percepção de utilidade e intenção de uso. Esses sinais precisam ser analisados no contexto do estudo; não demonstram, por si só, melhoria de desempenho ou organização acadêmica.
