package br.com.lobo.tarefas.servico;

import java.text.Normalizer;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

import br.com.lobo.tarefas.dto.ImportacaoDto;
import br.com.lobo.tarefas.dto.TarefaDto;
import br.com.lobo.tarefas.repositorio.TarefaRepositorio;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

/**
 * Importa a aba Tarefas da planilha do Google, exportada em CSV.
 *
 * So CRIA. Tarefa que ja existe aqui e ignorada, nunca sobrescrita: depois da
 * migracao quem tem o dado mais novo e este app, e reimportar a planilha velha por
 * engano desfaria o que mudou desde entao.
 *
 * As colunas sao achadas pelo cabecalho, e nao pela posicao: reordenar a planilha
 * nao pode jogar a etapa no lugar do tipo sem ninguem perceber.
 */
@ApplicationScoped
public class Importacao {

    private static final DateTimeFormatter DATA = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    /**
     * Primeiro ano do historico. Data antes disso e erro de digitacao - a planilha tem
     * "21/11/2015" numa tarefa aberta em 2025. Importa assim mesmo e avisa: corrigir e
     * decisao de quem conhece a tarefa, nao da importacao.
     */
    private static final LocalDate INICIO_PLAUSIVEL = LocalDate.of(2019, 1, 1);

    @Inject
    TarefaRepositorio tarefas;

    public ImportacaoDto importar(String csv) {
        List<List<String>> linhas = Csv.ler(csv);

        if (linhas.isEmpty()) {
            throw new IllegalArgumentException("Planilha vazia.");
        }

        Map<String, Integer> colunas = indice(linhas.get(0));

        ImportacaoDto resultado = new ImportacaoDto();

        // A mesma tarefa pode aparecer duas vezes - a planilha guardou o nome antigo
        // e o novo de uma tarefa renomeada no Redmine. Vale a linha mais recente, que
        // e a que reflete a tarefa como ela esta.
        Map<Integer, TarefaDto> porNumero = new LinkedHashMap<>();

        for (int i = 1; i < linhas.size(); i++) {
            List<String> linha = linhas.get(i);

            if (linha.stream().allMatch(String::isBlank)) {
                continue;
            }

            resultado.lidas++;

            TarefaDto tarefa;

            try {
                tarefa = montar(linha, colunas);
            } catch (IllegalArgumentException e) {
                resultado.ignoradas++;
                resultado.avisos.add("Linha %d ignorada: %s".formatted(i + 1, e.getMessage()));
                continue;
            }

            if (tarefa.atualizacao.isBefore(INICIO_PLAUSIVEL)) {
                resultado.avisos.add("Tarefa %d com data %s, anterior ao historico - confira."
                                         .formatted(tarefa.id, tarefa.atualizacao.format(DATA)));
            }

            TarefaDto anterior = porNumero.get(tarefa.id);

            if (anterior != null) {
                TarefaDto fica = tarefa.atualizacao.isBefore(anterior.atualizacao) ? anterior : tarefa;
                TarefaDto sai = fica == tarefa ? anterior : tarefa;

                resultado.ignoradas++;
                resultado.avisos.add("Tarefa %d repetida: fica \"%s\" (%s), sai \"%s\" (%s)."
                                         .formatted(tarefa.id, fica.titulo, fica.atualizacao.format(DATA),
                                                    sai.titulo, sai.atualizacao.format(DATA)));

                porNumero.put(tarefa.id, fica);
                continue;
            }

            porNumero.put(tarefa.id, tarefa);
        }

        for (TarefaDto tarefa : porNumero.values()) {
            if (tarefas.existe(tarefa.id)) {
                resultado.ignoradas++;
                continue;
            }

            tarefas.inserir(tarefa);
            resultado.criadas++;
        }

        return resultado;
    }

    private TarefaDto montar(List<String> linha, Map<String, Integer> colunas) {
        TarefaDto tarefa = new TarefaDto();

        String numero = campo(linha, colunas, "tarefa").replace("#", "").trim();

        try {
            tarefa.id = Integer.valueOf(numero);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("numero de tarefa invalido: \"" + numero + "\"");
        }

        tarefa.titulo = campo(linha, colunas, "descricao").trim();

        if (tarefa.titulo.isEmpty()) {
            throw new IllegalArgumentException("tarefa " + numero + " sem descricao");
        }

        String data = campo(linha, colunas, "ult. atualizacao").trim();

        try {
            tarefa.atualizacao = LocalDate.parse(data, DATA);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("tarefa " + numero + " com data invalida: \"" + data + "\"");
        }

        tarefa.tipo = campo(linha, colunas, "tipo").trim();
        tarefa.etapa = campo(linha, colunas, "etapa").trim();
        tarefa.dev = campo(linha, colunas, "dev").trim();
        tarefa.tag = lista(campo(linha, colunas, "tag"));
        tarefa.versoes = lista(campo(linha, colunas, "versao liberada"));

        return tarefa;
    }

    /**
     * Versoes e tags chegam ora separadas por virgula, ora uma por linha dentro da
     * celula. Viram uma lista so, separada por virgula - e o que o filtro e a tela
     * esperam.
     */
    private static String lista(String valor) {
        return Arrays.stream(valor.split("[,\\n]"))
                     .map(String::trim)
                     .filter(parte -> !parte.isEmpty())
                     .collect(Collectors.joining(", "));
    }

    private static Map<String, Integer> indice(List<String> cabecalho) {
        Map<String, Integer> colunas = new LinkedHashMap<>();

        for (int i = 0; i < cabecalho.size(); i++) {
            colunas.put(normalizar(cabecalho.get(i)), i);
        }

        List<String> faltando = new ArrayList<>();
        for (String obrigatoria : List.of("ult. atualizacao", "tarefa", "descricao")) {
            if (!colunas.containsKey(obrigatoria)) {
                faltando.add(obrigatoria);
            }
        }

        if (!faltando.isEmpty()) {
            throw new IllegalArgumentException("Cabecalho sem as colunas " + faltando + ". E a aba Tarefas?");
        }

        return colunas;
    }

    private static String campo(List<String> linha, Map<String, Integer> colunas, String nome) {
        Integer posicao = colunas.get(nome);
        return posicao != null && posicao < linha.size() ? linha.get(posicao) : "";
    }

    private static String normalizar(String texto) {
        return Normalizer.normalize(texto.trim(), Normalizer.Form.NFD)
                         .replaceAll("\\p{M}", "")
                         .toLowerCase(Locale.ROOT);
    }
}
