import { Button, InputAdornment, Stack, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Filtro, FILTRO_VAZIO, filtroAtivo } from '../types/tarefa';

interface Props {
  filtro: Filtro;
  onMudar: (filtro: Filtro) => void;
}

/** Texto livre: número, título ou descrição. */
export default function Filtros({ filtro, onMudar }: Props) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
      <TextField
        label="Tarefa"
        placeholder="número, título ou descrição"
        value={filtro.texto}
        onChange={(e) => onMudar({ ...filtro, texto: e.target.value })}
        sx={{ flex: 1 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />

      {/* Só aparece com filtro ativo: botão permanentemente desabilitado é ruído. */}
      {filtroAtivo(filtro) && <Button onClick={() => onMudar(FILTRO_VAZIO)}>Limpar</Button>}
    </Stack>
  );
}
