import { FormEvent, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Confirmacao from './Confirmacao';
import { REDMINE, Tarefa } from '../types/tarefa';
import { deletarTarefa, localizarTarefa, mensagemDeErro, salvarTarefa } from '../services/api';
import { paraBrasileiro } from '../util/data';

interface Props {
  /** Nulo para tarefa nova. */
  id: number | null;
  onFechar: (alterou: boolean) => void;
}

interface Formulario {
  numero: string;
  titulo: string;
  descricao: string;
}

const VAZIO: Formulario = { numero: '', titulo: '', descricao: '' };

export default function EditarTarefa({ id, onFechar }: Props) {
  const [formulario, setFormulario] = useState<Formulario>(VAZIO);
  const [original, setOriginal] = useState<Tarefa | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  useEffect(() => {
    if (id === null) return;

    localizarTarefa(id)
      .then((tarefa) => {
        setOriginal(tarefa);
        setFormulario({ numero: String(tarefa.id), titulo: tarefa.titulo, descricao: tarefa.descricao });
      })
      .catch((e) => setErro(mensagemDeErro(e)));
  }, [id]);

  async function salvar(e: FormEvent) {
    e.preventDefault();

    const numero = Number(formulario.numero);

    if (!Number.isInteger(numero) || numero <= 0) {
      setErro('Digite o número da tarefa no Redmine.');
      return;
    }

    setSalvando(true);
    setErro(null);

    try {
      await salvarTarefa({ id: numero, titulo: formulario.titulo, descricao: formulario.descricao });
      onFechar(true);
    } catch (e) {
      setErro(mensagemDeErro(e));
      setSalvando(false);
    }
  }

  async function apagar() {
    setConfirmandoExclusao(false);

    try {
      await deletarTarefa(Number(formulario.numero));
      onFechar(true);
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  }

  const mudar = (campo: keyof Formulario) => (valor: string) => setFormulario({ ...formulario, [campo]: valor });

  const fechar = () => onFechar(false);

  return (
    <Dialog
      open
      maxWidth="sm"
      fullWidth
      // O clique no fundo NAO fecha: a janela tem formulario preenchido, e fechar por
      // clique fora perderia o que foi digitado sem perguntar. Esc e o X fecham.
      onClose={(_, motivo) => motivo !== 'backdropClick' && fechar()}
      slotProps={{ paper: { component: 'form', onSubmit: salvar } as object }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', pr: 1, fontWeight: 600 }}>
        <Box sx={{ flex: 1 }}>{id === null ? 'Nova tarefa' : `Tarefa ${id}`}</Box>
        <IconButton onClick={fechar} title="Fechar (Esc)">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          {/* O número é a chave — o mesmo do Redmine e do lançamento de horas. Na
              edição fica travado: trocar criaria outra tarefa e deixaria esta. */}
          <TextField
            label="Tarefa"
            value={formulario.numero}
            onChange={(e) => mudar('numero')(e.target.value.replace(/\D/g, ''))}
            required
            autoFocus={id === null}
            sx={{ width: 160 }}
            slotProps={{ htmlInput: { inputMode: 'numeric', readOnly: id !== null } }}
          />

          <TextField
            label="Título"
            multiline
            minRows={2}
            value={formulario.titulo}
            onChange={(e) => mudar('titulo')(e.target.value)}
            required
          />

          <TextField
            label="Descrição"
            multiline
            minRows={3}
            placeholder="Do que se trata, em uma frase"
            value={formulario.descricao}
            onChange={(e) => mudar('descricao')(e.target.value)}
          />

          {original && (
            <Typography variant="body2" color="text.secondary">
              Atualizada em {paraBrasileiro(original.atualizacao)}
              {' · '}
              <Link href={`${REDMINE}/${original.id}`} target="_blank" rel="noreferrer" underline="hover">
                abrir no Redmine
              </Link>
            </Typography>
          )}

          {erro && <Alert severity="error">{erro}</Alert>}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        {/*
          Excluir e vermelho o tempo todo, e nao so no hover: e a unica acao irreversivel
          da janela, e cor que so aparece ao passar o mouse nao avisa quem ja esta clicando.
          Contornado, e nao preenchido: solido ficaria mais pesado que o Salvar ao lado, e
          a acao principal da janela e salvar.
        */}
        {id !== null && (
          <Button variant="outlined" color="error" onClick={() => setConfirmandoExclusao(true)}>
            Excluir
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" color="inherit" onClick={fechar}>
          Cancelar
        </Button>
        <Button type="submit" variant="contained" disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar'}
        </Button>
      </DialogActions>

      {confirmandoExclusao && (
        <Confirmacao
          titulo="Excluir tarefa"
          rotuloConfirmar="Excluir"
          perigo
          onConfirmar={apagar}
          onCancelar={() => setConfirmandoExclusao(false)}
        >
          {/* As horas não saem junto: são do Controle de Horas, e continuam lá. */}
          Excluir a tarefa <strong>{formulario.numero}</strong> — <strong>{formulario.titulo}</strong> — do histórico? As
          horas apontadas nela continuam no Controle de Horas.
        </Confirmacao>
      )}
    </Dialog>
  );
}
