import { REDMINE, Tarefa } from '../types/tarefa';
import { paraBrasileiro } from '../util/data';

interface Props {
  tarefas: Tarefa[];
  onEditar: (id: number) => void;
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
          <th>Descrição</th>
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
            <td className="titulo-tarefa">{tarefa.descricao}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
