package br.com.lobo.tarefas.recurso;

import java.util.Map;

import br.com.lobo.tarefas.Base;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/api/base")
@Produces(MediaType.APPLICATION_JSON)
public class BaseResource {

    @Inject
    Base base;

    /**
     * Marca de versao da base: muda a cada gravacao, de qualquer processo. A tela
     * pergunta de tempos em tempos e so recarrega quando o numero muda - assim a hora
     * lancada pela skill aparece sem F5, e a consulta pesada nao roda a toa.
     */
    @GET
    @Path("/versao")
    public Map<String, Long> versao() {
        return Map.of("versao", base.ultimaGravacao());
    }
}
