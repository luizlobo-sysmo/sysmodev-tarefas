package br.com.lobo.tarefas;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.Locale;

import br.com.lobo.tarefas.dto.TarefaDto;

/**
 * Filtro da lista: texto livre, tipo, etapa, dev e tag.
 *
 * Em Java, e nao no SQL, pelo mesmo motivo do Controle de Horas: o LIKE do SQLite
 * nao ignora acento, e procurar "projecao" tem de achar "Projecao IA" escrito com
 * cedilha e til. A tabela inteira tem centenas de linhas, nao milhares.
 *
 * Texto casa com o numero OU o titulo - quem procura "365158" e quem procura
 * "fechamento" estao fazendo a mesma pergunta.
 */
public record Filtro(String texto, String tipo, String etapa, String dev, String tag) {

    public static Filtro de(String texto, String tipo, String etapa, String dev, String tag) {
        return new Filtro(normalizar(texto), normalizar(tipo), normalizar(etapa), normalizar(dev), normalizar(tag));
    }

    public boolean casa(TarefaDto tarefa) {
        if (!tipo.isEmpty() && !normalizar(tarefa.tipo).equals(tipo)) {
            return false;
        }

        if (!etapa.isEmpty() && !normalizar(tarefa.etapa).equals(etapa)) {
            return false;
        }

        if (!dev.isEmpty() && !normalizar(tarefa.dev).equals(dev)) {
            return false;
        }

        // Tag e lista: "Acordo Comercial, Sell Out" tem as duas, e filtrar por uma
        // tem de trazer a tarefa. Comparar o texto inteiro so acharia quem tem uma.
        if (!tag.isEmpty() && Arrays.stream(normalizar(tarefa.tag).split(",")).map(String::trim).noneMatch(tag::equals)) {
            return false;
        }

        if (!texto.isEmpty()) {
            return String.valueOf(tarefa.id).contains(texto) || normalizar(tarefa.titulo).contains(texto);
        }

        return true;
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
