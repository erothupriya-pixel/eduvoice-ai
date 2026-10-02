import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { 
  HelpCircle, 
  Send, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Bot, 
  User, 
  Sparkles, 
  FileText, 
  AlertCircle,
  Globe,
  Loader2
} from 'lucide-react';

export default function DoubtSessionView({ activeDocument, onClose }) {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [questionInput, setQuestionInput] = useState('');
  const [language, setLanguage] = useState('telugu'); // default 'telugu'
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);

  // Audio Playback states
  const [audioLoadingMsgId, setAudioLoadingMsgId] = useState(null);
  const [playingMsgId, setPlayingMsgId] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [ttsError, setTtsError] = useState('');
  
  const currentAudioRef = useRef(null);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    fetchDoubtSessions();
    return () => {
      stopAudio();
    };
  }, [activeDocument]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const fetchDoubtSessions = async () => {
    setInitLoading(true);
    try {
      const docParam = activeDocument ? `?document_id=${activeDocument.id}` : '';
      const res = await api.get(`/api/documents/doubt-sessions/${docParam}`);
      setSessions(res.data);
      
      if (res.data.length > 0) {
        loadSessionDetails(res.data[0].id);
      } else {
        createNewSession();
      }
    } catch (err) {
      console.error("Failed to load doubt sessions:", err);
      setInitLoading(false);
    }
  };

  const createNewSession = async () => {
    try {
      const payload = {
        document_id: activeDocument?.id || null,
        topic: activeDocument ? `Doubts: ${activeDocument.original_filename}` : 'General Doubt Session'
      };
      const res = await api.post('/api/documents/doubt-sessions/', payload);
      setActiveSessionId(res.data.id);
      setMessages([]);
      setSessions(prev => [res.data, ...prev]);
    } catch (err) {
      console.error("Failed to create new doubt session:", err);
    } finally {
      setInitLoading(false);
    }
  };

  const loadSessionDetails = async (sessionId) => {
    setActiveSessionId(sessionId);
    setInitLoading(true);
    try {
      const res = await api.get(`/api/documents/doubt-sessions/${sessionId}/`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error("Failed to load session details:", err);
    } finally {
      setInitLoading(false);
    }
  };

  const stopAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    window.speechSynthesis.cancel();
    setPlayingMsgId(null);
    setIsPaused(false);
    setAudioLoadingMsgId(null);
  };

  const playVoiceForMessage = async (msgId, text, msgLanguage) => {
    setTtsError('');

    if (playingMsgId === msgId && currentAudioRef.current) {
      if (isPaused) {
        currentAudioRef.current.play();
        setIsPaused(false);
      } else {
        currentAudioRef.current.pause();
        setIsPaused(true);
      }
      return;
    }

    stopAudio();
    setAudioLoadingMsgId(msgId);

    try {
      const res = await api.post(
        '/api/documents/tts/',
        { text, language: msgLanguage },
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
        throw new Error('Received empty audio file from TTS server.');
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      audio.onplay = () => {
        setAudioLoadingMsgId(null);
        setPlayingMsgId(msgId);
        setIsPaused(false);
      };

      audio.onended = () => {
        setPlayingMsgId(null);
        setIsPaused(false);
        setAudioLoadingMsgId(null);
      };

      audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        setAudioLoadingMsgId(null);
        setPlayingMsgId(null);
        setIsPaused(false);
        setTtsError(msgLanguage === 'telugu' ? 'Telugu voice audio playback failed.' : 'Voice playback failed.');
      };

      await audio.play();

    } catch (err) {
      console.error("Backend TTS error:", err);
      setAudioLoadingMsgId(null);
      setPlayingMsgId(null);
      setIsPaused(false);

      let errMsg = err.message || "Voice playback failed.";
      if (err.response && err.response.data instanceof Blob) {
        try {
          const errTxt = await err.response.data.text();
          const parsed = JSON.parse(errTxt);
          if (parsed.error) errMsg = parsed.error;
        } catch (_) {}
      }
      setTtsError(msgLanguage === 'telugu' ? `Telugu Voice Error: ${errMsg}` : `Voice Error: ${errMsg}`);
    }
  };

  const handleAskDoubt = async (e, customText = null) => {
    if (e) e.preventDefault();
    const textToAsk = customText || questionInput.trim();
    if (!textToAsk || loading) return;

    if (!customText) setQuestionInput('');
    setLoading(true);
    setTtsError('');

    const tempStudentMsg = {
      id: `temp-${Date.now()}`,
      sender: 'STUDENT',
      text_content: textToAsk,
      language: language,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempStudentMsg]);

    try {
      const res = await api.post('/api/documents/doubt-sessions/ask/', {
        session_id: activeSessionId,
        document_id: activeDocument?.id || null,
        question: textToAsk,
        language: language
      });

      const { session_id, student_message, ai_message } = res.data;
      if (!activeSessionId) setActiveSessionId(session_id);

      setMessages(prev => [
        ...prev.filter(m => m.id !== tempStudentMsg.id),
        student_message,
        ai_message
      ]);

      playVoiceForMessage(ai_message.id, ai_message.text_content, ai_message.language);

    } catch (err) {
      console.error("Failed to ask doubt:", err);
      const errorMsg = {
        id: `err-${Date.now()}`,
        sender: 'AI',
        text_content: err.response?.data?.error || "Doubt query failed. Please check your internet connection and try again.",
        language: language,
        context_found: false,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-3xl border border-indigo-500/20 p-6 space-y-5 bg-slate-900/40 relative overflow-hidden">
      
      {/* Doubt Session Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Doubt Session
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                AI Teacher
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5 flex items-center gap-1.5">
              {activeDocument ? (
                <>
                  <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Document Context: <strong className="text-slate-200">{activeDocument.original_filename}</strong></span>
                </>
              ) : (
                <span>Ask any doubt from your study material or engineering topics</span>
              )}
            </p>
          </div>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-2 bg-slate-950/40 p-1.5 rounded-2xl border border-white/10 self-stretch sm:self-auto justify-center">
          <button
            type="button"
            onClick={() => setLanguage('telugu')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
              language === 'telugu'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            🇮🇳 తెలుగు (Simple Telugu)
          </button>

          <button
            type="button"
            onClick={() => setLanguage('english')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
              language === 'english'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            🇬🇧 English
          </button>
        </div>
      </div>

      {/* TTS Error Banner */}
      {ttsError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{ttsError}</span>
        </div>
      )}

      {/* Chat Conversation Area */}
      <div className="min-h-[350px] max-h-[500px] overflow-y-auto p-4 space-y-4 rounded-2xl bg-slate-950/30 border border-white/5">
        {initLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <span className="text-xs text-slate-400 font-semibold animate-pulse">Initializing Doubt Session...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center animate-bounce">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-200">No Doubts Asked Yet</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              {language === 'telugu'
                ? 'మీరు ఇక్కడ ఏ సందేహాన్నైనా (doubt) అడగవచ్చు. AI Lecturer మీకు చాలా తేలికైన వాడుక తెలుగులో (Simple Spoken Telugu) ఉదాహరణలతో వివరిస్తారు.'
                : 'Ask any doubt related to your uploaded study material or engineering topics. AI Lecturer will explain step-by-step with simple examples.'}
            </p>

            {/* Quick Suggestion Chips */}
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={(e) => handleAskDoubt(e, language === 'telugu' ? 'What is the main topic of this document?' : 'What is the main topic of this document?')}
                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/40 text-xs text-slate-300 font-semibold hover:text-indigo-300 transition-all cursor-pointer"
              >
                💡 Explain main concepts
              </button>
              <button
                type="button"
                onClick={(e) => handleAskDoubt(e, language === 'telugu' ? 'కష్టమైన టాపిక్స్ ని simple గా వివరిస్తారా?' : 'Can you explain the hardest concept simply?')}
                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/40 text-xs text-slate-300 font-semibold hover:text-indigo-300 transition-all cursor-pointer"
              >
                💡 Explain difficult topic with example
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isStudent = msg.sender === 'STUDENT' || msg.sender === 'USER';
            const isPlaying = playingMsgId === msg.id;
            const isAudioLoading = audioLoadingMsgId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${isStudent ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 ${
                  isStudent 
                    ? 'bg-indigo-950 border border-indigo-500/30 text-indigo-300' 
                    : 'bg-purple-950 border border-purple-500/30 text-purple-300'
                }`}>
                  {isStudent ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2 relative group ${
                  isStudent
                    ? 'bg-indigo-600/15 border-indigo-500/30 text-slate-100 rounded-tr-none'
                    : 'bg-slate-900/80 border-white/10 text-slate-200 rounded-tl-none shadow-md'
                }`}>
                  
                  {/* Context notice badge if present */}
                  {!isStudent && msg.context_found === false && (
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{msg.language === 'telugu' ? 'గమనిక: ఈ సమాచారం document లో లేదు (General Explanation)' : 'Note: Information not found in uploaded document (General Explanation)'}</span>
                    </div>
                  )}

                  <p className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed">
                    {msg.text_content}
                  </p>

                  {/* Voice Button for AI Answers */}
                  {!isStudent && (
                    <div className="pt-2 border-t border-white/5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => playVoiceForMessage(msg.id, msg.text_content, msg.language)}
                        disabled={isAudioLoading}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                          isPlaying
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20'
                        }`}
                      >
                        {isAudioLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Generating Voice...</span>
                          </>
                        ) : isPlaying && !isPaused ? (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            <span>Pause Voice</span>
                          </>
                        ) : isPlaying && isPaused ? (
                          <>
                            <Play className="w-3.5 h-3.5" />
                            <span>Resume Voice</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
                            <span>{msg.language === 'telugu' ? 'Listen in Telugu (తెలుగు Voice)' : 'Listen in English'}</span>
                          </>
                        )}
                      </button>

                      {isPlaying && (
                        <button
                          type="button"
                          onClick={stopAudio}
                          className="p-1.5 rounded-lg bg-rose-950/20 text-rose-400 border border-rose-500/10 hover:bg-rose-950/30 text-[10px] font-bold cursor-pointer"
                          title="Stop Voice"
                        >
                          <VolumeX className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                </div>
              </div>
            );
          })
        )}

        {/* Loading Spinner during doubt processing */}
        {loading && (
          <div className="flex gap-3 max-w-[85%]">
            <div className="w-8 h-8 rounded-full bg-purple-950 border border-purple-500/30 text-purple-300 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 rounded-2xl border border-white/10 bg-slate-900/80 text-slate-400 text-xs rounded-tl-none flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
              <span className="text-[10px] font-semibold text-slate-400 ml-2">
                {language === 'telugu' ? 'తెలుగులో సులభంగా వివరిస్తున్నారు...' : 'Lecturer is formulating simple answer...'}
              </span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Box Form */}
      <form onSubmit={(e) => handleAskDoubt(e)} className="flex gap-2">
        <input
          type="text"
          value={questionInput}
          onChange={(e) => setQuestionInput(e.target.value)}
          placeholder={
            language === 'telugu'
              ? 'మీకు ఉన్న సందేహాన్ని అడగండి (e.g. Normalization అంటే ఏమిటి? నాకు అర్థం కాలేదు)'
              : 'Ask your doubt here... (e.g. What is normalization in DBMS? I don\'t understand it.)'
          }
          className="flex-1 px-4 py-3 rounded-2xl text-xs glass-input focus:border-indigo-500 text-slate-100 placeholder:text-slate-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !questionInput.trim()}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer transition-all shrink-0"
        >
          <Send className="w-4 h-4" />
          <span>Ask Doubt</span>
        </button>
      </form>

    </div>
  );
}
