export type Tema = 'sistema' | 'claro' | 'escuro';

/**
 * Preferencia de tema.
 *
 * Fica no localStorage, e nao na TB_CONFIGURACAO junto com usuario e atividade
 * padrao: tema e do aparelho, nao do dado. A mesma base aberta no monitor grande e
 * no notebook nao deveria forcar as duas telas ao mesmo brilho, e gravar no banco
 * ainda faria a primeira pintura esperar uma chamada de API - que e exatamente o
 * atraso que produz o flash de tela branca.
 */
const CHAVE = 'tarefas.tema';

export function lerTema(): Tema {
  const guardado = localStorage.getItem(CHAVE);
  return guardado === 'claro' || guardado === 'escuro' ? guardado : 'sistema';
}

/**
 * Aplica no <html>.
 *
 * 'sistema' REMOVE o atributo em vez de resolver claro/escuro aqui: sem ele, quem
 * decide e o `prefers-color-scheme` do CSS, e a tela acompanha o sistema mudando de
 * tema com a janela aberta. Resolvido em JavaScript, so mudaria no F5.
 */
export function aplicarTema(tema: Tema): void {
  if (tema === 'sistema') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', tema === 'claro' ? 'light' : 'dark');
  }
}

export function salvarTema(tema: Tema): void {
  if (tema === 'sistema') {
    localStorage.removeItem(CHAVE);
  } else {
    localStorage.setItem(CHAVE, tema);
  }
  aplicarTema(tema);
}
