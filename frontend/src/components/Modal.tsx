import { ReactNode, useEffect, useId, useRef } from 'react';

interface Props {
  titulo: string;
  largura?: number;
  onFechar: () => void;
  children: ReactNode;
}

/**
 * Pilha de modais abertos, do mais antigo ao mais recente.
 *
 * A confirmacao de exclusao abre POR CIMA do lancamento, e os dois escutam Escape
 * no window. Sem saber quem esta no topo, um Escape fechava os dois de uma vez: a
 * confirmacao sumia e o lancamento junto, dando a impressao de que a exclusao
 * aconteceu.
 */
const abertos: string[] = [];

/**
 * Janela modal. Esc fecha a de cima.
 *
 * O clique no fundo NAO fecha: as telas daqui tem formulario preenchido, e fechar
 * por clique fora perderia o que foi digitado sem perguntar.
 */
export default function Modal({ titulo, largura = 560, onFechar, children }: Props) {
  const id = useId();

  // A callback vive em ref, e nao nas dependencias do efeito: quem chama passa uma
  // arrow inline, que muda a cada render. Nas dependencias, cada render do pai
  // removeria e reempilharia o modal - jogando o de baixo para o topo da pilha e
  // invertendo quem responde ao Escape.
  const fechar = useRef(onFechar);
  fechar.current = onFechar;

  useEffect(() => {
    abertos.push(id);

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && abertos[abertos.length - 1] === id) {
        fechar.current();
      }
    };

    window.addEventListener('keydown', aoTeclar);

    return () => {
      window.removeEventListener('keydown', aoTeclar);
      const posicao = abertos.indexOf(id);
      if (posicao >= 0) abertos.splice(posicao, 1);
    };
  }, [id]);

  return (
    <div className="modal-fundo">
      <div className="modal" style={{ maxWidth: largura }}>
        <header className="modal-cabecalho">
          <h2>{titulo}</h2>
          <button type="button" className="botao-icone" onClick={onFechar} title="Fechar (Esc)">
            ✕
          </button>
        </header>
        <div className="modal-corpo">{children}</div>
      </div>
    </div>
  );
}
