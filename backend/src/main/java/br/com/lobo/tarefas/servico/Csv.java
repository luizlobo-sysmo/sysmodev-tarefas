package br.com.lobo.tarefas.servico;

import java.util.ArrayList;
import java.util.List;

/**
 * Leitor de CSV no formato que o Google Planilhas exporta (RFC 4180).
 *
 * Feito a mao, e nao com biblioteca, porque a planilha tem as duas coisas que um
 * split por virgula quebra: celula com virgula dentro ("2.65.39, 2.67.05") e celula
 * com quebra de linha dentro (versoes uma por linha). As duas chegam entre aspas, e
 * aspas literais chegam dobradas ("").
 */
final class Csv {

    private Csv() {
    }

    static List<List<String>> ler(String texto) {
        List<List<String>> linhas = new ArrayList<>();
        List<String> linha = new ArrayList<>();
        StringBuilder celula = new StringBuilder();
        boolean entreAspas = false;

        // BOM do UTF-8: o Excel grava, e sem tirar ele a primeira coluna nao casaria
        // com o nome esperado.
        int inicio = texto.startsWith("﻿") ? 1 : 0;

        for (int i = inicio; i < texto.length(); i++) {
            char c = texto.charAt(i);

            if (entreAspas) {
                if (c == '"') {
                    if (i + 1 < texto.length() && texto.charAt(i + 1) == '"') {
                        celula.append('"');
                        i++;
                    } else {
                        entreAspas = false;
                    }
                } else {
                    // Quebra de linha dentro da celula chega como CRLF ou LF; fica LF.
                    if (c != '\r') {
                        celula.append(c);
                    }
                }
                continue;
            }

            switch (c) {
                case '"' -> entreAspas = true;
                case ',' -> {
                    linha.add(celula.toString());
                    celula.setLength(0);
                }
                case '\r' -> {
                    // O \n que vem em seguida fecha a linha.
                }
                case '\n' -> {
                    linha.add(celula.toString());
                    celula.setLength(0);
                    linhas.add(linha);
                    linha = new ArrayList<>();
                }
                default -> celula.append(c);
            }
        }

        // Ultima linha sem quebra no fim - e como o Google exporta.
        if (celula.length() > 0 || !linha.isEmpty()) {
            linha.add(celula.toString());
            linhas.add(linha);
        }

        return linhas;
    }
}
