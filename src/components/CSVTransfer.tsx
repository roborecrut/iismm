import React, { useState } from 'react';
import { Upload, Download, CheckCircle, AlertTriangle } from 'lucide-react';

interface CSVTransferProps {
  onImportComplete: () => void;
}

export default function CSVTransfer({ onImportComplete }: CSVTransferProps) {
  const [csvText, setCsvText] = useState('');
  const [importType, setImportType] = useState<'templates' | 'history'>('templates');
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImport = async () => {
    if (!csvText.trim()) {
      setStatus({ success: false, message: 'Пожалуйста, вставьте текст CSV для импорта' });
      return;
    }

    setIsProcessing(true);
    setStatus(null);

    try {
      const response = await fetch('/api/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText, type: importType })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setStatus({ 
          success: true, 
          message: `Импорт завершен! Успешно обработано строк: ${data.importedCount}.` 
        });
        setCsvText('');
        onImportComplete();
      } else {
        throw new Error(data.error || 'Ошибка во время импорта');
      }
    } catch (err: any) {
      setStatus({ success: false, message: err.message || 'Ошибка парсинга или сохранения данных.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center space-x-2">
        <Upload className="text-indigo-600" size={20} />
        <h3 className="text-sm font-bold text-slate-900">Миграция из Google Sheets (CSV)</h3>
      </div>

      <p className="text-xs text-slate-500 font-medium">
        Вставьте содержимое экспортированного CSV файла из Google Sheets для автоматического заполнения шаблонов или истории отправки.
      </p>

      <div className="flex space-x-4">
        <label className="flex items-center space-x-2 text-xs text-slate-700 font-bold cursor-pointer">
          <input 
            type="radio" 
            name="importType" 
            value="templates" 
            checked={importType === 'templates'} 
            onChange={() => setImportType('templates')}
            className="text-indigo-600 focus:ring-indigo-500" 
          />
          <span>Шаблоны дней недели (SAV - БД)</span>
        </label>
        <label className="flex items-center space-x-2 text-xs text-slate-700 font-bold cursor-pointer">
          <input 
            type="radio" 
            name="importType" 
            value="history" 
            checked={importType === 'history'} 
            onChange={() => setImportType('history')}
            className="text-indigo-600 focus:ring-indigo-500" 
          />
          <span>История отправки публикаций</span>
        </label>
      </div>

      <textarea
        rows={4}
        value={csvText}
        onChange={(e) => setCsvText(e.target.value)}
        placeholder={importType === 'templates' 
          ? "Формат: День недели,Категория,Текст шаблона...\nПонедельник,бизнес/финансы,Напиши случайный промт..."
          : "Формат: Дата,Заголовок,Текст промпта,Канал,MessageId,Статус\n01.07.2025,Бизнес-Стратегия,Промпт для бизнеса...,@SAV_AI,172,TRUE"
        }
        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <div className="flex justify-between items-center">
        <button
          onClick={handleImport}
          disabled={isProcessing}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          {isProcessing ? 'Импорт...' : 'Импортировать'}
        </button>

        {status && (
          <div className={`flex items-center space-x-1.5 text-xs ${status.success ? 'text-emerald-400' : 'text-rose-400'}`}>
            {status.success ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
            <span>{status.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
