import axios from 'axios';
import { Filtro, Importacao, Opcoes, Tarefa } from '../types/tarefa';

const api = axios.create({ baseURL: '/api' });

/**
 * Traduz erro do axios na mensagem que o backend mandou — o corpo de 400 vem como
 * `{ erro: "..." }`. Sem isto a tela mostraria "Request failed with status code 400".
 */
export function mensagemDeErro(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const corpo = e.response?.data as { erro?: string } | undefined;
    if (corpo?.erro) return corpo.erro;
    if (e.code === 'ERR_NETWORK') return 'Backend fora do ar (127.0.0.1:5003).';
    return e.message;
  }
  return String(e);
}

/**
 * O filtro vai na chamada e é aplicado no backend, que ignora acento — o mesmo
 * motivo do Controle de Horas. Campo em branco não é enviado.
 */
export async function listarTarefas(filtro: Filtro): Promise<Tarefa[]> {
  const params: Record<string, string> = {};

  Object.entries(filtro).forEach(([chave, valor]) => {
    if (valor.trim()) params[chave] = valor.trim();
  });

  const { data } = await api.get<Tarefa[]>('/tarefas', { params });
  return data;
}

export async function lerOpcoes(): Promise<Opcoes> {
  const { data } = await api.get<Opcoes>('/tarefas/opcoes');
  return data;
}

export async function localizarTarefa(id: number): Promise<Tarefa> {
  const { data } = await api.get<Tarefa>(`/tarefas/${id}`);
  return data;
}

/**
 * Cria ou altera — PUT no número do Redmine. A data de atualização vai em branco e o
 * backend põe a de hoje: é o dia em que o histórico foi mexido.
 */
export async function salvarTarefa(tarefa: Partial<Tarefa> & { id: number }): Promise<Tarefa> {
  const { data } = await api.put<Tarefa>(`/tarefas/${tarefa.id}`, tarefa);
  return data;
}

export async function deletarTarefa(id: number): Promise<void> {
  await api.delete(`/tarefas/${id}`);
}

/** O CSV da aba Tarefas, como o Google Planilhas exporta. Só cria; nada é sobrescrito. */
export async function importarPlanilha(csv: string): Promise<Importacao> {
  const { data } = await api.post<Importacao>('/tarefas/importar', csv, { headers: { 'Content-Type': 'text/csv' } });
  return data;
}
