import { Link, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { REDMINE, Tarefa } from '../types/tarefa';
import { paraBrasileiro } from '../util/data';
import { FONTE_MONO } from '../util/temaMui';

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
    return (
      <Typography color="text.disabled" sx={{ fontStyle: 'italic' }}>
        Nenhuma tarefa.
      </Typography>
    );
  }

  const numero = { fontFamily: FONTE_MONO, whiteSpace: 'nowrap' } as const;

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 110 }}>Atualização</TableCell>
            <TableCell sx={{ width: 90 }}>Tarefa</TableCell>
            <TableCell>Título</TableCell>
            <TableCell>Descrição</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tarefas.map((tarefa) => (
            <TableRow
              key={tarefa.id}
              hover
              tabIndex={0}
              title="Abrir para editar"
              onClick={() => onEditar(tarefa.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onEditar(tarefa.id);
                }
              }}
              // A linha e focavel (abre a edicao por Enter). Sem realce visivel, quem
              // navega por Tab nao saberia onde esta.
              sx={{
                cursor: 'pointer',
                verticalAlign: 'top',
                '&:focus-visible': { outline: 'none', bgcolor: 'action.selected', boxShadow: (t) => `inset 2px 0 0 ${t.palette.primary.main}` },
              }}
            >
              <TableCell sx={numero}>{paraBrasileiro(tarefa.atualizacao)}</TableCell>
              <TableCell sx={numero}>
                <Link
                  href={`${REDMINE}/${tarefa.id}`}
                  target="_blank"
                  rel="noreferrer"
                  underline="hover"
                  onClick={(e) => e.stopPropagation()}
                >
                  {tarefa.id}
                </Link>
              </TableCell>
              {/* Título com quebra de linha dentro (a planilha tem): a quebra é do texto, fica. */}
              <TableCell sx={{ whiteSpace: 'pre-line' }}>{tarefa.titulo}</TableCell>
              <TableCell sx={{ whiteSpace: 'pre-line', color: 'text.secondary' }}>{tarefa.descricao}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
