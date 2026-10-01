package br.com.lobo.tarefas.servico;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.List;

import org.junit.jupiter.api.Test;

/** O formato que o Google Planilhas exporta, com os casos que a aba Tarefas tem. */
class CsvTest {

    @Test
    void virgulaDentroDeAspasNaoSeparaCelula() {
        List<List<String>> linhas = Csv.ler("a,\"2.65.39, 2.67.05\",c\r\n");

        assertEquals(List.of(List.of("a", "2.65.39, 2.67.05", "c")), linhas);
    }

    @Test
    void quebraDeLinhaDentroDeAspasFicaNaCelula() {
        List<List<String>> linhas = Csv.ler("x,\"2.72.01\r\n2.74.03\"\r\ny,z");

        assertEquals(List.of(List.of("x", "2.72.01\n2.74.03"), List.of("y", "z")), linhas);
    }

    @Test
    void aspasDobradasViramUmaAspa() {
        List<List<String>> linhas = Csv.ler("\"\"\"Out of memory\"\" ao gerar\"");

        assertEquals(List.of(List.of("\"Out of memory\" ao gerar")), linhas);
    }

    @Test
    void celulasVaziasNoFimSaoMantidas() {
        List<List<String>> linhas = Csv.ler("a,b,,\r\n");

        assertEquals(List.of(List.of("a", "b", "", "")), linhas);
    }
}
