package br.com.lobo.tarefas;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Hora decimal (a da TB_HORA) em hh:mm, so para exibir.
 *
 * E copia do Horas.paraRelogio do Controle de Horas, e so dele: aqui nada e gravado,
 * entao a conversao no sentido contrario - a que decide o valor que vai para o banco
 * - continua existindo num lugar so.
 */
public final class Horas {

    private static final BigDecimal SESSENTA = BigDecimal.valueOf(60);

    private Horas() {
    }

    public static String paraRelogio(BigDecimal decimal) {
        if (decimal == null) {
            return "00:00";
        }

        boolean negativo = decimal.signum() < 0;
        BigDecimal valor = decimal.abs();

        int horas = valor.intValue();
        int minutos = valor.subtract(BigDecimal.valueOf(horas))
                           .multiply(SESSENTA)
                           .setScale(0, RoundingMode.HALF_UP)
                           .intValue();

        // 1,999 arredonda para 60 minutos, que nao existe no relogio.
        if (minutos == 60) {
            horas++;
            minutos = 0;
        }

        return "%s%02d:%02d".formatted(negativo ? "-" : "", horas, minutos);
    }
}
