'use client';
import React from 'react';

export default function DownloadPDFButton({ meuHorario, userName, selectedWeek, totalHoras }) {
  const handleDownload = async () => {
    // Importa só no client
    const jsPDFModule = await import('jspdf');
    const autoTableModule = await import('jspdf-autotable');
    const jsPDF = jsPDFModule.default;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`${userName} — ${selectedWeek}`, 105, 20, { align: 'center' });

    const tableData = meuHorario.map((h) => [
      h.dia_trabalho,
      h.hora_entrada,
      h.hora_saida,
      h.loja,
    ]);

    doc.autoTable({
      head: [['Dia', 'Entrada', 'Saída', 'Loja']],
      body: tableData,
      startY: 30,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { halign: 'center' },
    });

    doc.text(
      `Total horas: ${totalHoras.toFixed(2)}`,
      105,
      doc.lastAutoTable.finalY + 10,
      { align: 'center' }
    );

    doc.save(`${userName}_horario.pdf`);
  };

  return (
    <button
      onClick={handleDownload}
      className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition mt-4"
    >
      ⬇️ Download PDF
    </button>
  );
}
