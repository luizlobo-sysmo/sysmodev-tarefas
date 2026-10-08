package br.com.lobo.tarefas.dto;

import java.time.LocalDate;

/**
 * Uma tarefa do historico.
 *
 * `id` e o numero da tarefa no Redmine - nao ha codigo proprio. E o numero que se
 * digita no lancamento de horas. `titulo` e o do Redmine; `descricao` e uma frase
 * do que se trata. O resto da tarefa (tipo, situacao, versoes, horas) se consulta
 * no Redmine.
 */
public class TarefaDto {

    public Integer id;
    public String titulo;
    public String descricao;
    public LocalDate atualizacao;
}
