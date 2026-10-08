import { useEffect, useRef } from 'react';
import axios from 'axios';

const INTERVALO = 5000;

/**
 * Chama `aoMudar` quando a base é gravada por outro processo — a skill
 * /sysmo-redmine-work lançando hora, ou o outro app que divide o `trabalho.db`.
 *
 * Pergunta a versão (a data da última gravação do arquivo) a cada 5 s e ao voltar o foco
 * para a aba, e só recarrega quando ela muda: a consulta pesada não roda à toa. Com
 * `pausado` — janela aberta, formulário pela metade — a mudança fica guardada e é
 * aplicada quando a pausa acaba, para a tela não se mexer embaixo de quem está editando.
 */
export function useAoMudarBase(aoMudar: () => void, pausado: boolean) {
  const versao = useRef<number | null>(null);
  const pendente = useRef(false);
  const callback = useRef(aoMudar);
  callback.current = aoMudar;
  const pausa = useRef(pausado);
  pausa.current = pausado;

  useEffect(() => {
    let vivo = true;

    async function conferir() {
      // Aba em segundo plano não pergunta: ninguém está olhando, e o foco de volta confere.
      if (document.hidden) return;

      try {
        const { data } = await axios.get<{ versao: number }>('/api/base/versao');
        if (!vivo) return;

        if (versao.current !== null && data.versao !== versao.current) {
          pendente.current = true;
        }
        versao.current = data.versao;
      } catch {
        // Backend fora: a próxima rodada tenta de novo, e o erro da tela já avisa.
        return;
      }

      if (pendente.current && !pausa.current) {
        pendente.current = false;
        callback.current();
      }
    }

    conferir();
    const relogio = window.setInterval(conferir, INTERVALO);
    document.addEventListener('visibilitychange', conferir);

    return () => {
      vivo = false;
      window.clearInterval(relogio);
      document.removeEventListener('visibilitychange', conferir);
    };
  }, []);

  // Pausa acabou com mudança guardada: aplica já, sem esperar a próxima rodada.
  useEffect(() => {
    if (!pausado && pendente.current) {
      pendente.current = false;
      callback.current();
    }
  }, [pausado]);
}
