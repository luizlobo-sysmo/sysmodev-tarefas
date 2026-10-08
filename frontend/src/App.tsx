import { useCallback, useEffect, useState } from 'react';
import Filtros from './components/Filtros';
import ListaTarefas from './components/ListaTarefas';
import EditarTarefa from './components/EditarTarefa';
import { Filtro, FILTRO_VAZIO, Tarefa } from './types/tarefa';
import { listarTarefas, mensagemDeErro } from './services/api';
import { lerTema, salvarTema, Tema } from './util/tema';
import { useAoMudarBase } from './util/aoMudarBase';

type Janela = 'nenhuma' | 'editar';

export default function App() {
  const [filtro, setFiltro] = useState<Filtro>(FILTRO_VAZIO);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
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

  /**
   * Recarrega ao mudar o filtro, esperando 250ms sem digitação — sem a espera, a
   * resposta de uma tecla antiga que chegue atrasada sobrescreve a atual.
   */
  useEffect(() => {
    const espera = setTimeout(atualizar, 250);
    return () => clearTimeout(espera);
  }, [atualizar]);

  // Tarefa registrada pela skill aparece sem F5. Com janela aberta espera fechar, para
  // a lista não mudar embaixo de quem edita.
  useAoMudarBase(atualizar, janela !== 'nenhuma');

  function abrir(id: number | null) {
    setEditando(id);
    setJanela('editar');
  }

  async function fechar(alterou: boolean) {
    setJanela('nenhuma');
    setEditando(null);

    if (alterou) {
      await atualizar();
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
        <Filtros filtro={filtro} onMudar={setFiltro} />
      </div>

      {erro && <p className="erro faixa">{erro}</p>}

      <main>
        <ListaTarefas tarefas={tarefas} onEditar={abrir} />
      </main>

      {janela === 'editar' && <EditarTarefa id={editando} onFechar={fechar} />}
    </div>
  );
}
