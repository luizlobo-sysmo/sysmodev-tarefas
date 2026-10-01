import { useCallback, useEffect, useState } from 'react';
import Filtros from './components/Filtros';
import ListaTarefas from './components/ListaTarefas';
import EditarTarefa from './components/EditarTarefa';
import Importar from './components/Importar';
import { Filtro, FILTRO_VAZIO, Opcoes, Tarefa } from './types/tarefa';
import { lerOpcoes, listarTarefas, mensagemDeErro } from './services/api';
import { lerTema, salvarTema, Tema } from './util/tema';

const SEM_OPCOES: Opcoes = { tipos: [], etapas: [], devs: [], tags: [] };

type Janela = 'nenhuma' | 'editar' | 'importar';

export default function App() {
  const [filtro, setFiltro] = useState<Filtro>(FILTRO_VAZIO);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [opcoes, setOpcoes] = useState<Opcoes>(SEM_OPCOES);
  const [editando, setEditando] = useState<number | null>(null);
  const [janela, setJanela] = useState<Janela>('nenhuma');
  const [tema, setTema] = useState<Tema>(lerTema());
  const [erro, setErro] = useState<string | null>(null);

  const atualizar = useCallback(async () => {
    setErro(null);

    try {
      setTarefas(await listarTarefas(filtro));
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  }, [filtro]);

  const recarregarOpcoes = useCallback(async () => {
    try {
      setOpcoes(await lerOpcoes());
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  }, []);

  useEffect(() => {
    recarregarOpcoes();
  }, [recarregarOpcoes]);

  /**
   * Recarrega ao mudar o filtro, esperando 250ms sem digitação — sem a espera, a
   * resposta de uma tecla antiga que chegue atrasada sobrescreve a atual.
   */
  useEffect(() => {
    const espera = setTimeout(atualizar, 250);
    return () => clearTimeout(espera);
  }, [atualizar]);

  function abrir(id: number | null) {
    setEditando(id);
    setJanela('editar');
  }

  async function fechar(alterou: boolean) {
    setJanela('nenhuma');
    setEditando(null);

    if (alterou) {
      await Promise.all([atualizar(), recarregarOpcoes()]);
    }
  }

  function mudarTema(novo: Tema) {
    salvarTema(novo);
    setTema(novo);
  }

  return (
    <div className="app">
      <header className="cabecalho">
        <h1>Tarefas</h1>
        <span className="contagem">{tarefas.length} tarefa(s)</span>

        <div className="acoes">
          <button type="button" className="botao primario" onClick={() => abrir(null)}>
            Nova tarefa
          </button>
          <button type="button" className="botao" onClick={() => setJanela('importar')}>
            Importar planilha
          </button>
          <label>
            Tema
            <select value={tema} onChange={(e) => mudarTema(e.target.value as Tema)}>
              <option value="sistema">Do sistema</option>
              <option value="claro">Claro</option>
              <option value="escuro">Escuro</option>
            </select>
          </label>
        </div>
      </header>

      <div className="barra-filtro">
        <Filtros filtro={filtro} opcoes={opcoes} onMudar={setFiltro} />
      </div>

      {erro && <p className="erro faixa">{erro}</p>}

      <main>
        <ListaTarefas tarefas={tarefas} onEditar={abrir} />
      </main>

      {janela === 'editar' && <EditarTarefa id={editando} opcoes={opcoes} onFechar={fechar} />}
      {janela === 'importar' && <Importar onFechar={fechar} />}
    </div>
  );
}
