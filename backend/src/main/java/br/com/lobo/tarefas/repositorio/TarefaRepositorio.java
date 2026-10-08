package br.com.lobo.tarefas.repositorio;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import br.com.lobo.tarefas.Base;
import br.com.lobo.tarefas.dto.TarefaDto;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class TarefaRepositorio {

    private static final String SELECAO = """
        SELECT ID,
               TX_TITULO,
               DT_ATUALIZACAO
          FROM TB_TAREFA
        """;

    @Inject
    Base base;

    /**
     * Todas, da atualizada mais recentemente para a mais antiga. O numero desempata:
     * ha dias com varias tarefas, e sem desempate a ordem entre elas mudaria de uma
     * consulta para outra.
     */
    public List<TarefaDto> listar() {
        List<TarefaDto> lista = new ArrayList<>();

        try (Connection conexao = base.abrir();
             PreparedStatement ps = conexao.prepareStatement(SELECAO + " ORDER BY DT_ATUALIZACAO DESC, ID DESC");
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
             PreparedStatement ps = conexao.prepareStatement(SELECAO + " WHERE ID = ?")) {

            ps.setInt(1, id);

            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? Optional.of(montar(rs)) : Optional.empty();
            }
        } catch (SQLException e) {
            throw new IllegalStateException("Falha ao localizar a tarefa " + id, e);
        }
    }

    public void inserir(TarefaDto tarefa) {
        String sql = """
            INSERT INTO TB_TAREFA (ID, TX_TITULO, DT_ATUALIZACAO)
            VALUES (?, ?, ?)
            """;

        try (Connection conexao = base.abrir();
             PreparedStatement ps = conexao.prepareStatement(sql)) {

            ps.setInt(1, tarefa.id);
            ps.setString(2, tarefa.titulo.trim());
            ps.setString(3, tarefa.atualizacao.toString());

            ps.executeUpdate();
        } catch (SQLException e) {
            throw new IllegalStateException("Falha ao inserir a tarefa " + tarefa.id, e);
        }
    }

    /**
     * Grava a data de atualizacao e, se veio, o titulo; titulo nulo ou em branco fica
     * como esta. E o que deixa a skill /sysmo-redmine-work so marcar o dia em que a
     * tarefa foi mexida.
     */
    public boolean atualizar(TarefaDto tarefa) {
        String sql = """
            UPDATE TB_TAREFA
               SET TX_TITULO = coalesce(?, TX_TITULO),
                   DT_ATUALIZACAO = ?
             WHERE ID = ?
            """;

        try (Connection conexao = base.abrir();
             PreparedStatement ps = conexao.prepareStatement(sql)) {

            ps.setString(1, tarefa.titulo != null && !tarefa.titulo.isBlank() ? tarefa.titulo.trim() : null);
            ps.setString(2, tarefa.atualizacao.toString());
            ps.setInt(3, tarefa.id);

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

    private TarefaDto montar(ResultSet rs) throws SQLException {
        TarefaDto tarefa = new TarefaDto();

        tarefa.id = rs.getInt("ID");
        tarefa.titulo = rs.getString("TX_TITULO");
        tarefa.atualizacao = LocalDate.parse(rs.getString("DT_ATUALIZACAO"));

        return tarefa;
    }
}
