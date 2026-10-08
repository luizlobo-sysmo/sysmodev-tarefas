import { FormEvent, useEffect, useState } from 'react';
import Modal from './Modal';
import Confirmacao from './Confirmacao';
import { REDMINE, Tarefa } from '../types/tarefa';
import { deletarTarefa, localizarTarefa, mensagemDeErro, salvarTarefa } from '../services/api';
import { paraBrasileiro } from '../util/data';

interface Props {
  /** Nulo para tarefa nova. */
  id: number | null;
  onFechar: (alterou: boolean) => void;
}

interface Formulario {
  numero: string;
  titulo: string;
  descricao: string;
}

const VAZIO: Formulario = { numero: '', titulo: '', descricao: '' };

export default function EditarTarefa({ id, onFechar }: Props) {
  const [formulario, setFormulario] = useState<Formulario>(VAZIO);
  const [original, setOriginal] = useState<Tarefa | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  useEffect(() => {
    if (id === null) return;

    localizarTarefa(id)
      .then((tarefa) => {
        setOriginal(tarefa);
        setFormulario({ numero: String(tarefa.id), titulo: tarefa.titulo, descricao: tarefa.descricao });
      })
      .catch((e) => setErro(mensagemDeErro(e)));
  }, [id]);

  async function salvar(e: FormEvent) {
    e.preventDefault();

    const numero = Number(formulario.numero);

    if (!Number.isInteger(numero) || numero <= 0) {
      setErro('Digite o número da tarefa no Redmine.');
      return;
    }

    setSalvando(true);
    setErro(null);

    try {
      await salvarTarefa({ id: numero, titulo: formulario.titulo, descricao: formulario.descricao });
      onFechar(true);
    } catch (e) {
      setErro(mensagemDeErro(e));
      setSalvando(false);
    }
  }

  async function apagar() {
    setConfirmandoExclusao(false);

    try {
      await deletarTarefa(Number(formulario.numero));
      onFechar(true);
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  }

  const mudar = (campo: keyof Formulario) => (valor: string) => setFormulario({ ...formulario, [campo]: valor });

  return (
    <Modal titulo={id === null ? 'Nova tarefa' : `Tarefa ${id}`} largura={680} onFechar={() => onFechar(false)}>
      <form className="formulario" onSubmit={salvar}>
        <div className="linha">
          <label className="campo-numero">
            Tarefa
            {/* O número é a chave — o mesmo do Redmine e do lançamento de horas. Na
                edição fica travado: trocar criaria outra tarefa e deixaria esta. */}
            <input
              type="text"
              inputMode="numeric"
              value={formulario.numero}
              readOnly={id !== null}
              onChange={(e) => mudar('numero')(e.target.value.replace(/\D/g, ''))}
              required
              autoFocus={id === null}
            />
          </label>
        </div>

        <label>
          Título
          <textarea rows={2} value={formulario.titulo} onChange={(e) => mudar('titulo')(e.target.value)} required />
        </label>

        <label>
          Descrição
          <textarea
            rows={3}
            placeholder="Do que se trata, em uma frase"
            value={formulario.descricao}
            onChange={(e) => mudar('descricao')(e.target.value)}
          />
        </label>

        {original && (
          <p className="rodape-tarefa">
            Atualizada em {paraBrasileiro(original.atualizacao)}
            {' · '}
            <a href={`${REDMINE}/${original.id}`} target="_blank" rel="noreferrer">
              abrir no Redmine
            </a>
          </p>
        )}

        {erro && <p className="erro">{erro}</p>}

        <footer className="modal-rodape">
          {id !== null && (
            <button type="button" className="botao excluir" onClick={() => setConfirmandoExclusao(true)}>
              Excluir
            </button>
          )}
          <span className="espaco" />
          <button type="button" className="botao" onClick={() => onFechar(false)}>
            Cancelar
          </button>
          <button type="submit" className="botao primario" disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </footer>
      </form>

      {confirmandoExclusao && (
        <Confirmacao
          titulo="Excluir tarefa"
          rotuloConfirmar="Excluir"
          perigo
          onConfirmar={apagar}
          onCancelar={() => setConfirmandoExclusao(false)}
        >
          {/* As horas não saem junto: são do Controle de Horas, e continuam lá. */}
          Excluir a tarefa <strong>{formulario.numero}</strong> — <strong>{formulario.titulo}</strong> — do histórico? As
          horas apontadas nela continuam no Controle de Horas.
        </Confirmacao>
      )}
    </Modal>
  );
}
