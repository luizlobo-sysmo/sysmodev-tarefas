# Tarefas

Histórico das tarefas do Redmine em que mexi: número, título do Redmine, uma descrição breve do
que se trata e o último dia em que a tarefa foi mexida. Substitui a aba **Tarefas** da planilha do Google em que esse histórico era mantido à
mão.

Não é um espelho do Redmine. Tipo, situação, quem fez, versões e horas se consultam lá, pelo
link do número; uma cópia aqui só ficaria desatualizada.

## Rodar

Pelo Painel do SysmoDev, bloco **Desenvolvimento**, projeto **Tarefas**. Ou à mão:

```
cd backend  && mvnw.cmd quarkus:dev     API  em 127.0.0.1:5003
cd frontend && npm run dev              site em localhost:8003
```

Mesmas exigências do [Controle de Horas](../controlehoras/README.md#rodar): **JDK 17** no
`JAVA_HOME` (o Painel resolve com `{jdk17}`) e `npm install` feito **no Windows**.

O depurador do `quarkus:dev` escuta na **5103**, fixada no `pom.xml` (`<debug>`). O padrão
do Quarkus é 5005 para qualquer projeto, e o Painel sobe este e o Controle de Horas juntos: o
segundo a subir morria com `bind failed: Address already in use` antes de abrir a API.

## Base

A base é o `../../db/trabalho.db`, o **mesmo arquivo** do Controle de Horas.

| Tabela | Dono | Aqui |
|---|---|---|
| `TB_TAREFA` | este app | cria na subida e grava |
| `TB_HORA` | Controle de Horas | não é lida |

`TB_TAREFA` tem só `ID` (o número da tarefa no Redmine), `TX_TITULO`, `TX_DESCRICAO` e
`DT_ATUALIZACAO`. O título é o do Redmine, que muitas vezes não diz do que a tarefa trata
("Reforma Tributária 2026 - Compras e WMS"); a descrição é uma frase que diz, para achar a
tarefa depois. Tarefa anterior à coluna fica com a descrição vazia. A subida cria a
`TX_DESCRICAO` se faltar e apaga as colunas da primeira versão (`TX_TIPO`, `TX_ETAPA`, `TX_DEV`, `TX_TAG`,
`TX_VERSOES`), se ainda existirem.

Dois processos gravam o arquivo, e por isso a conexão abre com `PRAGMA busy_timeout = 5000`.
Sem a espera, gravar no instante em que o outro segura o arquivo falha na hora com
`SQLITE_BUSY`.

## API

| Verbo | Rota | O quê |
|---|---|---|
| GET | `/api/tarefas?texto=` | lista, da atualizada mais recentemente para a mais antiga |
| GET | `/api/tarefas/{id}` | uma tarefa |
| PUT | `/api/tarefas/{id}` | cria (201) ou altera (200) |
| DELETE | `/api/tarefas/{id}` | apaga do histórico; as horas ficam no Controle de Horas |
| GET | `/api/base/versao` | data da última gravação na base — ver abaixo |

### Atualização sozinha

`GET /api/base/versao` devolve a data da última gravação do `trabalho.db`. A tela pergunta a
cada 5 s e ao voltar o foco para a aba, e só recarrega quando o número muda — é o que faz a hora
lançada pela `/sysmo-redmine-work`, ou a gravação do outro app, aparecer sem F5. A data do
arquivo, e não uma contagem de linhas: pega inserção, alteração e exclusão em qualquer tabela
com uma leitura de metadado. Com janela aberta a recarga espera ela fechar, para a lista não
mudar embaixo de quem está editando (`util/aoMudarBase.ts`).

### `PUT` cria ou altera, e título nulo mantém

`PUT` no número, e não `POST`: o número é do Redmine, quem chama já o sabe, e repetir o mesmo
pedido tem de dar o mesmo resultado. É o que a skill `/sysmo-redmine-work` usa depois de lançar
a hora, sem precisar perguntar antes se a tarefa existe.

Na criação o título é obrigatório. Na alteração, título nulo ou em branco fica como está, e
descrição nula fica como está (texto vazio apaga): a skill manda `{}` na tarefa que já existe, e
só a data de atualização muda.

`atualizacao` em branco vira o dia de hoje: é o dia em que o histórico foi mexido.

### Filtro

No backend, em Java, pelo motivo do Controle de Horas: o `LIKE` do SQLite não ignora acento, e
procurar `projecao` tem de achar `Projeção IA`. Texto casa com o número, o título **ou** a
descrição.

## Ao alterar

Mudança de coluna da `TB_TAREFA` ou da regra de nulo no `PUT` **muda
este arquivo e a skill `/sysmo-redmine-work` na mesma tarefa** — a skill grava por esta API.
