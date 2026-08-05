'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// 🛡️ DICIONÁRIO DAS 20 EQUIPAS E RESPETIVOS EMBLEMAS (Na pasta /public/equipas/)
const EQUIPAS_MAP: Record<string, string> = {
  'AD Marco 09': '/equipas/marco09.png',
  'Atlético CP': '/equipas/atletico.png',
  'Belenenses': '/equipas/belenenses.png',
  'Caldas SC': '/equipas/caldas.png',
  'CD Mafra': '/equipas/mafra.png',
  'Fafe': '/equipas/fafe.png',
  'Leça FC': '/equipas/leca.png',
  'Louletano': '/equipas/louletano.png',
  'Lusitano GC': '/equipas/lusitano.png',
  'Paços de Ferreira': '/equipas/pacos.png',
  'S. João Ver': '/equipas/sjoaover.png',
  'SC Covilhã': '/equipas/covilha.png',
  'Trofense': '/equipas/trofense.png',
  'U. Santarém': '/equipas/santarem.png',
  'UD Oliveirense': '/equipas/oliveirense.png',
  'USC Paredes': '/equipas/paredes.png',
  'Varzim': '/equipas/varzim.png',
  'Vianense': '/equipas/vianense.png',
  'Vitória SC B': '/equipas/vitoriasc.png',
  'Vitória Sernache': '/equipas/vitoriasernache.png'
};

// 🥷 DICIONÁRIO DE ANIMACÕES WEBP DOS JOGADORES (Na pasta /public/gifs/)
const JOGADORES_GIF_MAP: Record<string, string> = {
  'André': '/gifs/andre.webp',
  'Coutinho': '/gifs/coutinho.webp',
  'Craveiro': '/gifs/craveiro.webp',
  'Duarte': '/gifs/duarte.webp',
  'Miguel': '/gifs/miguel.webp',
  'Oliveira': '/gifs/oliveira.webp',
  'Paulo': '/gifs/paulo.webp',
  'Pinto': '/gifs/pinto.webp',
  'Presidente': '/gifs/presidente.webp',
};

const EQUIPAS_LISTA = Object.keys(EQUIPAS_MAP).sort();

// Helper global para renderizar logo da equipa
function renderBadge(nomeEquipa: string, size = 'w-6 h-6') {
  const url = EQUIPAS_MAP[nomeEquipa];
  if (!url) return <span className="text-xs">⚽</span>;
  return <img src={url} alt={nomeEquipa} className={`${size} object-contain inline-block shrink-0 drop-shadow-md`} />;
}

// ----------------------------------------------------------------------
// 🎯 COMPONENTE PERSONALIZADO: SELETOR DE EQUIPA COM PESQUISA E IMAGENS
// ----------------------------------------------------------------------
function SeletorEquipa({ value, onChange, placeholder, pequeno = false }: { value: string, onChange: (val: string) => void, placeholder: string, pequeno?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const equipasFiltradas = EQUIPAS_LISTA.filter(eq => eq.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative w-full">
      <div 
        onClick={() => { setIsOpen(!isOpen); setSearch(''); }}
        className={`w-full bg-slate-900 border border-slate-700 flex items-center justify-between cursor-pointer focus:border-emerald-500 outline-none transition-colors hover:border-slate-500 ${pequeno ? 'p-2 sm:p-3 rounded-lg text-xs sm:text-sm font-bold' : 'p-4 rounded-xl text-base sm:text-lg font-bold'}`}
      >
        {value ? (
          <div className="flex items-center gap-2 overflow-hidden">
            {renderBadge(value, pequeno ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-6 h-6')}
            <span className="truncate text-white">{value}</span>
          </div>
        ) : (
          <span className="text-slate-500 truncate">{placeholder}</span>
        )}
        <span className={`text-slate-500 ml-2 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          
          <div className="absolute top-full left-0 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col min-w-[220px]">
            <div className="p-2 border-b border-slate-700 bg-slate-900">
              <input 
                type="text" 
                placeholder="🔍 Pesquisar equipa..." 
                className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-lg text-sm font-bold text-white outline-none focus:border-emerald-500 placeholder-slate-500"
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="max-h-56 overflow-y-auto overscroll-contain">
              {equipasFiltradas.length > 0 ? equipasFiltradas.map(eq => (
                <div 
                  key={eq}
                  onClick={() => { onChange(eq); setIsOpen(false); }}
                  className={`flex items-center gap-3 p-3 hover:bg-slate-700 cursor-pointer transition border-b border-slate-700/50 last:border-0 ${value === eq ? 'bg-emerald-900/30 text-emerald-400' : 'text-slate-200'}`}
                >
                  {renderBadge(eq, 'w-6 h-6')}
                  <span className="font-bold text-sm truncate">{eq}</span>
                </div>
              )) : (
                <div className="p-4 text-center text-slate-500 text-sm font-bold">Sem resultados</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
// ----------------------------------------------------------------------

export default function Home() {
  const [abaAtiva, setAbaAtiva] = useState<'apostar' | 'historico' | 'ranking' | 'estatisticas' | 'admin'>('apostar');
  
  // Dados Principais
  const [jogadores, setJogadores] = useState<any[]>([]);
  const [jornadas, setJornadas] = useState<any[]>([]);
  const [jornadaAtiva, setJornadaAtiva] = useState<any | null>(null);
  const [jogos, setJogos] = useState<any[]>([]);
  const [apostas, setApostas] = useState<any[]>([]);
  const [todosJogos, setTodosJogos] = useState<any[]>([]);

  // Autenticação de Admin (PIN)
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [mostrarPinModal, setMostrarPinModal] = useState(false);
  const PIN_CORRETO = '1234';

  // Modal de Aposta
  const [jogadorApostar, setJogadorApostar] = useState<any | null>(null);
  const [palpitesTemp, setPalpitesTemp] = useState<{ [jogoId: string]: '1' | 'X' | '2' }>({});
  const [jokerJogoId, setJokerJogoId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Efeito Roleta & GIF de Celebração Personalizado
  const [isSorteando, setIsSorteando] = useState(false);
  const [roletaId, setRoletaId] = useState<string | null>(null);
  const [mostrarGifCelebracao, setMostrarGifCelebracao] = useState(false);
  const [jogadorSorteadoInfo, setJogadorSorteadoInfo] = useState<any | null>(null);

  // Drag & Drop no Admin
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Formulários Admin
  const [novoJogadorNome, setNovoJogadorNome] = useState('');
  const [novoJogadorFoto, setNovoJogadorFoto] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFotoId, setUploadingFotoId] = useState<string | null>(null);
  const [novaJornadaNum, setNovaJornadaNum] = useState<number | ''>('');
  const [equipaCasa, setEquipaCasa] = useState('');
  const [equipaFora, setEquipaFora] = useState('');

  // Estado de Edição de Jogos
  const [jogoEditId, setJogoEditId] = useState<string | null>(null);
  const [editEquipaCasa, setEditEquipaCasa] = useState('');
  const [editEquipaFora, setEditEquipaFora] = useState('');

  // 1. CARREGAR DADOS INICIAIS
  useEffect(() => {
    carregarDadosGerais();
  }, []);

  useEffect(() => {
    if (jornadaAtiva?.id) {
      carregarJogosEApostas(jornadaAtiva.id);
    } else {
      setJogos([]);
    }
  }, [jornadaAtiva]);

  useEffect(() => {
    supabase.from('jogos').select('*').then(({ data }) => {
      if (data) setTodosJogos(data);
    });
  }, [abaAtiva]);

  async function carregarDadosGerais() {
    const { data: dJogadores } = await supabase.from('jogadores').select('*').order('nome');
    const { data: dJornadas } = await supabase.from('jornadas').select('*').order('numero', { ascending: false });

    if (dJogadores) setJogadores(dJogadores);
    
    if (dJornadas && dJornadas.length > 0) {
      setJornadas(dJornadas);
      setJornadaAtiva((prev: any) => {
        const existe = dJornadas.find(j => j.id === prev?.id);
        return existe || dJornadas[0];
      });
    } else {
      setJornadas([]);
      setJornadaAtiva(null);
      setJogos([]);
    }
  }

  async function carregarJogosEApostas(jornadaId: string) {
    const { data: dJogos } = await supabase
      .from('jogos')
      .select('*')
      .eq('jornada_id', jornadaId)
      .order('created_at', { ascending: true });

    const { data: dApostas } = await supabase.from('apostas').select('*');
    
    if (dJogos) setJogos(dJogos);
    if (dApostas) setApostas(dApostas);
  }

  // ROLETA DE SORTEIO COM GIF DE CELEBRAÇÃO PERSONALIZADO
  function sortearProximoApostador() {
    if (isSorteando) return;

    const pendentes = jogadores.filter(j => {
      return !jogos.every(jg => apostas.some(a => a.jogador_id === j.id && a.jogo_id === jg.id));
    });

    if (pendentes.length === 0) {
      alert('🎉 Todos os jogadores já preencheram as apostas desta jornada!');
      return;
    }

    const TEMPO_EXIBICAO_GIF = 8000; // 8 Segundos

    if (pendentes.length === 1) {
      const sorteado = pendentes[0];
      setRoletaId(sorteado.id);
      setJogadorSorteadoInfo(sorteado);
      setMostrarGifCelebracao(true);
      
      setTimeout(() => {
        setMostrarGifCelebracao(false);
        setRoletaId(null);
        setJogadorSorteadoInfo(null);
        abrirModalAposta(sorteado);
      }, TEMPO_EXIBICAO_GIF);
      return;
    }

    setIsSorteando(true);
    let voltas = 0;
    const maxVoltas = 15 + Math.floor(Math.random() * 10);
    let currentIdx = 0;

    const tick = () => {
      setRoletaId(pendentes[currentIdx].id);
      voltas++;

      if (voltas < maxVoltas) {
        currentIdx = (currentIdx + 1) % pendentes.length;
        const delay = 50 + (voltas * voltas * 0.8);
        setTimeout(tick, delay);
      } else {
        const sorteado = pendentes[currentIdx];
        setJogadorSorteadoInfo(sorteado);
        setMostrarGifCelebracao(true);

        setTimeout(() => {
          setIsSorteando(false);
          setMostrarGifCelebracao(false);
          setRoletaId(null);
          setJogadorSorteadoInfo(null);
          abrirModalAposta(sorteado);
        }, TEMPO_EXIBICAO_GIF);
      }
    };
    
    tick();
  }

  // Helper para procurar a animação WEBP do jogador
  function obterGifDoJogador(nomeJogador: string) {
    if (JOGADORES_GIF_MAP[nomeJogador]) {
      return JOGADORES_GIF_MAP[nomeJogador];
    }
    const nomeLimpo = nomeJogador.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');
    return `/gifs/${nomeLimpo}.webp`;
  }

  // 2. NAVEGAÇÃO & PIN ADMIN
  function selecionarAba(aba: 'apostar' | 'historico' | 'ranking' | 'estatisticas' | 'admin') {
    if (aba === 'admin' && !isAdminAuth) {
      setMostrarPinModal(true);
      return;
    }
    setAbaAtiva(aba);
  }

  function verificarPin() {
    if (pinInput === PIN_CORRETO) {
      setIsAdminAuth(true);
      setMostrarPinModal(false);
      setPinInput('');
      setAbaAtiva('admin');
    } else {
      alert('Palavra-passe incorreta!');
      setPinInput('');
    }
  }

  // 3. FUNÇÕES DE APOSTA
  function abrirModalAposta(jogador: any) {
    const apostasDoJogador = apostas.filter(a => a.jogador_id === jogador.id);
    const novosPalpites: { [key: string]: '1' | 'X' | '2' } = {};
    let jokerId = null;

    apostasDoJogador.forEach(a => {
      novosPalpites[a.jogo_id] = a.palpite;
      if (a.tem_joker) jokerId = a.jogo_id;
    });

    setPalpitesTemp(novosPalpites);
    setJokerJogoId(jokerId);
    setJogadorApostar(jogador);
  }

  function limparTodosPalpites() {
    setPalpitesTemp({});
    setJokerJogoId(null);
  }

  async function guardarAposta() {
    const numPalpites = Object.keys(palpitesTemp).length;

    setIsSaving(true);
    try {
      if (numPalpites === 0) {
        const jogoIds = jogos.map(j => j.id);
        await supabase.from('apostas').delete().eq('jogador_id', jogadorApostar.id).in('jogo_id', jogoIds);
      } else {
        if (numPalpites < jogos.length) {
          setIsSaving(false);
          return alert('Preenche os palpites de todos os jogos!');
        }
        if (!jokerJogoId) {
          setIsSaving(false);
          return alert('É obrigatório escolher 1 jogo para usar o JOKER ⭐!');
        }

        for (const jogo of jogos) {
          await supabase.from('apostas').upsert({
            jogador_id: jogadorApostar.id,
            jogo_id: jogo.id,
            palpite: palpitesTemp[jogo.id],
            tem_joker: jokerJogoId === jogo.id,
          }, { onConflict: 'jogador_id,jogo_id' });
        }
      }

      const { data: dNovasApostas } = await supabase.from('apostas').select('*');
      if (dNovasApostas) setApostas(dNovasApostas);
      
      if (jornadaAtiva?.id) await carregarJogosEApostas(jornadaAtiva.id);
      setJogadorApostar(null);
    } catch (error) {
      alert('Erro ao guardar.');
    }
    setIsSaving(false);
  }

  // 4. FUNÇÕES ADMIN
  async function criarJogador() {
    if (!novoJogadorNome) return;
    setIsUploading(true);

    let fotoUrlFinal = null;

    if (novoJogadorFoto) {
      const fileExt = novoJogadorFoto.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatares')
        .upload(fileName, novoJogadorFoto);

      if (!uploadError) {
        const { data } = supabase.storage.from('avatares').getPublicUrl(fileName);
        fotoUrlFinal = data.publicUrl;
      }
    }

    await supabase.from('jogadores').insert([{ 
      nome: novoJogadorNome,
      foto_url: fotoUrlFinal
    }]);

    setNovoJogadorNome('');
    setNovoJogadorFoto(null);
    const fileInput = document.getElementById('foto-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    
    setIsUploading(false);
    carregarDadosGerais();
  }

  // ADICIONAR / ALTERAR FOTO DE UM JOGADOR JÁ EXISTENTE
  async function atualizarFotoJogador(jogadorId: string, ficheiro: File) {
    if (!ficheiro) return;
    setUploadingFotoId(jogadorId);

    const fileExt = ficheiro.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatares')
      .upload(fileName, ficheiro);

    if (!uploadError) {
      const { data } = supabase.storage.from('avatares').getPublicUrl(fileName);
      await supabase.from('jogadores').update({ foto_url: data.publicUrl }).eq('id', jogadorId);
      await carregarDadosGerais();
    } else {
      alert('Erro ao carregar fotografia.');
    }

    setUploadingFotoId(null);
  }

  async function apagarJogador(id: string, nome: string) {
    if (!confirm(`Tem a certeza que pretende apagar o jogador "${nome}"?`)) return;
    await supabase.from('jogadores').delete().eq('id', id);
    carregarDadosGerais();
  }

  async function criarJornada() {
    if (!novaJornadaNum) return;
    await supabase.from('jornadas').insert([{ numero: novaJornadaNum, estado: 'aberta' }]);
    setNovaJornadaNum('');
    carregarDadosGerais();
  }

  async function apagarJornada(id: string, numero: number) {
    if (!confirm(`Tem a certeza que pretende apagar a Jornada ${numero} e TODOS os seus jogos/apostas?`)) return;
    await supabase.from('jornadas').delete().eq('id', id);
    if (jornadaAtiva?.id === id) {
      setJornadaAtiva(null);
      setJogos([]);
    }
    carregarDadosGerais();
  }

  async function adicionarJogo() {
    if (!jornadaAtiva || !equipaCasa || !equipaFora) return alert("Seleciona ambas as equipas!");
    if (equipaCasa === equipaFora) return alert("A equipa da casa e a de fora têm de ser diferentes!");

    await supabase.from('jogos').insert([{
      jornada_id: jornadaAtiva.id,
      equipa_casa: equipaCasa,
      equipa_fora: equipaFora
    }]);
    setEquipaCasa('');
    setEquipaFora('');
    carregarJogosEApostas(jornadaAtiva.id);
  }

  function iniciarEdicaoJogo(jogo: any) {
    setJogoEditId(jogo.id);
    setEditEquipaCasa(jogo.equipa_casa);
    setEditEquipaFora(jogo.equipa_fora);
  }

  async function guardarEdicaoJogo(id: string) {
    if (!editEquipaCasa || !editEquipaFora) return;
    await supabase.from('jogos').update({
      equipa_casa: editEquipaCasa,
      equipa_fora: editEquipaFora
    }).eq('id', id);

    setJogoEditId(null);
    if (jornadaAtiva?.id) carregarJogosEApostas(jornadaAtiva.id);
  }

  async function apagarJogo(id: string) {
    if (!confirm('Tem a certeza que pretende apagar este jogo?')) return;
    await supabase.from('jogos').delete().eq('id', id);
    if (jornadaAtiva?.id) {
      carregarJogosEApostas(jornadaAtiva.id);
    } else {
      setJogos(prev => prev.filter(j => j.id !== id));
    }
  }

  // REORDENAR POR DRAG & DROP
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const reordered = [...jogos];
    const [movedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, movedItem);

    setJogos(reordered);
    setDraggedIndex(null);

    const baseTime = Date.now();
    for (let i = 0; i < reordered.length; i++) {
      const newDate = new Date(baseTime + i * 1000).toISOString();
      await supabase.from('jogos').update({ created_at: newDate }).eq('id', reordered[i].id);
    }

    if (jornadaAtiva?.id) {
      carregarJogosEApostas(jornadaAtiva.id);
    }
  };

  // MARCAR RESULTADO COM SUPORTE A ALTERNAR (TOGGLE)
  async function marcarResultadoFinal(jogoId: string, resultado: '1' | 'X' | '2') {
    const jogoAtual = jogos.find(j => j.id === jogoId);
    const novoResultado = jogoAtual?.resultado_final === resultado ? null : resultado;

    await supabase.from('jogos').update({ resultado_final: novoResultado }).eq('id', jogoId);
    if (jornadaAtiva?.id) carregarJogosEApostas(jornadaAtiva.id);
  }

  // 5. CÁLCULO DE PONTOS E ESTATÍSTICAS
  const calcularEstatisticas = () => {
    let globalBestJokerTeam = '-';
    let globalBestJokerPts = 0;
    let globalReiJoker = '-';
    let globalMaxJokers = 0;
    let globalReiEmpates = '-';
    let globalMaxEmpates = 0;

    const equipasJokerPontos: Record<string, number> = {};
    const jogadoresJokerAcertos: Record<string, number> = {};
    const jogadoresEmpatesAcertos: Record<string, number> = {};

    const statsPorJogador = jogadores.map(j => {
      let totalPontos = 0;
      let jokersCertos = 0;
      let empatesCertos = 0;
      
      const equipasTalismã: Record<string, number> = {};
      const equipasApostarContra: Record<string, number> = {};

      apostas.filter(a => a.jogador_id === j.id).forEach(aposta => {
        const jogo = todosJogos.find(jg => jg.id === aposta.jogo_id);
        
        if (jogo && jogo.resultado_final && jogo.resultado_final === aposta.palpite) {
          const pontosGanhos = aposta.tem_joker ? 2 : 1;
          totalPontos += pontosGanhos;

          if (aposta.palpite === 'X') {
            empatesCertos++;
            jogadoresEmpatesAcertos[j.nome] = (jogadoresEmpatesAcertos[j.nome] || 0) + 1;
          }

          if (jogo.resultado_final === '1') {
            equipasTalismã[jogo.equipa_casa] = (equipasTalismã[jogo.equipa_casa] || 0) + pontosGanhos;
            equipasApostarContra[jogo.equipa_fora] = (equipasApostarContra[jogo.equipa_fora] || 0) + pontosGanhos;
            if (aposta.tem_joker) equipasJokerPontos[jogo.equipa_casa] = (equipasJokerPontos[jogo.equipa_casa] || 0) + 2;
          } else if (jogo.resultado_final === '2') {
            equipasTalismã[jogo.equipa_fora] = (equipasTalismã[jogo.equipa_fora] || 0) + pontosGanhos;
            equipasApostarContra[jogo.equipa_casa] = (equipasApostarContra[jogo.equipa_casa] || 0) + pontosGanhos;
            if (aposta.tem_joker) equipasJokerPontos[jogo.equipa_fora] = (equipasJokerPontos[jogo.equipa_fora] || 0) + 2;
          } else {
            equipasTalismã[jogo.equipa_casa] = (equipasTalismã[jogo.equipa_casa] || 0) + pontosGanhos;
            equipasTalismã[jogo.equipa_fora] = (equipasTalismã[jogo.equipa_fora] || 0) + pontosGanhos;
            if (aposta.tem_joker) {
              equipasJokerPontos[jogo.equipa_casa] = (equipasJokerPontos[jogo.equipa_casa] || 0) + 2;
              equipasJokerPontos[jogo.equipa_fora] = (equipasJokerPontos[jogo.equipa_fora] || 0) + 2;
            }
          }

          if (aposta.tem_joker) {
            jokersCertos++;
            jogadoresJokerAcertos[j.nome] = (jogadoresJokerAcertos[j.nome] || 0) + 1;
          }
        }
      });

      let melhorEquipa = '-'; let maxT = 0;
      Object.entries(equipasTalismã).forEach(([eq, pts]) => { if (pts > maxT) { maxT = pts; melhorEquipa = eq; }});

      let piorEquipa = '-'; let maxP = 0;
      Object.entries(equipasApostarContra).forEach(([eq, pts]) => { if (pts > maxP) { maxP = pts; piorEquipa = eq; }});

      return {
        ...j,
        pontosTotais: totalPontos,
        jokersCertos,
        empatesCertos,
        equipaTalismaNome: melhorEquipa,
        equipaTalismaPts: maxT,
        equipaApostarContraNome: piorEquipa,
        equipaApostarContraPts: maxP
      };
    }).sort((a, b) => b.pontosTotais - a.pontosTotais);

    Object.entries(equipasJokerPontos).forEach(([eq, pts]) => {
      if (pts > globalBestJokerPts) { globalBestJokerPts = pts; globalBestJokerTeam = eq; }
    });
    Object.entries(jogadoresJokerAcertos).forEach(([nome, acertos]) => {
      if (acertos > globalMaxJokers) { globalMaxJokers = acertos; globalReiJoker = nome; }
    });
    Object.entries(jogadoresEmpatesAcertos).forEach(([nome, acertos]) => {
      if (acertos > globalMaxEmpates) { globalMaxEmpates = acertos; globalReiEmpates = nome; }
    });

    return {
      statsPorJogador,
      reiDosJokers: globalMaxJokers > 0 ? `${globalReiJoker} (${globalMaxJokers} certos)` : '-',
      reiDosEmpates: globalMaxEmpates > 0 ? `${globalReiEmpates} (${globalMaxEmpates} certos)` : '-',
      melhorEquipaJokerNome: globalBestJokerTeam,
      melhorEquipaJokerPts: globalBestJokerPts
    };
  };

  const estatisticas = calcularEstatisticas();
  const ranking = estatisticas.statsPorJogador;

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-900">
      
      {/* 📱 TOP NAVIGATION RESPONSIVA */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚽</span>
            <h1 className="text-2xl font-black tracking-wider text-white">TOTO<span className="text-emerald-500">LEÇA</span></h1>
          </div>
          
          <nav className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 justify-start md:justify-end [&::-webkit-scrollbar]:hidden">
            {[
              { id: 'apostar', label: '🎯 Apostas' },
              { id: 'historico', label: '👁️ Histórico' },
              { id: 'ranking', label: '🏆 Ranking Geral' },
              { id: 'estatisticas', label: '📊 Curiosidades' },
              { id: 'admin', label: '⚙️ Painel Gestão' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => selecionarAba(tab.id as any)}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-bold transition-all text-xs sm:text-sm uppercase tracking-widest whitespace-nowrap shrink-0 ${
                  abaAtiva === tab.id 
                    ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* 📱 SELETOR DE JORNADAS E BOTÃO DE SORTEIO RESPONSIVOS */}
        {(abaAtiva === 'apostar' || abaAtiva === 'historico' || abaAtiva === 'admin') && (
          <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 bg-slate-800/50 p-2 sm:p-3 rounded-xl border border-slate-700 w-full sm:w-fit">
              <span className="text-slate-400 font-bold ml-2 uppercase text-xs tracking-widest">Jornada Ativa:</span>
              {jornadas.length === 0 ? (
                <span className="text-slate-500 text-xs font-bold italic">Nenhuma jornada criada</span>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {jornadas.map(j => (
                    <button
                      key={j.id}
                      onClick={() => setJornadaAtiva(j)}
                      className={`px-4 py-2 rounded-lg font-black transition text-sm ${
                        jornadaAtiva?.id === j.id
                          ? 'bg-emerald-500 text-slate-900'
                          : 'bg-slate-900 text-slate-500 hover:bg-slate-700'
                      }`}
                    >
                      {j.numero}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* O BOTÃO DA ROLETA DE SORTEIO */}
            {abaAtiva === 'apostar' && jogadores.length > 0 && (
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={sortearProximoApostador}
                  disabled={isSorteando}
                  className={`w-full sm:w-auto font-black px-6 py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 text-xs sm:text-sm uppercase tracking-wider border-2 ${
                    isSorteando 
                      ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed' 
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400'
                  }`}
                >
                  <span className={isSorteando ? 'animate-spin' : 'animate-bounce'}>🎲</span> 
                  {isSorteando ? 'A Sortear...' : 'Sortear Quem Aposta Agora'}
                </button>
              </div>
            )}

          </div>
        )}

        {/* ================= ABA 1: APOSTAS ================= */}
        {abaAtiva === 'apostar' && (
          <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {jogadores.map(jogador => {
                const jaApostouTudo = jogos.length > 0 && jogos.every(jg => 
                  apostas.some(a => a.jogador_id === jogador.id && a.jogo_id === jg.id)
                );
                
                const isOnRoulette = roletaId === jogador.id;

                return (
                  <button
                    key={jogador.id}
                    onClick={() => abrirModalAposta(jogador)}
                    className={`group relative flex flex-col items-center justify-center p-4 sm:p-8 rounded-2xl border-4 transition-all duration-150 ${
                      isOnRoulette 
                        ? 'bg-amber-500/20 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.6)] scale-105 sm:scale-110 z-10' 
                        : jaApostouTudo 
                          ? 'bg-emerald-900/20 border-emerald-500/50 sm:hover:scale-105' 
                          : 'bg-slate-800 border-slate-700 hover:border-emerald-500 sm:hover:scale-105'
                    }`}
                  >
                    {jaApostouTudo && (
                      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-emerald-500 text-slate-900 w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full font-black text-sm sm:text-xl shadow-lg">
                        ✓
                      </div>
                    )}
                    
                    {jogador.foto_url ? (
                      <img 
                        src={jogador.foto_url} 
                        alt={jogador.nome} 
                        className={`w-16 h-16 sm:w-24 sm:h-24 rounded-full mb-2 sm:mb-4 object-cover border-4 transition-colors ${isOnRoulette ? 'border-amber-400 shadow-xl' : 'border-slate-800 group-hover:border-emerald-500'}`} 
                      />
                    ) : (
                      <div className={`w-16 h-16 sm:w-24 sm:h-24 bg-slate-700 rounded-full mb-2 sm:mb-4 flex items-center justify-center text-2xl sm:text-4xl font-black text-slate-400 border-4 transition-colors ${isOnRoulette ? 'border-amber-400 text-amber-400 shadow-xl' : 'border-slate-800 group-hover:border-emerald-500'}`}>
                        {jogador.nome.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <span className={`text-base sm:text-xl font-bold text-center ${isOnRoulette ? 'text-amber-400' : ''}`}>{jogador.nome}</span>
                    <span className={`text-[10px] sm:text-sm mt-1 sm:mt-2 font-medium text-center ${jaApostouTudo ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {jaApostouTudo ? 'Apostas Registadas' : 'A aguardar apostas'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= ABA 2: HISTÓRICO ================= */}
        {abaAtiva === 'historico' && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-950 border-b-2 border-slate-700">
                    <th className="p-4 font-black text-slate-300 w-64 uppercase tracking-widest text-sm">Jogo</th>
                    <th className="p-4 font-black text-emerald-400 text-center uppercase tracking-widest text-sm w-32">Oficial</th>
                    {jogadores.map(j => (
                      <th key={j.id} className="p-4 font-bold text-center border-l border-slate-800 w-32">
                        {j.nome}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {jogos.map(jogo => (
                    <tr key={jogo.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 font-bold">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            {renderBadge(jogo.equipa_casa, 'w-5 h-5')}
                            <span className="text-slate-200 truncate">{jogo.equipa_casa}</span>
                          </div>
                          <span className="text-slate-500 text-xs pl-7">vs</span>
                          <div className="flex items-center gap-2">
                            {renderBadge(jogo.equipa_fora, 'w-5 h-5')}
                            <span className="text-slate-200 truncate">{jogo.equipa_fora}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {jogo.resultado_final ? (
                          <span className="bg-emerald-500 text-slate-900 font-black px-4 py-2 rounded-lg text-lg">
                            {jogo.resultado_final}
                          </span>
                        ) : (
                          <span className="text-slate-600 font-bold italic">-</span>
                        )}
                      </td>
                      {jogadores.map(j => {
                        const aposta = apostas.find(a => a.jogador_id === j.id && a.jogo_id === jogo.id);
                        const acertou = jogo.resultado_final && aposta?.palpite === jogo.resultado_final;
                        const erro = jogo.resultado_final && aposta?.palpite !== jogo.resultado_final;

                        return (
                          <td key={j.id} className="p-4 text-center border-l border-slate-800/50 align-middle">
                            {aposta ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className={`font-black text-xl w-12 h-12 flex items-center justify-center rounded-xl border-2 ${
                                  acertou ? 'bg-emerald-500 text-slate-900 border-emerald-400' :
                                  erro ? 'bg-slate-900 text-slate-500 border-slate-700 opacity-50' :
                                  'bg-slate-800 text-slate-300 border-slate-600'
                                }`}>
                                  {aposta.palpite}
                                </span>
                                {aposta.tem_joker && (
                                  <span className="text-amber-400 text-xs font-black drop-shadow-md">⭐ JOKER</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-700">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= ABA 3: RANKING ================= */}
        {abaAtiva === 'ranking' && (
          <div className="max-w-3xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black mb-8 text-center text-amber-400 drop-shadow-md">🏆 Tabela Classificativa</h2>
            {ranking.map((j, idx) => (
              <div key={j.id} className="flex items-center justify-between p-4 sm:p-6 bg-slate-800 border border-slate-700 rounded-2xl shadow-lg">
                <div className="flex items-center gap-4 sm:gap-6">
                  <span className={`text-2xl sm:text-4xl font-black w-8 sm:w-12 text-center ${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-700' : 'text-slate-600'}`}>
                    {idx + 1}º
                  </span>
                  {j.foto_url ? (
                    <img src={j.foto_url} alt={j.nome} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-700 rounded-full flex items-center justify-center text-xl sm:text-2xl font-black text-slate-400">
                      {j.nome.charAt(0)}
                    </div>
                  )}
                  <span className="text-xl sm:text-2xl font-bold text-white truncate">{j.nome}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-3xl sm:text-5xl font-black text-emerald-400">{j.pontosTotais}</span>
                  <span className="text-slate-500 font-bold uppercase tracking-widest text-xs sm:text-sm ml-1 sm:ml-2">Pts</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================= ABA 4: ESTATÍSTICAS ================= */}
        {abaAtiva === 'estatisticas' && (
          <div className="space-y-8">
            <h2 className="text-2xl sm:text-3xl font-black mb-8 text-center text-sky-400 drop-shadow-md">📊 Curiosidades e Estatísticas</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl flex items-center gap-6">
                <div className="text-5xl sm:text-6xl">👑</div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Rei dos Jokers</h3>
                  <span className="text-xl sm:text-2xl font-black text-amber-400">{estatisticas.reiDosJokers}</span>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Mais Jokers certos no total.</p>
                </div>
              </div>
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl flex items-center gap-6">
                <div className="text-5xl sm:text-6xl">🤝</div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Rei dos Empates</h3>
                  <span className="text-xl sm:text-2xl font-black text-sky-400">{estatisticas.reiDosEmpates}</span>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Mais empates (X) acertados no total.</p>
                </div>
              </div>
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl flex items-center gap-6">
                <div className="text-5xl sm:text-6xl">⭐</div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Equipa D&apos;Ouro</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {renderBadge(estatisticas.melhorEquipaJokerNome, 'w-6 h-6 sm:w-8 sm:h-8')}
                    <span className="text-xl sm:text-2xl font-black text-emerald-400">
                      {estatisticas.melhorEquipaJokerPts > 0 ? `${estatisticas.melhorEquipaJokerNome} (+${estatisticas.melhorEquipaJokerPts}pts)` : '-'}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-1">A equipa que mais pontuou como Joker.</p>
                </div>
              </div>
            </div>

            <div className="max-w-6xl mx-auto bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl mt-8">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-950 border-b-2 border-slate-700">
                      <th className="p-4 w-48 sm:w-64 font-black text-slate-300 uppercase tracking-widest text-xs sm:text-sm"></th>
                      <th className="p-4 font-black text-amber-400 uppercase tracking-widest text-xs sm:text-sm text-center">Jokers</th>
                      <th className="p-4 font-black text-sky-400 uppercase tracking-widest text-xs sm:text-sm text-center">Empates</th>
                      <th className="p-4 font-black text-emerald-400 uppercase tracking-widest text-xs sm:text-sm">🍀 Equipa Talismã</th>
                      <th className="p-4 font-black text-rose-400 uppercase tracking-widest text-xs sm:text-sm">💀 Apostar contra</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {estatisticas.statsPorJogador.map(j => (
                      <tr key={j.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="p-4 font-bold flex items-center gap-3">
                          {j.foto_url ? (
                            <img src={j.foto_url} alt={j.nome} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-700 rounded-full flex items-center justify-center font-black text-slate-400 shrink-0">
                              {j.nome.charAt(0)}
                            </div>
                          )}
                          <span className="text-sm sm:text-lg truncate">{j.nome}</span>
                        </td>
                        <td className="p-4 text-center font-black text-lg sm:text-xl text-amber-500">{j.jokersCertos}</td>
                        <td className="p-4 text-center font-black text-lg sm:text-xl text-sky-400">{j.empatesCertos}</td>
                        <td className="p-4 font-bold text-emerald-300 text-xs sm:text-base">
                          {j.equipaTalismaPts > 0 ? (
                            <div className="flex items-center gap-2">
                              {renderBadge(j.equipaTalismaNome, 'w-4 h-4 sm:w-5 sm:h-5')}
                              <span className="truncate">{j.equipaTalismaNome} (+{j.equipaTalismaPts}pts)</span>
                            </div>
                          ) : '-'}
                        </td>
                        <td className="p-4 font-bold text-rose-300 text-xs sm:text-base">
                          {j.equipaApostarContraPts > 0 ? (
                            <div className="flex items-center gap-2">
                              {renderBadge(j.equipaApostarContraNome, 'w-4 h-4 sm:w-5 sm:h-5')}
                              <span className="truncate">{j.equipaApostarContraNome} (+{j.equipaApostarContraPts}pts)</span>
                            </div>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= ABA 5: ADMIN ================= */}
        {abaAtiva === 'admin' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Bloco 1: Gestão de Jornadas e Jogos */}
            <div className="space-y-6">
              <div className="bg-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-700 shadow-xl space-y-4">
                <h3 className="text-lg sm:text-xl font-black text-emerald-400 uppercase tracking-widest">1. Gestão de Jornadas</h3>
                
                <div className="flex gap-4">
                  <input type="number" placeholder="Nº da Jornada" className="flex-1 bg-slate-900 border border-slate-700 p-3 sm:p-4 rounded-xl text-base sm:text-lg font-bold focus:border-emerald-500 outline-none w-full" value={novaJornadaNum} onChange={e => setNovaJornadaNum(Number(e.target.value))} />
                  <button onClick={criarJornada} className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black px-6 sm:px-8 py-3 sm:py-4 rounded-xl transition">Criar</button>
                </div>

                {jornadas.length > 0 && (
                  <div className="pt-4 border-t border-slate-700/50">
                    <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Jornadas Existentes:</span>
                    <div className="flex flex-wrap gap-2">
                      {jornadas.map(j => (
                        <div key={j.id} className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold">
                          <span>Jornada {j.numero}</span>
                          <button onClick={() => apagarJornada(j.id, j.numero)} className="text-red-400 hover:text-red-300 ml-1" title="Apagar Jornada">🗑️</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {jornadaAtiva && (
                <div className="bg-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-700 shadow-xl">
                  <h3 className="text-lg sm:text-xl font-black text-emerald-400 mb-6 uppercase tracking-widest flex justify-between items-center">
                    <span>2. Adicionar Jogo</span>
                    <span className="text-slate-500 text-xs sm:text-base">Jornada {jornadaAtiva.numero}</span>
                  </h3>
                  
                  <div className="space-y-4">
                    <SeletorEquipa 
                      placeholder="Selecionar Equipa da Casa..." 
                      value={equipaCasa} 
                      onChange={setEquipaCasa} 
                    />
                    <SeletorEquipa 
                      placeholder="Selecionar Equipa de Fora..." 
                      value={equipaFora} 
                      onChange={setEquipaFora} 
                    />
                    
                    <button onClick={adicionarJogo} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black p-4 rounded-xl transition text-base sm:text-lg mt-2 shadow-lg">
                      + Inserir Jogo na Grelha
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bloco 2: Marcar Resultados, Edição, Reordenar por Arrastar & Apagar Jogos */}
            <div className="space-y-6">
              
              <div className="bg-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-700 shadow-xl">
                <h3 className="text-lg sm:text-xl font-black text-amber-400 mb-6 uppercase tracking-widest">
                  🏁 Jogos da Jornada {jornadaAtiva?.numero || '-'}
                </h3>
                {jogos.length === 0 ? <p className="text-slate-500 italic text-sm">Nenhum jogo nesta jornada.</p> : (
                  <div className="space-y-3">
                    {jogos.map((jogo, index) => {
                      const estaEditando = jogoEditId === jogo.id;

                      return (
                        <div 
                          key={jogo.id} 
                          draggable={!estaEditando}
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, index)}
                          className={`bg-slate-900 p-4 rounded-xl border transition-all ${
                            draggedIndex === index ? 'opacity-30 border-amber-500' : 'border-slate-800'
                          }`}
                        >
                          {estaEditando ? (
                            <div className="flex flex-col sm:flex-row gap-2 items-center w-full">
                              
                              <div className="w-full sm:w-auto flex-1 min-w-0">
                                <SeletorEquipa value={editEquipaCasa} onChange={setEditEquipaCasa} placeholder="Casa" pequeno />
                              </div>
                              
                              <span className="hidden sm:inline text-slate-500 text-xs font-black px-1">V</span>
                              
                              <div className="w-full sm:w-auto flex-1 min-w-0">
                                <SeletorEquipa value={editEquipaFora} onChange={setEditEquipaFora} placeholder="Fora" pequeno />
                              </div>

                              <div className="flex gap-2 w-full sm:w-auto justify-end mt-2 sm:mt-0">
                                <button onClick={() => guardarEdicaoJogo(jogo.id)} className="flex-1 sm:flex-none bg-emerald-500 text-slate-950 px-4 sm:px-3 py-2 rounded-lg text-sm font-black shadow-md hover:bg-emerald-400">
                                  💾
                                </button>
                                <button onClick={() => setJogoEditId(null)} className="flex-1 sm:flex-none bg-slate-800 text-slate-400 px-4 sm:px-3 py-2 rounded-lg text-sm font-bold hover:bg-slate-700">
                                  ✕
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-3">
                              
                              {/* LINHA 1: ARRASTAR + EQUIPAS EM CONFRONTO */}
                              <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 gap-2">
                                
                                <div className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-amber-400 text-lg px-1 select-none" title="Clique e arraste para mudar a ordem">
                                  ☰
                                </div>

                                <div className="flex items-center gap-2 font-bold text-slate-200 text-xs sm:text-base min-w-0 flex-1">
                                  {renderBadge(jogo.equipa_casa, 'w-5 h-5 sm:w-6 sm:h-6')}
                                  <span className="truncate">{jogo.equipa_casa}</span>
                                </div>

                                <span className="text-slate-500 font-black text-[10px] sm:text-xs px-2 shrink-0">VS</span>

                                <div className="flex items-center gap-2 font-bold text-slate-200 text-xs sm:text-base min-w-0 flex-1 justify-end">
                                  <span className="truncate text-right">{jogo.equipa_fora}</span>
                                  {renderBadge(jogo.equipa_fora, 'w-5 h-5 sm:w-6 sm:h-6')}
                                </div>
                              </div>

                              {/* LINHA 2: RESULTADOS E FERRAMENTAS */}
                              <div className="flex items-center justify-between gap-2 pt-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 hidden sm:inline">Oficial:</span>
                                  <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                                    {(['1', 'X', '2'] as const).map(res => (
                                      <button 
                                        key={res} 
                                        onClick={() => marcarResultadoFinal(jogo.id, res)} 
                                        className={`w-8 h-8 rounded-md font-black text-xs transition ${
                                          jogo.resultado_final === res 
                                            ? 'bg-amber-500 text-slate-900 shadow-md scale-105' 
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                        }`}
                                      >
                                        {res}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                                  <button 
                                    onClick={() => iniciarEdicaoJogo(jogo)} 
                                    className="w-8 h-8 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-slate-800 transition" 
                                    title="Editar Equipas"
                                  >
                                    ✏️
                                  </button>
                                  <button 
                                    onClick={() => apagarJogo(jogo.id)} 
                                    className="w-8 h-8 flex items-center justify-center rounded text-red-400 hover:bg-red-500/20 transition" 
                                    title="Apagar Jogo"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>

                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Gerir Amigos */}
              <div className="bg-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-700 shadow-xl space-y-6">
                <h3 className="text-lg sm:text-xl font-black text-emerald-400 uppercase tracking-widest">👤 Gerir Amigos do Grupo</h3>
                
                {/* Form Novo Jogador */}
                <div className="space-y-4">
                  <input type="text" placeholder="Nome do Jogador" className="w-full bg-slate-900 border border-slate-700 p-3 sm:p-4 rounded-xl text-base sm:text-lg font-bold focus:border-emerald-500 outline-none" value={novoJogadorNome} onChange={e => setNovoJogadorNome(e.target.value)} />
                  <input 
                    id="foto-upload"
                    type="file" 
                    accept="image/*"
                    onChange={e => setNovoJogadorFoto(e.target.files?.[0] || null)}
                    className="w-full bg-slate-900 border border-slate-700 p-3 sm:p-4 rounded-xl text-xs sm:text-sm font-bold outline-none text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-bold file:bg-emerald-500/20 file:text-emerald-400 hover:file:bg-emerald-500/30 transition cursor-pointer" 
                  />
                  <button 
                    onClick={criarJogador} 
                    disabled={isUploading}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black p-3 sm:p-4 rounded-xl transition text-base sm:text-lg"
                  >
                    {isUploading ? 'A guardar foto...' : 'Adicionar Amigo'}
                  </button>
                </div>

                {/* Lista de Amigos Registados com Botão de Alterar Fotografia */}
                {jogadores.length > 0 && (
                  <div className="pt-4 border-t border-slate-700/50">
                    <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">Amigos Registados:</span>
                    <div className="space-y-2">
                      {jogadores.map(j => (
                        <div key={j.id} className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
                          <div className="flex items-center gap-3 min-w-0">
                            {j.foto_url ? (
                              <img src={j.foto_url} alt={j.nome} className="w-10 h-10 rounded-full object-cover shrink-0 border-2 border-emerald-500/50" />
                            ) : (
                              <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center font-bold text-slate-300 text-sm shrink-0">
                                {j.nome[0]}
                              </div>
                            )}
                            <span className="font-bold text-slate-200 text-sm sm:text-base truncate">{j.nome}</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <input 
                              type="file" 
                              accept="image/*"
                              id={`foto-edit-${j.id}`}
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) atualizarFotoJogador(j.id, file);
                              }}
                            />
                            
                            <label 
                              htmlFor={`foto-edit-${j.id}`}
                              className={`p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer flex items-center justify-center ${uploadingFotoId === j.id ? 'animate-pulse' : ''}`}
                              title="Adicionar / Alterar Fotografia"
                            >
                              {uploadingFotoId === j.id ? '⏳' : '📷'}
                            </label>

                            <button onClick={() => apagarJogador(j.id, j.nome)} className="text-red-400 hover:text-red-300 p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition" title="Apagar Jogador">
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </div>

      {/* ================= OVERLAY ANIMADO PERSONALIZADO (APENAS NOME) ================= */}
      {mostrarGifCelebracao && jogadorSorteadoInfo && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
          <div className="text-center space-y-4">
            <h3 className="text-3xl sm:text-5xl font-black text-emerald-400 drop-shadow-lg uppercase tracking-wider">
              {jogadorSorteadoInfo.nome}
            </h3>
            <div className="relative border-4 border-amber-400 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.5)] max-w-xs sm:max-w-md mx-auto">
              <img 
                src={obterGifDoJogador(jogadorSorteadoInfo.nome)} 
                alt={`Animação ${jogadorSorteadoInfo.nome}`} 
                className="w-full h-auto object-cover max-h-[60vh]"
                onError={(e) => {
                  e.currentTarget.src = "/celebracao.gif";
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL PIN ADMIN ================= */}
      {mostrarPinModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl text-center">
            <h3 className="text-xl sm:text-2xl font-black text-white mb-2">🔒 Acesso Restrito</h3>
            <p className="text-slate-400 text-xs sm:text-sm mb-6">Introduza a palavra-passe do administrador.</p>
            <input
              type="password"
              placeholder="****"
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && verificarPin()}
              className="w-full bg-slate-950 border border-slate-700 p-4 rounded-xl text-center text-xl sm:text-2xl font-black tracking-widest mb-6 focus:border-emerald-500 outline-none"
            />
            <div className="flex gap-4">
              <button onClick={() => setMostrarPinModal(false)} className="flex-1 bg-slate-800 text-slate-400 font-bold p-3 sm:p-4 rounded-xl text-sm sm:text-base">Cancelar</button>
              <button onClick={verificarPin} className="flex-1 bg-emerald-500 text-slate-900 font-black p-3 sm:p-4 rounded-xl text-sm sm:text-base">Entrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 📱 MODAL DE APOSTA ESTRUTURADO ================= */}
      {jogadorApostar && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-8 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl relative">
            
            {/* CABEÇALHO FIXO DO MODAL */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
              <div>
                <span className="text-emerald-500 font-black tracking-widest uppercase text-xs sm:text-sm">A preencher apostas</span>
                <h2 className="text-2xl sm:text-4xl font-black text-white">{jogadorApostar.nome}</h2>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={limparTodosPalpites}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 font-bold px-3 py-2 rounded-xl text-xs sm:text-sm transition"
                  title="Limpar todos os palpites"
                >
                  🧹 Limpar
                </button>
                <button 
                  onClick={() => setJogadorApostar(null)} 
                  className="text-slate-500 hover:text-white font-black text-xl bg-slate-800 w-10 h-10 rounded-full flex items-center justify-center transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* CORPO DE JOGOS (APENAS ESTA PARTE FAZ SCROLL) */}
            <div className="overflow-y-auto flex-1 my-4 pr-1 space-y-3 sm:space-y-4">
              {jogos.map(jogo => {
                const isJoker = jokerJogoId === jogo.id;
                const palpite = palpitesTemp[jogo.id];

                return (
                  <div key={jogo.id} className={`flex flex-col lg:flex-row items-center justify-between p-4 sm:p-5 rounded-2xl border-2 transition gap-4 lg:gap-0 ${isJoker ? 'bg-amber-900/10 border-amber-500/50' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}`}>
                    
                    {/* Equipas Layout */}
                    <div className="w-full flex lg:flex-1 text-lg sm:text-2xl font-bold items-center justify-center lg:justify-start gap-2 sm:gap-3">
                      <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-center w-2/5 lg:w-auto">
                        {renderBadge(jogo.equipa_casa, 'w-8 h-8 sm:w-10 sm:h-10')}
                        <span className="text-white text-sm sm:text-xl leading-tight">{jogo.equipa_casa}</span>
                      </div>
                      <span className="text-slate-600 text-sm sm:text-lg">vs</span>
                      <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-center w-2/5 lg:w-auto">
                        {renderBadge(jogo.equipa_fora, 'w-8 h-8 sm:w-10 sm:h-10')}
                        <span className="text-white text-sm sm:text-xl leading-tight">{jogo.equipa_fora}</span>
                      </div>
                    </div>

                    {/* Botões de Aposta Layout */}
                    <div className="flex items-center gap-3 sm:gap-6 w-full lg:w-auto justify-center">
                      <div className="flex gap-1.5 sm:gap-2 bg-slate-900 p-1.5 sm:p-2 rounded-xl">
                        {(['1', 'X', '2'] as const).map(opcao => (
                          <button
                            key={opcao}
                            onClick={() => setPalpitesTemp(prev => {
                              if (prev[jogo.id] === opcao) {
                                const copy = { ...prev };
                                delete copy[jogo.id];
                                return copy;
                              }
                              return { ...prev, [jogo.id]: opcao };
                            })}
                            className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg text-xl sm:text-2xl font-black transition-all ${
                              palpite === opcao
                                ? 'bg-emerald-500 text-slate-900 shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-110'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                            {opcao}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => setJokerJogoId(isJoker ? null : jogo.id)}
                        className={`flex flex-col items-center justify-center w-16 h-[60px] sm:w-24 sm:h-[80px] rounded-xl font-black transition-all border-2 shrink-0 ${
                          isJoker
                            ? 'bg-amber-500 text-slate-900 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-110'
                            : 'bg-slate-900 text-slate-600 border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <span className="text-xl sm:text-2xl">⭐</span>
                        <span className="text-[8px] sm:text-[10px] uppercase tracking-widest mt-0.5 sm:mt-1">Joker</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RODAPÉ FIXO DO MODAL */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-3 shrink-0">
              <button
                onClick={() => setJogadorApostar(null)}
                className="w-full sm:w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-base sm:text-lg py-3.5 sm:py-4 rounded-xl transition uppercase tracking-widest order-2 sm:order-1"
              >
                ← Voltar
              </button>
              
              <button
                onClick={guardarAposta}
                disabled={isSaving}
                className="w-full sm:w-2/3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black text-lg sm:text-xl py-3.5 sm:py-4 rounded-xl shadow-xl transition active:scale-95 uppercase tracking-widest order-1 sm:order-2"
              >
                {isSaving ? 'A guardar...' : '✅ Confirmar Apostas'}
              </button>
            </div>

          </div>
        </div>
      )}
    </main>
  );
}