package br.com.lobo.tarefas.repositorio;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.TreeSet;

import br.com.lobo.tarefas.Base;
import br.com.lobo.tarefas.Horas;
import br.com.lobo.tarefas.dto.OpcoesDto;
import br.com.lobo.tarefas.dto.TarefaDto;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class TarefaRepositorio {

    private static final String COLUNAS = """
        SELECT T.ID,
               T.TX_TITULO,
               T.TX_TIPO,
               T.TX_ETAPA,
               T.TX_DEV,
               T.TX_TAG,
               T.TX_VERSOES,
               T.DT_ATUALIZACAO
        """;

    /**
     * Com as horas do Controle de Horas, somadas por tarefa.
     *
     * Subconsulta agrupada, e nao join direto: o join repetiria a tarefa uma vez por
     * lancamento. O substr corta a hora do DT_DATA, gravado como
     * "2026-08-07 08:56:01.323" desde o Delphi.
     */
    private static final String COM_HORAS = COLUNAS + """
             , H.HORAS,
               H.PRIMEIRO,
               H.ULTIMO
          FROM TB_TAREFA T
          LEFT JOIN (SELECT CD_TAREFA,
                            sum(NR_TEMPO) AS HORAS,
                            min(substr(DT_DATA, 1, 10)) AS PRIMEIRO,
                            max(substr(DT_DATA, 1, 10)) AS ULTIMO
                       FROM TB_HORA
                      GROUP BY CD_TAREFA) H ON H.CD_TAREFA = T.ID
        """;

    private static final String SEM_HORAS = COLUNAS + """
             , NULL AS HORAS,
               NULL AS PRIMEIRO,
               NULL AS ULTIMO
          FROM TB_TAREFA T
        """;

    @Inject
    Base base;

    /**
     * Todas, da atualizada mais recentemente para a mais antiga. O numero desempata:
     * a planilha tem dias com varias tarefas, e sem desempate a ordem entre elas
     * mudaria de uma consulta para outra.
     */
    public List<TarefaDto> listar() {
        List<TarefaDto> lista = new ArrayList<>();

        try (Connection conexao = base.abrir();
             PreparedStatement ps = conexao.prepareStatement(selecao(conexao) + " ORDER BY T.DT_ATUALIZACAO DESC, T.ID DESC");
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                lista.add(montar(rs));
            }
        } catch (SQLException e) {
            throw new IllegalStateException("Falha ao listar tarefas", e);
        }

        return lista;
    }

    public Optional<TarefaDto> localizar(int id) {
        try (Connection conexao = base.abrir();
             PreparedStatement ps = conexao.prepareStatement(selecao(conexao) + " WHERE T.ID = ?")) {

            ps.setInt(1, id);

            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? Optional.of(montar(rs)) : Optional.empty();
            }
        } catch (SQLException e) {
            throw new IllegalStateException("Falha ao localizar a tarefa " + id, e);
        }
    }

    public boolean existe(int id) {
        try (Connection conexao = base.abrir();
             PreparedStatement ps = conexao.prepareStatement("SELECT 1 FROM TB_TAREFA WHERE ID = ?")) {

            ps.setInt(1, id);

            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        } catch (SQLException e) {
            throw new IllegalStateException("Falha ao conferir a tarefa " + id, e);
        }
    }

    public void inserir(TarefaDto tarefa) {
        String sql = """
            INSERT INTO TB_TAREFA (ID, TX_TITULO, TX_TIPO, TX_ETAPA, TX_DEV, TX_TAG, TX_VERSOES, DT_ATUALIZACAO)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """;

        try (Connection conexao = base.abrir();
             PreparedStatement ps = conexao.prepareStatement(sql)) {

            ps.setInt(1, tarefa.id);
            ps.setString(2, texto(tarefa.titulo));
            ps.setString(3, texto(tarefa.tipo));
            ps.setString(4, texto(tarefa.etapa));
            ps.setString(5, texto(tarefa.dev));
            ps.setString(6, texto(tarefa.tag));
            ps.setString(7, texto(tarefa.versoes));
            ps.setString(8, tarefa.atualizacao.toString());

            ps.executeUpdate();
        } catch (SQLException e) {
            throw new IllegalStateException("Falha ao inserir a tarefa " + tarefa.id, e);
        }
    }

    /**
     * Altera so o que veio preenchido; campo nulo fica como esta.
     *
     * E o que permite a skill atualizar etapa e versoes a partir do Redmine sem
     * apagar o que so existe aqui - a tag, que o Redmine nao tem, e o dev, que la e
     * o grupo da equipe e aqui e a pessoa. Para LIMPAR um campo manda-se texto
     * vazio, que e diferente de nulo.
     */
    public boolean atualizar(TarefaDto tarefa) {
        String sql = """
            UPDATE TB_TAREFA
               SET TX_TITULO = coalesce(?, TX_TITULO),
                   TX_TIPO = coalesce(?, TX_TIPO),
                   TX_ETAPA = coalesce(?, TX_ETAPA),
                   TX_DEV = coalesce(?, TX_DEV),
                   TX_TAG = coalesce(?, TX_TAG),
                   TX_VERSOES = coalesce(?, TX_VERSOES),
                   DT_ATUALIZACAO = ?
             WHERE ID = ?
            """;

        try (Connection conexao = base.abrir();
             PreparedStatement ps = conexao.prepareStatement(sql)) {

            ps.setString(1, aparado(tarefa.titulo));
            ps.setString(2, aparado(tarefa.tipo));
            ps.setString(3, aparado(tarefa.etapa));
            ps.setString(4, aparado(tarefa.dev));
            ps.setString(5, aparado(tarefa.tag));
            ps.setString(6, aparado(tarefa.versoes));
            ps.setString(7, tarefa.atualizacao.toString());
            ps.setInt(8, tarefa.id);

            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new IllegalStateException("Falha ao atualizar a tarefa " + tarefa.id, e);
        }
    }

    public boolean deletar(int id) {
        try (Connection conexao = base.abrir();
             PreparedStatement ps = conexao.prepareStatement("DELETE FROM TB_TAREFA WHERE ID = ?")) {

            ps.setInt(1, id);

            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new IllegalStateException("Falha ao deletar a tarefa " + id, e);
        }
    }

    public OpcoesDto opcoes() {
        TreeSet<String> tipos = new TreeSet<>();
        TreeSet<String> etapas = new TreeSet<>();
        TreeSet<String> devs = new TreeSet<>();
        TreeSet<String> tags = new TreeSet<>();

        try (Connection conexao = base.abrir();
             PreparedStatement ps = conexao.prepareStatement("SELECT TX_TIPO, TX_ETAPA, TX_DEV, TX_TAG FROM TB_TAREFA");
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                adicionar(tipos, rs.getString(1));
                adicionar(etapas, rs.getString(2));
                adicionar(devs, rs.getString(3));
                Arrays.stream(rs.getString(4).split(",")).forEach(tag -> adicionar(tags, tag));
            }
        } catch (SQLException e) {
            throw new IllegalStateException("Falha ao listar as opcoes", e);
        }

        OpcoesDto opcoes = new OpcoesDto();
        opcoes.tipos = List.copyOf(tipos);
        opcoes.etapas = List.copyOf(etapas);
        opcoes.devs = List.copyOf(devs);
        opcoes.tags = List.copyOf(tags);

        return opcoes;
    }

    private String selecao(Connection conexao) throws SQLException {
        return base.temHoras(conexao) ? COM_HORAS : SEM_HORAS;
    }

    private static void adicionar(TreeSet<String> conjunto, String valor) {
        if (valor != null && !valor.isBlank()) {
            conjunto.add(valor.trim());
        }
    }

    private static String texto(String valor) {
        return valor != null ? valor.trim() : "";
    }

    private static String aparado(String valor) {
        return valor != null ? valor.trim() : null;
    }

    private TarefaDto montar(ResultSet rs) throws SQLException {
        TarefaDto tarefa = new TarefaDto();

        tarefa.id = rs.getInt("ID");
        tarefa.titulo = rs.getString("TX_TITULO");
        tarefa.tipo = rs.getString("TX_TIPO");
        tarefa.etapa = rs.getString("TX_ETAPA");
        tarefa.dev = rs.getString("TX_DEV");
        tarefa.tag = rs.getString("TX_TAG");
        tarefa.versoes = rs.getString("TX_VERSOES");
        tarefa.atualizacao = LocalDate.parse(rs.getString("DT_ATUALIZACAO"));

        tarefa.horas = rs.getBigDecimal("HORAS");
        tarefa.horasRelogio = tarefa.horas != null ? Horas.paraRelogio(tarefa.horas) : null;

        String primeiro = rs.getString("PRIMEIRO");
        String ultimo = rs.getString("ULTIMO");
        tarefa.primeiroDia = primeiro != null ? LocalDate.parse(primeiro) : null;
        tarefa.ultimoDia = ultimo != null ? LocalDate.parse(ultimo) : null;

        return tarefa;
    }
}
