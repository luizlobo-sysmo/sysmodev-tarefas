import { FormEvent, useEffect, useState } from 'react';
import Modal from './Modal';
import Confirmacao from './Confirmacao';
import { Opcoes, REDMINE, Tarefa } from '../types/tarefa';
import { deletarTarefa, localizarTarefa, mensagemDeErro, salvarTarefa } from '../services/api';
import { paraBrasileiro } from '../util/data';

interface Props {
  /** Nulo para tarefa nova. */
  id: number | null;
  opcoes: Opcoes;
  onFechar: (alterou: boolean) => void;
}

interface Formulario {
  numero: string;
  titulo: string;
  tipo: string;
  etapa: string;
  dev: string;
  tag: string;
  versoes: string;
}

const VAZIO: Formulario = { numero: '', titulo: '', tipo: '', etapa: '', dev: '', tag: '', versoes: '' };

/**
 * Campo de texto com sugestões dos valores já usados.
 *
 * <datalist>, e não <select>: a lista sugere, mas não prende — etapa nova ou dev que
 * ainda não apareceu no histórico se digita direto, sem passar por um cadastro.
 */
function ComSugestao({ rotulo, valor, itens, onMudar }: { rotulo: string; valor: string; itens: string[]; onMudar: (valor: string) => void }) {
  const lista = `sugestoes-${rotulo.toLowerCase()}`;

  return (
    <label>
      {rotulo}
      <input type="text" list={lista} value={valor} onChange={(e) => onMudar(e.target.value)} />
      <datalist id={lista}>
        {itens.map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>
    </label>
  );
}

export default function EditarTarefa({ id, opcoes, onFechar }: Props) {
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
        setFormulario({
          numero: String(tarefa.id),
          titulo: tarefa.titulo,
          tipo: tarefa.tipo,
          etapa: tarefa.etapa,
          dev: tarefa.dev,
          tag: tarefa.tag,
          versoes: tarefa.versoes,
        });
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
      // Campos vão todos, mesmo vazios: aqui vazio quer dizer "limpar". O nulo, que
      // o backend lê como "manter", é para a skill, que só conhece parte dos campos.
      await salvarTarefa({
        id: numero,
        titulo: formulario.titulo,
        tipo: formulario.tipo,
        etapa: formulario.etapa,
        dev: formulario.dev,
        tag: formulario.tag,
        versoes: formulario.versoes,
      });
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
          <ComSugestao rotulo="Tipo" valor={formulario.tipo} itens={opcoes.tipos} onMudar={mudar('tipo')} />
          <ComSugestao rotulo="Etapa" valor={formulario.etapa} itens={opcoes.etapas} onMudar={mudar('etapa')} />
          <ComSugestao rotulo="Dev" valor={formulario.dev} itens={opcoes.devs} onMudar={mudar('dev')} />
        </div>

        <label>
          Título
          <textarea rows={2} value={formulario.titulo} onChange={(e) => mudar('titulo')(e.target.value)} required />
        </label>

        <div className="linha">
          <ComSugestao rotulo="Tag" valor={formulario.tag} itens={opcoes.tags} onMudar={mudar('tag')} />
          <label>
            Versões
            <input
              type="text"
              placeholder="2.88.05, 2.89.55"
              value={formulario.versoes}
              onChange={(e) => mudar('versoes')(e.target.value)}
            />
          </label>
        </div>

        {original && (
          <p className="rodape-tarefa">
            Atualizada em {paraBrasileiro(original.atualizacao)}
            {original.horasRelogio && (
              <>
                {' · '}
                <strong>{original.horasRelogio}</strong> apontadas de {paraBrasileiro(original.primeiroDia!)} a{' '}
                {paraBrasileiro(original.ultimoDia!)}
              </>
            )}
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
