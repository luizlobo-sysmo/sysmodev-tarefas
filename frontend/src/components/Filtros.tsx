import { Filtro, FILTRO_VAZIO, filtroAtivo, Opcoes } from '../types/tarefa';

interface Props {
  filtro: Filtro;
  opcoes: Opcoes;
  onMudar: (filtro: Filtro) => void;
}

function Lista({ rotulo, valor, itens, onMudar }: { rotulo: string; valor: string; itens: string[]; onMudar: (valor: string) => void }) {
  return (
    <label>
      {rotulo}
      <select value={valor} onChange={(e) => onMudar(e.target.value)}>
        <option value="">Todos</option>
        {itens.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Texto livre (número ou título) e as quatro listas, com os valores que o histórico já usa. */
export default function Filtros({ filtro, opcoes, onMudar }: Props) {
  return (
    <div className="filtros">
      <label className="cresce">
        Tarefa
        <input
          type="text"
          placeholder="número ou título"
          value={filtro.texto}
          onChange={(e) => onMudar({ ...filtro, texto: e.target.value })}
        />
      </label>

      <Lista rotulo="Tipo" valor={filtro.tipo} itens={opcoes.tipos} onMudar={(tipo) => onMudar({ ...filtro, tipo })} />
      <Lista rotulo="Etapa" valor={filtro.etapa} itens={opcoes.etapas} onMudar={(etapa) => onMudar({ ...filtro, etapa })} />
      <Lista rotulo="Dev" valor={filtro.dev} itens={opcoes.devs} onMudar={(dev) => onMudar({ ...filtro, dev })} />
      <Lista rotulo="Tag" valor={filtro.tag} itens={opcoes.tags} onMudar={(tag) => onMudar({ ...filtro, tag })} />

      {/* Só aparece com filtro ativo: botão permanentemente desabilitado é ruído. */}
      {filtroAtivo(filtro) && (
        <button type="button" className="botao" onClick={() => onMudar(FILTRO_VAZIO)}>
          Limpar
        </button>
      )}
    </div>
  );
}
