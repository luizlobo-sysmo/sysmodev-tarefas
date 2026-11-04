import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AppBar,
  Box,
  Button,
  Paper,
  Toolbar,
  Typography,
  } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Filtros from './components/Filtros';
import ListaTarefas from './components/ListaTarefas';
import EditarTarefa from './components/EditarTarefa';
import { Filtro, FILTRO_VAZIO, Tarefa } from './types/tarefa';
import { listarTarefas, mensagemDeErro } from './services/api';
import MarcaProjeto from '@comum/mui/MarcaProjeto';
import { MARCAS } from '@comum/mui/marca';
import { SeletorTema } from '@comum/mui/TemaSysmoDev';
import { useAoMudarBase } from '@comum/mui/aoMudarBase';

type Janela = 'nenhuma' | 'editar';

export default function App() {
  const [filtro, setFiltro] = useState<Filtro>(FILTRO_VAZIO);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [editando, setEditando] = useState<number | null>(null);
  const [janela, setJanela] = useState<Janela>('nenhuma');
  const [erro, setErro] = useState<string | null>(null);


  const atualizar = useCallback(async () => {
    setErro(null);

    try {
      setTarefas(await listarTarefas(filtro));
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  }, [filtro]);

  /**
   * Recarrega ao mudar o filtro, esperando 250ms sem digitação — sem a espera, a
   * resposta de uma tecla antiga que chegue atrasada sobrescreve a atual.
   */
  useEffect(() => {
    const espera = setTimeout(atualizar, 250);
    return () => clearTimeout(espera);
  }, [atualizar]);

  // Tarefa registrada pela skill aparece sem F5. Com janela aberta espera fechar, para
  // a lista não mudar embaixo de quem edita.
  useAoMudarBase(atualizar, janela !== 'nenhuma');

  function abrir(id: number | null) {
    setEditando(id);
    setJanela('editar');
  }

  async function fechar(alterou: boolean) {
    setJanela('nenhuma');
    setEditando(null);

    if (alterou) {
      await atualizar();
    }
  }

  return (
    <>

      <AppBar position="sticky" sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ gap: 2, px: 4 }}>
          <MarcaProjeto {...MARCAS.tarefas} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Tarefas
          </Typography>
          <Typography variant="body2" color="text.disabled">
            {tarefas.length} tarefa(s)
          </Typography>

          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => abrir(null)}>
              Nova tarefa
            </Button>
            <SeletorTema />
          </Box>
        </Toolbar>
      </AppBar>

      <Paper square elevation={0} sx={{ px: 4, py: 1.5, borderBottom: 1, borderColor: 'divider', display: 'flex' }}>
        <Filtros filtro={filtro} onMudar={setFiltro} />
      </Paper>

      <Box sx={{ px: 4, py: 2.5 }}>
        {erro && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {erro}
          </Alert>
        )}

        <ListaTarefas tarefas={tarefas} onEditar={abrir} />
      </Box>

      {janela === 'editar' && <EditarTarefa id={editando} onFechar={fechar} />}
    </>
  );
}
