import { ReactNode } from 'react';
import Modal from './Modal';

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
 * Abre por cima do modal que a chamou: mesmo z-index, mas depois no DOM.
 */
export default function Confirmacao({
  titulo,
  children,
  rotuloConfirmar,
  perigo = false,
  onConfirmar,
  onCancelar,
}: Props) {
  return (
    <Modal titulo={titulo} largura={420} onFechar={onCancelar}>
      <div className="formulario">
        <p className="pergunta">{children}</p>

        <footer className="modal-rodape">
          <span className="espaco" />
          {/* O foco comeca no Cancelar: um Enter distraido nao deve apagar nada. */}
          <button type="button" className="botao" onClick={onCancelar} autoFocus>
            Cancelar
          </button>
          <button type="button" className={`botao ${perigo ? 'excluir' : 'primario'}`} onClick={onConfirmar}>
            {rotuloConfirmar}
          </button>
        </footer>
      </div>
    </Modal>
  );
}
