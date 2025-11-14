'use client';
import { useState, useEffect } from 'react';

// Função auxiliar para gerar semanas
function getWeekLabel(weekOffset = 0) {
  const now = new Date();
  const monday = new Date(now.setDate(now.getDate() - now.getDay() + 1 + weekOffset * 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const format = (d) =>
    d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return `Semana de ${format(monday)} - ${format(sunday)}`;
}

export default function NovoHorarioPage() {
  const [selectedLoja, setSelectedLoja] = useState('');
  const [selectedSemana, setSelectedSemana] = useState('');
  const [dias] = useState(['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo']);
  const [horarios, setHorarios] = useState({});
  const [pessoas, setPessoas] = useState([]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // Buscar utilizadores
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`${apiUrl}/utilizadores`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        const usuariosTransformados = data.map(u => ({
          ...u,
          lojas: u.loja ? JSON.parse(u.loja) : [],
        }));
        setPessoas(usuariosTransformados);
      })
      .catch(err => console.error('Erro ao buscar utilizadores:', err));
  }, [apiUrl]);

  const pessoasFiltradas = selectedLoja
    ? pessoas.filter(p => Array.isArray(p.lojas) && p.lojas.includes(selectedLoja))
    : pessoas;

  const handleHorarioChange = (dia, index, field, value) => {
    const newHorarios = { ...horarios };
    newHorarios[dia][index][field] = value;
    setHorarios(newHorarios);
  };

  const addHorario = (dia) => {
    setHorarios(prev => ({
      ...prev,
      [dia]: [...(prev[dia] || []), { entrada: '', saida: '', pessoas: [] }]
    }));
  };

  const removeHorario = (dia, index) => {
    if (!window.confirm('Tem certeza que deseja eliminar este horário?')) return;
    setHorarios(prev => {
      const newDia = [...prev[dia]];
      newDia.splice(index, 1);
      return { ...prev, [dia]: newDia };
    });
  };

  const toggleDia = (dia, ativo) => {
    setHorarios(prev => ({
      ...prev,
      [dia]: ativo ? [{ entrada: '', saida: '', pessoas: [] }] : []
    }));
  };

  const handleAddPessoa = (dia, index, pessoaNome) => {
    if (!pessoaNome) return;
    setHorarios(prev => {
      const newDia = [...prev[dia]];
      if (!newDia[index].pessoas.includes(pessoaNome)) {
        newDia[index].pessoas.push(pessoaNome);
      }
      return { ...prev, [dia]: newDia };
    });
  };

  const handleRemovePessoa = (dia, index, pessoaNome) => {
    setHorarios(prev => {
      const newDia = [...prev[dia]];
      newDia[index].pessoas = newDia[index].pessoas.filter(p => p !== pessoaNome);
      return { ...prev, [dia]: newDia };
    });
  };

  // Salvar horários
  const handleSave = async () => {
    if (!selectedLoja || !selectedSemana) {
      return alert('Selecione a loja e a semana antes de salvar!');
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Faça login primeiro!');
      window.location.href = '/login';
      return;
    }

    const payload = [];

    for (const dia of Object.keys(horarios)) {
      for (const linha of horarios[dia]) {
        if (linha.pessoas.length === 0) continue;

        linha.pessoas.forEach(pessoaNome => {
          const pessoaObj = pessoas.find(p => p.nome === pessoaNome);
          if (!pessoaObj) return;

          payload.push({
            loja: selectedLoja,
            dia_trabalho: dia,
            semana: selectedSemana,
            hora_entrada: linha.entrada || null,
            hora_saida: linha.saida || null,
            utilizador_id: pessoaObj.id,
            utilizador_nome: pessoaNome,
          });
        });
      }
    }

    if (payload.length === 0) {
      return alert('Nenhum horário válido para salvar!');
    }

    try {
      for (const h of payload) {
        await fetch(`${apiUrl}/horarios`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(h),
        });
      }

      alert('Horários guardados com sucesso!');
      setHorarios({});
      setSelectedLoja('');
      setSelectedSemana('');
    } catch (err) {
      console.error('Erro ao salvar horário:', err);
      alert('Erro de conexão com o servidor');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <header className="flex justify-between items-center bg-blue-700 text-white p-4 rounded-b-lg shadow">
        <h1 className="text-2xl font-semibold">➕ Fazer Novo Horário</h1>
      </header>

      <div className="max-w-6xl mx-auto mt-4 flex justify-end">
        <button
          onClick={() => (window.location.href = '/horarios')}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md shadow"
        >
          🔙 Voltar ao início
        </button>
      </div>

      <div className="relative overflow-hidden mx-auto mt-6" style={{ width:'1998px', height:'697px', maxWidth:'100%' }}>
        <img
          src={`${apiUrl.replace('/api','')}/uploads/banner.jpg`}
          alt="Banner fixo"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-md mt-6">
        {/* Selects */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block font-medium mb-2">Loja</label>
            <select
              value={selectedLoja}
              onChange={(e) => setSelectedLoja(e.target.value)}
              className="border border-gray-400 rounded p-2 w-full"
            >
              <option value="">-- Selecionar Loja --</option>
              <option>Gelataria Costa Nova</option>
              <option>Pizzaria São Bernardo</option>
              <option>Gelataria São Bernardo</option>
            </select>
          </div>

          <div>
            <label className="block font-medium mb-2">Semana</label>
            <select
              value={selectedSemana}
              onChange={(e) => setSelectedSemana(e.target.value)}
              className="border border-gray-400 rounded p-2 w-full"
            >
              <option value="">-- Selecionar Semana --</option>
              <option>{getWeekLabel(0)}</option>
              <option>{getWeekLabel(1)}</option>
              <option>{getWeekLabel(2)}</option>
            </select>
          </div>
        </div>

        {/* Dias */}
        {dias.map((dia) => {
          const ativo = (horarios[dia]?.length || 0) > 0;
          return (
            <div key={dia} className="border-t border-gray-300 pt-4 mt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">{dia}</h3>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={ativo}
                    onChange={(e) => toggleDia(dia, e.target.checked)}
                    className="mr-2"
                  />
                  Dia ativo
                </label>
              </div>

              {ativo &&
                horarios[dia].map((linha, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 items-end">
                    <div>
                      <label className="block font-medium mb-1">Hora de Entrada</label>
                      <input
                        type="time"
                        value={linha.entrada}
                        onChange={(e) => handleHorarioChange(dia, index, 'entrada', e.target.value)}
                        className="border border-gray-400 rounded p-2 w-full"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-medium mb-1">Hora de Saída</label>
                      <input
                        type="time"
                        value={linha.saida}
                        onChange={(e) => handleHorarioChange(dia, index, 'saida', e.target.value)}
                        className="border border-gray-400 rounded p-2 w-full"
                        required
                      />
                    </div>

                    <div className="flex gap-2 flex-wrap items-center border p-2 rounded">
                      {linha.pessoas.map(p => (
                        <div key={p} className="flex items-center bg-gray-200 px-2 rounded">
                          <span>{p}</span>
                          <button
                            type="button"
                            onClick={() => handleRemovePessoa(dia, index, p)}
                            className="ml-1 text-red-600 font-bold"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <select
                        onChange={(e) => handleAddPessoa(dia, index, e.target.value)}
                        value=""
                        className="border border-gray-400 rounded p-1"
                      >
                        <option value="">+ Adicionar Pessoa</option>
                        {pessoasFiltradas
                          .filter(p => !linha.pessoas.includes(p.nome))
                          .map(p => (
                            <option key={p.id} value={p.nome}>{p.nome}</option>
                          ))}
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => addHorario(dia)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                      >
                        ➕
                      </button>

                      <button
                        type="button"
                        onClick={() => removeHorario(dia, index)}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          );
        })}

        <div className="mt-6 text-center">
          <button
            onClick={handleSave}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
          >
            💾 Guardar Horário
          </button>
        </div>
      </div>
    </div>
  );
}
