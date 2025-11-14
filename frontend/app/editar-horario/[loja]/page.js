'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';

export default function EditarHorario() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const loja = params.loja;
  const semana = searchParams.get('semana');

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Faça login primeiro!');
      router.push('/login');
      return;
    }

    fetch(
      `${API_URL}/horarios?loja=${encodeURIComponent(
        loja
      )}&semana=${encodeURIComponent(semana)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        setHorarios(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Erro ao buscar horários:', err);
        setLoading(false);
      });
  }, [loja, semana, API_URL]);

  const handleChange = (index, field, value) => {
    const newHorarios = [...horarios];
    newHorarios[index][field] = value;
    setHorarios(newHorarios);
  };

  const handleSave = async () => {
    if (!confirm('Tem a certeza que deseja guardar as alterações?')) return;

    setSaving(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/horarios/editar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(horarios),
      });

      if (!response.ok) throw new Error('Erro ao guardar alterações.');

      alert('Horários atualizados com sucesso!');
      router.push('/horarios');
    } catch (error) {
      console.error(error);
      alert('Falha ao atualizar horários.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem a certeza que deseja eliminar este horário?')) return;

    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/horarios/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Erro ao eliminar horário.');

      setHorarios((prev) => prev.filter((h) => h.id !== id));
    } catch (error) {
      console.error(error);
      alert('Falha ao eliminar horário.');
    }
  };

  if (loading) return <p>Carregando...</p>;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="flex justify-between items-center bg-blue-700 text-white p-4 rounded-b-lg shadow">
        <h1 className="text-2xl font-semibold">
          ✏️ Editar Horário — {loja.replace(/-/g, ' ')}
        </h1>
        <button
          onClick={() => router.push('/horarios')}
          className="bg-gray-300 text-black px-4 py-2 rounded-md hover:bg-gray-400 transition"
        >
          ⬅️ Voltar
        </button>
      </header>

      {/* Banner */}
      <div
        className="relative overflow-hidden mx-auto mt-6"
        style={{ width: '1998px', height: '697px', maxWidth: '100%' }}
      >
        <img
          src={`${API_URL.replace('/api', '')}/uploads/banner.jpg`}
          alt="Banner fixo"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="mt-6 p-6">
        <h2 className="mt-4 text-lg font-semibold text-center">{semana}</h2>

        <div className="mt-6 bg-white shadow rounded-lg p-4">
          {horarios.map((h, index) => (
            <div
              key={h.id}
              className="grid grid-cols-5 gap-4 border-b border-gray-200 py-2 items-center"
            >
              <div>{h.dia_trabalho}</div>
              <input
                type="time"
                value={h.hora_entrada || ''}
                onChange={(e) =>
                  handleChange(index, 'hora_entrada', e.target.value)
                }
                className="border rounded p-1"
              />
              <input
                type="time"
                value={h.hora_saida || ''}
                onChange={(e) =>
                  handleChange(index, 'hora_saida', e.target.value)
                }
                className="border rounded p-1"
              />
              <div>{h.utilizador_nome}</div>
              <button
                onClick={() => handleDelete(h.id)}
                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
              >
                🗑️ Eliminar
              </button>
            </div>
          ))}
        </div>

        <div className="text-center mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-6 py-2 rounded-lg text-white ${
              saving
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            } transition`}
          >
            💾 Guardar Alterações
          </button>
        </div>
      </div>
    </div>
  );
}
