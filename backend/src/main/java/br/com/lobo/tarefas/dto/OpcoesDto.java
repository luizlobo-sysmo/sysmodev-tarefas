package br.com.lobo.tarefas.dto;

import java.util.List;

/**
 * Valores ja usados em cada campo, para os filtros e as sugestoes do formulario.
 *
 * Sai do proprio dado, e nao de um cadastro: tipo e etapa sao os nomes que a
 * planilha usava, e um cadastro a mais so obrigaria a manter duas listas iguais.
 * `tags` vem desmembrada - na tarefa elas ficam juntas, separadas por virgula.
 */
public class OpcoesDto {

    public List<String> tipos;
    public List<String> etapas;
    public List<String> devs;
    public List<String> tags;
}
