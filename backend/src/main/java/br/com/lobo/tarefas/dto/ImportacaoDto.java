package br.com.lobo.tarefas.dto;

import java.util.ArrayList;
import java.util.List;

/** O que a importacao da planilha fez, com aviso para cada linha que pediu decisao. */
public class ImportacaoDto {

    public int lidas;
    public int criadas;
    public int ignoradas;
    public List<String> avisos = new ArrayList<>();
}
