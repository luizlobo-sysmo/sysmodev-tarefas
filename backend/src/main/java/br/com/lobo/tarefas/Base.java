package br.com.lobo.tarefas;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;

/**
 * Acesso a base SQLite compartilhada com o Controle de Horas.
 *
 * Uma conexao por operacao, aberta por DriverManager, como no Controle de Horas:
 * SQLite nao tem extensao Quarkus, e um pool nao ajudaria um app de um usuario so.
 * Quem chama fecha, sempre em try-with-resources.
 *
 * Este app e dono so da TB_TAREFA. A TB_HORA, no mesmo arquivo, e do Controle de
 * Horas e nao e lida aqui.
 */
@ApplicationScoped
public class Base {

    private static final Logger LOG = Logger.getLogger(Base.class);

    /** Colunas da primeira versao, quando o historico copiava a planilha. */
    private static final String[] COLUNAS_REMOVIDAS = { "TX_TIPO", "TX_ETAPA", "TX_DEV", "TX_TAG", "TX_VERSOES" };

    @ConfigProperty(name = "base.arquivo")
    String arquivo;

    @PostConstruct
    void iniciar() {
        Path caminho = Paths.get(arquivo).toAbsolutePath().normalize();

        Path pasta = caminho.getParent();

        if (pasta != null) {
            try {
                Files.createDirectories(pasta);
            } catch (Exception e) {
                throw new IllegalStateException("Falha ao criar a pasta da base: " + pasta, e);
            }
        }

        try (Connection conexao = abrir()) {
            ajustarEsquema(conexao);
        } catch (SQLException e) {
            throw new IllegalStateException("Falha ao abrir a base local: " + caminho, e);
        }

        LOG.infof("Base local em %s", caminho);
    }

    /**
     * Instante da ultima gravacao no arquivo da base, em milissegundos.
     *
     * E o que a tela consulta para se atualizar sozinha quando outro processo grava -
     * a skill /sysmo-redmine-work lancando hora, ou o outro app que divide o arquivo.
     * A data do arquivo, e nao uma contagem de linhas: pega insercao, alteracao e
     * exclusao em qualquer tabela, com uma leitura de metadado e nenhuma consulta.
     */
    public long ultimaGravacao() {
        try {
            return Files.getLastModifiedTime(Paths.get(arquivo).toAbsolutePath().normalize()).toMillis();
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao ler a data da base", e);
        }
    }

    public Connection abrir() throws SQLException {
        Path caminho = Paths.get(arquivo).toAbsolutePath().normalize();

        Connection conexao = DriverManager.getConnection("jdbc:sqlite:" + caminho);

        // Dois processos gravam o mesmo arquivo - este e o Controle de Horas. Sem
        // busy_timeout, a gravacao que encontra o arquivo travado pelo outro falha na
        // hora com SQLITE_BUSY, em vez de esperar os milissegundos que a outra leva.
        try (Statement st = conexao.createStatement()) {
            st.execute("PRAGMA busy_timeout = 5000");
        }

        return conexao;
    }

    /**
     * Cria a TB_TAREFA se faltar e tira as colunas que deixaram de existir. Roda em
     * toda subida e e idempotente.
     *
     * So numero, titulo e data de atualizacao: tipo, etapa, dev, versoes e horas se
     * consultam no Redmine, e uma copia aqui so ficaria desatualizada.
     *
     * DT_ATUALIZACAO em texto ISO (yyyy-MM-dd): SQLite nao tem data nativa, e ISO
     * ordena certo como texto.
     */
    private void ajustarEsquema(Connection conexao) throws SQLException {
        try (Statement st = conexao.createStatement()) {
            st.executeUpdate("""
                CREATE TABLE IF NOT EXISTS TB_TAREFA (
                  ID INTEGER PRIMARY KEY,
                  TX_TITULO TEXT NOT NULL,
                  DT_ATUALIZACAO TEXT NOT NULL
                )
                """);

            st.executeUpdate("CREATE INDEX IF NOT EXISTS IX_TAREFA_ATUALIZACAO ON TB_TAREFA (DT_ATUALIZACAO)");

            for (String coluna : COLUNAS_REMOVIDAS) {
                if (temColuna(conexao, coluna)) {
                    st.executeUpdate("ALTER TABLE TB_TAREFA DROP COLUMN " + coluna);
                    LOG.infof("Coluna TB_TAREFA.%s removida", coluna);
                }
            }
        }
    }

    private static boolean temColuna(Connection conexao, String coluna) throws SQLException {
        DatabaseMetaData meta = conexao.getMetaData();
        try (ResultSet rs = meta.getColumns(null, null, "TB_TAREFA", coluna)) {
            return rs.next();
        }
    }
}
