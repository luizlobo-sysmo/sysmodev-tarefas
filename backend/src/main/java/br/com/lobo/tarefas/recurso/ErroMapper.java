package br.com.lobo.tarefas.recurso;

import java.util.Map;

import org.jboss.logging.Logger;

import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

/**
 * Rede de seguranca: transforma excecao nao tratada em resposta que a tela consegue
 * mostrar.
 *
 * Sem isto, a falha chegaria na tela como "Request failed with status code 500" -
 * que nao diz o que corrigir. Os recursos validam antes e devolvem 400 com mensagem
 * propria; este mapper cobre o que escapar. Mesmo arranjo do Controle de Horas.
 *
 * IllegalArgumentException vira 400, e nao 500: e o que a importacao lanca quando
 * nao entende uma data, e entrada malformada e erro de quem chamou.
 */
@Provider
public class ErroMapper implements ExceptionMapper<RuntimeException> {

    private static final Logger LOG = Logger.getLogger(ErroMapper.class);

    @Override
    public Response toResponse(RuntimeException e) {
        // WebApplicationException JA carrega a resposta pretendida - inclusive o 404
        // de rota inexistente, que o JAX-RS lanca. Tratar como falha transformaria
        // "nao encontrei" em erro de servidor.
        if (e instanceof WebApplicationException w) {
            return w.getResponse();
        }

        if (e instanceof IllegalArgumentException) {
            return Response.status(Response.Status.BAD_REQUEST)
                           .type(MediaType.APPLICATION_JSON)
                           .entity(Map.of("erro", mensagem(e)))
                           .build();
        }

        // 500 tambem sai com corpo legivel, e a pilha vai para o log - a tela mostra o
        // que aconteceu sem obrigar a abrir o console do backend.
        LOG.error("Falha nao tratada", e);

        return Response.serverError()
                       .type(MediaType.APPLICATION_JSON)
                       .entity(Map.of("erro", mensagem(e)))
                       .build();
    }

    private String mensagem(RuntimeException e) {
        String texto = e.getMessage();

        if (texto == null || texto.isBlank()) {
            return e.getClass().getSimpleName();
        }

        return texto;
    }
}
