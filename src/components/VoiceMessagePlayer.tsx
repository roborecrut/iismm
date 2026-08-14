import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Bot, Copy, Check, Sparkles, Volume2, RefreshCw, FileText } from 'lucide-react';

interface VoiceMessagePlayerProps {
  audioUrl: string;
  initialText?: string;
  sender?: 'me' | 'them';
  onTextUpdated?: (newText: string) => void;
}

export const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({
  audioUrl,
  initialText = '',
  sender = 'them',
  onTextUpdated
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showTranscription, setShowTranscription] = useState(!!initialText && initialText !== '🎤 Голосовое сообщение');
  const [transcribedText, setTranscribedText] = useState(initialText || '');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(err => console.error('Audio playback error:', err));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleTranscribeWithProTalk = async () => {
    if (showTranscription && transcribedText && transcribedText !== '🎤 Голосовое сообщение') {
      setShowTranscription(!showTranscription);
      return;
    }

    setIsTranscribing(true);
    try {
      let voiceText = '';

      // 1. Fetch audio file blob
      const audioBlobRes = await fetch(audioUrl);
      const audioBlob = await audioBlobRes.blob();

      // 2. Try server endpoint /api/protalk-stt
      try {
        const formData = new FormData();
        formData.append('file', audioBlob, 'voice_message.webm');

        const res = await fetch('/api/protalk-stt', {
          method: 'POST',
          body: formData
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.text) {
            voiceText = data.text;
          } else if (data.url && data.url.startsWith('http')) {
            // If server uploaded file but STT call returned empty text, call STT directly from client
            const encodedUrl = encodeURIComponent(data.url);
            const sttRes = await fetch(`https://api.pro-talk.ru/api/v1.0/stt_from_widget?url=${encodedUrl}`);
            if (sttRes.ok) {
              const sttData = await sttRes.json();
              voiceText = sttData.text || sttData.data?.text || '';
            }
          }
        }
      } catch (sErr) {
        console.warn('Server STT attempt failed:', sErr);
      }

      // 3. Fallback: direct browser upload to file.pro-talk.ru and call stt_from_widget
      if (!voiceText) {
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
              const encodedUrl = encodeURIComponent(remoteUrl);
              const sttRes = await fetch(`https://api.pro-talk.ru/api/v1.0/stt_from_widget?url=${encodedUrl}`);
              if (sttRes.ok) {
                const sttData = await sttRes.json();
                voiceText = sttData.text || sttData.data?.text || '';
              }
            }
          }
        } catch (cErr) {
          console.warn('Direct client ProTalk upload failed:', cErr);
        }
      }

      if (voiceText) {
        setTranscribedText(voiceText);
        setShowTranscription(true);
        if (onTextUpdated) onTextUpdated(voiceText);
      } else {
        setTranscribedText(initialText || 'Речь в аудиозаписи не распознана.');
        setShowTranscription(true);
      }
    } catch (err) {
      console.error('STT Error:', err);
      setTranscribedText(initialText || 'Ошибка подключения к сервису ProTalk STT.');
      setShowTranscription(true);
    } finally {
      setIsTranscribing(false);
    }
  };

  const copyToClipboard = () => {
    if (!transcribedText) return;
    navigator.clipboard.writeText(transcribedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate 20 pseudo waveform bars
  const waveformHeights = [30, 45, 80, 60, 40, 90, 75, 50, 85, 95, 60, 70, 85, 40, 65, 90, 50, 70, 40, 30];

  return (
    <div className="w-full max-w-sm my-1 text-left select-none">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Main Player Box - Soft Gradient Background */}
      <div className="bg-gradient-to-r from-sky-100/90 via-pink-100/90 via-orange-100/90 via-pink-100/90 to-sky-100/90 border border-pink-200/90 rounded-2xl p-2.5 shadow-2xs flex items-center gap-2.5">
        
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlayPause}
          className="w-9 h-9 rounded-xl bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white flex items-center justify-center shrink-0 shadow-2xs hover:opacity-95 transition-all cursor-pointer active:scale-95"
          title={isPlaying ? 'Пауза' : 'Воспроизвести'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-white text-white" /> : <Play className="w-4 h-4 fill-white text-white ml-0.5" />}
        </button>

        {/* Waveform & Progress */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-700 mb-1">
            <span className="flex items-center gap-1">
              <Volume2 className="w-3 h-3 text-pink-500" />
              <span>Голосовое</span>
            </span>
            <span className="text-[9px] text-slate-500">
              {formatTime(currentTime)} / {formatTime(duration || 0)}
            </span>
          </div>

          {/* Interactive Waveform / Slider */}
          <div className="relative w-full h-4 flex items-center gap-0.5 cursor-pointer group">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
            />
            {waveformHeights.map((h, i) => {
              const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
              const barProgress = (i / waveformHeights.length) * 100;
              const isPassed = barProgress <= progress;

              return (
                <div
                  key={i}
                  style={{ height: `${h}%` }}
                  className={`flex-1 rounded-full transition-all duration-150 ${
                    isPassed 
                      ? 'bg-gradient-to-b from-sky-400 via-pink-500 to-orange-400' 
                      : 'bg-pink-200/80 group-hover:bg-pink-300'
                  } ${isPlaying && isPassed ? 'animate-pulse' : ''}`}
                />
              );
            })}
          </div>
        </div>

        {/* Speech Recognition STT Button */}
        <button
          type="button"
          onClick={handleTranscribeWithProTalk}
          disabled={isTranscribing}
          title="Распознать голос в текст"
          className="p-2 bg-white/90 border border-pink-300 text-pink-700 rounded-xl text-[10px] font-extrabold flex items-center gap-1 hover:bg-pink-50 transition-all shrink-0 cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
        >
          {isTranscribing ? (
            <RefreshCw className="w-4 h-4 animate-spin text-pink-500" />
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              <FileText className="w-3.5 h-3.5 text-orange-500" />
            </>
          )}
        </button>
      </div>

      {/* Recognized Text Panel */}
      {showTranscription && transcribedText && (
        <div className="mt-1.5 bg-gradient-to-r from-sky-50/90 via-pink-50/90 via-orange-50/90 to-sky-50/90 border border-pink-200 rounded-xl p-2.5 text-xs text-slate-800 shadow-2xs relative group">
          <div className="flex items-center justify-between text-[10px] font-bold text-pink-600 mb-1 border-b border-pink-200/60 pb-1">
            <span className="flex items-center gap-1">
              <Bot className="w-3.5 h-3.5 text-pink-500" />
              <span>ИИ-Распознавание речи:</span>
            </span>
            <button
              type="button"
              onClick={copyToClipboard}
              className="p-1 hover:bg-pink-100 rounded-md transition-colors text-pink-700 cursor-pointer flex items-center gap-1 text-[9px]"
              title="Скопировать текст"
            >
              {copied ? <Check className="w-3 h-3 text-pink-600" /> : <Copy className="w-3 h-3 text-pink-600" />}
              <span>{copied ? 'Скопировано' : 'Копия'}</span>
            </button>
          </div>
          <p className="font-medium text-slate-700 leading-relaxed text-[11px] select-text">
            {transcribedText}
          </p>
        </div>
      )}
    </div>
  );
};

export default VoiceMessagePlayer;
