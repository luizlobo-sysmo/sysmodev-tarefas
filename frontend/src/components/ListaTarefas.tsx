import { REDMINE, Tarefa } from '../types/tarefa';
import { paraBrasileiro } from '../util/data';

interface Props {
  tarefas: Tarefa[];
  onEditar: (id: number) => void;
}

/** Etapa vira classe de cor: o que ainda anda se destaca do que já fechou. */
function classeDaEtapa(etapa: string): string {
  const valor = etapa.toLowerCase();
  if (valor.startsWith('conclu')) return 'etapa concluida';
  if (valor.startsWith('recus')) return 'etapa recusada';
  if (valor === '') return '';
  return 'etapa andando';
}

/**
 * A lista do histórico, uma tarefa por linha.
 *
 * Clicar na linha abre a edição. O número é link para o Redmine e para a propagação
 * do clique — sem isso, abrir a tarefa no Redmine abriria também o modal por trás.
 */
export default function ListaTarefas({ tarefas, onEditar }: Props) {
  if (tarefas.length === 0) {
    return <p className="vazio">Nenhuma tarefa.</p>;
  }

  return (
    <table className="tabela-dia tabela-tarefas">
      <thead>
        <tr>
          <th className="col-data">Atualização</th>
          <th className="col-tarefa">Tarefa</th>
          <th>Título</th>
          <th className="col-tipo">Tipo</th>
          <th className="col-etapa">Etapa</th>
          <th className="col-dev">Dev</th>
          <th>Tag</th>
          <th>Versões</th>
          <th className="col-tempo" title="Apontado no Controle de Horas">Horas</th>
        </tr>
      </thead>
      <tbody>
        {tarefas.map((tarefa) => (
          <tr
            key={tarefa.id}
            tabIndex={0}
            title="Abrir para editar"
            onClick={() => onEditar(tarefa.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onEditar(tarefa.id);
              }
            }}
          >
            <td className="col-data numero">{paraBrasileiro(tarefa.atualizacao)}</td>
            <td className="col-tarefa numero">
              <a href={`${REDMINE}/${tarefa.id}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                {tarefa.id}
              </a>
            </td>
            <td className="titulo-tarefa">{tarefa.titulo}</td>
            <td className="col-tipo">{tarefa.tipo}</td>
            <td className="col-etapa">
              <span className={classeDaEtapa(tarefa.etapa)}>{tarefa.etapa}</span>
            </td>
            <td className="col-dev">{tarefa.dev}</td>
            <td className="comentario">{tarefa.tag}</td>
            <td className="comentario">{tarefa.versoes}</td>
            <td
              className="col-tempo numero"
              title={
                tarefa.primeiroDia && tarefa.ultimoDia
                  ? `De ${paraBrasileiro(tarefa.primeiroDia)} a ${paraBrasileiro(tarefa.ultimoDia)}`
                  : 'Sem apontamento'
              }
            >
              {tarefa.horasRelogio ?? ''}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
