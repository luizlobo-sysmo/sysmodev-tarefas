package br.com.lobo.tarefas.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Uma tarefa do historico.
 *
 * `id` e o numero da tarefa no Redmine - nao ha codigo proprio. E o numero que se
 * digita no lancamento de horas e o que liga a tarefa a TB_HORA.
 *
 * Os campos de horas vem da TB_HORA, do Controle de Horas, e sao ignorados na
 * gravacao. `horas` e decimal, como a TB_HORA guarda; `horasRelogio` e o mesmo
 * total em hh:mm.
 */
public class TarefaDto {

    public Integer id;
    public String titulo;
    public String tipo;
    public String etapa;
    public String dev;
    public String tag;
    public String versoes;
    public LocalDate atualizacao;

    public BigDecimal horas;
    public String horasRelogio;
    public LocalDate primeiroDia;
    public LocalDate ultimoDia;
}
