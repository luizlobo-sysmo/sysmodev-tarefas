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
 * Este app e dono so da TB_TAREFA. A TB_HORA e do Controle de Horas, e aqui e
 * apenas lida - nunca criada nem alterada. Base nova, sem o Controle de Horas ter
 * subido nunca, simplesmente nao tem horas: ver {@link #temHoras}.
 */
@ApplicationScoped
public class Base {

    private static final Logger LOG = Logger.getLogger(Base.class);

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
     * Cria a TB_TAREFA se faltar. Roda em toda subida e e idempotente.
     *
     * As colunas sao as da aba Tarefas da planilha que este app substitui. Tag e
     * versoes ficam em texto, separadas por virgula, como na planilha: sao para ler
     * e filtrar, nao para cruzar com outra tabela.
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
                  TX_TIPO TEXT NOT NULL DEFAULT '',
                  TX_ETAPA TEXT NOT NULL DEFAULT '',
                  TX_DEV TEXT NOT NULL DEFAULT '',
                  TX_TAG TEXT NOT NULL DEFAULT '',
                  TX_VERSOES TEXT NOT NULL DEFAULT '',
                  DT_ATUALIZACAO TEXT NOT NULL
                )
                """);

            st.executeUpdate("CREATE INDEX IF NOT EXISTS IX_TAREFA_ATUALIZACAO ON TB_TAREFA (DT_ATUALIZACAO)");
        }
    }

    /**
     * A TB_HORA existe? E do Controle de Horas; numa base em que ele nunca subiu, nao.
     *
     * Perguntado a cada consulta, e nao guardado na subida: o Controle de Horas pode
     * criar a tabela com este app ja no ar.
     */
    public boolean temHoras(Connection conexao) throws SQLException {
        DatabaseMetaData meta = conexao.getMetaData();
        try (ResultSet rs = meta.getTables(null, null, "TB_HORA", new String[] { "TABLE" })) {
            return rs.next();
        }
    }
}
