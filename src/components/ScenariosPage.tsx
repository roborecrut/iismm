import React, { useState, useEffect } from 'react';
import { 
  Workflow, 
  Play, 
  Plus, 
  Trash2, 
  Edit3, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Sparkles, 
  ImageIcon, 
  History, 
  Send, 
  FileText, 
  ChevronRight, 
  Settings2, 
  RefreshCw, 
  Layers, 
  Bot, 
  Zap,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Lock,
  Unlock,
  Search,
  Check,
  Eye,
  Calendar,
  Image as ImageIcon2
} from 'lucide-react';
import { Scenario, ScenarioStep, ScenarioLog, Channel } from '../types';

interface ScenariosPageProps {
  currentUser: any;
  channels: Channel[];
}

interface BasePostItem {
  id: string;
  title: string;
  category: string;
  content: string;
  channel: string;
  format: 'v2' | 'rich';
  type: 'prompt' | 'dayRequest' | 'publication';
}

export const ScenariosPage: React.FC<ScenariosPageProps> = ({ currentUser, channels }) => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [logs, setLogs] = useState<ScenarioLog[]>([]);
  const [cronSchedules, setCronSchedules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'editor' | 'logs'>('list');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/scenarios/logs')) {
      setActiveTab('logs');
    }
  }, []);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Base Posts Selection Modal State
  const [isSelectPostModalOpen, setIsSelectPostModalOpen] = useState(false);
  const [basePosts, setBasePosts] = useState<BasePostItem[]>([]);
  const [postSearchQuery, setPostSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<BasePostItem | null>(null);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  // Editor State
  const [editingScenario, setEditingScenario] = useState<Partial<Scenario> | null>(null);
  const [testingStepNumber, setTestingStepNumber] = useState<number | null>(null);

  // Interactive Live Step-by-Step Scenario Runner Modal State
  const [isInteractiveRunnerOpen, setIsInteractiveRunnerOpen] = useState(false);
  const [runnerScenario, setRunnerScenario] = useState<Scenario | null>(null);
  const [runnerCurrentStep, setRunnerCurrentStep] = useState<number>(1);
  const [runnerIsExecuting, setRunnerIsExecuting] = useState<boolean>(false);
  const [runnerStepLogs, setRunnerStepLogs] = useState<string[]>([]);
  const [runnerOutputs, setRunnerOutputs] = useState<{
    topic?: string;
    text?: string;
    imagePrompt?: string;
    imageUrls?: string[];
    formattedPreview?: string;
    scheduledCronId?: string;
  }>({});

  const fetchCronSchedules = async () => {
    try {
      const res = await fetch('/api/cron');
      if (res.ok) {
        const data = await res.json();
        setCronSchedules(data.items || []);
      }
    } catch (e) {
      console.error('Failed to fetch cron schedules:', e);
    }
  };

  const fetchScenariosAndLogs = async () => {
    setIsLoading(true);
    try {
      const activeUserId = currentUser?.id || '';
      const queryParam = activeUserId ? `?userId=${encodeURIComponent(activeUserId)}` : '';
      const reqHeaders: Record<string, string> = activeUserId ? { 'x-user-id': activeUserId } : {};

      const [scenRes, logsRes] = await Promise.all([
        fetch(`/api/scenarios${queryParam}`, { headers: reqHeaders }),
        fetch('/api/scenarios/logs'),
        fetchCronSchedules()
      ]);
      if (scenRes.ok) {
        const scenData = await scenRes.json();
        setScenarios(scenData);
      }
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData);
      }
    } catch (err) {
      console.error('Failed fetching scenarios:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBasePosts = async () => {
    setIsLoadingPosts(true);
    try {
      const activeUserId = currentUser?.id || '';
      const queryParam = activeUserId ? `?userId=${encodeURIComponent(activeUserId)}` : '';
      const reqHeaders: Record<string, string> = activeUserId ? { 'x-user-id': activeUserId } : {};

      const res = await fetch(`/api/scenarios/base-posts${queryParam}`, { headers: reqHeaders });
      if (res.ok) {
        const data = await res.json();
        setBasePosts(data);
      }
    } catch (e) {
      console.error('Failed to fetch base posts:', e);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchScenariosAndLogs();
  }, []);

  const handleOpenCreateFlow = () => {
    fetchBasePosts();
    setIsSelectPostModalOpen(true);
  };

  const handleSelectPostAndInitScenario = (post: BasePostItem) => {
    setSelectedPost(post);
    setIsSelectPostModalOpen(false);

    const defaultSteps: ScenarioStep[] = [
      {
        id: 'step_1',
        stepNumber: 1,
        type: 'analyze_history',
        title: 'Шаг 1: Изучить историю постов',
        description: 'Изучение последних тем в базе данных и генерация нового уникального заголовка',
        enabled: true,
        config: { memoryCount: 5 }
      },
      {
        id: 'step_2',
        stepNumber: 2,
        type: 'generate_text',
        title: 'Шаг 2: Написать текст поста',
        description: 'Отправка запроса в нейросеть ProTalk по выбранному промпту',
        enabled: true,
        config: { requestTemplate: `Напиши экспертный пост для Telegram по теме [ТЕМА] на основе промпта: "${post.content.slice(0, 200)}..."` }
      },
      {
        id: 'step_3',
        stepNumber: 3,
        type: 'generate_image_prompt',
        title: 'Шаг 3: Написать промпт к картинке',
        description: 'Составление промпта на английском для генерации визуальной иллюстрации',
        enabled: true,
        config: { imageStylePrompt: 'Cyberpunk futuristic realistic style, 8k resolution' }
      },
      {
        id: 'step_4',
        stepNumber: 4,
        type: 'generate_image',
        title: 'Шаг 4: Сгенерировать картинку в ProTalk',
        description: 'Получение прямой ссылки на сгенерированное нейросетью изображение и прикрепление в альбом',
        enabled: true,
        config: {}
      },
      {
        id: 'step_5',
        stepNumber: 5,
        type: 'format_post',
        title: 'Шаг 5: Оформить пост с картинкой',
        description: 'Сборка поста в формате V2 / Rich HTML с подписью и медиавложениями',
        enabled: true,
        config: { messageFormat: post.format || 'v2' }
      },
      {
        id: 'step_6',
        stepNumber: 6,
        type: 'schedule_post',
        title: 'Шаг 6: Запланировать / Опубликовать',
        description: 'Публикация в выбранные каналы с учетом опережения сценария относительно поста',
        enabled: true,
        config: { autoPublish: true }
      }
    ];

    setEditingScenario({
      name: `Автосценарий: ${post.title}`,
      description: `Автоматическая цепочка публикаций по теме "${post.category}"`,
      basePromptId: post.id,
      basePromptTitle: post.title,
      topicCategory: post.category || 'Технологии ИИ',
      targetChannels: [post.channel || channels[0]?.username || '@SAV_AI'],
      messageFormat: post.format || 'v2',
      enabled: true,
      offsetHoursBeforePost: 12,
      schedule: {
        frequency: 'daily',
        time: '10:00',
        intervalMinutes: 60,
        intervalHours: 2
      },
      completedTestSteps: [],
      generatedImageUrls: [],
      steps: defaultSteps
    });
    setActiveTab('editor');
  };

  const handleEditScenario = (scenario: Scenario) => {
    setEditingScenario(JSON.parse(JSON.stringify(scenario)));
    setActiveTab('editor');
  };

  const handleToggleEnable = async (scenario: Scenario) => {
    try {
      const res = await fetch(`/api/scenarios/${scenario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !scenario.enabled })
      });
      if (res.ok) {
        fetchScenariosAndLogs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот сценарий?')) return;
    try {
      const res = await fetch(`/api/scenarios/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'Сценарий удален' });
        fetchScenariosAndLogs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveScenario = async () => {
    if (!editingScenario?.name || !editingScenario?.topicCategory) {
      setStatusMessage({ type: 'error', text: 'Заполните название и тему сценария' });
      return;
    }

    try {
      const method = editingScenario.id ? 'PUT' : 'POST';
      const url = editingScenario.id ? `/api/scenarios/${editingScenario.id}` : '/api/scenarios';
      const payload = { ...editingScenario, userId: editingScenario.userId || currentUser?.id };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'Сценарий успешно сохранен!' });
        setActiveTab('list');
        fetchScenariosAndLogs();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Ошибка сохранения сценария');
      }
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: e.message });
    }
  };

  const handleRunNow = async (scenarioId: string) => {
    setRunningId(scenarioId);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/scenarios/${scenarioId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          telegramId: currentUser?.telegramId
        })
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMessage({
          type: 'success',
          text: `Сценарий успешно выполнен! Сгенерирован пост: "${data.generatedTitle}". Списано: ${data.cost} ИИрок.`
        });
        fetchScenariosAndLogs();
      } else {
        throw new Error(data.error || 'Ошибка исполнения сценария');
      }
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: e.message });
    } finally {
      setRunningId(null);
    }
  };

  // Test Step Execution Handler with locks & progress
  const handleTestStep = async (stepNum: number, customAction?: string) => {
    if (!editingScenario) return;
    setTestingStepNumber(stepNum);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/scenarios/test-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepNumber: stepNum,
          scenarioData: editingScenario,
          customAction
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка при тестировании шага');

      // Update Editing Scenario State with Step Output
      setEditingScenario(prev => {
        if (!prev) return prev;
        const currentCompleted = prev.completedTestSteps || [];
        const nextCompleted = Array.from(new Set([...currentCompleted, stepNum]));

        const updated: Partial<Scenario> = {
          ...prev,
          completedTestSteps: nextCompleted
        };

        if (stepNum === 1 && data.generatedTopic) {
          updated.generatedTopic = data.generatedTopic;
          updated.topicCategory = data.generatedTopic;
        } else if (stepNum === 2 && data.generatedText) {
          updated.generatedText = data.generatedText;
          if (data.generatedTitle) updated.name = `Автосценарий: ${data.generatedTitle}`;
        } else if (stepNum === 3 && data.generatedImagePrompt) {
          updated.generatedImagePrompt = data.generatedImagePrompt;
        } else if (stepNum === 4 && data.generatedImageUrls) {
          updated.generatedImageUrls = data.generatedImageUrls;
        } else if (stepNum === 5 && data.formattedPreview) {
          updated.formattedPreview = data.formattedPreview;
        }

        return updated;
      });

      setStatusMessage({
        type: 'success',
        text: data.message || `Шаг ${stepNum} успешно протестирован!`
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Ошибка в Шаге ${stepNum}: ${err.message}`
      });
    } finally {
      setTestingStepNumber(null);
    }
  };

  const isStepUnlocked = (stepNum: number) => {
    if (stepNum === 1) return true;
    const completed = editingScenario?.completedTestSteps || [];
    return completed.includes(stepNum - 1);
  };

  const handleStartInteractiveRunner = (scen: Scenario) => {
    setRunnerScenario(scen);
    setRunnerCurrentStep(1);
    setRunnerStepLogs([`[${new Date().toLocaleTimeString()}] Инициализация пошагового симулятора сценария "${scen.name}"...`]);
    setRunnerOutputs({});
    setIsInteractiveRunnerOpen(true);
  };

  const handleExecuteRunnerStep = async (stepNum: number) => {
    if (!runnerScenario) return;
    setRunnerIsExecuting(true);
    setRunnerStepLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ▶️ Запуск Шага ${stepNum}...`]);

    try {
      const res = await fetch('/api/scenarios/test-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepNumber: stepNum,
          scenarioData: runnerScenario
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка исполнения шага');

      setRunnerOutputs(prev => {
        const next = { ...prev };
        if (stepNum === 1 && data.generatedTopic) next.topic = data.generatedTopic;
        if (stepNum === 2 && data.generatedText) next.text = data.generatedText;
        if (stepNum === 3 && data.generatedImagePrompt) next.imagePrompt = data.generatedImagePrompt;
        if (stepNum === 4 && data.generatedImageUrls) next.imageUrls = data.generatedImageUrls;
        if (stepNum === 5 && data.formattedPreview) next.formattedPreview = data.formattedPreview;
        return next;
      });

      setRunnerStepLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ✅ Шаг ${stepNum} успешно выполнен: ${data.message || 'ОК'}`
      ]);

      if (stepNum < 6) {
        setRunnerCurrentStep(stepNum + 1);
      }
    } catch (err: any) {
      setRunnerStepLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ❌ Ошибка в Шаге ${stepNum}: ${err.message}`
      ]);
    } finally {
      setRunnerIsExecuting(false);
    }
  };

  const handleRegisterCronScheduleFromRunner = async () => {
    if (!runnerScenario) return;
    setRunnerIsExecuting(true);
    try {
      const timeStr = runnerScenario.schedule?.time || '10:00';
      const [h, m] = timeStr.split(':');
      const cronExpr = `${m || '0'} ${h || '10'} * * *`;
      const res = await fetch('/api/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_type: 'scenery',
          item_id: runnerScenario.id,
          title: `Крон расписание: ${runnerScenario.name}`,
          cron_expression: cronExpr,
          schedule_human: `Ежедневно в ${timeStr} MSK`
        })
      });

      if (res.ok) {
        const data = await res.json();
        setRunnerOutputs(prev => ({ ...prev, scheduledCronId: data.cron?.id }));
        setRunnerStepLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ⏰ Сценарий успешно внесен в таблицу расписаний Cron! ID: ${data.cron?.id}`
        ]);
        fetchCronSchedules();
      }
    } catch (e: any) {
      setRunnerStepLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ❌ Ошибка внесения в Cron: ${e.message}`]);
    } finally {
      setRunnerIsExecuting(false);
    }
  };

  const filteredBasePosts = basePosts.filter(p => 
    p.title.toLowerCase().includes(postSearchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(postSearchQuery.toLowerCase()) ||
    p.content.toLowerCase().includes(postSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-md border border-slate-200/80 p-6 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl">
              <Workflow className="text-indigo-600" size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Сценарии
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold">
                  Конструктор автопубликаций ИИSMM
                </span>
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Пошаговые алгоритмы автогенерации и автопубликации с возможностью пошагового тестирования
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setActiveTab('list');
              if (typeof window !== 'undefined' && window.location.pathname !== '/scenarios') {
                window.history.pushState(null, '', '/scenarios');
              }
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'list' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80'
            }`}
          >
            Сценарии ({scenarios.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('logs');
              if (typeof window !== 'undefined' && window.location.pathname !== '/scenarios/logs') {
                window.history.pushState(null, '', '/scenarios/logs');
              }
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'logs' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80'
            }`}
          >
            История / Логи
          </button>
          <button
            onClick={handleOpenCreateFlow}
            className="flex items-center space-x-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer border border-white/20 active:scale-95"
          >
            <Plus size={16} />
            <span>Создать сценарий</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {statusMessage && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium animate-fadeIn ${
          statusMessage.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          <div className="flex items-center space-x-2">
            {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="hover:opacity-75">
            <XCircle size={14} />
          </button>
        </div>
      )}

      {/* MODAL: POST SELECTOR FOR NEW SCENARIO */}
      {isSelectPostModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-3xl rounded-2xl p-6 shadow-xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Search size={20} className="text-indigo-600" />
                  Шаг 1: Выберите базовый пост / промпт
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Для создания автосценария выберите исходный пост из вашей базы. Данные автозаполнятся в редакторе.
                </p>
              </div>
              <button 
                onClick={() => setIsSelectPostModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <XCircle size={20} />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Поиск поста по названию, категории или тексту..."
                value={postSearchQuery}
                onChange={e => setPostSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Base Posts List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {isLoadingPosts ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
                  <Loader2 className="animate-spin text-indigo-600" size={24} />
                  <span className="text-xs">Загрузка базы постов и шаблонов...</span>
                </div>
              ) : filteredBasePosts.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl text-slate-500 text-xs font-semibold">
                  Посты по вашему запросу не найдены.
                </div>
              ) : (
                filteredBasePosts.map(post => (
                  <div
                    key={post.id}
                    onClick={() => handleSelectPostAndInitScenario(post)}
                    className="p-4 bg-white hover:bg-indigo-50/40 border border-slate-200 hover:border-indigo-300 rounded-xl cursor-pointer transition-all flex flex-col space-y-2 group shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {post.title}
                        </span>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200 font-medium">
                          {post.category}
                        </span>
                        <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                          {post.channel}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-slate-500 uppercase">
                        Формат: {post.format}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 italic font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      "{post.content}"
                    </p>

                    <div className="flex items-center justify-end text-xs text-indigo-600 font-bold group-hover:translate-x-1 transition-transform">
                      <span>Выбрать этот пост для сценария →</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: LIST OF SCENARIOS */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 space-y-2">
              <Loader2 className="animate-spin text-indigo-600 mr-2" size={20} />
              <span className="text-xs">Загрузка сценариев...</span>
            </div>
          ) : scenarios.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-12 text-center space-y-4 shadow-xs">
              <Workflow size={48} className="mx-auto text-slate-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Нет активных автосценариев</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Создайте ваш первый автосценарий для регулярного анализа тем, генерации текста в ИИSMM и автопубликации в Telegram
                </p>
              </div>
              <button
                onClick={handleOpenCreateFlow}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center space-x-2 cursor-pointer"
              >
                <Plus size={16} />
                <span>Выбрать пост и создать сценарий</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scenarios.map(scen => (
                <div
                  key={scen.id}
                  className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 hover:border-indigo-300 transition-all shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${scen.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                          <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{scen.name}</h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          Базовый пост: {scen.basePromptTitle || scen.topicCategory}
                        </p>
                      </div>

                      <button
                        onClick={() => handleToggleEnable(scen)}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                        title={scen.enabled ? 'Отключить автосценарий' : 'Включить автосценарий'}
                      >
                        {scen.enabled ? (
                          <ToggleRight size={24} className="text-emerald-500" />
                        ) : (
                          <ToggleLeft size={24} className="text-slate-400" />
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Тема / Ниша</span>
                        <span className="text-slate-800 font-bold truncate block">{scen.topicCategory}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Канал</span>
                        <span className="text-indigo-600 font-mono font-bold truncate block">{scen.targetChannels[0] || '@SAV_AI'}</span>
                      </div>
                    </div>

                    {/* Schedule offset info */}
                    <div className="bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Запуск сценария:</span>
                        <span className="text-amber-600 font-bold">за {scen.offsetHoursBeforePost || 12}ч до поста</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Шагов в цепи:</span>
                        <span className="text-emerald-600 font-mono font-bold">6 шагов</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleStartInteractiveRunner(scen)}
                      className="bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 py-2 px-3 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
                      title="Интерактивный пошаговый запуск с отслеживанием действий нейросети"
                    >
                      <Play size={14} className="text-indigo-400" />
                      <span>Пошагово</span>
                    </button>

                    <button
                      onClick={() => handleRunNow(scen.id)}
                      disabled={runningId === scen.id}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-md disabled:opacity-50 cursor-pointer"
                    >
                      {runningId === scen.id ? (
                        <>
                          <Loader2 className="animate-spin" size={14} />
                          <span>Выполняется...</span>
                        </>
                      ) : (
                        <>
                          <Zap size={14} />
                          <span>Запустить цепь</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleEditScenario(scen)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                      title="Редактировать и тестировать шаги"
                    >
                      <Edit3 size={14} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(scen.id);
                      }}
                      className="p-2 bg-slate-800 hover:bg-rose-950 text-rose-400 rounded-xl transition-colors cursor-pointer"
                      title="Удалить сценарий"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EDITOR & SEQUENTIAL STEP TESTER */}
      {activeTab === 'editor' && editingScenario && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white/80 backdrop-blur-md border border-slate-200/80 p-5 rounded-2xl shadow-xs">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Редактирование & Пошаговое Тестирование Сценария
                <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-mono font-bold border border-indigo-200">
                  {editingScenario.basePromptTitle ? `Пост: ${editingScenario.basePromptTitle}` : 'Индивидуальный'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Каждый шаг открывается последовательно после проведения теста предыдущего шага.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTab('list')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer border border-slate-200"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveScenario}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Сохранить сценарий
              </button>
            </div>
          </div>

          {/* Basic Scenario Info */}
          <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Settings2 size={16} className="text-indigo-600" />
              Основные параметры автосценария
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">
                  Название сценария
                </label>
                <input
                  type="text"
                  value={editingScenario.name || ''}
                  onChange={e => setEditingScenario({ ...editingScenario, name: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">
                  Тема / Категория
                </label>
                <input
                  type="text"
                  value={editingScenario.topicCategory || ''}
                  onChange={e => setEditingScenario({ ...editingScenario, topicCategory: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">
                  Формат сообщения Telegram
                </label>
                <select
                  value={editingScenario.messageFormat || 'v2'}
                  onChange={e => setEditingScenario({ ...editingScenario, messageFormat: e.target.value as any })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="v2">V2 HTML (Красивое заглавие + Инлайн кнопки)</option>
                  <option value="rich">Rich Text (Обычный текст с подписью)</option>
                </select>
              </div>
            </div>
          </div>

          {/* SEQUENTIAL STEPS (1 TO 6) WITH LOCKS & TEST BUTTONS */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Layers size={16} className="text-indigo-600" />
              Пошаговый алгоритм цепи
            </h3>

            {/* STEP 1 */}
            <div className={`p-5 rounded-2xl border transition-all ${
              isStepUnlocked(1) 
                ? 'bg-white/80 backdrop-blur-md border-indigo-200 shadow-xs' 
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 mb-3">
                <div className="flex items-center space-x-3">
                  <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    1
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Шаг 1: Изучить историю постов</h4>
                    <p className="text-xs text-slate-500">Анализирует ранее опубликованные посты в БД для генерации исключительной новой темы</p>
                  </div>
                </div>

                <button
                  onClick={() => handleTestStep(1)}
                  disabled={testingStepNumber === 1}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {testingStepNumber === 1 ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Play size={12} />
                  )}
                  <span>Запустить тест шага 1</span>
                </button>
              </div>

              {/* Step 1 Result Output */}
              {editingScenario.generatedTopic && (
                <div className="mt-3 p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-indigo-800 uppercase flex items-center gap-1">
                    <CheckCircle2 size={12} /> Итог шага 1: Новая уникальная тема
                  </span>
                  <input
                    type="text"
                    value={editingScenario.generatedTopic}
                    onChange={e => setEditingScenario({ ...editingScenario, generatedTopic: e.target.value, topicCategory: e.target.value })}
                    className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* STEP 2 */}
            <div className={`p-5 rounded-2xl border transition-all ${
              isStepUnlocked(2) 
                ? 'bg-white/80 backdrop-blur-md border-indigo-200 shadow-xs' 
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 mb-3">
                <div className="flex items-center space-x-3">
                  <span className={`w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center ${
                    isStepUnlocked(2) ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-200 text-slate-500'
                  }`}>
                    2
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      Шаг 2: Написать текст поста
                      {!isStepUnlocked(2) && <Lock size={12} className="text-amber-500" />}
                    </h4>
                    <p className="text-xs text-slate-500">Отправляет сформированный промпт в нейросеть ИИSMM с учетом параметров темы</p>
                  </div>
                </div>

                <button
                  onClick={() => handleTestStep(2)}
                  disabled={!isStepUnlocked(2) || testingStepNumber === 2}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                >
                  {testingStepNumber === 2 ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : !isStepUnlocked(2) ? (
                    <Lock size={12} />
                  ) : (
                    <Play size={12} />
                  )}
                  <span>Запустить тест шага 2</span>
                </button>
              </div>

              {/* Prompt Sent Box */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 block">Промпт для нейросети (Промпт-инструкция):</label>
                <textarea
                  rows={2}
                  value={editingScenario.steps?.[1]?.config?.requestTemplate || ''}
                  onChange={e => {
                    const newSteps = [...(editingScenario.steps || [])];
                    if (newSteps[1]) newSteps[1].config.requestTemplate = e.target.value;
                    setEditingScenario({ ...editingScenario, steps: newSteps });
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Step 2 Result Output */}
              {editingScenario.generatedText && (
                <div className="mt-3 p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-800 uppercase flex items-center gap-1">
                      <CheckCircle2 size={12} /> Итог шага 2: Сгенерированный пост
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleTestStep(2, 'rewrite')}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer"
                      >
                        <RefreshCw size={10} />
                        <span>Переписать нейросетью</span>
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={6}
                    value={editingScenario.generatedText}
                    onChange={e => setEditingScenario({ ...editingScenario, generatedText: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 leading-relaxed focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* STEP 3 */}
            <div className={`p-5 rounded-2xl border transition-all ${
              isStepUnlocked(3) 
                ? 'bg-white/80 backdrop-blur-md border-indigo-200 shadow-xs' 
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 mb-3">
                <div className="flex items-center space-x-3">
                  <span className={`w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center ${
                    isStepUnlocked(3) ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-200 text-slate-500'
                  }`}>
                    3
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      Шаг 3: Написать промпт к картинке
                      {!isStepUnlocked(3) && <Lock size={12} className="text-amber-500" />}
                    </h4>
                    <p className="text-xs text-slate-500">Формирует короткий визуальный промпт на английском языке на основе текста поста</p>
                  </div>
                </div>

                <button
                  onClick={() => handleTestStep(3)}
                  disabled={!isStepUnlocked(3) || testingStepNumber === 3}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                >
                  {testingStepNumber === 3 ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : !isStepUnlocked(3) ? (
                    <Lock size={12} />
                  ) : (
                    <Play size={12} />
                  )}
                  <span>Запустить тест шага 3</span>
                </button>
              </div>

              {/* Step 3 Result Output */}
              {editingScenario.generatedImagePrompt && (
                <div className="mt-3 p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-indigo-800 uppercase flex items-center gap-1">
                    <CheckCircle2 size={12} /> Итог шага 3: Промпт для изображения (EN)
                  </span>
                  <input
                    type="text"
                    value={editingScenario.generatedImagePrompt}
                    onChange={e => setEditingScenario({ ...editingScenario, generatedImagePrompt: e.target.value })}
                    className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* STEP 4 */}
            <div className={`p-5 rounded-2xl border transition-all ${
              isStepUnlocked(4) 
                ? 'bg-white/80 backdrop-blur-md border-indigo-200 shadow-xs' 
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 mb-3">
                <div className="flex items-center space-x-3">
                  <span className={`w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center ${
                    isStepUnlocked(4) ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-200 text-slate-500'
                  }`}>
                    4
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      Шаг 4: Сгенерировать картинку в ИИSMM
                      {!isStepUnlocked(4) && <Lock size={12} className="text-amber-500" />}
                    </h4>
                    <p className="text-xs text-slate-500">Генерирует изображения через нейросеть ИИSMM и собирает медиа-альбом</p>
                  </div>
                </div>

                <button
                  onClick={() => handleTestStep(4)}
                  disabled={!isStepUnlocked(4) || testingStepNumber === 4}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                >
                  {testingStepNumber === 4 ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : !isStepUnlocked(4) ? (
                    <Lock size={12} />
                  ) : (
                    <Play size={12} />
                  )}
                  <span>Запустить тест шага 4 (ИИSMM AI)</span>
                </button>
              </div>

              {/* Step 4 Result Output (Media Album) */}
              {editingScenario.generatedImageUrls && editingScenario.generatedImageUrls.length > 0 && (
                <div className="mt-3 p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-800 uppercase flex items-center gap-1">
                      <ImageIcon2 size={12} /> Альбом изображений ({editingScenario.generatedImageUrls.length})
                    </span>
                    <button
                      onClick={() => handleTestStep(4, 'add_image')}
                      className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus size={10} />
                      <span>+ Добавить еще картинку в альбом</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {editingScenario.generatedImageUrls.map((url, idx) => (
                      <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-200 aspect-square group bg-slate-100">
                        <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                        <span className="absolute top-1 left-1 bg-slate-900/80 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                          #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* STEP 5 */}
            <div className={`p-5 rounded-2xl border transition-all ${
              isStepUnlocked(5) 
                ? 'bg-white/80 backdrop-blur-md border-indigo-200 shadow-xs' 
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 mb-3">
                <div className="flex items-center space-x-3">
                  <span className={`w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center ${
                    isStepUnlocked(5) ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-200 text-slate-500'
                  }`}>
                    5
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      Шаг 5: Оформить пост с картинкой / текстом
                      {!isStepUnlocked(5) && <Lock size={12} className="text-amber-500" />}
                    </h4>
                    <p className="text-xs text-slate-500">Форматирование HTML/V2, прикрепление кнопок и предварительный просмотр</p>
                  </div>
                </div>

                <button
                  onClick={() => handleTestStep(5)}
                  disabled={!isStepUnlocked(5) || testingStepNumber === 5}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                >
                  {testingStepNumber === 5 ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : !isStepUnlocked(5) ? (
                    <Lock size={12} />
                  ) : (
                    <Play size={12} />
                  )}
                  <span>Запустить тест шага 5</span>
                </button>
              </div>

              {/* Step 5 Result Output (Formatted Telegram Preview) */}
              {editingScenario.formattedPreview && (
                <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <span className="text-xs font-bold text-indigo-700 uppercase flex items-center gap-1">
                    <Eye size={12} /> Предпросмотр поста в Telegram ({editingScenario.messageFormat?.toUpperCase()})
                  </span>

                  {/* Album preview */}
                  {editingScenario.generatedImageUrls && editingScenario.generatedImageUrls.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {editingScenario.generatedImageUrls.map((url, i) => (
                        <img key={i} src={url} alt="Attached media" className="h-28 rounded-lg object-cover border border-slate-200" />
                      ))}
                    </div>
                  )}

                  <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 whitespace-pre-wrap font-sans">
                    {editingScenario.formattedPreview}
                  </div>

                  <div className="flex gap-2">
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg border border-indigo-200 font-semibold">
                      🔘 ##INLINE:Добавь промпт в таблицу;Напиши другой промпт##
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 6 */}
            <div className={`p-5 rounded-2xl border transition-all ${
              isStepUnlocked(6) 
                ? 'bg-white/80 backdrop-blur-md border-indigo-200 shadow-xs' 
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 mb-3">
                <div className="flex items-center space-x-3">
                  <span className={`w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center ${
                    isStepUnlocked(6) ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-200 text-slate-500'
                  }`}>
                    6
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      Шаг 6: Запланировать / Опубликовать
                      {!isStepUnlocked(6) && <Lock size={12} className="text-amber-500" />}
                    </h4>
                    <p className="text-xs text-slate-500">Настройка расписания поста и времени опережения запуска сценария</p>
                  </div>
                </div>

                <button
                  onClick={() => handleTestStep(6)}
                  disabled={!isStepUnlocked(6) || testingStepNumber === 6}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                >
                  {testingStepNumber === 6 ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : !isStepUnlocked(6) ? (
                    <Lock size={12} />
                  ) : (
                    <Play size={12} />
                  )}
                  <span>Запустить тест шага 6</span>
                </button>
              </div>

              {/* Step 6 Schedule Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">
                    Время публикации поста в Telegram
                  </label>
                  <input
                    type="time"
                    value={editingScenario.schedule?.time || '10:00'}
                    onChange={e => setEditingScenario({
                      ...editingScenario,
                      schedule: { ...(editingScenario.schedule || { frequency: 'daily' }), time: e.target.value }
                    })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">
                    За сколько часов ДО ПОСТА запускать автосценарий? (Опережение)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={48}
                    value={editingScenario.offsetHoursBeforePost ?? 12}
                    onChange={e => setEditingScenario({ ...editingScenario, offsetHoursBeforePost: parseInt(e.target.value) || 12 })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CRON SCHEDULE MANAGER REMOVED (Moved to Admin /admin/autoai) */}

      {/* MODAL: INTERACTIVE LIVE STEP-BY-STEP SCENARIO RUNNER */}
      {isInteractiveRunnerOpen && runnerScenario && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-4xl rounded-2xl p-6 shadow-xl space-y-5 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <Zap className="text-indigo-600 animate-pulse" size={22} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    Пошаговый Интерактивный Симулятор Сценария
                    <span className="text-xs bg-indigo-50 text-indigo-700 font-mono px-2 py-0.5 rounded-full border border-indigo-200 font-bold">
                      {runnerScenario.name}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Тестируйте каждый шаг нейросети по очереди, проверяйте результаты и заносите готовый сценарий в Cron расписание.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsInteractiveRunnerOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <XCircle size={22} />
              </button>
            </div>

            {/* Stepper Status Bar (1 to 6) */}
            <div className="grid grid-cols-6 gap-2">
              {[1, 2, 3, 4, 5, 6].map(stepNum => {
                const isCurrent = runnerCurrentStep === stepNum;
                const isPassed = stepNum < runnerCurrentStep || (stepNum === 6 && runnerOutputs.scheduledCronId);
                return (
                  <div
                    key={stepNum}
                    onClick={() => setRunnerCurrentStep(stepNum)}
                    className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold ring-2 ring-indigo-500/30'
                        : isPassed
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <div className="text-xs uppercase font-mono mb-1 font-bold">Шаг {stepNum}</div>
                    <div className="text-xs font-bold line-clamp-1">
                      {stepNum === 1 && '1. Тема'}
                      {stepNum === 2 && '2. Текст AI'}
                      {stepNum === 3 && '3. Промпт Арт'}
                      {stepNum === 4 && '4. Картинка ИИSMM'}
                      {stepNum === 5 && '5. Верстка Telegram'}
                      {stepNum === 6 && '6. Запись в Крон'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Active Step Inspector Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 bg-slate-50 p-4 rounded-xl border border-slate-200">
              {runnerCurrentStep === 1 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <span>Шаг 1: Анализ истории постов и выбор новой темы</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Нейросеть считывает последние посты в БД и формирует новую непересекающуюся тему.
                      </p>
                    </div>
                    <button
                      onClick={() => handleExecuteRunnerStep(1)}
                      disabled={runnerIsExecuting}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-xs cursor-pointer"
                    >
                      {runnerIsExecuting ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} />}
                      <span>Сгенерировать тему (Шаг 1)</span>
                    </button>
                  </div>

                  {runnerOutputs.topic && (
                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1 animate-fadeIn">
                      <span className="text-xs font-bold text-indigo-800 uppercase">Сгенерированная уникальная тема:</span>
                      <div className="text-xs font-bold text-slate-900">{runnerOutputs.topic}</div>
                    </div>
                  )}
                </div>
              )}

              {runnerCurrentStep === 2 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">Шаг 2: Генерация текста поста в ИИSMM AI</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Нейросеть пишет развернутый пост для Telegram по выбранной теме.
                      </p>
                    </div>
                    <button
                      onClick={() => handleExecuteRunnerStep(2)}
                      disabled={runnerIsExecuting}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-xs cursor-pointer"
                    >
                      {runnerIsExecuting ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                      <span>Написать пост (Шаг 2)</span>
                    </button>
                  </div>

                  {runnerOutputs.text && (
                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2 animate-fadeIn">
                      <span className="text-xs font-bold text-indigo-800 uppercase">Текст, созданный ИИ:</span>
                      <textarea
                        rows={6}
                        readOnly
                        value={runnerOutputs.text}
                        className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-800 leading-relaxed font-sans"
                      />
                    </div>
                  )}
                </div>
              )}

              {runnerCurrentStep === 3 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">Шаг 3: Составление англоязычного промпта для картинки</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Формирование арт-инструкции на английском языке в стиле 8k 3d render.
                      </p>
                    </div>
                    <button
                      onClick={() => handleExecuteRunnerStep(3)}
                      disabled={runnerIsExecuting}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-xs cursor-pointer"
                    >
                      {runnerIsExecuting ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} />}
                      <span>Создать арт-промпт (Шаг 3)</span>
                    </button>
                  </div>

                  {runnerOutputs.imagePrompt && (
                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1 animate-fadeIn">
                      <span className="text-xs font-bold text-indigo-800 uppercase">Промпт для нейросети изображений:</span>
                      <div className="text-xs font-mono text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200">
                        {runnerOutputs.imagePrompt}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {runnerCurrentStep === 4 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">Шаг 4: Генерация картинки и сборка медиа-альбома</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Получение прямых ссылок на сгенерированные изображения в ИИSMM AI.
                      </p>
                    </div>
                    <button
                      onClick={() => handleExecuteRunnerStep(4)}
                      disabled={runnerIsExecuting}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-xs cursor-pointer"
                    >
                      {runnerIsExecuting ? <Loader2 className="animate-spin" size={14} /> : <ImageIcon size={14} />}
                      <span>Сгенерировать картинку (Шаг 4)</span>
                    </button>
                  </div>

                  {runnerOutputs.imageUrls && runnerOutputs.imageUrls.length > 0 && (
                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2 animate-fadeIn">
                      <span className="text-xs font-bold text-indigo-800 uppercase">Сгенерированные иллюстрации:</span>
                      <div className="grid grid-cols-2 gap-3">
                        {runnerOutputs.imageUrls.map((url, i) => (
                          <img key={i} src={url} alt="Runner art" className="w-full h-36 object-cover rounded-lg border border-slate-200" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {runnerCurrentStep === 5 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">Шаг 5: Форматирование верстки и инлайн-кнопок Telegram V2</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Сборка готового сообщения со стилями, хештегами и подписью.
                      </p>
                    </div>
                    <button
                      onClick={() => handleExecuteRunnerStep(5)}
                      disabled={runnerIsExecuting}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-xs cursor-pointer"
                    >
                      {runnerIsExecuting ? <Loader2 className="animate-spin" size={14} /> : <Eye size={14} />}
                      <span>Оформить публикацию (Шаг 5)</span>
                    </button>
                  </div>

                  {runnerOutputs.formattedPreview && (
                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2 animate-fadeIn">
                      <span className="text-xs font-bold text-indigo-800 uppercase">Итоговый вид в Telegram:</span>
                      <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 whitespace-pre-wrap font-sans">
                        {runnerOutputs.formattedPreview}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {runnerCurrentStep === 6 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">Шаг 6: Запись в таблицу расписаний Cron</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Внесение сформированной цепи в таблицу cron базы данных с автоматическим расписанием запуска.
                      </p>
                    </div>
                    <button
                      onClick={handleRegisterCronScheduleFromRunner}
                      disabled={runnerIsExecuting || !!runnerOutputs.scheduledCronId}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {runnerIsExecuting ? <Loader2 className="animate-spin" size={14} /> : <Clock size={14} />}
                      <span>{runnerOutputs.scheduledCronId ? 'Внесено в Cron!' : 'Внести в таблицу Cron (Шаг 6)'}</span>
                    </button>
                  </div>

                  {runnerOutputs.scheduledCronId && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-xs text-emerald-800 animate-fadeIn font-semibold">
                      <div className="font-bold">✅ Сценарий успешно привязан к таблице Крон!</div>
                      <div className="text-xs text-emerald-700 font-mono">ID расписания: {runnerOutputs.scheduledCronId}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Console Execution Logs */}
              <div className="mt-4 p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <span className="text-xs font-mono font-bold text-slate-600 uppercase block mb-1">Консоль пошагового выполнения:</span>
                <div className="space-y-1 max-h-32 overflow-y-auto text-xs font-mono text-slate-700">
                  {runnerStepLogs.map((log, i) => (
                    <div key={i} className="leading-tight">{log}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Controls Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <div className="flex items-center space-x-2">
                <button
                  disabled={runnerCurrentStep <= 1}
                  onClick={() => setRunnerCurrentStep(prev => prev - 1)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl disabled:opacity-40 cursor-pointer border border-slate-200"
                >
                  ← Предыдущий шаг
                </button>
                <button
                  disabled={runnerCurrentStep >= 6}
                  onClick={() => setRunnerCurrentStep(prev => prev + 1)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl disabled:opacity-40 cursor-pointer border border-slate-200"
                >
                  Следующий шаг →
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsInteractiveRunnerOpen(false)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer border border-slate-200"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScenariosPage;
