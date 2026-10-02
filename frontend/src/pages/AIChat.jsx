import { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import { 
  Send, 
  Bot, 
  User, 
  Trash2, 
  Sparkles,
  AlertTriangle,
  RotateCw,
  Play,
  Pause,
  Volume2,
  RefreshCw,
  X
} from 'lucide-react';

export default function AIChat() {
  const [messages, setMessages] = useState([
    { role: 'model', text: "Hello! I am your EduVoice AI tutor. Ask me any engineering concept, and I can explain it to you in simple English or Telugu!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  // Audio / Speech State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeMsgIdx, setActiveMsgIdx] = useState(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);
    setError('');
    handleStopSpeech();

    try {
      const res = await api.post('/api/ai/chat/', { message: userMessage });
      const aiResponse = res.data.response;
      setMessages(prev => [...prev, { role: 'model', text: aiResponse }]);
      
      // Auto-trigger voice read-aloud on new model response
      const newIndex = messages.length + 1;
      speakText(aiResponse, newIndex);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to send query to Gemini engine.');
      setMessages(prev => [...prev, { role: 'model', text: 'Error: Failed to fetch explanation from the server.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      { role: 'model', text: "Chat history cleared. How can I help you learn today?" }
    ]);
    setError('');
    handleStopSpeech();
  };

  // Audio / Speech State
  const currentAudioRef = useRef(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [ttsError, setTtsError] = useState('');

  const detectLanguage = (text) => {
    const teluguRegex = /[\u0c00-\u0c7f]/;
    return teluguRegex.test(text) ? 'telugu' : 'english';
  };

  const handleStopSpeech = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setIsAudioLoading(false);
    setActiveMsgIdx(null);
  };

  const speakText = async (text, index) => {
    handleStopSpeech();
    if (!text) return;

    setTtsError('');
    const lang = detectLanguage(text);
    const cleanText = text.replace(/[*_#`~[\]]/g, '');

    setIsAudioLoading(true);
    setActiveMsgIdx(index);

    try {
      const res = await api.post(
        '/api/ai/tts/',
        { text: cleanText, language: lang },
        { responseType: 'blob', timeout: 35000 }
      );

      if (res.data && res.data.type && res.data.type.includes('application/json')) {
        const textErr = await res.data.text();
        let jsonErr = {};
        try { jsonErr = JSON.parse(textErr); } catch (_) {}
        throw new Error(jsonErr.error || 'TTS audio generation failed.');
      }

      const audioBlob = new Blob([res.data], { type: 'audio/mpeg' });
      if (audioBlob.size < 100) {
        throw new Error('Received empty audio payload from TTS server.');
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      audio.onplay = () => {
        setIsAudioLoading(false);
        setIsSpeaking(true);
        setIsPaused(false);
        setActiveMsgIdx(index);
      };

      audio.onended = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        setIsAudioLoading(false);
        setActiveMsgIdx(null);
      };

      audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        handleStopSpeech();
        setTtsError(lang === 'telugu' ? 'Telugu voice audio playback failed.' : 'Voice playback failed.');
      };

      await audio.play();
    } catch (err) {
      console.error("Backend TTS error:", err);
      handleStopSpeech();

      let errMsg = err.message || "Failed to generate audio.";
      if (err.response && err.response.data instanceof Blob) {
        try {
          const errTxt = await err.response.data.text();
          const parsed = JSON.parse(errTxt);
          if (parsed.error) errMsg = parsed.error;
        } catch (_) {}
      }
      setTtsError(lang === 'telugu' ? `Telugu Voice Error: ${errMsg}` : `Voice Error: ${errMsg}`);
    }
  };

  const handlePlayPause = (text, index) => {
    if (activeMsgIdx === index && (isSpeaking || isPaused)) {
      if (currentAudioRef.current) {
        if (isPaused) {
          currentAudioRef.current.play();
          setIsPaused(false);
        } else {
          currentAudioRef.current.pause();
          setIsPaused(true);
        }
      }
    } else {
      speakText(text, index);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-2xl border border-white/5 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            AI Chat Tutor
          </h1>
          <p className="text-[10px] text-slate-400 font-semibold">General knowledge and concept helper powered by Gemini API</p>
        </div>
        <button
          onClick={handleClear}
          className="p-2 text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Clear Chat History"
        >
          <Trash2 className="w-4 h-4" />
          Clear
        </button>
      </div>

      {/* Messages Board */}
      <div className="flex-1 overflow-y-auto p-6 rounded-3xl bg-slate-950/20 border border-white/5 space-y-4 shadow-inner min-h-0">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              msg.role === 'user' ? 'bg-indigo-600/20 text-indigo-400' : 'bg-purple-600/20 text-purple-400'
            }`}>
              {msg.role === 'user' ? <User className="w-4.5 h-4.5" /> : <Bot className="w-4.5 h-4.5" />}
            </div>

            <div className={`p-4 rounded-2xl text-xs font-medium leading-relaxed ${
              msg.role === 'user'
                ? 'bg-indigo-600 text-white rounded-tr-none'
                : 'bg-slate-900/80 border border-white/5 text-slate-200 rounded-tl-none'
            }`}>
              <p className="whitespace-pre-wrap">{msg.text}</p>

              {/* Speak AI controls inside bubble */}
              {msg.role === 'model' && (
                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePlayPause(msg.text, index)}
                    className="py-1 px-2.5 bg-indigo-600/15 hover:bg-indigo-600/35 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 rounded-lg text-[9px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {isSpeaking && activeMsgIdx === index && !isPaused ? (
                      <>
                        <Pause className="w-3 h-3" />
                        Pause
                      </>
                    ) : isSpeaking && activeMsgIdx === index && isPaused ? (
                      <>
                        <Play className="w-3 h-3" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3 h-3 animate-pulse" />
                        Listen
                      </>
                    )}
                  </button>

                  {isSpeaking && activeMsgIdx === index && (
                    <>
                      <button
                        type="button"
                        onClick={() => speakText(msg.text, index)}
                        className="py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-350 rounded-lg text-[9px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Replay Audio"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Replay
                      </button>

                      <button
                        type="button"
                        onClick={handleStopSpeech}
                        className="py-1 px-2 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/10 text-rose-400 rounded-lg text-[9px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Stop Audio"
                      >
                        <X className="w-3 h-3" />
                        Stop
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 max-w-[85%] mr-auto">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0 animate-bounce">
              <Bot className="w-4.5 h-4.5" />
            </div>
            <div className="p-4 rounded-2xl text-xs bg-slate-900/80 border border-white/5 text-slate-400 rounded-tl-none flex items-center gap-2 font-semibold">
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
              Gemini is composing response...
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Tray */}
      <form onSubmit={handleSend} className="relative shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything: e.g. Explain binary search trees in simple Telugu..."
          className="w-full pl-5 pr-24 py-4 rounded-2xl glass-input text-xs font-semibold focus:border-indigo-500"
          required
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-lg transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
