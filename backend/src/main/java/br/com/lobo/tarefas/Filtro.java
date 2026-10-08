package br.com.lobo.tarefas;

import java.text.Normalizer;
import java.util.Locale;

import br.com.lobo.tarefas.dto.TarefaDto;

/**
 * Filtro da lista: texto livre.
 *
 * Em Java, e nao no SQL, pelo mesmo motivo do Controle de Horas: o LIKE do SQLite
 * nao ignora acento, e procurar "projecao" tem de achar "Projecao IA" escrito com
 * cedilha e til. A tabela inteira tem centenas de linhas, nao milhares.
 *
 * Texto casa com o numero OU o titulo - quem procura "365158" e quem procura
 * "fechamento" estao fazendo a mesma pergunta.
 */
public record Filtro(String texto) {

    public static Filtro de(String texto) {
        return new Filtro(normalizar(texto));
    }

    public boolean casa(TarefaDto tarefa) {
        if (texto.isEmpty()) {
            return true;
        }

        return String.valueOf(tarefa.id).contains(texto) || normalizar(tarefa.titulo).contains(texto);
    }

    /** Minusculas e sem acento: NFD separa a letra da marca, o replace descarta a marca. */
    static String normalizar(String texto) {
        if (texto == null) {
            return "";
        }

        return Normalizer.normalize(texto.trim(), Normalizer.Form.NFD)
                         .replaceAll("\\p{M}", "")
                         .toLowerCase(Locale.ROOT);
    }
}
