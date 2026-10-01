import { ChangeEvent, useState } from 'react';
import Modal from './Modal';
import { Importacao } from '../types/tarefa';
import { importarPlanilha, mensagemDeErro } from '../services/api';

interface Props {
  onFechar: (alterou: boolean) => void;
}

/**
 * Importa a aba Tarefas da planilha antiga, baixada em CSV.
 *
 * Só cria: tarefa que já existe aqui fica como está, então reimportar por engano não
 * desfaz nada. Os avisos ficam na tela até fechar — são justamente as linhas que
 * pedem conferência, e sumir com eles sozinho seria perder a lista.
 */
export default function Importar({ onFechar }: Props) {
  const [resultado, setResultado] = useState<Importacao | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function escolher(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    setEnviando(true);
    setErro(null);

    try {
      setResultado(await importarPlanilha(await arquivo.text()));
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setEnviando(false);
      e.target.value = '';
    }
  }

  return (
    <Modal titulo="Importar planilha" onFechar={() => onFechar(resultado !== null && resultado.criadas > 0)}>
      <div className="formulario">
        <p className="explicacao">
          No Google Planilhas, abra a aba <strong>Tarefas</strong> e use Arquivo → Fazer download → CSV. Só entram as
          tarefas que ainda não estão aqui.
        </p>

        <label>
          Arquivo CSV
          <input type="file" accept=".csv,text/csv" onChange={escolher} disabled={enviando} />
        </label>

        {erro && <p className="erro">{erro}</p>}

        {resultado && (
          <>
            <p className="aviso-ok">
              {resultado.lidas} linha(s) lida(s): <strong>{resultado.criadas}</strong> criada(s),{' '}
              {resultado.ignoradas} ignorada(s).
            </p>
            {resultado.avisos.length > 0 && (
              <ul className="avisos">
                {resultado.avisos.map((aviso) => (
                  <li key={aviso}>{aviso}</li>
                ))}
              </ul>
            )}
          </>
        )}

        <footer className="modal-rodape">
          <span className="espaco" />
          <button type="button" className="botao" onClick={() => onFechar(resultado !== null && resultado.criadas > 0)}>
            Fechar
          </button>
        </footer>
      </div>
    </Modal>
  );
}
