/**
 * Espelho do DTO do backend.
 *
 * `id` é o número da tarefa no Redmine e `titulo` o de lá; `descricao` é uma frase do
 * que se trata. O resto da tarefa (tipo, situação, versões, horas) se consulta lá.
 */
export interface Tarefa {
  id: number;
  titulo: string;
  descricao: string;
  /** ISO, yyyy-MM-dd. */
  atualizacao: string;
}

export interface Filtro {
  /** Trecho do número, do título OU da descrição, sem acento e sem caixa. */
  texto: string;
}

export const FILTRO_VAZIO: Filtro = { texto: '' };

export function filtroAtivo(filtro: Filtro): boolean {
  return filtro.texto.trim() !== '';
}

export const REDMINE = 'https://redmine.sysmo.com.br:1000/issues';
