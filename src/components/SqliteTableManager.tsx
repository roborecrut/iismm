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
  HardDrive,
  Calculator,
  CreditCard,
  History,
  Info,
  Sparkles,
  UserCheck,
  Users
} from 'lucide-react';

const TABLES = [
  'users',
  'tarifs',
  'transactions',
  'notifications',
  'posts',
  'teams',
  'team_reports',
  'sceneries',
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

const BALANCE_COLUMNS = [
  'balance',
  'balance_free',
  'balance_pay',
  'balance_start',
  'balance_ref',
  'balance_tarif',
  'balance_admin',
  'balance_cost',
  'balance_time'
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

  // Admin Balance Adjust Calculator Modal States
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [balanceUser, setBalanceUser] = useState<any>(null);
  const [balanceAdjustAmount, setBalanceAdjustAmount] = useState<string>('100');
  const [balanceAdjustType, setBalanceAdjustType] = useState<string>('admin');
  const [balanceAdjustComment, setBalanceAdjustComment] = useState<string>('');
  const [balanceAdjustSubmitting, setBalanceAdjustSubmitting] = useState(false);

  // Custom Tariff Modal States
  const [isCustomTariffModalOpen, setIsCustomTariffModalOpen] = useState(false);
  const [customTariffForm, setCustomTariffForm] = useState({
    name: 'Космос Индивидуальный',
    price_rub: 15000,
    monthly_iirky: 15000,
    duration_days: 30,
    duration_text: '30 дней',
    sub: 'Индивидуальная разработка под ключ',
    target_user_id: '',
    featuresText: 'Любой объем ИИрок под задачи\nРазработка брендбука и SMM-стратегии\nИндивидуальный контент-план под ключ\nКастомная ИИ-разработка'
  });
  const [customTariffSubmitting, setCustomTariffSubmitting] = useState(false);

  // Assign Tariff to User Modal States
  const [isAssignTariffModalOpen, setIsAssignTariffModalOpen] = useState(false);
  const [assignTariffUser, setAssignTariffUser] = useState<any>(null);
  const [assignTariffForm, setAssignTariffForm] = useState({
    tariffName: 'Космос',
    durationDays: 30,
    addMonthlyIirky: 0
  });
  const [assignTariffSubmitting, setAssignTariffSubmitting] = useState(false);

  // Referral Sync State
  const [isSyncingReferrals, setIsSyncingReferrals] = useState(false);

  // Handle Sync Referrals
  const handleSyncReferrals = async () => {
    setIsSyncingReferrals(true);
    try {
      const res = await fetch('/api/admin/sync-referrals', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast('success', data.message || `Синхронизировано ${data.addedCount} реферальных начислений!`);
        fetchTableRows(selectedTable);
        fetchTablesInfo();
      } else {
        triggerToast('error', data.error || 'Ошибка синхронизации рефералов');
      }
    } catch (e: any) {
      triggerToast('error', 'Сетевая ошибка при синхронизации: ' + e.message);
    } finally {
      setIsSyncingReferrals(false);
    }
  };

  // Handle Save Custom Tariff
  const handleSaveCustomTariff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTariffForm.name.trim()) {
      triggerToast('error', 'Название тарифа обязательно');
      return;
    }
    setCustomTariffSubmitting(true);
    try {
      const featuresArray = customTariffForm.featuresText
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)
        .map(title => ({ title, desc: '' }));

      const res = await fetch('/api/admin/tariffs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customTariffForm.name.trim(),
          price_rub: Number(customTariffForm.price_rub) || 0,
          monthly_iirky: Number(customTariffForm.monthly_iirky) || 0,
          duration_days: Number(customTariffForm.duration_days) || 30,
          duration_text: customTariffForm.duration_text.trim() || `${customTariffForm.duration_days} дней`,
          sub: customTariffForm.sub.trim() || 'Индивидуальный тариф',
          target_user_id: customTariffForm.target_user_id.trim() || null,
          features: featuresArray,
          is_custom: 1
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast('success', `Индивидуальный тариф «${customTariffForm.name}» успешно сохранен!`);
        setIsCustomTariffModalOpen(false);
        fetchTableRows(selectedTable);
        fetchTablesInfo();
      } else {
        triggerToast('error', data.error || 'Ошибка создания тарифа');
      }
    } catch (e: any) {
      triggerToast('error', 'Сетевая ошибка: ' + e.message);
    } finally {
      setCustomTariffSubmitting(false);
    }
  };

  // Handle Assign Tariff to User
  const handleAssignTariffToUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTariffUser) return;
    setAssignTariffSubmitting(true);
    try {
      const res = await fetch('/api/admin/users/assign-tariff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: assignTariffUser.id,
          tariffName: assignTariffForm.tariffName.trim(),
          durationDays: Number(assignTariffForm.durationDays) || 30,
          addMonthlyIirky: Number(assignTariffForm.addMonthlyIirky) || 0
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast('success', `Тариф «${assignTariffForm.tariffName}» успешно назначен пользователю #${assignTariffUser.id}!`);
        setIsAssignTariffModalOpen(false);
        fetchTableRows('users');
        fetchTablesInfo();
      } else {
        triggerToast('error', data.error || 'Ошибка назначения тарифа');
      }
    } catch (e: any) {
      triggerToast('error', 'Сетевая ошибка: ' + e.message);
    } finally {
      setAssignTariffSubmitting(false);
    }
  };

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
        if (Array.isArray(data.tables)) setTablesInfo(data.tables);
      }
    } catch (e) {
      console.error('Error fetching tables info:', e);
    }
  };

  // Fetch rows for selected table
  const fetchTableRows = async (table: string) => {
    if (!table) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/db/table/${encodeURIComponent(table)}`);
      if (res.ok) {
        const data = await res.json();
        setTableData({ columns: data.columns || [], rows: data.rows || [] });
      } else {
        const err = await res.json();
        console.warn('Error loading table:', err);
      }
    } catch (e) {
      console.warn('Error fetching table rows:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTablesInfo();
    fetchTableRows(selectedTable);
    setSqlQuery(`SELECT * FROM ${selectedTable} LIMIT 20`);
  }, [selectedTable]);

  // Execute raw SQL
  const handleExecuteSql = async () => {
    if (!sqlQuery.trim()) return;
    setQueryLoading(true);
    setQueryError(null);
    setQueryResult(null);
    try {
      const res = await fetch('/api/db/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sqlQuery })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setQueryResult(data);
        triggerToast('success', 'Запрос успешно выполнен!');
        fetchTablesInfo();
        fetchTableRows(selectedTable);
      } else {
        setQueryError(data.error || 'Ошибка выполнения SQL');
        triggerToast('error', data.error || 'Ошибка выполнения SQL');
      }
    } catch (err: any) {
      setQueryError('Сетевая ошибка выполнения запроса');
      triggerToast('error', 'Сетевая ошибка');
    } finally {
      setQueryLoading(false);
    }
  };

  // Delete row
  const handleDeleteRow = async (id: string) => {
    if (!window.confirm(`Вы уверены, что хотите удалить запись #${id} из таблицы «${selectedTable}»?`)) return;
    setDeletingRowId(id);
    try {
      const res = await fetch(`/api/db/table/${selectedTable}/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast('success', `Запись #${id} успешно удалена`);
        fetchTablesInfo();
        fetchTableRows(selectedTable);
      } else {
        triggerToast('error', data.error || 'Ошибка удаления записи');
      }
    } catch (e) {
      triggerToast('error', 'Сетевая ошибка при удалении');
    } finally {
      setDeletingRowId(null);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (row: any) => {
    setEditingRow(row);
    setFormData({ ...row });
    setIsEditModalOpen(true);
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    const emptyRow: Record<string, any> = {};
    tableData.columns.forEach(col => {
      if (col === 'id') {
        if (selectedTable === 'tarifs') {
          emptyRow[col] = `tarif_${Date.now()}`;
        } else {
          emptyRow[col] = `${selectedTable.slice(0, 3)}_${Date.now()}`;
        }
      } else if (col === 'created_at' || col === 'createdAt') {
        emptyRow[col] = new Date().toISOString();
      } else if (col === 'role') {
        emptyRow[col] = 'user';
      } else if (col === 'tariff') {
        emptyRow[col] = 'Старт';
      } else if (col === 'status') {
        emptyRow[col] = 'Активный';
      } else if (col.startsWith('balance')) {
        emptyRow[col] = 0;
      } else {
        emptyRow[col] = '';
      }
    });
    setFormData(emptyRow);
    setIsAddModalOpen(true);
  };

  // Open Balance Adjust Modal for a user
  const handleOpenBalanceModal = (userRow: any) => {
    setBalanceUser(userRow);
    setBalanceAdjustAmount('100');
    setBalanceAdjustType('admin');
    setBalanceAdjustComment('');
    setIsBalanceModalOpen(true);
  };

  // Submit Admin Balance Adjust
  const handleSaveBalanceAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!balanceUser) return;
    const num = parseInt(balanceAdjustAmount, 10);
    if (isNaN(num) || num === 0) {
      triggerToast('error', 'Укажите корректную сумму изменения (не 0)');
      return;
    }
    if (!balanceAdjustComment.trim()) {
      triggerToast('error', 'Обязательно укажите причину корректировки баланса');
      return;
    }

    setBalanceAdjustSubmitting(true);
    try {
      const res = await fetch('/api/admin/user-balance-adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: balanceUser.id,
          amount: num,
          balanceType: balanceAdjustType,
          comment: balanceAdjustComment.trim(),
          description: `Корректировка администратором: ${num > 0 ? '+' : ''}${num} ИИрок (${balanceAdjustComment.trim()})`
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast('success', data.message || 'Баланс успешно скорректирован!');
        setIsBalanceModalOpen(false);
        fetchTableRows('users');
        fetchTablesInfo();
      } else {
        triggerToast('error', data.error || 'Ошибка корректировки баланса');
      }
    } catch (err: any) {
      triggerToast('error', 'Сетевая ошибка при изменении баланса: ' + err.message);
    } finally {
      setBalanceAdjustSubmitting(false);
    }
  };

  // Save Edit Row
  const handleSaveEditRow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRow || !editingRow.id) return;
    setSubmitting(true);
    try {
      const cleanData = { ...formData };
      
      // If editing user table, prevent direct manual overwrite of balance columns
      if (selectedTable === 'users') {
        BALANCE_COLUMNS.forEach(col => {
          if (editingRow[col] !== undefined) {
            cleanData[col] = editingRow[col];
          }
        });
      }

      const res = await fetch(`/api/db/table/${selectedTable}/${editingRow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast('success', `Запись #${editingRow.id} успешно обновлена`);
        setIsEditModalOpen(false);
        fetchTableRows(selectedTable);
      } else {
        triggerToast('error', data.error || 'Ошибка сохранения изменений');
      }
    } catch (err: any) {
      triggerToast('error', 'Сетевая ошибка при сохранении');
    } finally {
      setSubmitting(false);
    }
  };

  // Save Add Row
  const handleSaveAddRow = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/db/table/${selectedTable}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast('success', `Новая строка добавлена в таблицу «${selectedTable}»`);
        setIsAddModalOpen(false);
        fetchTablesInfo();
        fetchTableRows(selectedTable);
      } else {
        triggerToast('error', data.error || 'Ошибка добавления строки');
      }
    } catch (err: any) {
      triggerToast('error', 'Сетевая ошибка при добавлении');
    } finally {
      setSubmitting(false);
    }
  };

  // CSV Parsing
  const parseCsvData = (text: string) => {
    try {
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) {
        setCsvParsedPreview(null);
        return;
      }
      const delimiter = lines[0].includes(';') ? ';' : ',';
      const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
      const rows: Record<string, any>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(delimiter).map(p => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length > 0 && (parts.length > 1 || parts[0] !== '')) {
          const rowObj: Record<string, any> = {};
          headers.forEach((h, idx) => {
            rowObj[h] = parts[idx] !== undefined ? parts[idx] : '';
          });
          rows.push(rowObj);
        }
      }
      setCsvParsedPreview({ headers, rows });
    } catch (err) {
      setCsvParsedPreview(null);
    }
  };

  const handleCsvFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvImportText(content);
      parseCsvData(content);
      setIsCsvImportModalOpen(true);
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const handleExecuteCsvImport = async () => {
    if (!csvParsedPreview || csvParsedPreview.rows.length === 0) {
      triggerToast('error', 'Нет распознанных данных для импорта');
      return;
    }

    setIsImportingCsv(true);
    try {
      const res = await fetch('/api/admin/db/import/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName: selectedTable,
          rows: csvParsedPreview.rows
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast('success', `Успешно импортировано ${data.importedCount || csvParsedPreview.rows.length} строк в таблицу «${selectedTable}»!`);
        setIsCsvImportModalOpen(false);
        setCsvImportText('');
        setCsvParsedPreview(null);
        fetchTablesInfo();
        fetchTableRows(selectedTable);
      } else {
        triggerToast('error', data.error || 'Ошибка импорта CSV данных');
      }
    } catch (err: any) {
      triggerToast('error', 'Сетевая ошибка при импорте CSV: ' + err.message);
    } finally {
      setIsImportingCsv(false);
    }
  };

  // Combined dynamic tables list
  const displayTables = Array.from(new Set([...TABLES, ...tablesInfo.map(t => t.tableName)]));

  // Filter rows
  const filteredRows = tableData.rows.filter(row => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return Object.values(row).some(val => 
      String(val ?? '').toLowerCase().includes(term)
    );
  });

  const photoUrlValue = formData['photo_url'] || formData['photoUrl'] || formData['photo'] || formData['avatar_url'] || formData['avatarUrl'];

  return (
    <div className="space-y-6 text-left">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={jsonFileInputRef}
        onChange={handleJsonImportFileSelect}
        accept=".json"
        className="hidden"
      />
      <input
        type="file"
        ref={csvFileInputRef}
        onChange={handleCsvFileSelect}
        accept=".csv,text/csv"
        className="hidden"
      />

      {/* Database Export & Import Management Block */}
      <div className="bg-gradient-to-r from-sky-100/90 via-pink-100/90 via-orange-100/90 via-pink-100/90 to-sky-100/90 border border-pink-300 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 rounded-2xl text-white shadow-md">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <span>Резервное копирование и экспорт базы данных</span>
                <span className="text-sm bg-white/90 text-pink-700 border border-pink-300 px-2.5 py-0.5 rounded-full font-bold">
                  SQLite
                </span>
              </h3>
              <p className="text-sm text-slate-700 mt-0.5">Экспорт таблиц в JSON/SQLite и прямой импорт данных</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSyncReferrals}
              disabled={isSyncingReferrals}
              className="bg-white/90 hover:bg-white text-slate-800 border border-pink-300 text-sm font-bold px-3.5 py-2 rounded-2xl flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
              title="Проверить рефералов и начислить недостающие транзакции"
            >
              <Users size={16} className={isSyncingReferrals ? "animate-spin text-pink-500" : "text-pink-500"} />
              <span>{isSyncingReferrals ? 'Синхронизация...' : 'Синхронизация рефералов'}</span>
            </button>

            <button
              onClick={() => setIsCustomTariffModalOpen(true)}
              className="bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white text-sm font-bold px-3.5 py-2 rounded-2xl flex items-center space-x-1.5 transition-all cursor-pointer shadow-md"
              title="Создать или настроить индивидуальный тариф для пользователя"
            >
              <Sparkles size={16} />
              <span>+ Индив. тариф</span>
            </button>

            <a
              href="/api/admin/db/export/json"
              download
              className="bg-white/90 hover:bg-white text-slate-800 border border-pink-300 text-sm font-bold px-3.5 py-2 rounded-2xl flex items-center space-x-1.5 transition-all shadow-xs"
            >
              <Download size={16} className="text-pink-500" />
              <span>Скачать JSON</span>
            </a>

            <a
              href="/api/admin/db/export/sqlite"
              download
              className="bg-white/90 hover:bg-white text-slate-800 border border-pink-300 text-sm font-bold px-3.5 py-2 rounded-2xl flex items-center space-x-1.5 transition-all shadow-xs"
            >
              <HardDrive size={16} className="text-sky-500" />
              <span>Скачать app.sqlite</span>
            </a>

            <button
              onClick={() => jsonFileInputRef.current?.click()}
              disabled={isImportingJson}
              className="bg-white/90 hover:bg-white text-slate-800 border border-pink-300 text-sm font-bold px-3.5 py-2 rounded-2xl flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Upload size={16} className="text-orange-500" />
              <span>{isImportingJson ? 'Импорт...' : 'Импорт JSON'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Banner: SQLite Tables Selector */}
      <div className="bg-gradient-to-r from-sky-100/90 via-pink-100/90 via-orange-100/90 via-pink-100/90 to-sky-100/90 border border-pink-300 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-pink-200/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 rounded-2xl text-white shadow-md">
              <Database size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <span>Менеджер таблиц SQLite</span>
                <span className="text-sm bg-white/90 text-sky-800 border border-sky-300 px-2.5 py-0.5 rounded-full font-mono font-bold">
                  {TABLES.length} таблиц
                </span>
              </h3>
              <p className="text-sm text-slate-700 mt-0.5">Визуальное редактирование, просмотр и аудит данных платформы</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => { fetchTablesInfo(); fetchTableRows(selectedTable); }}
              className="bg-white/90 hover:bg-white text-slate-800 border border-pink-200 text-sm font-bold px-3.5 py-2 rounded-2xl flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-pink-500' : 'text-sky-500'} />
              <span>Обновить</span>
            </button>
            <button
              onClick={handleOpenAddModal}
              className="bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white text-sm font-bold px-4 py-2 rounded-2xl flex items-center space-x-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Создать строку</span>
            </button>
          </div>
        </div>

        {/* Tables Grid Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-1">
          {displayTables.map(tableName => {
            const info = tablesInfo.find(t => t.tableName === tableName);
            const isSelected = selectedTable === tableName;
            return (
              <button
                key={tableName}
                onClick={() => setSelectedTable(tableName)}
                className={`flex flex-col p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-sky-200 via-pink-200 to-orange-200 border-pink-400 text-slate-900 shadow-sm font-bold ring-1 ring-pink-400/40'
                    : 'bg-white/80 border-pink-200 text-slate-700 hover:bg-white hover:border-pink-300'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="font-mono text-sm font-bold truncate">{tableName}</span>
                  <TableIcon size={14} className={isSelected ? 'text-pink-600' : 'text-slate-400'} />
                </div>
                <span className="text-sm font-mono text-slate-600 mt-1">
                  Записей: <strong className="text-slate-900">{info ? info.rowCount : '...'}</strong>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Table Viewer Card */}
      <div className="bg-gradient-to-r from-sky-100/90 via-pink-100/90 via-orange-100/90 via-pink-100/90 to-sky-100/90 border border-pink-300 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-pink-200/80 pb-4">
          <div className="flex items-center space-x-2">
            <TableIcon className="text-pink-600" size={18} />
            <span className="text-sm font-bold text-slate-900 font-mono">Таблица: {selectedTable}</span>
            <span className="text-sm text-slate-600 font-mono font-bold">({filteredRows.length} из {tableData.rows.length} строк)</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-2.5 text-pink-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Поиск по столбцам..."
                className="w-full bg-white/90 border border-pink-200 rounded-2xl pl-9 pr-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-pink-400"
              />
            </div>

            {/* CSV Import Button */}
            <button
              onClick={() => setIsCsvImportModalOpen(true)}
              className="bg-white/90 hover:bg-white text-slate-800 border border-pink-300 text-sm font-bold px-3.5 py-1.5 rounded-2xl flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs shrink-0"
            >
              <FileSpreadsheet size={15} className="text-orange-500" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Table Rows Display */}
        <div className="overflow-x-auto border border-pink-200 rounded-2xl bg-white/80 max-h-[500px]">
          {loading ? (
            <div className="py-12 text-center text-slate-700 text-sm font-bold flex items-center justify-center space-x-2">
              <RefreshCw className="animate-spin text-pink-500" size={18} />
              <span>Загрузка данных...</span>
            </div>
          ) : filteredRows.length > 0 ? (
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-sky-100/80 text-slate-800 font-bold sticky top-0 border-b border-pink-200 z-10">
                <tr>
                  <th className="p-3 border-r border-pink-200 font-mono text-center w-24">Действия</th>
                  {tableData.columns.map(col => (
                    <th key={col} className="p-3 border-r border-pink-200 font-mono whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-100">
                {filteredRows.map((row, rIdx) => {
                  const rowId = row.id !== undefined ? String(row.id) : `row_${rIdx}`;
                  return (
                    <tr key={rowId} className="hover:bg-pink-50/60 transition-colors">
                      <td className="p-2.5 border-r border-pink-200 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1">
                          {selectedTable === 'users' && (
                            <>
                              <button
                                onClick={() => handleOpenBalanceModal(row)}
                                className="p-1.5 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-90 text-white rounded-xl shadow-xs transition-all cursor-pointer"
                                title="Калькулятор корректировки баланса"
                              >
                                <Calculator size={15} />
                              </button>
                              <button
                                onClick={() => {
                                  setAssignTariffUser(row);
                                  setAssignTariffForm({
                                    tariffName: row.tariff || 'Космос',
                                    durationDays: 30,
                                    addMonthlyIirky: 0
                                  });
                                  setIsAssignTariffModalOpen(true);
                                }}
                                className="p-1.5 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-90 text-white rounded-xl shadow-xs transition-all cursor-pointer"
                                title="Назначить тариф и индивидуальные условия"
                              >
                                <Sparkles size={15} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleOpenEditModal(row)}
                            className="p-1.5 bg-white hover:bg-pink-50 text-slate-700 hover:text-pink-600 border border-pink-200 rounded-xl shadow-xs transition-all cursor-pointer"
                            title="Редактировать запись"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteRow(rowId)}
                            disabled={deletingRowId === rowId}
                            className="p-1.5 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-pink-200 rounded-xl shadow-xs transition-all cursor-pointer"
                            title="Удалить запись"
                          >
                            {deletingRowId === rowId ? <RefreshCw className="animate-spin" size={15} /> : <Trash2 size={15} />}
                          </button>
                        </div>
                      </td>
                      {tableData.columns.map(col => (
                        <td key={col} className="p-2.5 border-r border-pink-100 font-mono text-slate-800 max-w-xs truncate">
                          {String(row[col] ?? '')}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-slate-600 text-sm font-bold">
              В таблице «{selectedTable}» нет доступных записей (0 строк).
            </div>
          )}
        </div>
      </div>

      {/* SQL Raw Terminal Console */}
      <div className="bg-gradient-to-r from-sky-100/90 via-pink-100/90 via-orange-100/90 via-pink-100/90 to-sky-100/90 border border-pink-300 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-pink-200/80 pb-3">
          <div className="flex items-center space-x-2">
            <Code className="text-pink-600" size={18} />
            <span className="text-sm font-bold text-slate-900">SQL Консоль прямого доступа</span>
          </div>
          <span className="text-sm text-slate-600 font-mono font-bold">SELECT, INSERT, UPDATE, DELETE</span>
        </div>

        <div className="relative">
          <textarea
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
            rows={3}
            className="w-full bg-white/90 border border-pink-200 rounded-2xl p-3.5 font-mono text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-pink-400"
            placeholder="SELECT * FROM users WHERE role = 'admin'"
          />
          <button
            onClick={() => handleExecuteSql()}
            disabled={queryLoading}
            className="absolute bottom-3.5 right-3.5 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white font-bold text-sm px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            {queryLoading ? <RefreshCw className="animate-spin" size={14} /> : <Code size={14} />}
            <span>Выполнить SQL</span>
          </button>
        </div>

        {queryError && (
          <div className="bg-orange-50 border border-orange-200 p-3 rounded-2xl font-mono text-sm text-orange-800 flex items-start space-x-2">
            <X size={16} className="shrink-0 mt-0.5 text-orange-600" />
            <span>{queryError}</span>
          </div>
        )}

        {queryResult && (
          <div className="space-y-2 bg-white/90 border border-pink-200 p-4 rounded-2xl font-mono text-sm">
            <div className="flex justify-between items-center text-slate-900 font-bold mb-2">
              <span className="flex items-center space-x-1">
                <Check size={16} className="text-pink-500" />
                <span>Результат выполнения SQL запроса:</span>
              </span>
            </div>
            {queryResult.rows ? (
              <div className="overflow-x-auto max-h-60 bg-white border border-pink-200 rounded-xl">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-sky-50 text-slate-800 font-bold">
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

      {/* Modal: ADMIN BALANCE ADJUST CALCULATOR */}
      {isBalanceModalOpen && balanceUser && (
        <div className="fixed inset-0 bg-sky-900/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-r from-sky-100/95 via-pink-100/95 via-orange-100/95 via-pink-100/95 to-sky-100/95 border border-pink-300 rounded-3xl w-full max-w-lg shadow-2xl space-y-4 p-5 sm:p-6 text-left">
            <div className="flex items-center justify-between border-b border-pink-200 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white rounded-xl shadow-sm">
                  <Calculator size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Калькулятор изменения баланса</h3>
                  <p className="text-sm text-slate-600">
                    Пользователь: <strong className="text-slate-900">{balanceUser.name || balanceUser.firstName || balanceUser.username || balanceUser.id}</strong> (ID: {balanceUser.id})
                  </p>
                </div>
              </div>
              <button onClick={() => setIsBalanceModalOpen(false)} className="text-slate-500 hover:text-slate-800 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Current Balances Overview */}
            <div className="grid grid-cols-2 gap-2.5 p-3.5 bg-white/80 rounded-2xl border border-pink-200">
              <div className="text-center p-2 rounded-xl bg-pink-50/70 border border-pink-100">
                <span className="text-sm text-slate-600 block">Баланс (ИИрки)</span>
                <span className="text-base font-bold text-pink-600 font-mono">{(balanceUser.balance ?? 0).toLocaleString()}</span>
              </div>
              <div className="text-center p-2 rounded-xl bg-sky-50/70 border border-sky-100">
                <span className="text-sm text-slate-600 block">Баланс Free</span>
                <span className="text-base font-bold text-sky-700 font-mono">{(balanceUser.balance_free ?? 0).toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={handleSaveBalanceAdjust} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">
                  Сумма изменения (+ для начисления, - для списания):
                </label>
                <input
                  type="number"
                  required
                  value={balanceAdjustAmount}
                  onChange={(e) => setBalanceAdjustAmount(e.target.value)}
                  placeholder="+500 или -200"
                  className="w-full bg-white border border-pink-300 rounded-xl px-3.5 py-2 text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">
                  Тип баланса:
                </label>
                <select
                  value={balanceAdjustType}
                  onChange={(e) => setBalanceAdjustType(e.target.value)}
                  className="w-full bg-white border border-pink-300 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-pink-500 cursor-pointer"
                >
                  <option value="admin">Корректировка администратором (balance_admin)</option>
                  <option value="pay">Пополнение / Оплата (balance_pay)</option>
                  <option value="start">Стартовый бонус (balance_start)</option>
                  <option value="ref">Партнерские реферальные (balance_ref)</option>
                  <option value="tarif">Тарифное начисление (balance_tarif)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">
                  Причина изменения (обязательный комментарий для истории транзакций):
                </label>
                <textarea
                  required
                  rows={2}
                  value={balanceAdjustComment}
                  onChange={(e) => setBalanceAdjustComment(e.target.value)}
                  placeholder="Например: Бонус за участие в тестировании или компенсация..."
                  className="w-full bg-white border border-pink-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-pink-200">
                <button
                  type="button"
                  onClick={() => setIsBalanceModalOpen(false)}
                  className="bg-white hover:bg-slate-100 text-slate-800 text-sm font-bold px-4 py-2 rounded-2xl border border-pink-200 transition-all cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={balanceAdjustSubmitting}
                  className="bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white text-sm font-bold px-5 py-2 rounded-2xl flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
                >
                  {balanceAdjustSubmitting ? <RefreshCw className="animate-spin" size={16} /> : <Check size={16} />}
                  <span>Применить корректировку</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: ADD ROW */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-sky-900/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-r from-sky-100/95 via-pink-100/95 via-orange-100/95 via-pink-100/95 to-sky-100/95 border border-pink-300 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-4 p-5 sm:p-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-pink-200/80 pb-3 shrink-0">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
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
                    <label className="block text-sm font-mono font-bold text-slate-700 mb-1">
                      {col}
                    </label>
                    <input
                      type="text"
                      value={formData[col] ?? ''}
                      onChange={(e) => setFormData({ ...formData, [col]: e.target.value })}
                      className="w-full bg-white/90 border border-pink-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:border-pink-400"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-pink-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="bg-white/80 hover:bg-white text-slate-800 text-sm font-bold px-4 py-2 rounded-2xl border border-pink-200 transition-all cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white text-sm font-bold px-5 py-2 rounded-2xl flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
                >
                  {submitting ? <RefreshCw className="animate-spin" size={15} /> : <Check size={15} />}
                  <span>Сохранить строку</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: EDIT ROW */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-sky-900/20 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-gradient-to-r from-sky-100/95 via-pink-100/95 via-orange-100/95 via-pink-100/95 to-sky-100/95 border border-pink-300 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-4 p-4 sm:p-6 max-h-[90vh] flex flex-col">
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
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                    {selectedTable === 'users' ? `Редактирование пользователя` : `Редактор записи #${editingRow?.id}`}
                  </h3>
                  <p className="text-sm font-bold text-pink-700 truncate hidden sm:block">
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
              {photoUrlValue && (
                <div className="p-3 bg-white/80 rounded-2xl border border-pink-200 flex items-center space-x-4">
                  <img 
                    src={photoUrlValue} 
                    alt="User Avatar" 
                    className="w-14 h-14 rounded-full object-cover border-2 border-pink-400 shadow-md shrink-0" 
                  />
                  <div className="space-y-1 text-sm min-w-0">
                    <div className="font-bold text-slate-800">Аватар / Фотография:</div>
                    <div className="text-sm text-slate-500 font-mono break-all line-clamp-2">{photoUrlValue}</div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tableData.columns.map(col => {
                  const isPhotoCol = col === 'photo_url' || col === 'photoUrl' || col === 'photo' || col === 'avatar_url';
                  const isTariff = col === 'tariff';
                  const isRole = col === 'role';
                  const isStatus = col === 'status';
                  const isBalanceField = selectedTable === 'users' && BALANCE_COLUMNS.includes(col);

                  return (
                    <div key={col} className={isPhotoCol ? 'sm:col-span-2' : ''}>
                      <label className="block text-sm font-mono font-bold text-slate-700 mb-1">
                        {col} {col === 'id' && '(PRIMARY KEY)'}
                        {isBalanceField && <span className="text-pink-600 font-bold ml-1">(через калькулятор)</span>}
                      </label>
                      {isTariff ? (
                        <select
                          value={formData[col] ?? 'Старт'}
                          onChange={(e) => setFormData({ ...formData, [col]: e.target.value })}
                          className="w-full bg-white/90 border border-pink-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold focus:outline-none focus:border-pink-400 cursor-pointer"
                        >
                          <option value="Старт">Старт</option>
                          <option value="Разгон">Разгон</option>
                          <option value="Отрыв">Отрыв</option>
                          <option value="Космос">Космос</option>
                        </select>
                      ) : isRole ? (
                        <select
                          value={formData[col] ?? 'user'}
                          onChange={(e) => setFormData({ ...formData, [col]: e.target.value })}
                          className="w-full bg-white/90 border border-pink-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold focus:outline-none focus:border-pink-400 cursor-pointer"
                        >
                          <option value="user">User</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : isStatus ? (
                        <select
                          value={formData[col] ?? 'Активный'}
                          onChange={(e) => setFormData({ ...formData, [col]: e.target.value })}
                          className="w-full bg-white/90 border border-pink-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold focus:outline-none focus:border-pink-400 cursor-pointer"
                        >
                          <option value="Активный">Активный</option>
                          <option value="Заблокирован">Заблокирован</option>
                          <option value="Ожидает">Ожидает</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          disabled={col === 'id' || isBalanceField}
                          value={formData[col] ?? ''}
                          onChange={(e) => setFormData({ ...formData, [col]: e.target.value })}
                          className={`w-full bg-white/90 border border-pink-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none ${
                            col === 'id' || isBalanceField ? 'text-slate-500 cursor-not-allowed bg-slate-100/80' : 'text-slate-900 focus:border-pink-400'
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
                  className="bg-white/80 hover:bg-white text-slate-800 text-sm font-bold px-4 py-2 rounded-2xl border border-pink-200 transition-all cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white text-sm font-bold px-5 py-2 rounded-2xl flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
                >
                  {submitting ? <RefreshCw className="animate-spin" size={15} /> : <Check size={15} />}
                  <span>Сохранить изменения</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: CSV IMPORT */}
      {isCsvImportModalOpen && (
        <div className="fixed inset-0 bg-sky-900/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-r from-sky-100/95 via-pink-100/95 via-orange-100/95 via-pink-100/95 to-sky-100/95 border border-pink-300 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-4 p-5 sm:p-6 text-left max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-pink-200/80 pb-3 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/90 rounded-xl border border-pink-200 text-pink-600 shadow-xs">
                  <FileSpreadsheet size={20} className="text-orange-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Импорт данных из CSV</h3>
                  <p className="text-sm text-slate-600">
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
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/80 border border-pink-200 rounded-2xl p-3.5">
                <div className="flex items-center space-x-3">
                  <Upload size={18} className="text-pink-500 shrink-0" />
                  <div className="text-sm text-slate-700">
                    <p className="font-bold text-slate-900">Загрузить готовый .CSV файл</p>
                    <p className="text-sm text-slate-500">Автоматически определит разделители и заголовки</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => csvFileInputRef.current?.click()}
                  className="bg-white hover:bg-pink-50 border border-pink-300 text-slate-800 text-sm font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs transition-all shrink-0 cursor-pointer"
                >
                  <Upload size={15} className="text-orange-500" />
                  <span>Выбрать .CSV файл</span>
                </button>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Или вставьте CSV текст напрямую:
                </label>
                <textarea
                  rows={5}
                  value={csvImportText}
                  onChange={(e) => {
                    setCsvImportText(e.target.value);
                    parseCsvData(e.target.value);
                  }}
                  placeholder={`id,name,role,status\nuser_1,Иван Иванов,admin,active`}
                  className="w-full bg-white/95 border border-pink-200 rounded-xl p-3 text-sm font-mono text-slate-800 focus:outline-none focus:border-pink-400 placeholder-slate-400"
                />
              </div>

              {csvParsedPreview && (
                <div className="bg-white/90 border border-pink-200 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-900">
                      Распознано строк: <strong className="text-pink-600">{csvParsedPreview.rows.length}</strong>
                    </span>
                    <span className="text-sm font-mono text-slate-600">
                      Столбцов: {csvParsedPreview.headers.length} ({csvParsedPreview.headers.join(', ')})
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-pink-200 shrink-0">
              <button
                type="button"
                onClick={() => setIsCsvImportModalOpen(false)}
                className="bg-white/80 hover:bg-white text-slate-800 text-sm font-bold px-4 py-2 rounded-2xl border border-pink-200 transition-all cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleExecuteCsvImport}
                disabled={isImportingCsv || !csvParsedPreview || csvParsedPreview.rows.length === 0}
                className="bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white text-sm font-bold px-5 py-2 rounded-2xl flex items-center space-x-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isImportingCsv ? <RefreshCw className="animate-spin" size={15} /> : <Check size={15} />}
                <span>Импортировать в базу</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: CREATE CUSTOM TARIFF */}
      {isCustomTariffModalOpen && (
        <div className="fixed inset-0 bg-sky-900/20 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-gradient-to-r from-sky-100/95 via-pink-100/95 via-orange-100/95 via-pink-100/95 to-sky-100/95 border border-pink-300 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-5 sm:p-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-pink-200/80 pb-3 shrink-0">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Sparkles size={18} className="text-pink-600" />
                <span>Создание индивидуального тарифа</span>
              </h3>
              <button 
                onClick={() => setIsCustomTariffModalOpen(false)} 
                className="text-slate-500 hover:text-slate-800 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomTariff} className="space-y-4 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">
                  Название тарифа:
                </label>
                <input
                  type="text"
                  required
                  value={customTariffForm.name}
                  onChange={(e) => setCustomTariffForm({ ...customTariffForm, name: e.target.value })}
                  placeholder="Например: Космос VIP, Индивидуальный Корпоративный"
                  className="w-full bg-white border border-pink-300 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1">
                    Стоимость (руб):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={customTariffForm.price_rub}
                    onChange={(e) => setCustomTariffForm({ ...customTariffForm, price_rub: Number(e.target.value) || 0 })}
                    className="w-full bg-white border border-pink-300 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1">
                    ИИрок в месяц:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={customTariffForm.monthly_iirky}
                    onChange={(e) => setCustomTariffForm({ ...customTariffForm, monthly_iirky: Number(e.target.value) || 0 })}
                    className="w-full bg-white border border-pink-300 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1">
                    Срок действия (дней):
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={customTariffForm.duration_days}
                    onChange={(e) => {
                      const days = Number(e.target.value) || 30;
                      setCustomTariffForm({ 
                        ...customTariffForm, 
                        duration_days: days,
                        duration_text: `${days} дней`
                      });
                    }}
                    className="w-full bg-white border border-pink-300 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1">
                    Привязка к ID пользователя (необязательно):
                  </label>
                  <input
                    type="text"
                    value={customTariffForm.target_user_id}
                    onChange={(e) => setCustomTariffForm({ ...customTariffForm, target_user_id: e.target.value })}
                    placeholder="Например: 169262990 (или пусто для всех)"
                    className="w-full bg-white border border-pink-300 rounded-xl px-3.5 py-2 text-sm font-mono text-slate-900 focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">
                  Краткое описание / подзаголовок:
                </label>
                <input
                  type="text"
                  value={customTariffForm.sub}
                  onChange={(e) => setCustomTariffForm({ ...customTariffForm, sub: e.target.value })}
                  placeholder="Индивидуальная разработка под ключ"
                  className="w-full bg-white border border-pink-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">
                  Возможности тарифа (каждая с новой строки):
                </label>
                <textarea
                  rows={4}
                  value={customTariffForm.featuresText}
                  onChange={(e) => setCustomTariffForm({ ...customTariffForm, featuresText: e.target.value })}
                  className="w-full bg-white border border-pink-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-pink-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCustomTariffModalOpen(false)}
                  className="bg-white/80 hover:bg-white text-slate-800 text-sm font-bold px-4 py-2 rounded-2xl border border-pink-200 transition-all cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={customTariffSubmitting}
                  className="bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white text-sm font-bold px-5 py-2 rounded-2xl flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
                >
                  {customTariffSubmitting ? <RefreshCw className="animate-spin" size={16} /> : <Check size={16} />}
                  <span>Сохранить тариф в базу</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: ASSIGN TARIFF TO USER */}
      {isAssignTariffModalOpen && assignTariffUser && (
        <div className="fixed inset-0 bg-sky-900/20 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-gradient-to-r from-sky-100/95 via-pink-100/95 via-orange-100/95 via-pink-100/95 to-sky-100/95 border border-pink-300 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl space-y-4 p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-pink-200/80 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Sparkles size={18} className="text-pink-600" />
                <span>Назначение тарифа</span>
              </h3>
              <button 
                onClick={() => setIsAssignTariffModalOpen(false)} 
                className="text-slate-500 hover:text-slate-800 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 bg-white/80 rounded-2xl border border-pink-200 space-y-1">
              <div className="text-sm font-bold text-slate-800">
                Пользователь: <span className="text-pink-600">{assignTariffUser.name || assignTariffUser.username || `#${assignTariffUser.id}`}</span>
              </div>
              <div className="text-sm text-slate-600">
                Текущий тариф: <strong className="text-slate-800">{assignTariffUser.tariff || 'Старт'}</strong> (до {assignTariffUser.tariff_until ? new Date(assignTariffUser.tariff_until).toLocaleDateString('ru-RU') : 'бессрочно'})
              </div>
            </div>

            <form onSubmit={handleAssignTariffToUser} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">
                  Выберите тариф:
                </label>
                <input
                  type="text"
                  required
                  value={assignTariffForm.tariffName}
                  onChange={(e) => setAssignTariffForm({ ...assignTariffForm, tariffName: e.target.value })}
                  placeholder="Старт, Разгон, Отрыв, Космос или название кастомного тарифа"
                  className="w-full bg-white border border-pink-300 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">
                  Срок действия (в днях):
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={assignTariffForm.durationDays}
                  onChange={(e) => setAssignTariffForm({ ...assignTariffForm, durationDays: Number(e.target.value) || 30 })}
                  className="w-full bg-white border border-pink-300 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">
                  Начислить ИИрок сразу (balance_tarif):
                </label>
                <input
                  type="number"
                  min="0"
                  value={assignTariffForm.addMonthlyIirky}
                  onChange={(e) => setAssignTariffForm({ ...assignTariffForm, addMonthlyIirky: Number(e.target.value) || 0 })}
                  placeholder="0 (или количество бонусных ИИрок)"
                  className="w-full bg-white border border-pink-300 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-pink-200">
                <button
                  type="button"
                  onClick={() => setIsAssignTariffModalOpen(false)}
                  className="bg-white/80 hover:bg-white text-slate-800 text-sm font-bold px-4 py-2 rounded-2xl border border-pink-200 transition-all cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={assignTariffSubmitting}
                  className="bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white text-sm font-bold px-5 py-2 rounded-2xl flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
                >
                  {assignTariffSubmitting ? <RefreshCw className="animate-spin" size={16} /> : <Check size={16} />}
                  <span>Применить тариф</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
