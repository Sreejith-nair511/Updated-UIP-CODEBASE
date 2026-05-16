"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, Send, X, MessageSquare, Volume2, VolumeX, Trash2, Cpu, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ML_SERVICE_URL } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: string;
}

type Lang = "en" | "hi" | "ta" | "te" | "kn";

const LANG_LABELS: Record<Lang, string> = {
  en: "English", hi: "हिंदी", ta: "தமிழ்", te: "తెలుగు", kn: "ಕನ್ನಡ",
};

const LANG_VOICES: Record<Lang, string> = {
  en: "en-IN", hi: "hi-IN", ta: "ta-IN", te: "te-IN", kn: "kn-IN",
};

const QUICK_PROMPTS = [
  "Is there any leak right now?",
  "Explain the current prediction",
  "What does the frequency spike mean?",
  "What action should I take?",
  "Check device status",
];

// ── Speech helpers ────────────────────────────────────────────────────────────

function speak(text: string, lang: Lang) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = LANG_VOICES[lang];
  utt.rate = 0.95;
  utt.pitch = 1;
  const voices = window.speechSynthesis.getVoices();
  const match = voices.find((v) => v.lang.startsWith(LANG_VOICES[lang]));
  if (match) utt.voice = match;
  window.speechSynthesis.speak(utt);
}

// ── Main component ────────────────────────────────────────────────────────────

export function AssistantDock() {
  const [open, setOpen]           = useState(false);
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn]     = useState(true);
  const [lang, setLang]           = useState<Lang>("en");
  const [showLang, setShowLang]   = useState(false);
  const [unread, setUnread]       = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recogRef  = useRef<any>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clear unread when opened
  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  // ── Send message ────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text.trim(), ts: new Date().toLocaleTimeString() };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${ML_SERVICE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), language: lang }),
        signal: AbortSignal.timeout(15000),
      });

      const data = res.ok ? await res.json() : null;
      const reply = data?.reply ?? "System data unavailable. Please check the ML service connection.";

      const asstMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: reply, ts: new Date().toLocaleTimeString() };
      setMessages((p) => [...p, asstMsg]);

      if (voiceOn) speak(reply, lang);
      if (!open) setUnread((n) => n + 1);

    } catch {
      const errMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "System data unavailable. Please check sensor connection.", ts: new Date().toLocaleTimeString() };
      setMessages((p) => [...p, errMsg]);
    } finally {
      setLoading(false);
    }
  }, [loading, lang, voiceOn, open]);

  // ── Voice recording ─────────────────────────────────────────────────────────
  const toggleListening = useCallback(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Speech recognition not supported in this browser."); return; }

    if (listening) {
      recogRef.current?.stop();
      setListening(false);
      return;
    }

    const recog = new SR();
    recog.lang = LANG_VOICES[lang];
    recog.continuous = false;
    recog.interimResults = false;
    recogRef.current = recog;

    recog.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setListening(false);
      sendMessage(transcript);
    };
    recog.onerror = () => setListening(false);
    recog.onend   = () => setListening(false);
    recog.start();
    setListening(true);
  }, [listening, lang, sendMessage]);

  // ── Hardware command shortcut ───────────────────────────────────────────────
  const runCommand = async (cmd: string) => {
    try {
      const res = await fetch(`${ML_SERVICE_URL}/api/device/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
      });
      const data = await res.json();
      const msg: Message = { id: Date.now().toString(), role: "assistant", content: data.message, ts: new Date().toLocaleTimeString() };
      setMessages((p) => [...p, msg]);
      if (voiceOn) speak(data.message, lang);
    } catch {
      const msg: Message = { id: Date.now().toString(), role: "assistant", content: "Device command failed.", ts: new Date().toLocaleTimeString() };
      setMessages((p) => [...p, msg]);
    }
  };

  return (
    <>
      {/* ── Floating button ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all",
          "bg-indigo-600 hover:bg-indigo-700 text-white",
          open && "rotate-180"
        )}
        aria-label="AI Assistant"
      >
        {open ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
            {unread}
          </span>
        )}
      </button>

      {/* ── Panel ── */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-80 sm:w-96 flex flex-col rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
          style={{ maxHeight: "calc(100vh - 120px)" }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
                <Cpu className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Leak AI</p>
                <p className="text-xs text-gray-400">Groq · llama3-70b</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Language selector */}
              <div className="relative">
                <button onClick={() => setShowLang((s) => !s)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  {lang.toUpperCase()} <ChevronDown className="w-3 h-3" />
                </button>
                {showLang && (
                  <div className="absolute right-0 top-8 w-32 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg z-10 overflow-hidden">
                    {(Object.entries(LANG_LABELS) as [Lang, string][]).map(([code, label]) => (
                      <button key={code} onClick={() => { setLang(code); setShowLang(false); }}
                        className={cn("w-full text-left px-3 py-2 text-xs transition-colors hover:bg-gray-50 dark:hover:bg-gray-800",
                          lang === code ? "text-indigo-600 font-medium" : "text-gray-700 dark:text-gray-300")}>
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Voice toggle */}
              <button onClick={() => setVoiceOn((v) => !v)}
                className={cn("p-1.5 rounded-lg transition-colors", voiceOn ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-950" : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800")}>
                {voiceOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              {/* Clear */}
              <button onClick={() => setMessages([])}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
            {messages.length === 0 && (
              <div className="text-center py-6">
                <p className="text-sm text-gray-400 mb-4">Ask me about your water pipes</p>
                <div className="space-y-1.5">
                  {QUICK_PROMPTS.map((p) => (
                    <button key={p} onClick={() => sendMessage(p)}
                      className="block w-full text-left text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
                {m.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                  m.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-sm"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm"
                )}>
                  <p className="leading-relaxed">{m.content}</p>
                  <p className={cn("text-xs mt-1", m.role === "user" ? "text-indigo-200" : "text-gray-400")}>{m.ts}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center flex-shrink-0">
                  <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    {[0,1,2].map((i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick hardware commands */}
          <div className="px-3 pb-2 flex gap-1.5 flex-shrink-0">
            {[["restart","Restart"],["reconnect","Reconnect"],["status","Status"]].map(([cmd, label]) => (
              <button key={cmd} onClick={() => runCommand(cmd)}
                className="flex-1 text-xs py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                {label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="px-3 pb-3 flex-shrink-0">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                placeholder={listening ? "Listening..." : "Ask anything..."}
                disabled={loading || listening}
                className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none"
              />
              <button onClick={toggleListening}
                className={cn("p-1.5 rounded-lg transition-colors flex-shrink-0",
                  listening ? "bg-red-100 text-red-600 animate-pulse" : "text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950")}>
                {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
                className="p-1.5 rounded-lg bg-indigo-600 text-white disabled:opacity-40 hover:bg-indigo-700 transition-colors flex-shrink-0">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}