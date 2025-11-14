'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GerirUtilizadoresPage() {
  const [utilizadores, setUtilizadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const lojasDisponiveis = [
    'Gelataria Costa Nova',
    'Pizzaria São Bernardo',
    'Gelataria São Bernardo',
  ];

  const tipos = ['FUNCIONARIOS', 'GERENTE', 'ADMINISTRADOR'];

  // 🔹 Carregar utilizadores
  const fetchUtilizadores = async () => {
    try {
      const res = await fetch('https://sistema-de-horarios-rimini.onrender.com/api/utilizadores');
      if (!res.ok) throw new Error('Erro ao obter utilizadores');
      const data = await res.json();
      const transformados = data.map(u => ({
        ...u,
        lojas: u.loja ? JSON.parse(u.loja) : [],
        tempId: u.tempId || null,
      }));
      setUtilizadores(transformados);
    } catch (err) {
      console.error('Erro ao carregar utilizadores:', err);
      setUtilizadores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUtilizadores();
  }, []);

  const handleChange = (id, field, value) => {
    setUtilizadores(prev =>
      prev.map(u =>
        u.id === id || u.tempId === id
          ? { ...u, [field]: value }
          : u
      )
    );
  };

  const handleAddUser = () => {
    const tempId = Date.now();
    const novo = { tempId, nome: '', email: '', password: '', lojas: [], tipo_utilizador: '' };
    setUtilizadores(prev => [novo, ...prev]);
  };

  const handleAddLoja = (id, loja) => {
    setUtilizadores(prev =>
      prev.map(u => {
        if (u.id === id || u.tempId === id) {
          const novasLojas = [...u.lojas];
          if (!novasLojas.includes(loja)) novasLojas.push(loja);
          return { ...u, lojas: novasLojas };
        }
        return u;
      })
    );
  };

  const handleRemoveLoja = (id, loja) => {
    setUtilizadores(prev =>
      prev.map(u => {
        if (u.id === id || u.tempId === id) {
          return { ...u, lojas: u.lojas.filter(l => l !== loja) };
        }
        return u;
      })
    );
  };

  const handleDelete = async (id, tipo_utilizador) => {
    if (!id) {
      setUtilizadores(prev => prev.filter(u => u.tempId !== id));
      return;
    }

    if (tipo_utilizador === 'ADMINISTRADOR') {
      const adminCount = utilizadores.filter(u => u.tipo_utilizador === 'ADMINISTRADOR').length;
      if (adminCount <= 1) {
        alert('⚠️ Não é possível eliminar o último administrador.');
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token ausente. Faça login novamente.');

      const res = await fetch(`https://sistema-de-horarios-rimini.onrender.com/api/utilizadores/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        let errorMsg = `Erro ao eliminar utilizador (status ${res.status})`;
        try {
          const text = await res.text();
          if (text) {
            try {
              const errorData = JSON.parse(text);
              if (errorData?.error) errorMsg = errorData.error;
            } catch {
              errorMsg = text;
            }
          }
        } catch {}
        alert(errorMsg);
        return;
      }

      setUtilizadores(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Faça login primeiro!');
      return;
    }

    let algumErro = false;

    for (const u of utilizadores) {
      if (!u.id && (!u.nome || !u.email || !u.password || u.lojas.length === 0 || !u.tipo_utilizador)) {
        alert('Preencha todos os campos para os novos utilizadores.');
        return;
      }

      const url = u.id
        ? `https://sistema-de-horarios-rimini.onrender.com/api/utilizadores/${u.id}`
        : 'https://sistema-de-horarios-rimini.onrender.com/api/utilizadores';

      const method = u.id ? 'PUT' : 'POST';

      const payload = {
        ...u,
        loja: JSON.stringify(u.lojas),
      };

      try {
        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          let errorMsg = `Erro ao guardar utilizador (status ${res.status})`;
          try {
            const text = await res.text();
            if (text) {
              try {
                const errorData = JSON.parse(text);
                if (errorData?.error) errorMsg = errorData.error;
              } catch {
                errorMsg = text;
              }
            }
          } catch {}
          console.error(errorMsg);
          algumErro = true;
        }
      } catch (err) {
        console.error(err);
        algumErro = true;
      }
    }

    await fetchUtilizadores();

    if (algumErro) {
      alert('⚠️ Alguns utilizadores não foram salvos corretamente. Verifique o console.');
    } else {
      alert('✅ Alterações guardadas com sucesso!');
    }
  };

  if (loading) return <p className="text-center mt-10">A carregar utilizadores...</p>;

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <header className="flex justify-between items-center bg-blue-700 text-white p-4 rounded-b-lg shadow">
        <h1 className="text-2xl font-semibold">👥 Gerir Utilizadores</h1>
        <button
          onClick={() => router.push('/horarios')}
          className="bg-gray-500 hover:bg-gray-600 px-3 py-2 rounded-md text-sm"
        >
          Voltar ao Início
        </button>
      </header>

      <div className="relative overflow-hidden mx-auto mt-6" style={{ width: '1998px', height: '697px', maxWidth: '100%' }}>
        <img
          src="https://sistema-de-horarios-rimini.onrender.com/uploads/banner.jpg"
          alt="Banner fixo"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-md mt-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Lista de Utilizadores</h2>
          <button
            onClick={handleAddUser}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            ➕ Novo Utilizador
          </button>
        </div>

        <div className="space-y-4">
          {utilizadores.map(u => {
            const adminCount = utilizadores.filter(x => x.tipo_utilizador === 'ADMINISTRADOR').length;
            const disableDelete = u.tipo_utilizador === 'ADMINISTRADOR' && adminCount <= 1;

            return (
              <div key={u.id || u.tempId} className="flex flex-wrap gap-2 items-center border p-3 rounded hover:bg-gray-50">
                <input
                  type="text"
                  placeholder="Nome"
                  value={u.nome || ''}
                  onChange={e => handleChange(u.id || u.tempId, 'nome', e.target.value)}
                  className="border border-gray-400 rounded p-2 w-1/5"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={u.email || ''}
                  onChange={e => handleChange(u.id || u.tempId, 'email', e.target.value)}
                  className="border border-gray-400 rounded p-2 w-1/5"
                />
                <input
                  type="password"
                  placeholder="Senha"
                  value={u.password || ''}
                  onChange={e => handleChange(u.id || u.tempId, 'password', e.target.value)}
                  className="border border-gray-400 rounded p-2 w-1/5"
                />

                {/* Lojas */}
                <div className="flex gap-2 w-1/5 flex-wrap">
                  {u.lojas.map(loja => (
                    <div key={loja} className="flex items-center bg-gray-200 px-2 rounded">
                      <span>{loja}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLoja(u.id || u.tempId, loja)}
                        className="ml-1 text-red-600 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <select
                    onChange={e => handleAddLoja(u.id || u.tempId, e.target.value)}
                    className="border border-gray-400 rounded p-1"
                    value=""
                  >
                    <option value="">+ Adicionar Loja</option>
                    {lojasDisponiveis.map(loja => (
                      !u.lojas.includes(loja) && <option key={loja} value={loja}>{loja}</option>
                    ))}
                  </select>
                </div>

                <select
                  value={u.tipo_utilizador || ''}
                  onChange={e => handleChange(u.id || u.tempId, 'tipo_utilizador', e.target.value)}
                  className="border border-gray-400 rounded p-2 w-1/5"
                >
                  <option value="">-- Selecionar Tipo --</option>
                  {tipos.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
                </select>

                <button
                  onClick={() => handleDelete(u.id || u.tempId, u.tipo_utilizador)}
                  disabled={disableDelete}
                  className={`px-3 py-1 rounded-md text-white transition ${disableDelete ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  Eliminar
                </button>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-6">
          <button
            onClick={handleSave}
            className="bg-blue-700 text-white px-8 py-3 rounded-lg hover:bg-blue-800 transition text-lg font-medium"
          >
            💾 Guardar Alterações
          </button>
        </div>
      </div>
    </div>
  );
}
