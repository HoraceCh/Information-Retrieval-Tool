import React, { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Square, Loader2, Sparkles, AlertCircle, Check, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { transcribeWithProvider } from "../services/speech/speechService";
import { SPEECH_PROVIDERS, type SpeechProviderId } from "../services/speech/speechProviders.mjs";

interface AudioTranscriberProps {
  geminiKey?: string;
  speechProxyUrl?: string;
  onTranscribe: (text: string) => void;
  uiLang?: string;
  disabled?: boolean;
}

export const AudioTranscriber: React.FC<AudioTranscriberProps> = ({
  geminiKey,
  speechProxyUrl,
  onTranscribe,
  uiLang = "mix",
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [providerId, setProviderId] = useState<SpeechProviderId>(() => {
    try {
      const saved = localStorage.getItem("ai_retrieval_speech_provider");
      return SPEECH_PROVIDERS.some(provider => provider.id === saved) ? saved as SpeechProviderId : "gemini";
    } catch { return "gemini"; }
  });
  const selectedProvider = SPEECH_PROVIDERS.find(provider => provider.id === providerId) || SPEECH_PROVIDERS[0];
  const [proxyBaseUrl, setProxyBaseUrl] = useState(() => {
    try { return localStorage.getItem("ai_retrieval_speech_proxy_url") || ""; }
    catch { return ""; }
  });
  const effectiveProxyBaseUrl = proxyBaseUrl.trim() || speechProxyUrl;
  const saveProxyBaseUrl = (next: string) => {
    setProxyBaseUrl(next);
    try {
      if (next.trim()) localStorage.setItem("ai_retrieval_speech_proxy_url", next.trim());
      else localStorage.removeItem("ai_retrieval_speech_proxy_url");
    } catch { /* storage is optional */ }
  };
  const saveProvider = (next: SpeechProviderId) => {
    setProviderId(next);
    try { localStorage.setItem("ai_retrieval_speech_provider", next); } catch { /* storage is optional */ }
    setErrorMsg(null);
  };
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const mountedRef = useRef(false);
  const startPendingRef = useRef(false);
  const startRequestIdRef = useRef(0);
  const transcriptionAbortRef = useRef<AbortController | null>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      startRequestIdRef.current += 1;
      startPendingRef.current = false;
      transcriptionAbortRef.current?.abort();
      transcriptionAbortRef.current = null;
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
      cleanupAudio();
    };
  }, []);

  const cleanupAudio = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

  const startRecording = async () => {
    if (startPendingRef.current || isRecording || isTranscribing) return;
    startPendingRef.current = true;
    const requestId = ++startRequestIdRef.current;
    setErrorMsg(null);
    setSuccessNotice(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg(
        uiLang === "zh" || uiLang === "mix"
          ? "您的浏览器不支持麦克风录音功能，请使用现代浏览器 (Chrome / Edge / Firefox / Safari)。"
          : "Your browser does not support audio recording. Please use Chrome, Edge, Firefox, or Safari."
      );
      startPendingRef.current = false;
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      if (!mountedRef.current || requestId !== startRequestIdRef.current) {
        stream.getTracks().forEach(track => track.stop());
        if (requestId === startRequestIdRef.current) startPendingRef.current = false;
        return;
      }
      streamRef.current = stream;

      // Setup audio analyzer for live volume waveform
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          analyserRef.current = analyser;
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          const updateLevel = () => {
            if (!mountedRef.current || requestId !== startRequestIdRef.current || !analyserRef.current) return;
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
            animFrameRef.current = requestAnimationFrame(updateLevel);
          };
          updateLevel();
        }
      } catch (e) {
        console.warn("AudioContext analyzer setup ignored:", e);
      }

      // Determine best supported MIME type
      let mimeType = "audio/webm";
      if (typeof MediaRecorder.isTypeSupported === "function") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          mimeType = "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
          mimeType = "audio/webm";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
          mimeType = "audio/ogg";
        } else if (MediaRecorder.isTypeSupported("audio/wav")) {
          mimeType = "audio/wav";
        }
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        cleanupAudio();
        mediaRecorderRef.current = null;
        if (!mountedRef.current) return;
        setIsRecording(false);
        setRecordDuration(0);

        if (audioBlob.size < 500) {
          setErrorMsg(
            uiLang === "zh" || uiLang === "mix"
              ? "录音时长过短，请长按或对着麦克风说话后再试。"
              : "Audio is too short. Please speak into your microphone and try again."
          );
          return;
        }

        // Dispatch through the selected speech provider
        await handleTranscription(audioBlob);
      };

      recorder.start(250);
      startPendingRef.current = false;
      setIsRecording(true);
      setRecordDuration(0);

      // Duration counter (limit to 60 seconds)
      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => {
          if (prev >= 60) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      if (requestId === startRequestIdRef.current) startPendingRef.current = false;
      if (requestId !== startRequestIdRef.current || !mountedRef.current) return;
      cleanupAudio();
      setIsRecording(false);
      console.error("Microphone Access Error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMsg(
          uiLang === "zh" || uiLang === "mix"
            ? "麦克风访问被拒绝。请在浏览器地址栏允许麦克风权限后重试。"
            : "Microphone permission denied. Please allow microphone access in your browser."
        );
      } else {
        setErrorMsg(
          uiLang === "zh" || uiLang === "mix"
            ? `无法启动录音设备: ${err.message || "未知错误"}`
            : `Could not access microphone: ${err.message || "Unknown error"}`
        );
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn("Error stopping recorder:", e);
      }
    }
  };

  const cancelRecording = () => {
    startRequestIdRef.current += 1;
    startPendingRef.current = false;
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      if (mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {}
      }
    }
    cleanupAudio();
    setIsRecording(false);
    setRecordDuration(0);
    setErrorMsg(null);
  };

  const cancelTranscription = () => {
    transcriptionAbortRef.current?.abort();
    transcriptionAbortRef.current = null;
    setIsTranscribing(false);
    setErrorMsg(null);
  };

  const handleTranscription = async (audioBlob: Blob) => {
    if (!mountedRef.current) return;
    const controller = new AbortController();
    transcriptionAbortRef.current?.abort();
    transcriptionAbortRef.current = controller;
    setIsTranscribing(true);
    setErrorMsg(null);

    try {
      const text = await transcribeWithProvider(providerId, audioBlob, { geminiKey, proxyBaseUrl: effectiveProxyBaseUrl, signal: controller.signal });
      if (!mountedRef.current || controller.signal.aborted) return;
      if (!text) {
        setErrorMsg(
          uiLang === "zh" || uiLang === "mix"
            ? "未识别到有效语音内容，请重新清晰口述检索需求。"
            : "No audible speech recognized. Please speak clearly and try again."
        );
      } else {
        onTranscribe(text);
        setSuccessNotice(
          uiLang === "zh" || uiLang === "mix"
            ? `已转写: "${text.length > 25 ? text.slice(0, 25) + "..." : text}"`
            : `Transcribed: "${text.length > 25 ? text.slice(0, 25) + "..." : text}"`
        );
        if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
        successTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) setSuccessNotice(null);
          successTimeoutRef.current = null;
        }, 4000);
      }
    } catch (err: any) {
      if (!mountedRef.current || controller.signal.aborted) return;
      let details = err.message;
      try {
        const parsed = JSON.parse(err.message);
        details = parsed.details || parsed.detail || parsed.title || err.message;
      } catch (_) {}
      setErrorMsg(details);
    } finally {
      if (transcriptionAbortRef.current === controller) transcriptionAbortRef.current = null;
      if (mountedRef.current) setIsTranscribing(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="relative inline-flex items-center gap-2">
      {!isRecording && !isTranscribing && (
        <select
          id="speech-provider-select"
          aria-label={uiLang === "zh" || uiLang === "mix" ? "语音识别引擎" : "Speech recognition engine"}
          value={providerId}
          onChange={(event) => saveProvider(event.target.value as SpeechProviderId)}
          disabled={disabled}
          className="max-w-[132px] rounded-lg border border-slate-600/30 bg-slate-800/70 px-2 py-1.5 text-[10px] text-slate-200 outline-none focus:border-cyan-500"
        >
          {SPEECH_PROVIDERS.map(provider => (
            <option key={provider.id} value={provider.id}>{provider.label}</option>
          ))}
        </select>
      )}
      {selectedProvider.requiresProxy && !isRecording && !isTranscribing && (
        <label className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <span className="whitespace-nowrap">{uiLang === "zh" || uiLang === "mix" ? "服务地址" : "Service URL"}</span>
          <input
            id="speech-proxy-url"
            type="url"
            aria-label={uiLang === "zh" || uiLang === "mix" ? "语音服务地址" : "Speech service URL"}
            value={proxyBaseUrl}
            onChange={(event) => saveProxyBaseUrl(event.target.value)}
            placeholder={speechProxyUrl || "http://127.0.0.1:8000"}
            autoComplete="url"
            className="w-44 max-w-[34vw] rounded-lg border border-slate-600/30 bg-slate-800/70 px-2 py-1.5 text-[10px] text-slate-200 outline-none focus:border-cyan-500 placeholder:text-slate-500"
          />
        </label>
      )}

      {/* Default State: Trigger Button */}
      {!isRecording && !isTranscribing && (
        <button
          type="button"
          onClick={startRecording}
          disabled={disabled}
          title={
            uiLang === "zh" || uiLang === "mix"
              ? `语音转文字 · ${selectedProvider.label}`
              : `Voice input · ${selectedProvider.label}`
          }
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-500/20 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 text-xs font-semibold transition-all cursor-pointer shadow-sm hover:shadow-[0_0_12px_rgba(6,182,212,0.2)] disabled:opacity-40 disabled:cursor-not-allowed group select-none"
        >
          <Mic size={14} className="text-cyan-400 group-hover:scale-110 transition-transform" />
          <span>{uiLang === "zh" || uiLang === "mix" ? "语音输入" : "Voice Input"}</span>
          <span className="text-[10px] px-1 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300/80 font-mono scale-90">
            {selectedProvider.shortLabel}
          </span>
        </button>
      )}

      {/* Recording Active State */}
      {isRecording && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-red-950/40 border border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.25)] text-xs text-red-200"
        >
          {/* Pulsing indicator */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="font-mono font-bold text-red-300 text-xs">
              {formatTime(recordDuration)} / 01:00
            </span>
          </div>

          {/* Dynamic Audio Level Meter */}
          <div className="flex items-center gap-0.5 h-4 w-12 px-1 bg-black/40 rounded border border-white/5">
            {[0.3, 0.6, 0.9, 0.7, 0.4].map((scale, i) => {
              const height = Math.max(15, Math.min(100, audioLevel * scale * 1.5));
              return (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-red-500 to-amber-300 rounded-full transition-all duration-75"
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>

          {/* Stop & Transcribe Button */}
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-all shadow-md cursor-pointer select-none"
          >
            <Square size={12} className="fill-current" />
            <span>{uiLang === "zh" || uiLang === "mix" ? "完成并转写" : "Transcribe"}</span>
          </button>

          {/* Cancel Button */}
          <button
            type="button"
            onClick={cancelRecording}
            className="text-slate-400 hover:text-white px-1.5 py-1 text-[11px] transition-colors cursor-pointer select-none"
          >
            {uiLang === "zh" || uiLang === "mix" ? "取消" : "Cancel"}
          </button>
        </motion.div>
      )}

      {/* Transcribing State */}
      {isTranscribing && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-cyan-950/50 border border-cyan-500/40 text-cyan-200 text-xs shadow-[0_0_15px_rgba(6,182,212,0.2)]"
        >
          <Loader2 size={14} className="animate-spin text-cyan-400" />
          <span className="font-medium">
            {uiLang === "zh" || uiLang === "mix"
              ? `正在使用 ${selectedProvider.label} 转写...`
              : `Transcribing with ${selectedProvider.label}...`}
          </span>
          <button type="button" onClick={cancelTranscription} className="rounded-md px-2 py-1 text-[11px] text-cyan-200/80 hover:bg-cyan-800/50 hover:text-white">
            {uiLang === "zh" || uiLang === "mix" ? "取消" : "Cancel"}
          </button>
        </motion.div>
      )}

      {/* Success notice popup */}
      <AnimatePresence>
        {successNotice && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute left-0 top-full mt-2 z-30 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs shadow-xl backdrop-blur-md whitespace-nowrap"
          >
            <Check size={13} className="text-emerald-400 shrink-0" />
            <span className="max-w-[280px] truncate">{successNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error display */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute left-0 top-full mt-2 z-30 max-w-sm flex items-start gap-2 p-2.5 rounded-lg bg-red-950/90 border border-red-500/40 text-red-200 text-xs shadow-xl backdrop-blur-md"
          >
            <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-[11px] leading-tight">{errorMsg}</div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-red-400 hover:text-white text-xs px-1 cursor-pointer"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
