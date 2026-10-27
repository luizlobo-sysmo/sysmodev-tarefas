import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AppBar,
  Box,
  Button,
  CssBaseline,
  Paper,
  ThemeProvider,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import SettingsBrightnessOutlinedIcon from '@mui/icons-material/SettingsBrightnessOutlined';
import Filtros from './components/Filtros';
import ListaTarefas from './components/ListaTarefas';
import EditarTarefa from './components/EditarTarefa';
import { Filtro, FILTRO_VAZIO, Tarefa } from './types/tarefa';
import { listarTarefas, mensagemDeErro } from './services/api';
import { lerTema, salvarTema, Tema } from './util/tema';
import { criarTema } from './util/temaMui';
import { useAoMudarBase } from './util/aoMudarBase';

type Janela = 'nenhuma' | 'editar';

export default function App() {
  const [filtro, setFiltro] = useState<Filtro>(FILTRO_VAZIO);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [editando, setEditando] = useState<number | null>(null);
  const [janela, setJanela] = useState<Janela>('nenhuma');
  const [tema, setTema] = useState<Tema>(lerTema());
  const [erro, setErro] = useState<string | null>(null);

  // "Do sistema" resolvido aqui, pela media query: o MUI precisa saber claro ou escuro
  // para montar a paleta, e o useMediaQuery acompanha o sistema trocando de tema com a
  // janela aberta, sem F5.
  const sistemaEscuro = useMediaQuery('(prefers-color-scheme: dark)');
  const escuro = tema === 'escuro' || (tema === 'sistema' && sistemaEscuro);
  const temaMui = useMemo(() => criarTema(escuro), [escuro]);

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

  function mudarTema(novo: Tema | null) {
    // ToggleButtonGroup exclusivo devolve null ao clicar no botão já escolhido.
    if (!novo) return;
    salvarTema(novo);
    setTema(novo);
  }

  return (
    <ThemeProvider theme={temaMui}>
      <CssBaseline />

      <AppBar position="sticky" sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ gap: 2, px: { xs: 2, sm: 4 } }}>
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
            <ToggleButtonGroup exclusive size="small" value={tema} onChange={(_, novo) => mudarTema(novo)} aria-label="Tema">
              <ToggleButton value="claro" title="Claro">
                <LightModeOutlinedIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="sistema" title="Do sistema">
                <SettingsBrightnessOutlinedIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="escuro" title="Escuro">
                <DarkModeOutlinedIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Toolbar>
      </AppBar>

      <Paper square elevation={0} sx={{ px: { xs: 2, sm: 4 }, py: 1.5, borderBottom: 1, borderColor: 'divider', display: 'flex' }}>
        <Filtros filtro={filtro} onMudar={setFiltro} />
      </Paper>

      <Box sx={{ px: { xs: 2, sm: 4 }, py: 2.5 }}>
        {erro && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {erro}
          </Alert>
        )}

        <ListaTarefas tarefas={tarefas} onEditar={abrir} />
      </Box>

      {janela === 'editar' && <EditarTarefa id={editando} onFechar={fechar} />}
    </ThemeProvider>
  );
}
