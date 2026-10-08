package br.com.lobo.tarefas.recurso;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import br.com.lobo.tarefas.Filtro;
import br.com.lobo.tarefas.dto.TarefaDto;
import br.com.lobo.tarefas.repositorio.TarefaRepositorio;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/tarefas")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TarefaResource {

    @Inject
    TarefaRepositorio tarefas;

    @GET
    public List<TarefaDto> listar(@QueryParam("texto") String texto) {
        Filtro filtro = Filtro.de(texto);

        return tarefas.listar().stream().filter(filtro::casa).toList();
    }

    @GET
    @Path("/{id}")
    public Response localizar(@PathParam("id") int id) {
        return tarefas.localizar(id)
                      .map(tarefa -> Response.ok(tarefa).build())
                      .orElseGet(() -> Response.status(Response.Status.NOT_FOUND).build());
    }

    /**
     * Cria ou altera a tarefa de numero `id` - 201 se criou, 200 se alterou.
     *
     * PUT no numero, e nao POST: o numero e o do Redmine, quem chama ja o sabe, e
     * gravar duas vezes o mesmo pedido tem de dar o mesmo resultado. E o que a skill
     * /sysmo-redmine-work usa depois de lancar a hora, sem precisar perguntar antes
     * se a tarefa existe.
     *
     * Na alteracao, titulo nulo fica como esta - ver TarefaRepositorio.atualizar.
     * `atualizacao` em branco vira hoje: e o dia em que o historico foi mexido.
     */
    @PUT
    @Path("/{id}")
    public Response gravar(@PathParam("id") int id, TarefaDto tarefa) {
        if (tarefa == null) {
            return erro("Corpo da requisicao vazio.");
        }

        if (id <= 0) {
            return erro("Numero de tarefa invalido.");
        }

        tarefa.id = id;

        if (tarefa.atualizacao == null) {
            tarefa.atualizacao = LocalDate.now();
        }

        if (tarefas.atualizar(tarefa)) {
            return Response.ok(tarefas.localizar(id).orElseThrow()).build();
        }

        if (tarefa.titulo == null || tarefa.titulo.isBlank()) {
            return erro("Digite o titulo.");
        }

        tarefas.inserir(tarefa);

        return Response.status(Response.Status.CREATED).entity(tarefas.localizar(id).orElseThrow()).build();
    }

    @DELETE
    @Path("/{id}")
    public Response deletar(@PathParam("id") int id) {
        return tarefas.deletar(id)
             ? Response.noContent().build()
             : Response.status(Response.Status.NOT_FOUND).build();
    }

    private Response erro(String mensagem) {
        return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("erro", mensagem)).build();
    }
}
