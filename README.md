# Tarefas

Histórico das tarefas do Redmine — as que fiz e as que acompanho —, com quanto tempo foi
apontado em cada uma. Substitui a aba **Tarefas** da planilha do Google em que esse histórico
era mantido à mão.

Não é um espelho do Redmine. Guarda o que interessa lembrar de cada tarefa: título, tipo,
etapa, quem fez, tag e versões em que saiu. A tag só existe aqui.

## Rodar

Pelo Painel do SysmoDev, bloco **Desenvolvimento**, projeto **Tarefas**. Ou à mão:

```
cd backend  && mvnw.cmd quarkus:dev     API  em 127.0.0.1:5003
cd frontend && npm run dev              site em localhost:8003
```

Mesmas exigências do [Controle de Horas](../controlehoras/README.md#rodar): **JDK 17** no
`JAVA_HOME` (o Painel resolve com `{jdk17}`) e `npm install` feito **no Windows**.

## Base compartilhada

A base é o `../../db/trabalho.db`, o **mesmo arquivo** do Controle de Horas. O histórico
existe em boa parte para responder "quanto tempo foi nesta tarefa", e as horas estão lá: com
dois arquivos, a resposta exigiria abrir os dois e juntar na mão.

| Tabela | Dono | Aqui |
|---|---|---|
| `TB_TAREFA` | este app | cria na subida e grava |
| `TB_HORA` | Controle de Horas | só lê — soma por tarefa, primeiro e último dia |

A `TB_HORA` nunca é criada nem alterada por este app. Numa base em que o Controle de Horas
nunca subiu ela não existe, e a lista sai sem horas — `Base.temHoras` pergunta a cada
consulta, porque o outro app pode criá-la com este no ar.

O número da tarefa é o do Redmine e é a chave: é o mesmo `CD_TAREFA` que o lançamento de
horas grava, e é o que faz a junção funcionar sem tabela de ligação.

Dois processos gravam o arquivo, e por isso a conexão abre com `PRAGMA busy_timeout = 5000`.
Sem a espera, gravar no instante em que o outro segura o arquivo falha na hora com
`SQLITE_BUSY`.

## API

| Verbo | Rota | O quê |
|---|---|---|
| GET | `/api/tarefas?texto=&tipo=&etapa=&dev=&tag=` | lista, da atualizada mais recentemente para a mais antiga, com as horas |
| GET | `/api/tarefas/opcoes` | valores já usados em tipo, etapa, dev e tag |
| GET | `/api/tarefas/{id}` | uma tarefa |
| PUT | `/api/tarefas/{id}` | cria (201) ou altera (200) |
| DELETE | `/api/tarefas/{id}` | apaga do histórico; as horas ficam no Controle de Horas |
| POST | `/api/tarefas/importar` | importa a aba Tarefas da planilha, em CSV |

### `PUT` cria ou altera, e nulo mantém

`PUT` no número, e não `POST`: o número é do Redmine, quem chama já o sabe, e repetir o mesmo
pedido tem de dar o mesmo resultado. É o que a skill `/sysmo-redmine-work` usa depois de lançar
a hora, sem precisar perguntar antes se a tarefa existe.

Na alteração, **campo nulo fica como está**; texto vazio apaga. É o que deixa a skill atualizar
etapa e versões a partir do Redmine sem apagar o que só existe aqui — a tag, e o dev, que no
Redmine é o grupo da equipe e aqui é a pessoa. A tela manda todos os campos, então lá vazio
apaga como se espera.

`atualizacao` em branco vira o dia de hoje: é o dia em que o histórico foi mexido.

### Filtro

No backend, em Java, pelo motivo do Controle de Horas: o `LIKE` do SQLite não ignora acento, e
procurar `projecao` tem de achar `Projeção IA`. Texto casa com o número **ou** o título. Tag é
lista (`Acordo Comercial, Sell Out`), e filtrar por uma delas traz a tarefa.

Tipo, etapa, dev e tag não têm cadastro: as opções saem do próprio dado. Um cadastro só
obrigaria a manter duas listas iguais, e etapa nova se digita direto no formulário, que
sugere as existentes por `<datalist>` sem prender a elas.

## Importação da planilha

`POST /api/tarefas/importar` com o CSV da aba Tarefas (Arquivo → Fazer download → CSV), ou o
botão **Importar planilha** da tela.

| Regra | Por quê |
|---|---|
| só **cria**; tarefa que já existe é ignorada | depois da migração o dado novo é o daqui, e reimportar a planilha velha por engano desfaria o que mudou |
| colunas achadas pelo **cabeçalho** | reordenar a planilha não pode jogar a etapa no lugar do tipo |
| tarefa repetida → fica a linha **mais recente** | a planilha guarda o nome antigo e o novo de tarefa renomeada no Redmine |
| data antes de 2019 → importa e **avisa** | é erro de digitação, e corrigir é de quem conhece a tarefa |
| versões e tags uma por linha → viram lista com vírgula | é o formato que o filtro e a tela esperam |

O CSV é lido por `servico/Csv.java`, feito à mão: a planilha tem célula com vírgula dentro e
célula com quebra de linha dentro, que um `split` quebra. `CsvTest` cobre os dois casos e as
aspas dobradas.

## Testes

```
cd backend && mvnw.cmd test
```

Cobrem o leitor de CSV. Importação, filtro e gravação foram verificados contra a base real.

## Ao alterar

Mudança de coluna da `TB_TAREFA`, da regra de nulo no `PUT` ou do que se lê da `TB_HORA` **muda
este arquivo e a skill `/sysmo-redmine-work` na mesma tarefa** — a skill grava por esta API.
