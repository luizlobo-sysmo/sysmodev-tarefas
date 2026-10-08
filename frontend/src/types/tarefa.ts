/**
 * Espelho do DTO do backend.
 *
 * `id` é o número da tarefa no Redmine. O resto da tarefa (tipo, situação, versões,
 * horas) se consulta lá.
 */
export interface Tarefa {
  id: number;
  titulo: string;
  /** ISO, yyyy-MM-dd. */
  atualizacao: string;
}

export interface Filtro {
  /** Trecho do número OU do título, sem acento e sem caixa. */
  texto: string;
}

export const FILTRO_VAZIO: Filtro = { texto: '' };

export function filtroAtivo(filtro: Filtro): boolean {
  return filtro.texto.trim() !== '';
}

export const REDMINE = 'https://redmine.sysmo.com.br:1000/issues';
