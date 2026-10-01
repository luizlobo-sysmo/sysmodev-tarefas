/**
 * Espelho dos DTOs do backend.
 *
 * `id` é o número da tarefa no Redmine. As horas vêm da TB_HORA, do Controle de
 * Horas, e são nulas para tarefa sem apontamento.
 */
export interface Tarefa {
  id: number;
  titulo: string;
  tipo: string;
  etapa: string;
  dev: string;
  /** Lista separada por vírgula: "Acordo Comercial, Sell Out". */
  tag: string;
  /** Lista separada por vírgula: "2.88.05, 2.89.55". */
  versoes: string;
  /** ISO, yyyy-MM-dd. */
  atualizacao: string;

  horas: number | null;
  horasRelogio: string | null;
  primeiroDia: string | null;
  ultimoDia: string | null;
}

/** Valores já usados em cada campo — alimentam os filtros e as sugestões do formulário. */
export interface Opcoes {
  tipos: string[];
  etapas: string[];
  devs: string[];
  tags: string[];
}

export interface Filtro {
  /** Trecho do número OU do título, sem acento e sem caixa. */
  texto: string;
  tipo: string;
  etapa: string;
  dev: string;
  tag: string;
}

export const FILTRO_VAZIO: Filtro = { texto: '', tipo: '', etapa: '', dev: '', tag: '' };

export function filtroAtivo(filtro: Filtro): boolean {
  return Object.values(filtro).some((valor) => valor.trim() !== '');
}

export interface Importacao {
  lidas: number;
  criadas: number;
  ignoradas: number;
  avisos: string[];
}

export const REDMINE = 'https://redmine.sysmo.com.br:1000/issues';
