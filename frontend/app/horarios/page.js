'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';

function getWeekLabel(weekOffset = 0) {
  const now = new Date();
  const monday = new Date(now.setDate(now.getDate() - now.getDay() + 1 + weekOffset * 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const format = (d) =>
    d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `Semana de ${format(monday)} - ${format(sunday)}`;
}

const diasOrdem = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

export default function HorariosPage() {
  const router = useRouter();
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [viewMode, setViewMode] = useState('');
  const [userName, setUserName] = useState('');

  const API_URL = 'https://sistema-de-horarios-rimini.onrender.com';

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user) {
      alert('Por favor, faça login primeiro!');
      window.location.href = '/login';
      return;
    }

    setUserRole(user.tipo);
    setUserName(user.nome);

    fetch(`${API_URL}/api/horarios`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setHorarios(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Erro ao buscar horários:', err);
        setLoading(false);
      });
  }, []);

  const handleSelectWeek = (e) => setSelectedWeek(e.target.value);

  const filteredHorarios = horarios
    .filter((h) => h.semana === selectedWeek)
    .sort((a, b) => diasOrdem.indexOf(a.dia_trabalho) - diasOrdem.indexOf(b.dia_trabalho));

  const meuHorario = filteredHorarios.filter((h) => h.utilizador_nome === userName);

  const totalHoras = meuHorario.reduce((sum, h) => {
    if (h.hora_entrada && h.hora_saida) {
      const [hIn, mIn] = h.hora_entrada.split(':').map(Number);
      const [hOut, mOut] = h.hora_saida.split(':').map(Number);
      const diff = (hOut + mOut / 60) - (hIn + mIn / 60);
      return sum + (diff > 0 ? diff : 0);
    }
    return sum;
  }, 0);

  const handleDownloadPDF = async (horariosParaPDF, lojaOrUser) => {
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF();
    doc.setFontSize(16);

    const isMeuHorario = horariosParaPDF.every(h => h.utilizador_nome === userName);
    const titulo = isMeuHorario
      ? `Meu Horário — ${selectedWeek}`
      : `Horários — ${lojaOrUser} — ${selectedWeek}`;
    doc.text(titulo, 14, 16);

    const grouped = {};
    horariosParaPDF.forEach((h) => {
      const key = `${h.dia_trabalho}_${h.hora_entrada || '-'}_${h.hora_saida || '-'}`;
      if (!grouped[key]) grouped[key] = { dia: h.dia_trabalho, entrada: h.hora_entrada || '-', saida: h.hora_saida || '-', utilizadores: [], loja: h.loja || '-' };
      grouped[key].utilizadores.push(h.utilizador_nome);
    });

    const tableData = Object.values(grouped).map((g) => {
      if (isMeuHorario) {
        return [g.dia, g.entrada, g.saida, g.loja];
      } else {
        return [g.dia, g.entrada, g.saida, g.utilizadores.join(', ')];
      }
    });

    const head = isMeuHorario
      ? [['Dia', 'Entrada', 'Saída', 'Loja']]
      : [['Dia', 'Entrada', 'Saída', 'Utilizadores']];

    autoTable(doc, {
      head,
      body: tableData,
      startY: 24,
      theme: 'grid',
    });

    const usuarios = [...new Set(horariosParaPDF.map((h) => h.utilizador_nome))];
    const totalHorasUsuarios = usuarios.map((nome) => {
      const usuarioHoras = horariosParaPDF
        .filter((h) => h.utilizador_nome === nome)
        .reduce((sum, h) => {
          if (h.hora_entrada && h.hora_saida) {
            const [hIn, mIn] = h.hora_entrada.split(':').map(Number);
            const [hOut, mOut] = h.hora_saida.split(':').map(Number);
            const diff = (hOut + mOut / 60) - (hIn + mIn / 60);
            return sum + (diff > 0 ? diff : 0);
          }
          return sum;
        }, 0);
      return { nome, horas: usuarioHoras };
    });

    doc.text('Total de horas por utilizador:', 14, doc.lastAutoTable.finalY + 10);
    const resumoData = totalHorasUsuarios.map((u) => [u.nome, u.horas.toFixed(2)]);
    autoTable(doc, {
      head: [['Utilizador', 'Horas']],
      body: resumoData,
      startY: doc.lastAutoTable.finalY + 14,
      theme: 'grid',
    });

    const filename = isMeuHorario ? `horario_${userName}.pdf` : `horarios_${lojaOrUser}.pdf`;
    doc.save(filename);
  };

  if (loading) return <p>Carregando...</p>;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="flex justify-between items-center bg-blue-700 text-white p-4 rounded-b-lg shadow">
        <h1 className="text-2xl font-semibold">📅 Sistema de Horários</h1>
        <button
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }}
          className="bg-red-500 hover:bg-red-600 px-3 py-2 rounded-md text-sm"
        >
          Sair
        </button>
      </header>

      {/* Banner */}
      <div className="relative overflow-hidden mx-auto mt-6" style={{ width: '1998px', height: '697px', maxWidth: '100%' }}>
        <img
          src={`${API_URL}/uploads/banner.jpg`}
          alt="Banner fixo"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Conteúdo principal */}
      <div className="mt-6 p-6">
        {/* Select da Semana */}
        <div className="mb-4">
          <label className="block mb-2 font-medium text-gray-800">Selecionar Semana</label>
          <select value={selectedWeek} onChange={handleSelectWeek} className="border border-gray-400 rounded p-2 w-64">
            <option value="">-- Selecionar Semana --</option>
            <option value={getWeekLabel(0)}>{getWeekLabel(0)}</option>
            <option value={getWeekLabel(1)}>{getWeekLabel(1)}</option>
            <option value={getWeekLabel(2)}>{getWeekLabel(2)}</option>
          </select>
        </div>

        {/* Botões principais */}
        <div className="flex flex-wrap gap-4 mb-6">
          {(userRole === 'ADMINISTRADOR' || userRole === 'GERENTE') && (
            <button onClick={() => (window.location.href = '/novo-horario')} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
              ➕ Fazer Novo Horário
            </button>
          )}
          {userRole === 'ADMINISTRADOR' && (
            <button onClick={() => (window.location.href = '/gerir-utilizadores')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
              👥 Gerir Utilizadores
            </button>
          )}

          <button
            onClick={() => setViewMode('meu')}
            disabled={!selectedWeek}
            className={`px-4 py-2 rounded-lg text-white transition ${viewMode === 'meu' ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} ${!selectedWeek ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            👤 Ver meu horário
          </button>

          <button
            onClick={() => setViewMode('loja')}
            disabled={!selectedWeek}
            className={`px-4 py-2 rounded-lg text-white transition ${viewMode === 'loja' ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} ${!selectedWeek ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            🏬 Ver horários por loja
          </button>
        </div>

        {/* VISUALIZAÇÃO HORÁRIOS POR LOJA */}
        {selectedWeek && viewMode === 'loja' && (
          <div className="mt-6">
            {[...new Set(filteredHorarios.map((h) => h.loja))].map((loja) => {
              const horariosLoja = filteredHorarios
                .filter((h) => h.loja === loja)
                .sort((a, b) => diasOrdem.indexOf(a.dia_trabalho) - diasOrdem.indexOf(b.dia_trabalho));

              const usuarios = [...new Set(horariosLoja.map((h) => h.utilizador_nome))];
              const totalHorasUsuarios = usuarios.map((nome) => {
                const usuarioHoras = horariosLoja
                  .filter((h) => h.utilizador_nome === nome)
                  .reduce((sum, h) => {
                    if (h.hora_entrada && h.hora_saida) {
                      const [hIn, mIn] = h.hora_entrada.split(':').map(Number);
                      const [hOut, mOut] = h.hora_saida.split(':').map(Number);
                      const diff = (hOut + mOut / 60) - (hIn + mIn / 60);
                      return sum + (diff > 0 ? diff : 0);
                    }
                    return sum;
                  }, 0);
                return { nome, horas: usuarioHoras };
              });

              const grouped = {};
              horariosLoja.forEach(h => {
                const key = `${h.dia_trabalho}_${h.hora_entrada || '-'}_${h.hora_saida || '-'}`;
                if (!grouped[key]) grouped[key] = { dia: h.dia_trabalho, entrada: h.hora_entrada, saida: h.hora_saida, utilizadores: [] };
                grouped[key].utilizadores.push(h.utilizador_nome);
              });

              return (
                <div key={loja} className="mb-6 bg-white shadow rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-xl font-semibold">{loja} — {selectedWeek}</h2>
                    <div className="flex gap-2">
                      {(userRole === 'ADMINISTRADOR' || userRole === 'GERENTE') && (
                        <button
                          onClick={() => router.push(`/editar-horario/${encodeURIComponent(loja)}?semana=${encodeURIComponent(selectedWeek)}`)}
                          className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition"
                        >
                          ✏️ Editar horário da loja
                        </button>
                      )}
                      <button
                        onClick={() => handleDownloadPDF(horariosLoja, loja)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                      >
                        ⬇️ Download PDF
                      </button>
                    </div>
                  </div>

                  {Object.values(grouped).map((g, idx) => (
                    <div key={idx} className="mb-2 flex justify-between border-b border-gray-200 pb-1">
                      <div>{g.dia}</div>
                      <div>{g.entrada}</div>
                      <div>{g.saida}</div>
                      <div>{g.utilizadores.join(', ')}</div>
                    </div>
                  ))}

                  <div className="mt-2 font-semibold">
                    {totalHorasUsuarios.map((u) => (
                      <div key={u.nome}>{u.nome}: {u.horas.toFixed(2)} horas</div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* VISUALIZAÇÃO MEU HORÁRIO */}
        {viewMode === 'meu' && selectedWeek && (
          <div className="mt-6 text-center">
            <h2 className="text-xl font-semibold mb-4">{userName} — {selectedWeek}</h2>
            {meuHorario.map((h) => (
              <div key={h.id} className="mb-2 bg-white shadow rounded-lg p-4 flex justify-between">
                <div>{h.dia_trabalho}</div>
                <div>{h.hora_entrada}</div>
                <div>{h.hora_saida}</div>
                <div>{h.loja}</div>
              </div>
            ))}
            <div className="text-center mt-4 font-semibold">Total horas: {totalHoras.toFixed(2)}</div>
            <button
              onClick={() => handleDownloadPDF(meuHorario, userName)}
              className="mt-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              ⬇️ Download PDF
            </button>
          </div>
        )}

        {!selectedWeek && <p className="text-gray-500">Selecione uma semana para ver o horário.</p>}
      </div>
    </div>
  );
}
