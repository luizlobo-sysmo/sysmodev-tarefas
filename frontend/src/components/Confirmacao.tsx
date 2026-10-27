import { ReactNode, useRef } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

interface Props {
  titulo: string;
  /** O que será feito, em uma frase, nomeando o alvo. */
  children: ReactNode;
  rotuloConfirmar: string;
  /** Pinta o botão de confirmar de vermelho. Para o que não se desfaz. */
  perigo?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

/**
 * Confirmação em janela do próprio app, no lugar do `window.confirm`.
 *
 * O nativo tem três problemas concretos, e nenhum e estetico: nao permite dizer
 * QUAL registro esta em jogo com destaque, o rotulo do botao e "OK" (que nao
 * distingue confirmar de cancelar quando o dialogo e lido depressa), e ele congela
 * a aba - com o modal de lancamento aberto atras, a tela some por baixo de uma
 * caixa cinza do navegador.
 *
 * Abre por cima da janela que a chamou. O Dialog do MUI empilha sozinho e so o de
 * cima responde ao Esc - era o que a pilha do Modal antigo fazia a mao, para um Esc
 * nao fechar a confirmacao e a edicao juntas.
 */
export default function Confirmacao({
  titulo,
  children,
  rotuloConfirmar,
  perigo = false,
  onConfirmar,
  onCancelar,
}: Props) {
  const cancelar = useRef<HTMLButtonElement>(null);

  return (
    <Dialog
      open
      onClose={onCancelar}
      maxWidth="xs"
      fullWidth
      // O foco comeca no Cancelar: um Enter distraido nao deve apagar nada. Pelo fim da
      // animacao de entrada, e nao por autoFocus: o Dialog do MUI leva o foco para a
      // propria janela ao abrir, por cima do autoFocus do botao.
      TransitionProps={{ onEntered: () => cancelar.current?.focus() }}
    >
      <DialogTitle sx={{ fontWeight: 600 }}>{titulo}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ '& strong': { fontWeight: 600 } }}>
          {children}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button ref={cancelar} variant="outlined" color="inherit" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button variant={perigo ? 'outlined' : 'contained'} color={perigo ? 'error' : 'primary'} onClick={onConfirmar}>
          {rotuloConfirmar}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
