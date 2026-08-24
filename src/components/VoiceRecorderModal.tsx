import React, { useState, useEffect, useRef } from 'react';
import { Mic, Loader2, Sparkles, SendHorizontal, X, Radio, RefreshCw, Bot, ShieldAlert } from 'lucide-react';

interface VoiceRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVoiceProcessed: (result: { url: string; text: string }) => void;
  activeFriendName?: string;
  skipTranscription?: boolean;
}

export const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({
  isOpen,
  onClose,
  onVoiceProcessed,
  activeFriendName = 'Соавтор',
  skipTranscription = false
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [statusText, setStatusText] = useState<'idle' | 'permission_prompt' | 'recording' | 'processing' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [equalizerBars, setEqualizerBars] = useState<number[]>(new Array(18).fill(15));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Clean up on modal close or unmount
  useEffect(() => {
    if (!isOpen) {
      stopRecordingCleanup();
      setStatusText('idle');
      setRecordingTime(0);
      setStatusMessage('');
    }
  }, [isOpen]);

  const stopRecordingCleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {}
    }

    mediaRecorderRef.current = null;
    audioContextRef.current = null;
    analyserRef.current = null;
    setIsRecording(false);
  };

  // Continuous Ambient Neural Sphere Animation Loop when Modal is Open
  useEffect(() => {
    if (!isOpen) return;

    let ambientFrameId: number;

    const ambientLoop = () => {
      // If NOT actively recording with user voice stream, render ambient spinning sphere & equalizer
      if (!isRecording) {
        const time = Date.now() * 0.003;
        const ambientVol = 0.12 + 0.08 * Math.sin(time * 2);
        renderNeuralSphere(ambientVol);

        // Ambient moving equalizer bars
        const bars = new Array(18).fill(0).map((_, i) => {
          return 12 + Math.abs(Math.sin(time + i * 0.35)) * 28;
        });
        setEqualizerBars(bars);
      }
      ambientFrameId = requestAnimationFrame(ambientLoop);
    };

    ambientFrameId = requestAnimationFrame(ambientLoop);

    return () => {
      if (ambientFrameId) cancelAnimationFrame(ambientFrameId);
    };
  }, [isOpen, isRecording]);

  // DOUBLE UX: Handle user explicit click on "Начать запись"
  const handleStartRecordingClick = async () => {
    setStatusText('permission_prompt');
    setStatusMessage('Разрешите доступ к микрофону во всплывающем окне браузера...');

    // Small delay to allow React UI to render the "Разрешите доступ к микрофону" guidance first
    setTimeout(() => {
      executeMicrophoneRequest();
    }, 60);
  };

  // Execute getUserMedia inside user-triggered action
  const executeMicrophoneRequest = async () => {
    try {
      setRecordingTime(0);
      audioChunksRef.current = [];

      // Request microphone stream strictly on user action
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      setStatusText('recording');
      setStatusMessage('Запись голоса...');

      // Audio Context & Analyser for real-time Equalizer + Neural Sphere
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      // MediaRecorder setup
      let options = { mimeType: 'audio/webm' };
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/mp4' };
      }
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);

      // Timer counter
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Start dynamic equalizer and neural sphere rendering
      updateAudioVisualizer();

    } catch (err: any) {
      console.error('Error requesting microphone stream:', err);
      setStatusText('error');
      const isPermissionDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.message?.includes('Permission denied') || err.message?.includes('allowed');
      if (isPermissionDenied) {
        setStatusMessage('Доступ к микрофону заблокирован или отклонен браузером. Пожалуйста, разрешите доступ к микрофону в настройках браузера и нажмите «Попробовать снова».');
      } else {
        setStatusMessage('Не удалось получить доступ к микрофону: ' + (err.message || 'Проверьте подключение устройства'));
      }
      setIsRecording(false);
    }
  };

  // Real-time Audio Visualizer tick for Equalizer and Canvas Neural Sphere
  const updateAudioVisualizer = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avg = sum / dataArray.length;
    const volNorm = Math.min(1, avg / 128);

    // Map frequency data to 18 equalizer bars
    const barCount = 18;
    const newBars: number[] = [];
    const step = Math.floor(dataArray.length / barCount) || 1;

    for (let i = 0; i < barCount; i++) {
      const val = dataArray[i * step] || 0;
      const barHeight = Math.max(12, Math.min(100, (val / 255) * 100));
      newBars.push(barHeight);
    }
    setEqualizerBars(newBars);

    // Render Canvas Neural Sphere with live volume
    renderNeuralSphere(volNorm);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      animFrameRef.current = requestAnimationFrame(updateAudioVisualizer);
    }
  };

  // Canvas 3D Neural Mesh Sphere Renderer
  const renderNeuralSphere = (volume: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const time = Date.now() * 0.002;

    ctx.clearRect(0, 0, width, height);

    // Base Pulsing Radius (Sky - Pink - Orange)
    const baseRadius = 45 + volume * 25;
    
    // Outer Ring 1
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius + 18, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(56, 189, 248, ${0.2 + volume * 0.4})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Outer Ring 2 (Rotating Pink)
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(time);
    ctx.beginPath();
    ctx.arc(0, 0, baseRadius + 8, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(236, 72, 153, ${0.3 + volume * 0.5})`;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    // Neural Grid Mesh Nodes
    const nodeCount = 20;
    const nodes: { x: number; y: number; z: number }[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / nodeCount);
      const theta = Math.sqrt(nodeCount * Math.PI) * phi + time;

      const r = baseRadius * (1 + 0.1 * Math.sin(time * 2 + i));
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      const scale = 200 / (200 + z);
      nodes.push({
        x: centerX + x * scale,
        y: centerY + y * scale,
        z
      });
    }

    // Draw Neural Connection Lines
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 60) {
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          const alpha = (1 - dist / 60) * (0.3 + volume * 0.5);
          ctx.strokeStyle = i % 2 === 0 ? `rgba(249, 115, 22, ${alpha})` : `rgba(236, 72, 153, ${alpha})`;
          ctx.stroke();
        }
      }
    }

    // Draw Node Dots
    nodes.forEach((node, idx) => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 3.5 + volume * 2, 0, Math.PI * 2);
      ctx.fillStyle = idx % 3 === 0 ? '#38bdf8' : idx % 3 === 1 ? '#ec4899' : '#f97316';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ec4899';
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Core Glowing Sphere Center
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 5,
      centerX, centerY, baseRadius * 0.7
    );
    gradient.addColorStop(0, 'rgba(236, 72, 153, 0.8)');
    gradient.addColorStop(0.5, 'rgba(249, 115, 22, 0.5)');
    gradient.addColorStop(1, 'rgba(56, 189, 248, 0.1)');

    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  };

  // Stop Recording and Transcribe Speech to Text via ProTalk STT (or save as OGG voice directly if skipTranscription)
  const stopRecordingAndSend = async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;

    setStatusText('processing');
    setStatusMessage(skipTranscription ? 'Сохранение и конвертация голосового сообщения...' : 'Распознавание речи...');

    const mediaRecorder = mediaRecorderRef.current;

    mediaRecorder.onstop = async () => {
      stopRecordingCleanup();

      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

      if (audioBlob.size === 0) {
        setStatusText('error');
        setStatusMessage('Запись оказалась пустой. Попробуйте записать еще раз.');
        return;
      }

      try {
        let voiceUrl = '';
        let voiceText = '';

        // If skipTranscription is true (e.g. for post voice message), convert and upload directly to OGG without STT
        if (skipTranscription) {
          try {
            const formData = new FormData();
            formData.append('file', audioBlob, 'voice_message.webm');
            formData.append('convertVoiceOgg', 'true');

            const convRes = await fetch('/api/convert-audio-to-ogg', {
              method: 'POST',
              body: formData
            });

            if (convRes.ok) {
              const convData = await convRes.json();
              if (convData.success && convData.url) {
                voiceUrl = convData.proxyUrl || convData.shortUrl || convData.url;
              }
            }
          } catch (cErr) {
            console.warn('convert-audio-to-ogg failed, trying /api/upload fallback:', cErr);
          }

          if (!voiceUrl) {
            try {
              const formData = new FormData();
              formData.append('file', audioBlob, 'voice_message.webm');
              formData.append('convertVoiceOgg', 'true');

              const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData
              });
              if (uploadRes.ok) {
                const uploadData = await uploadRes.json();
                voiceUrl = uploadData.proxyUrl || uploadData.shortUrl || uploadData.url;
              }
            } catch (uErr) {
              console.warn('/api/upload fallback failed:', uErr);
            }
          }

          if (!voiceUrl) {
            voiceUrl = URL.createObjectURL(audioBlob);
          }

          onVoiceProcessed({
            url: voiceUrl,
            text: ''
          });

          onClose();
          return;
        }

        // Standard flow with STT transcription
        // 1. Try server proxy endpoint /api/protalk-stt
        try {
          const formData = new FormData();
          formData.append('file', audioBlob, 'voice_message.webm');

          const apiRes = await fetch('/api/protalk-stt', {
            method: 'POST',
            body: formData
          });

          if (apiRes.ok) {
            const data = await apiRes.json();
            if (data.success) {
              voiceUrl = data.url || '';
              voiceText = data.text || '';
            }
          }
        } catch (sErr) {
          console.warn('Server ProTalk proxy attempt failed:', sErr);
        }

        // 2. If server returned file URL but empty STT text, try STT widget directly from client
        if (voiceUrl && voiceUrl.startsWith('http') && !voiceText) {
          try {
            const encodedUrl = encodeURIComponent(voiceUrl);
            const sttRes = await fetch(`https://api.pro-talk.ru/api/v1.0/stt_from_widget?url=${encodedUrl}`);
            if (sttRes.ok) {
              const sttData = await sttRes.json();
              voiceText = sttData.text || sttData.data?.text || '';
            }
          } catch (cErr) {
            console.warn('Direct client STT fetch warning:', cErr);
          }
        }

        // 3. Fallback: Direct upload to ProTalk file server from browser if server proxy was unavailable
        if (!voiceUrl || !voiceUrl.startsWith('http')) {
          try {
            const clientFormData = new FormData();
            clientFormData.append('file', audioBlob, 'voice_message.webm');

            const uploadRes = await fetch('https://file.pro-talk.ru/upload_tmp', {
              method: 'POST',
              headers: { 'Accept': 'application/json' },
              body: clientFormData
            });

            if (uploadRes.ok) {
              const uploadData = await uploadRes.json();
              const remoteUrl = uploadData.data?.url || uploadData.url;
              if (remoteUrl) {
                voiceUrl = remoteUrl;
                const encodedUrl = encodeURIComponent(remoteUrl);
                const sttRes = await fetch(`https://api.pro-talk.ru/api/v1.0/stt_from_widget?url=${encodedUrl}`);
                if (sttRes.ok) {
                  const sttData = await sttRes.json();
                  voiceText = sttData.text || sttData.data?.text || '';
                }
              }
            }
          } catch (dErr) {
            console.warn('Direct ProTalk client upload warning:', dErr);
          }
        }

        if (!voiceUrl) {
          voiceUrl = URL.createObjectURL(audioBlob);
        }

        onVoiceProcessed({
          url: voiceUrl,
          text: voiceText.trim()
        });

        onClose();

      } catch (err: any) {
        console.error('Failed to process voice message:', err);
        setStatusText('error');
        setStatusMessage('Ошибка при обработке записи: ' + (err.message || 'Сбой сети'));
      }
    };

    mediaRecorder.stop();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sky-900/10 backdrop-blur-xs">
      {/* Container with light gradient background adhering strictly to visual instructions */}
      <div className="bg-gradient-to-r from-sky-100/95 via-pink-100/95 via-orange-100/95 via-pink-100/95 to-sky-100/95 border border-pink-200/90 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative overflow-hidden flex flex-col items-center text-center space-y-5">
        
        {/* Top Header Gradient Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400" />

        {/* Close Button */}
        <button
          onClick={() => {
            stopRecordingCleanup();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 text-slate-500 hover:text-pink-600 rounded-full bg-white/80 border border-pink-200 shadow-2xs transition-colors cursor-pointer"
          title="Закрыть"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title & Tag */}
        <div className="space-y-1.5 mt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white rounded-full text-[11px] font-black uppercase tracking-wider shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-white animate-spin" />
            <span>ИИ-Голосовой ввод</span>
          </div>
          <h3 className="text-lg font-extrabold text-slate-900">
            Запись голосового сообщения
          </h3>
          <p className="text-xs text-slate-600 font-semibold">
            Диалог с: <span className="text-pink-600 font-bold">{activeFriendName}</span>
          </p>
        </div>

        {/* AI Neural Sphere Animation Canvas (Animated continuously upon modal opening!) */}
        <div className="relative w-48 h-48 flex items-center justify-center my-1">
          <canvas
            ref={canvasRef}
            width={200}
            height={200}
            className="w-48 h-48 rounded-full shadow-inner"
          />
          {!isRecording && statusText !== 'processing' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 p-1 shadow-lg flex items-center justify-center">
                <button
                  onClick={handleStartRecordingClick}
                  className="w-full h-full bg-white rounded-full flex items-center justify-center text-pink-600 hover:scale-105 transition-transform cursor-pointer shadow-inner"
                  title="Начать запись"
                >
                  <Mic className="w-8 h-8 text-pink-600" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* DOUBLE UX: Clear guidance step for microphone permission */}
        {(statusText === 'idle' || statusText === 'permission_prompt') && !isRecording && (
          <div className="w-full bg-white/80 border border-pink-200/90 rounded-2xl p-3.5 shadow-2xs space-y-1.5 text-left">
            <div className="flex items-center gap-2 text-xs font-bold text-pink-700">
              <Mic className="w-4 h-4 text-pink-500 animate-pulse" />
              <span>Разрешите доступ к микрофону</span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
              Нажмите кнопку <strong>«Начать запись»</strong> ниже, а затем нажмите <strong>«Разрешить»</strong> во всплывающем запросе браузера. <strong className="text-pink-700">После включения микрофона НЕ обновляйте страницу</strong> (иначе настройка сбросится), а просто нажмите кнопку повторно!
            </p>
          </div>
        )}

        {/* Dynamic Voice Equalizer Bars */}
        <div className="w-full bg-white/70 border border-pink-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
            <span className="flex items-center gap-1.5 font-mono">
              <Radio className={`w-4 h-4 ${isRecording ? 'text-pink-600 animate-pulse' : 'text-slate-400'}`} />
              <span>
                {isRecording 
                  ? 'Идет запись...' 
                  : statusText === 'permission_prompt'
                  ? 'Запрос доступа к микрофону...'
                  : statusText === 'processing' 
                  ? 'Распознавание речи...' 
                  : 'Готов к записи'}
              </span>
            </span>
            <span className="font-mono text-sm font-black text-pink-600 bg-white px-2.5 py-1 rounded-lg border border-pink-200 shadow-2xs">
              {formatTime(recordingTime)}
            </span>
          </div>

          {/* Equalizer Frequency Bars */}
          <div className="h-12 flex items-end justify-center gap-1.5 px-2 py-1 bg-gradient-to-r from-sky-50 via-pink-50 to-orange-50 rounded-xl border border-pink-100 overflow-hidden">
            {equalizerBars.map((height, idx) => (
              <div
                key={idx}
                className="w-2 rounded-full bg-gradient-to-t from-sky-400 via-pink-500 to-orange-400 transition-all duration-75"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>

        {/* Status Messaging Banner */}
        {statusText === 'processing' && (
          <div className="w-full bg-gradient-to-r from-sky-100 via-pink-100 to-orange-100 border border-pink-300 rounded-xl p-3 flex items-center justify-center gap-2 text-xs font-bold text-slate-800">
            <Loader2 className="w-4 h-4 text-pink-600 animate-spin" />
            <span>{statusMessage || 'Распознавание речи...'}</span>
          </div>
        )}

        {statusText === 'error' && (
          <div className="w-full bg-white/90 border border-pink-300 rounded-2xl p-4 text-xs font-semibold text-slate-800 space-y-3 text-left shadow-sm">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-pink-600 shrink-0 mt-0.5 animate-pulse" />
              <div className="flex-1 space-y-1">
                <p className="font-extrabold text-pink-700 text-xs">{statusMessage}</p>
                <div className="text-[11px] text-slate-600 font-medium space-y-1 pt-1 bg-pink-50/60 p-2.5 rounded-xl border border-pink-100">
                  <p className="font-bold text-slate-700">Инструкция по включению микрофона:</p>
                  <ol className="list-decimal list-inside space-y-1 text-[10.5px]">
                    <li>Нажмите на иконку замочка 🔒 или микрофона в адресной строке браузера (слева от URL).</li>
                    <li>Включите параметр <strong>«Микрофон» → Разрешить (Allow)</strong>.</li>
                    <li><strong className="text-pink-600">НЕ обновляйте страницу!</strong> (При перезагрузке страницы настройка микрофона сбрасывается). Нажмите кнопку <strong>«Попробовать снова»</strong> ниже.</li>
                  </ol>
                </div>
              </div>
            </div>
            <div className="pt-1 flex items-center justify-end gap-2 border-t border-pink-100">
              <button
                type="button"
                onClick={handleStartRecordingClick}
                className="px-3.5 py-1.5 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white font-bold text-[11px] rounded-xl shadow-2xs hover:opacity-95 transition-all cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5 text-white" />
                <span>Попробовать снова</span>
              </button>
              <button
                type="button"
                onClick={() => window.open(window.location.href, '_blank')}
                className="px-3 py-1.5 bg-white border border-pink-300 text-pink-700 font-bold text-[11px] rounded-xl shadow-2xs hover:bg-pink-50 transition-all cursor-pointer"
              >
                Открыть в новой вкладке
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full flex items-center justify-center gap-3 pt-2">
          {!isRecording && statusText !== 'processing' && (
            <button
              onClick={handleStartRecordingClick}
              className="px-6 py-3 bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white font-extrabold rounded-2xl text-xs flex items-center gap-2 shadow-md hover:opacity-95 transition-all cursor-pointer active:scale-95"
            >
              {statusText === 'error' ? <RefreshCw className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{statusText === 'error' ? 'Попробовать снова' : 'Начать запись'}</span>
            </button>
          )}

          {isRecording && (
            <button
              onClick={stopRecordingAndSend}
              className="px-6 py-3 bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white font-extrabold rounded-2xl text-xs flex items-center gap-2 shadow-md hover:opacity-95 transition-all cursor-pointer active:scale-95"
            >
              <SendHorizontal className="w-4 h-4" />
              <span>Остановить и отправить</span>
            </button>
          )}

          <button
            onClick={() => {
              stopRecordingCleanup();
              onClose();
            }}
            className="px-5 py-3 bg-white/90 hover:bg-white text-slate-700 font-bold rounded-2xl text-xs border border-pink-200/80 shadow-2xs transition-all cursor-pointer"
          >
            Отмена
          </button>
        </div>

      </div>
    </div>
  );
};

export default VoiceRecorderModal;
