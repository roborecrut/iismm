import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, 
  Table as TableIcon, 
  Plus, 
  Trash2, 
  Edit2, 
  RefreshCw, 
  Check, 
  X, 
  Search, 
  FileSpreadsheet,
  Code,
  User as UserIcon,
  AlertTriangle,
  Download,
  Upload,
  ShieldCheck,
  Archive,
  HardDrive
} from 'lucide-react';

const TABLES = [
  'users',
  'posts',
  'sceneries',
  'transactions',
  'telegram_bot',
  'protalk_settings',
  'prompts',
  'channels',
  'history',
  'logs',
  'cron',
  'file_storage',
  'file_folders',
  'file_folder_relations',
  'chat_messages'
];

interface SqliteTableManagerProps {
  initialTable?: string;
  triggerToast?: (type: 'success' | 'error', message: string) => void;
  key?: any;
}

export default function SqliteTableManager({ 
  initialTable = 'users',
  triggerToast = (type, msg) => console.log(type, msg) 
}: Partial<SqliteTableManagerProps>) {
  const [selectedTable, setSelectedTable] = useState<string>(initialTable);

  useEffect(() => {
    if (initialTable) {
      setSelectedTable(initialTable);
    }
  }, [initialTable]);

  const [tablesInfo, setTablesInfo] = useState<any[]>([]);
  const [tableData, setTableData] = useState<{ columns: string[]; rows: any[] }>({ columns: [], rows: [] });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // SQL Console
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM users');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingRowId, setDeletingRowId] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  // Import JSON States
  const [isImportingJson, setIsImportingJson] = useState(false);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  // CSV Import States
  const [isCsvImportModalOpen, setIsCsvImportModalOpen] = useState(false);
  const [csvImportText, setCsvImportText] = useState('');
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [csvParsedPreview, setCsvParsedPreview] = useState<{ headers: string[]; rows: Record<string, any>[] } | null>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  const handleJsonImportFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportingJson(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await fetch('/api/admin/db/import/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      });
      if (res.ok) {
        triggerToast('success', 'Импорт базы данных из JSON успешно завершён!');
        fetchTablesInfo();
        fetchTableRows(selectedTable);
      } else {
        const err = await res.json();
        triggerToast('error', err.error || 'Ошибка импорта JSON');
      }
    } catch (err: any) {
      triggerToast('error', 'Невалидный JSON файл: ' + (err.message || 'ошибка чтения'));
    } finally {
      setIsImportingJson(false);
      if (e.target) e.target.value = '';
    }
  };

  // Fetch tables info
  const fetchTablesInfo = async () => {
    try {
      const res = await fetch('/api/db/tables');
      if (res.ok) {
        const data = await res.json();
        if (data.tables) setTablesInfo(data.tables);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch rows for selected table
  const fetchTableRows = async (table: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/db/table/${table}`);
      if (res.ok) {
        const data = await res.json();
        setTableData({ columns: data.columns || [], rows: data.rows || [] });
      } else {
        const err = await res.json();
        triggerToast('error', err.error || 'Ошибка загрузки таблицы');
      }
    } catch (e) {
      triggerToast('error', 'Сетевая ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTablesInfo();
    fetchTableRows(selectedTable);
    setSqlQuery(`SELECT * FROM ${selectedTable}`);
  }, [selectedTable]);

  // Execute raw SQL
  const handleExecuteSql = async (queryToRun?: string) => {
    const finalQuery = queryToRun || sqlQuery;
    if (!finalQuery.trim()) return;

    setQueryLoading(true);
    setQueryError(null);
    setQueryResult(null);

    try {
      const res = await fetch('/api/db/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: finalQuery })
      });
      const data = await res.json();
      if (res.ok) {
        setQueryResult(data.result);
        triggerToast('success', 'Запрос успешно выполнен!');
        fetchTablesInfo();
        fetchTableRows(selectedTable);
      } else {
        setQueryError(data.error || 'Ошибка исполнения SQL');
      }
    } catch (e: any) {
      setQueryError('Ошибка сети: ' + e.message);
    } finally {
      setQueryLoading(false);
    }
  };

  // Delete Row modal trigger
  const confirmDeleteRow = (rowId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeletingRowId(rowId);
  };

  const handleExecuteDeleteRow = async () => {
    if (!deletingRowId) return;
    const rowId = deletingRowId;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/db/table/${selectedTable}/${encodeURIComponent(rowId)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        triggerToast('success', `Запись "${rowId}" удалена из таблицы "${selectedTable}"`);
        setDeletingRowId(null);
        fetchTableRows(selectedTable);
        fetchTablesInfo();
      } else {
        const err = await res.json();
        triggerToast('error', err.error || 'Ошибка при удалении строки');
      }
    } catch (e) {
      triggerToast('error', 'Ошибка сети при удалении');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    const initialForm: Record<string, any> = {};
    tableData.columns.forEach(col => {
      if (selectedTable === 'users') {
        if (col === 'role') initialForm[col] = 'user';
        else if (col === 'balance') initialForm[col] = 1000;
        else if (col === 'tariff') initialForm[col] = 'Космос';
        else if (col === 'created_at') initialForm[col] = new Date().toISOString();
        else initialForm[col] = '';
      } else {
        if (col === 'id') initialForm[col] = `${selectedTable.slice(0, 3)}_${Date.now()}`;
        else if (col === 'created_at') initialForm[col] = new Date().toISOString();
        else initialForm[col] = '';
      }
    });
    setFormData(initialForm);
    setIsAddModalOpen(true);
  };

  // Submit Add Row
  const handleSaveAddRow = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...formData };
      if (selectedTable === 'users') {
        const tgIdStr = payload.telegram_id ? String(payload.telegram_id).trim() : (payload.id ? String(payload.id).trim() : '');
        if (tgIdStr) {
          payload.id = tgIdStr;
          const parsedTgId = parseInt(tgIdStr, 10);
          if (!isNaN(parsedTgId)) {
            payload.telegram_id = parsedTgId;
          }
        }
      }
      const res = await fetch(`/api/db/table/${selectedTable}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        triggerToast('success', `Запись добавлена в таблицу ${selectedTable}`);
        setIsAddModalOpen(false);
        fetchTableRows(selectedTable);
        fetchTablesInfo();
      } else {
        const err = await res.json();
        triggerToast('error', err.error || 'Ошибка добавления строки');
      }
    } catch (e) {
      triggerToast('error', 'Ошибка сети при сохранении');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal on row or field click
  const handleOpenEditModal = (row: any) => {
    setEditingRow(row);
    setFormData({ ...row });
    setIsEditModalOpen(true);
  };

  // Submit Edit Row
  const handleSaveEditRow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRow || !editingRow.id) return;
    setSubmitting(true);
    try {
      const payload = { ...formData };
      if (selectedTable === 'users') {
        const tgIdStr = payload.telegram_id ? String(payload.telegram_id).trim() : (payload.id ? String(payload.id).trim() : '');
        if (tgIdStr) {
          payload.id = tgIdStr;
          const parsedTgId = parseInt(tgIdStr, 10);
          if (!isNaN(parsedTgId)) {
            payload.telegram_id = parsedTgId;
          }
        }
      }
      const res = await fetch(`/api/db/table/${selectedTable}/${encodeURIComponent(editingRow.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        triggerToast('success', `Запись ${editingRow.id} обновлена!`);
        setIsEditModalOpen(false);
        fetchTableRows(selectedTable);
      } else {
        const err = await res.json();
        triggerToast('error', err.error || 'Ошибка обновления строки');
      }
    } catch (e) {
      triggerToast('error', 'Ошибка сети при редактировании');
    } finally {
      setSubmitting(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!tableData.rows || tableData.rows.length === 0) return;
    let csv = '';
    const headers = tableData.columns;
    csv += headers.join(',') + '\n';
    tableData.rows.forEach(r => {
      csv += headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',') + '\n';
    });
    const encoded = encodeURI('data:text/csv;charset=utf-8,' + csv);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `${selectedTable}_sqlite_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse CSV text helper
  const parseCsvData = (text: string) => {
    if (!text || !text.trim()) {
      setCsvParsedPreview(null);
      return;
    }
    try {
      const lines = text.trim().split(/\r?\n/);
      if (lines.length === 0) {
        setCsvParsedPreview(null);
        return;
      }
      
      // Determine delimiter (comma, semicolon, tab)
      const firstLine = lines[0];
      let delimiter = ',';
      if ((firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) {
        delimiter = ';';
      } else if ((firstLine.match(/\t/g) || []).length > (firstLine.match(/,/g) || []).length) {
        delimiter = '\t';
      }

      const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
      const parsedRows: Record<string, any>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = line.split(delimiter).map(v => {
          let val = v.trim();
          if (val.startsWith('"') && val.endsWith('"')) {
            val = val.slice(1, -1).replace(/""/g, '"');
          }
          return val;
        });

        const rowObj: Record<string, any> = {};
        headers.forEach((h, idx) => {
          if (h) rowObj[h] = values[idx] !== undefined ? values[idx] : '';
        });
        parsedRows.push(rowObj);
      }

      setCsvParsedPreview({ headers, rows: parsedRows });
    } catch (e) {
      console.error('Error parsing CSV preview:', e);
      setCsvParsedPreview(null);
    }
  };

  // Handle CSV file selection
  const handleCsvFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setCsvImportText(text);
      parseCsvData(text);
      setIsCsvImportModalOpen(true);
    } catch (err: any) {
      triggerToast('error', 'Ошибка чтения CSV файла: ' + err.message);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Submit CSV Import to Server
  const handleExecuteCsvImport = async () => {
    if (!csvParsedPreview || csvParsedPreview.rows.length === 0) {
      triggerToast('error', 'Нет валидных строк для импорта');
      return;
    }

    setIsImportingCsv(true);
    try {
      const res = await fetch(`/api/db/table/${selectedTable}/import-csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: csvParsedPreview.rows
        })
      });

      if (res.ok) {
        const data = await res.json();
        triggerToast('success', `Успешно импортировано ${data.importedCount || csvParsedPreview.rows.length} строк в таблицу ${selectedTable}!`);
        setIsCsvImportModalOpen(false);
        setCsvImportText('');
        setCsvParsedPreview(null);
        fetchTablesInfo();
        fetchTableRows(selectedTable);
      } else {
        const err = await res.json();
        triggerToast('error', err.error || 'Ошибка при импорте CSV');
      }
    } catch (err: any) {
      triggerToast('error', 'Сетевая ошибка при импорте CSV: ' + err.message);
    } finally {
      setIsImportingCsv(false);
    }
  };

  const filteredRows = tableData.rows.filter(row => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return Object.values(row).some(v => String(v ?? '').toLowerCase().includes(term));
  });

  const photoUrlValue = formData.photo_url || formData.photoUrl || formData.photo || '';

  return (
    <div className="space-y-6">
      {/* Hidden File Input for JSON Import */}
      <input
        type="file"
        ref={jsonFileInputRef}
        onChange={handleJsonImportFileSelect}
        accept=".json"
        className="hidden"
      />

      {/* Hidden File Input for CSV Import */}
      <input
        type="file"
        ref={csvFileInputRef}
        onChange={handleCsvFileSelect}
        accept=".csv,text/csv"
        className="hidden"
      />

      {/* Database Export & Import Management Block */}
      <div className="bg-gradient-to-r from-sky-100/90 via-pink-100/90 via-orange-100/90 via-pink-100/90 to-sky-100/90 border border-pink-300 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 rounded-2xl text-white shadow-sm">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <span>Резервное копирование и экспорт базы данных</span>
                <span className="text-sm bg-white/90 text-pink-800 border border-pink-300 px-2.5 py-0.5 rounded-full font-bold">
                  СУБД
                </span>
              </h3>
              <p className="text-sm text-slate-700 mt-0.5">Экспорт таблиц в JSON/SQLite и прямой импорт данных</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/api/admin/db/export/json"
              download
              className="bg-white/90 hover:bg-white text-slate-800 border border-pink-300 text-sm font-bold px-3.5 py-2 rounded-2xl flex items-center space-x-1.5 transition-all shadow-xs"
            >
              <Download size={15} className="text-pink-500" />
              <span>Скачать JSON</span>
            </a>

            <a
              href="/api/admin/db/export/sqlite"
              download
              className="bg-white/90 hover:bg-white text-slate-800 border border-pink-300 text-sm font-bold px-3.5 py-2 rounded-2xl flex items-center space-x-1.5 transition-all shadow-xs"
            >
              <HardDrive size={15} className="text-sky-500" />
              <span>Скачать app.sqlite</span>
            </a>

            <button
              onClick={() => jsonFileInputRef.current?.click()}
              disabled={isImportingJson}
              className="bg-white/90 hover:bg-white text-slate-800 border border-pink-300 text-sm font-bold px-3.5 py-2 rounded-2xl flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Upload size={15} className="text-orange-500" />
              <span>{isImportingJson ? 'Импорт...' : 'Импорт JSON'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Banner: SQLite Tables Selector */}
      <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 border border-pink-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-pink-200/60 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 rounded-2xl text-white shadow-sm">
              <Database size={22} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <span>Менеджер Таблиц СУБД SQLite</span>
                <span className="text-[10px] bg-white/90 text-sky-800 border border-sky-300 px-2.5 py-0.5 rounded-full font-mono font-bold">
                  {TABLES.length} Таблиц
                </span>
              </h3>
              <p className="text-xs text-slate-700 mt-0.5">Визуальное редактирование, добавление и удаление записей базы данных</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => { fetchTablesInfo(); fetchTableRows(selectedTable); }}
              className="bg-white/80 hover:bg-white text-slate-800 border border-pink-200 text-xs font-bold px-3.5 py-2 rounded-2xl flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-pink-500' : 'text-sky-500'} />
              <span>Обновить</span>
            </button>
            <button
              onClick={handleOpenAddModal}
              className="bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white text-xs font-bold px-4 py-2 rounded-2xl flex items-center space-x-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>Создать строку</span>
            </button>
          </div>
        </div>

        {/* 12 Tables Grid Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-1">
          {TABLES.map(tableName => {
            const info = tablesInfo.find(t => t.tableName === tableName);
            const isSelected = selectedTable === tableName;
            return (
              <button
                key={tableName}
                onClick={() => setSelectedTable(tableName)}
                className={`flex flex-col p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-sky-200 via-pink-200 to-orange-200 border-pink-400 text-slate-900 shadow-sm font-bold'
                    : 'bg-white/70 border-pink-100/80 text-slate-700 hover:bg-white/95 hover:border-pink-300'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="font-mono text-xs font-extrabold truncate">{tableName}</span>
                  <TableIcon size={12} className={isSelected ? 'text-pink-600' : 'text-slate-400'} />
                </div>
                <span className="text-[10px] font-mono text-slate-600 mt-1">
                  Записей: <strong className="text-slate-900">{info ? info.rowCount : '...'}</strong>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Table Viewer Card */}
      <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 border border-pink-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-pink-200/60 pb-4">
          <div className="flex items-center space-x-2">
            <TableIcon className="text-pink-600" size={18} />
            <span className="text-sm font-black text-slate-900 uppercase font-mono">Таблица: {selectedTable}</span>
            <span className="text-xs text-slate-600 font-mono font-bold">({filteredRows.length} из {tableData.rows.length} строк)</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-2.5 text-pink-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Поиск по столбцам..."
                className="w-full bg-white/90 border border-pink-200 rounded-2xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-pink-400"
              />
            </div>

            {/* CSV Import */}
            <button
              onClick={() => {
                setCsvImportText('');
                setCsvParsedPreview(null);
                setIsCsvImportModalOpen(true);
              }}
              className="bg-white/90 hover:bg-white border border-pink-200 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-2xl flex items-center space-x-1.5 shrink-0 transition-all cursor-pointer shadow-xs"
            >
              <Upload size={13} className="text-pink-500" />
              <span>CSV Импорт</span>
            </button>

            {/* CSV Export */}
            <button
              onClick={handleExportCSV}
              disabled={tableData.rows.length === 0}
              className="bg-white/90 hover:bg-white border border-pink-200 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-2xl flex items-center space-x-1.5 shrink-0 transition-all disabled:opacity-40 cursor-pointer shadow-xs"
            >
              <FileSpreadsheet size={13} className="text-orange-500" />
              <span>CSV Экспорт</span>
            </button>
          </div>
        </div>

        {/* Table Data Grid */}
        <div className="bg-white/80 border border-pink-200/80 rounded-2xl overflow-x-auto overflow-y-auto max-h-[550px] w-full relative">
          {loading ? (
            <div className="py-12 text-center text-slate-600 text-xs font-bold flex items-center justify-center space-x-2">
              <RefreshCw className="animate-spin text-pink-500" size={16} />
              <span>Загрузка данных таблицы {selectedTable}...</span>
            </div>
          ) : filteredRows.length > 0 ? (
            <div className="min-w-full inline-block align-middle">
              <table className="min-w-full text-left text-[11px] border-collapse font-mono whitespace-nowrap">
                <thead className="bg-gradient-to-r from-sky-100 via-pink-100 to-orange-100 sticky top-0 border-b border-pink-200 text-slate-800 uppercase font-black z-10">
                  <tr>
                    <th className="p-3 w-20 text-center border-b border-pink-200 bg-sky-100/90 sticky left-0 z-20">Действия</th>
                    {tableData.columns.map((col, i) => (
                      <th key={i} className="p-3 whitespace-nowrap border-b border-pink-200 text-slate-900 min-w-[120px]">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-100/60 text-slate-800">
                  {filteredRows.map((row, idx) => (
                    <tr 
                      key={row.id || idx} 
                      onClick={() => handleOpenEditModal(row)}
                      className="hover:bg-pink-50/80 transition-colors bg-white/90 cursor-pointer"
                      title="Кликните на любую ячейку, чтобы открыть редактор записи"
                    >
                      <td className="p-3 text-center whitespace-nowrap flex items-center justify-center space-x-1 bg-white/95 sticky left-0 z-10 border-r border-pink-100">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleOpenEditModal(row); }}
                          className="p-1 hover:bg-sky-100 rounded-lg text-sky-600 transition-all cursor-pointer"
                          title="Редактировать строку"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => confirmDeleteRow(row.id, e)}
                          className="p-1 hover:bg-pink-100 rounded-lg text-orange-600 transition-all cursor-pointer"
                          title="Удалить строку"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                      {tableData.columns.map((col, cIdx) => {
                        const val = row[col];
                        const isPhoto = (col === 'photo_url' || col === 'photoUrl' || col === 'photo' || col === 'avatar_url') && val && String(val).startsWith('http');
                        return (
                          <td key={cIdx} className="p-3 max-w-sm truncate whitespace-nowrap" title={String(val ?? '')}>
                            {val === null || val === undefined ? (
                              <span className="text-slate-400 italic">null</span>
                            ) : isPhoto ? (
                              <div className="flex items-center gap-2">
                                <img src={String(val)} alt="User" className="w-7 h-7 rounded-full object-cover border border-pink-300 shrink-0" />
                                <span className="text-[10px] text-slate-600 truncate">{String(val)}</span>
                              </div>
                            ) : typeof val === 'object' ? (
                              <span className="text-purple-700 font-semibold">{JSON.stringify(val)}</span>
                            ) : (
                              String(val)
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-600 text-xs font-mono font-bold">
              В таблице «{selectedTable}» нет доступных записей (0 строк).
            </div>
          )}
        </div>
      </div>

      {/* SQL Raw Terminal Console */}
      <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 border border-pink-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-pink-200/60 pb-3">
          <div className="flex items-center space-x-2">
            <Code className="text-pink-600" size={18} />
            <span className="text-xs font-mono font-extrabold text-slate-900 uppercase tracking-wider">SQL Консоль Прямого Доступа</span>
          </div>
          <span className="text-[10px] text-slate-600 font-mono font-bold">SELECT, INSERT, UPDATE, DELETE</span>
        </div>

        <div className="relative">
          <textarea
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
            rows={3}
            className="w-full bg-white/90 border border-pink-200 rounded-2xl p-3.5 font-mono text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-pink-400"
            placeholder="SELECT * FROM users WHERE role = 'admin'"
          />
          <button
            onClick={() => handleExecuteSql()}
            disabled={queryLoading}
            className="absolute bottom-3.5 right-3.5 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white font-bold text-xs px-4 py-1.5 rounded-xl flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            {queryLoading ? <RefreshCw className="animate-spin" size={12} /> : <Code size={12} />}
            <span>Выполнить SQL</span>
          </button>
        </div>

        {queryError && (
          <div className="bg-orange-50 border border-orange-200 p-3 rounded-2xl font-mono text-xs text-orange-800 flex items-start space-x-2">
            <X size={14} className="shrink-0 mt-0.5 text-orange-600" />
            <span>{queryError}</span>
          </div>
        )}

        {queryResult && (
          <div className="space-y-2 bg-white/80 border border-pink-200 p-4 rounded-2xl font-mono text-xs">
            <div className="flex justify-between items-center text-slate-900 font-bold mb-2">
              <span className="flex items-center space-x-1">
                <Check size={14} className="text-pink-500" />
                <span>Результат выполнения SQL запроса:</span>
              </span>
            </div>
            {queryResult.rows ? (
              <div className="overflow-x-auto max-h-60 bg-white border border-pink-200 rounded-xl">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead className="bg-sky-50 text-slate-800 uppercase font-bold">
                    <tr>
                      {queryResult.columns?.map((col: string, idx: number) => (
                        <th key={idx} className="p-2 border-b border-pink-200">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult.rows.map((r: any, idx: number) => (
                      <tr key={idx} className="border-b border-pink-100 hover:bg-pink-50">
                        {queryResult.columns?.map((col: string, cIdx: number) => (
                          <td key={cIdx} className="p-2 max-w-xs truncate text-slate-800">{String(r[col] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-700">{JSON.stringify(queryResult)}</p>
            )}
          </div>
        )}
      </div>

      {/* Modal: ADD ROW */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-sky-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 border border-pink-300 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-4 p-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-pink-200/80 pb-3 shrink-0">
              <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                <Plus size={18} className="text-pink-600" />
                <span>Добавить новую строку в «{selectedTable}»</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-500 hover:text-slate-800 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAddRow} className="space-y-4 overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tableData.columns.map(col => (
                  <div key={col}>
                    <label className="block text-[10px] font-mono font-black text-slate-700 uppercase mb-1">
                      {col}
                    </label>
                    <input
                      type="text"
                      value={formData[col] ?? ''}
                      onChange={(e) => setFormData({ ...formData, [col]: e.target.value })}
                      className="w-full bg-white/90 border border-pink-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-pink-400"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-pink-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="bg-white/80 hover:bg-white text-slate-800 text-xs font-bold px-4 py-2 rounded-2xl border border-pink-200 transition-all cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white text-xs font-black px-5 py-2 rounded-2xl flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
                >
                  {submitting ? <RefreshCw className="animate-spin" size={13} /> : <Check size={13} />}
                  <span>Сохранить строку</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: EDIT ROW */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-sky-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 border border-pink-300 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-4 p-4 sm:p-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-pink-200/80 pb-3 shrink-0 gap-2">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 overflow-hidden">
                {photoUrlValue ? (
                  <img 
                    src={photoUrlValue} 
                    alt="User Photo" 
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-pink-400 shadow-sm shrink-0" 
                  />
                ) : (
                  <div className="p-2 sm:p-2.5 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white rounded-2xl shadow-sm shrink-0">
                    <UserIcon size={18} />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                    {selectedTable === 'users' ? `Редактирование пользователя` : `Редактор записи #${editingRow?.id}`}
                  </h3>
                  <p className="text-[10px] font-bold text-pink-700 truncate hidden sm:block">
                    {selectedTable === 'users' ? `ID: ${editingRow?.id || ''} • TG: ${editingRow?.telegram_id || editingRow?.username || '—'}` : `Таблица «${selectedTable}»`}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)} 
                className="text-slate-600 hover:text-slate-900 p-2 bg-white/80 hover:bg-white border border-pink-200 rounded-full cursor-pointer shrink-0 shadow-xs flex items-center justify-center min-w-[36px] min-h-[36px]"
                title="Закрыть"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditRow} className="space-y-4 overflow-y-auto pr-1 flex-1">
              {/* Photo preview block if present */}
              {photoUrlValue && (
                <div className="p-3 bg-white/80 rounded-2xl border border-pink-200 flex items-center space-x-4">
                  <img 
                    src={photoUrlValue} 
                    alt="User Avatar" 
                    className="w-14 h-14 rounded-full object-cover border-2 border-pink-400 shadow-md shrink-0" 
                  />
                  <div className="space-y-1 text-xs min-w-0">
                    <div className="font-bold text-slate-800">Аватар / Фотография:</div>
                    <div className="text-[10px] text-slate-500 font-mono break-all line-clamp-2">{photoUrlValue}</div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tableData.columns.map(col => {
                  const isPhotoCol = col === 'photo_url' || col === 'photoUrl' || col === 'photo' || col === 'avatar_url';
                  const isTariff = col === 'tariff';
                  const isRole = col === 'role';
                  const isStatus = col === 'status';

                  return (
                    <div key={col} className={isPhotoCol ? 'sm:col-span-2' : ''}>
                      <label className="block text-[10px] font-mono font-black text-slate-700 uppercase mb-1">
                        {col} {col === 'id' && '(PRIMARY KEY)'}
                      </label>
                      {isTariff ? (
                        <select
                          value={formData[col] ?? 'Старт'}
                          onChange={(e) => setFormData({ ...formData, [col]: e.target.value })}
                          className="w-full bg-white/90 border border-pink-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-pink-400 cursor-pointer"
                        >
                          <option value="Старт">🚀 Старт</option>
                          <option value="Про">⚡ Про</option>
                          <option value="Бизнес">💼 Бизнес</option>
                          <option value="Космос">🌌 Космос</option>
                        </select>
                      ) : isRole ? (
                        <select
                          value={formData[col] ?? 'user'}
                          onChange={(e) => setFormData({ ...formData, [col]: e.target.value })}
                          className="w-full bg-white/90 border border-pink-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-pink-400 cursor-pointer"
                        >
                          <option value="user">User</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : isStatus ? (
                        <select
                          value={formData[col] ?? 'Активный'}
                          onChange={(e) => setFormData({ ...formData, [col]: e.target.value })}
                          className="w-full bg-white/90 border border-pink-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-pink-400 cursor-pointer"
                        >
                          <option value="Активный">🟢 Активный</option>
                          <option value="Заблокирован">🔴 Заблокирован</option>
                          <option value="Ожидает">🟡 Ожидает</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          disabled={col === 'id'}
                          value={formData[col] ?? ''}
                          onChange={(e) => setFormData({ ...formData, [col]: e.target.value })}
                          className={`w-full bg-white/90 border border-pink-200 rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none ${
                            col === 'id' ? 'text-slate-400 cursor-not-allowed bg-slate-100/80' : 'text-slate-900 focus:border-pink-400'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-pink-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="bg-white/80 hover:bg-white text-slate-800 text-xs font-bold px-4 py-2 rounded-2xl border border-pink-200 transition-all cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white text-xs font-black px-5 py-2 rounded-2xl flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
                >
                  {submitting ? <RefreshCw className="animate-spin" size={13} /> : <Check size={13} />}
                  <span>Сохранить изменения</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: CSV IMPORT */}
      {isCsvImportModalOpen && (
        <div className="fixed inset-0 bg-sky-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 border border-pink-300 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-4 p-6 text-left max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-pink-200/80 pb-3 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/90 rounded-xl border border-pink-200 text-pink-600 shadow-xs">
                  <FileSpreadsheet size={20} className="text-orange-500" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Импорт данных из CSV</h3>
                  <p className="text-xs text-slate-600">
                    Целевая таблица: <span className="font-mono font-bold text-pink-700">{selectedTable}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCsvImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-white/80 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1">
              {/* File Upload Button & Drag Area */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/80 border border-pink-200 rounded-2xl p-3.5">
                <div className="flex items-center space-x-3">
                  <Upload size={18} className="text-pink-500 shrink-0" />
                  <div className="text-xs text-slate-700">
                    <p className="font-bold text-slate-900">Загрузить готовый .CSV файл</p>
                    <p className="text-[11px] text-slate-500">Автоматически определит разделители и заголовки</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => csvFileInputRef.current?.click()}
                  className="bg-white hover:bg-pink-50 border border-pink-300 text-slate-800 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs transition-all shrink-0 cursor-pointer"
                >
                  <Upload size={13} className="text-orange-500" />
                  <span>Выбрать .CSV файл</span>
                </button>
              </div>

              {/* CSV Text Input Area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Или вставьте CSV текст напрямую (первая строка — заголовки столбцов):
                </label>
                <textarea
                  rows={5}
                  value={csvImportText}
                  onChange={(e) => {
                    setCsvImportText(e.target.value);
                    parseCsvData(e.target.value);
                  }}
                  placeholder={`id,name,role,status\nuser_1,Иван Иванов,admin,active\nuser_2,Петр Смирнов,editor,active`}
                  className="w-full bg-white/95 border border-pink-200 rounded-xl p-3 text-xs font-mono text-slate-800 focus:outline-none focus:border-pink-400 placeholder-slate-400"
                />
              </div>

              {/* Parsed Preview */}
              {csvParsedPreview && (
                <div className="bg-white/90 border border-pink-200 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-900">
                      Распознано строк: <strong className="text-pink-600">{csvParsedPreview.rows.length}</strong>
                    </span>
                    <span className="text-[11px] font-mono text-slate-600">
                      Столбцов: {csvParsedPreview.headers.length} ({csvParsedPreview.headers.join(', ')})
                    </span>
                  </div>

                  {csvParsedPreview.rows.length > 0 && (
                    <div className="border border-pink-100 rounded-xl overflow-x-auto max-h-[140px] text-[11px] font-mono bg-white">
                      <table className="min-w-full divide-y divide-pink-100">
                        <thead className="bg-pink-50/70 text-slate-800 font-bold sticky top-0">
                          <tr>
                            {csvParsedPreview.headers.map((h, i) => (
                              <th key={i} className="p-2 text-left whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {csvParsedPreview.rows.slice(0, 3).map((r, rIdx) => (
                            <tr key={rIdx}>
                              {csvParsedPreview.headers.map((h, cIdx) => (
                                <td key={cIdx} className="p-2 whitespace-nowrap">{String(r[h] ?? '')}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {csvParsedPreview.rows.length > 3 && (
                    <p className="text-[10px] text-slate-500 text-right font-mono">
                      ...и ещё {csvParsedPreview.rows.length - 3} строк
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-2 pt-3 border-t border-pink-200 shrink-0">
              <button
                type="button"
                onClick={() => setIsCsvImportModalOpen(false)}
                className="bg-white/80 hover:bg-white text-slate-800 text-xs font-bold px-4 py-2 rounded-2xl border border-pink-200 transition-all cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleExecuteCsvImport}
                disabled={isImportingCsv || !csvParsedPreview || csvParsedPreview.rows.length === 0}
                className="bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white text-xs font-black px-5 py-2 rounded-2xl flex items-center space-x-1.5 transition-all shadow-md disabled:opacity-40 cursor-pointer"
              >
                {isImportingCsv ? <RefreshCw className="animate-spin" size={13} /> : <Check size={13} />}
                <span>Импортировать {csvParsedPreview?.rows.length || 0} строк</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: DELETE CONFIRMATION */}
      {deletingRowId && (
        <div className="fixed inset-0 bg-sky-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 border border-pink-300 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex items-center space-x-3 text-pink-600">
              <div className="p-3 bg-white/90 rounded-2xl border border-pink-200">
                <Trash2 size={24} className="text-orange-500" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Подтверждение удаления</h3>
                <p className="text-xs text-slate-600">Таблица: <span className="font-mono font-bold text-slate-800">{selectedTable}</span></p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed font-semibold bg-white/80 p-3.5 rounded-2xl border border-pink-200">
              Вы действительно хотите безвозвратно удалить запись <strong className="font-mono text-pink-700">"{deletingRowId}"</strong> из базы данных SQLite?
            </p>

            <div className="flex justify-end space-x-2 pt-2 border-t border-pink-200">
              <button
                type="button"
                onClick={() => setDeletingRowId(null)}
                className="bg-white/80 hover:bg-white text-slate-800 text-xs font-bold px-4 py-2 rounded-2xl border border-pink-200 transition-all cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleExecuteDeleteRow}
                disabled={submitting}
                className="bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white text-xs font-black px-5 py-2 rounded-2xl flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
              >
                {submitting ? <RefreshCw className="animate-spin" size={13} /> : <Trash2 size={13} />}
                <span>Да, удалить</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
