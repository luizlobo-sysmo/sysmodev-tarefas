import { Filtro, FILTRO_VAZIO, filtroAtivo } from '../types/tarefa';

interface Props {
  filtro: Filtro;
  onMudar: (filtro: Filtro) => void;
}

/** Texto livre: número ou título. */
export default function Filtros({ filtro, onMudar }: Props) {
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

      {/* Só aparece com filtro ativo: botão permanentemente desabilitado é ruído. */}
      {filtroAtivo(filtro) && (
        <button type="button" className="botao" onClick={() => onMudar(FILTRO_VAZIO)}>
          Limpar
        </button>
      )}
    </div>
  );
}
