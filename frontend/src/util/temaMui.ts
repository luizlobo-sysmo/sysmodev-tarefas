import { createTheme, Theme } from '@mui/material/styles';

/**
 * Tema do Material UI, com a paleta de sempre do Tarefas, do Controle de Horas e do
 * Kanban - o mesmo arquivo nos três.
 *
 * As cores são as mesmas dos tokens do `index.css`, que ficaram só para pintar o
 * fundo antes de o React montar. Paleta repetida aqui, e não lida do CSS: o MUI
 * calcula hover, contraste e transparências a partir do valor, e `var(--cor)` não é
 * cor que ele saiba clarear.
 *
 * Fonte Inter, empacotada no app (`@fontsource-variable/inter`), e não do Google
 * Fonts: o app é local e tem de abrir igual sem internet. Inter foi desenhada para
 * tela, com altura-x grande e números tabulares.
 */
const FONTE = '"Inter Variable", "Segoe UI", system-ui, -apple-system, sans-serif';

export const FONTE_MONO = '"Cascadia Mono", Consolas, monospace';

export function criarTema(escuro: boolean): Theme {
  return createTheme({
    palette: escuro
      ? {
          mode: 'dark',
          primary: { main: '#3b82f6' },
          success: { main: '#22c55e' },
          error: { main: '#ef4444' },
          warning: { main: '#f59e0b' },
          background: { default: '#0f172a', paper: '#1e293b' },
          text: { primary: '#e2e8f0', secondary: '#94a3b8', disabled: '#64748b' },
          divider: '#334155',
        }
      : {
          mode: 'light',
          primary: { main: '#2563eb' },
          success: { main: '#15803d' },
          error: { main: '#dc2626' },
          warning: { main: '#b45309' },
          background: { default: '#f8fafc', paper: '#ffffff' },
          text: { primary: '#0f172a', secondary: '#475569', disabled: '#64748b' },
          divider: '#cbd5e1',
        },
    shape: { borderRadius: 6 },
    typography: {
      fontFamily: FONTE,
      fontSize: 14,
      button: { textTransform: 'none', fontWeight: 500 },
    },
    components: {
      // Sem sombra nos botões e no AppBar: num quadro com dezenas de cards, sombra em
      // tudo vira ruído. A elevação fica para o que sobrepõe (janela, menu).
      MuiButton: { defaultProps: { disableElevation: true } },
      // No escuro o MUI clareia o Paper elevado com uma camada branca; a janela de edição
      // sairia num cinza fora da paleta. Sem a camada, fica no fundo de superfície.
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiAppBar: { defaultProps: { elevation: 0, color: 'inherit' } },
      MuiTextField: { defaultProps: { size: 'small' } },
      MuiSelect: { defaultProps: { size: 'small' } },
      MuiAutocomplete: { defaultProps: { size: 'small' } },
    },
  });
}
