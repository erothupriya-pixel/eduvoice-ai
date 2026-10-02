import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { 
  Mic, 
  Square, 
  Send, 
  MessageSquare, 
  Plus, 
  Volume2, 
  ChevronRight,
  Sparkles,
  Bot,
  User,
  ArrowRight
} from 'lucide-react';

export default function VoiceTutor() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [topicInput, setTopicInput] = useState('');
  const [textMessage, setTextMessage] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    fetchSessions();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatLoading]);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/api/tutor/sessions/');
      setSessions(res.data);
      if (res.data.length > 0 && !activeSession) {
        handleSelectSession(res.data[0]);
      }
    } catch (e) {
      console.error('Failed to load tutor sessions:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSession = async (session) => {
    setActiveSession(session);
    setLoading(true);
    try {
      const res = await api.get(`/api/tutor/sessions/${session.id}/`);
      setMessages(res.data.messages || []);
    } catch (e) {
      console.error('Failed to fetch session messages:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!topicInput.trim()) return;

    setCreateLoading(true);
    try {
      const res = await api.post('/api/tutor/sessions/', { topic: topicInput });
      setTopicInput('');
      setSessions(prev => [res.data, ...prev]);
      handleSelectSession(res.data);
    } catch (e) {
      console.error('Failed to start session:', e);
    } finally {
      setCreateLoading(false);
    }
  };

  const currentAudioRef = useRef(null);
  const [ttsError, setTtsError] = useState('');
  const [audioLoadingMsgId, setAudioLoadingMsgId] = useState(null);
  const [playingMsgId, setPlayingMsgId] = useState(null);

  const stopAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    window.speechSynthesis.cancel();
    setPlayingMsgId(null);
    setAudioLoadingMsgId(null);
  };

  // Text-To-Speech Output
  const speakTutorResponse = async (text, msgId = 'latest') => {
    setTtsError('');

    if (playingMsgId === msgId && currentAudioRef.current) {
      stopAudio();
      return;
    }

    stopAudio();
    if (!text) return;

    const cleanText = text.replace(/[*_#`~[\]]/g, '');
    const hasTelugu = /[\u0c00-\u0c7f]/.test(cleanText);
    const lang = hasTelugu ? 'telugu' : 'english';

    setAudioLoadingMsgId(msgId);

    try {
      const res = await api.post(
        '/api/documents/tts/',
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
        throw new Error('Received empty audio payload from server.');
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      audio.onplay = () => {
        setAudioLoadingMsgId(null);
        setPlayingMsgId(msgId);
      };

      audio.onended = () => {
        setPlayingMsgId(null);
        setAudioLoadingMsgId(null);
      };

      audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        setAudioLoadingMsgId(null);
        setPlayingMsgId(null);
        setTtsError(hasTelugu ? "Telugu audio playback failed." : "Audio playback failed.");
      };

      await audio.play();
    } catch (err) {
      console.error("Backend TTS error:", err);
      setAudioLoadingMsgId(null);
      setPlayingMsgId(null);

      let errMsg = err.message || "Failed to generate audio.";
      if (err.response && err.response.data instanceof Blob) {
        try {
          const errTxt = await err.response.data.text();
          const parsed = JSON.parse(errTxt);
          if (parsed.error) errMsg = parsed.error;
        } catch (_) {}
      }
      setTtsError(hasTelugu ? `Telugu Voice Error: ${errMsg}` : `Voice Error: ${errMsg}`);
    }
  };


  // Start Mic Recording
  const startRecording = async () => {
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        sendVoiceMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordDuration(0);
      timerRef.current = setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Could not access microphone. Please verify site permissions.');
    }
  };

  // Stop Mic Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Post Voice Audio message to API
  const sendVoiceMessage = async (audioBlob) => {
    if (!activeSession) return;

    setChatLoading(true);
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'speech_recording.wav');

    try {
      const res = await api.post(`/api/tutor/sessions/${activeSession.id}/chat/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { user_message, tutor_message } = res.data;
      setMessages(prev => [...prev, user_message, tutor_message]);
      speakTutorResponse(tutor_message.text_content);
    } catch (e) {
      console.error('Audio upload failed:', e);
    } finally {
      setChatLoading(false);
    }
  };

  // Send Text Message alternate
  const handleSendText = async (e) => {
    e.preventDefault();
    if (!textMessage.trim() || !activeSession) return;

    const body = textMessage;
    setTextMessage('');
    setChatLoading(true);

    try {
      const res = await api.post(`/api/tutor/sessions/${activeSession.id}/chat/`, {
        text_content: body
      });
      const { user_message, tutor_message } = res.data;
      setMessages(prev => [...prev, user_message, tutor_message]);
      speakTutorResponse(tutor_message.text_content);
    } catch (e) {
      console.error('Send text failed:', e);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto h-[calc(100vh-8rem)]">
      
      {/* Sessions Sidebar Column */}
      <div className="md:col-span-1 glass-card rounded-3xl border border-white/10 p-5 flex flex-col h-full overflow-hidden">
        <h3 className="font-bold text-slate-100 mb-4 flex items-center gap-2 text-sm">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          Sessions
        </h3>

        {/* Start new session form */}
        <form onSubmit={handleCreateSession} className="mb-6 flex gap-2">
          <input
            type="text"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            placeholder="Topic (e.g. Physics)"
            className="flex-1 px-3 py-2 rounded-xl text-xs glass-input"
            required
          />
          <button
            type="submit"
            disabled={createLoading}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all cursor-pointer shrink-0"
            title="Start session"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {sessions.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No previous sessions.</p>
          ) : (
            sessions.map((sess) => (
              <button
                key={sess.id}
                onClick={() => handleSelectSession(sess)}
                className={`w-full text-left p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all duration-300 group ${
                  activeSession?.id === sess.id
                    ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400'
                    : 'border-white/5 text-slate-400 hover:bg-white/5'
                }`}
              >
                <span className="truncate pr-2">{sess.topic}</span>
                <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Voice Chat Dialog Box Column */}
      <div className="md:col-span-3 glass-card rounded-3xl border border-white/10 flex flex-col h-full overflow-hidden relative">
        {activeSession ? (
          <>
            {/* Active Session Header Banner */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-900/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                  <Bot className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{activeSession.topic}</h4>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-400">
                    {activeSession.lecture ? 'Voice Teacher (Document Context Mode)' : 'Verbal study companion active'}
                  </span>
                </div>
              </div>
              
              {/* Mic / Live status indicator */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Voice Loop</span>
                <div className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-rose-500 animate-ping' : 'bg-indigo-500'}`} />
              </div>
            </div>

            {/* Conversation Flow */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 max-w-sm mx-auto space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 animate-bounce">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-200">Session Initialized</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Click the microphone below to talk or type a question. The AI tutor responses will be played aloud automatically.
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 max-w-[80%] ${
                      msg.sender === 'USER' ? 'ml-auto flex-row-reverse' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 ${
                      msg.sender === 'USER' 
                        ? 'bg-indigo-950 border border-indigo-500/20 text-indigo-400' 
                        : 'bg-purple-950 border border-purple-500/20 text-purple-400'
                    }`}>
                      {msg.sender === 'USER' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    <div className={`p-4 rounded-2xl border text-xs leading-relaxed relative group ${
                      msg.sender === 'USER'
                        ? 'bg-indigo-600/10 border-indigo-500/25 text-slate-200 rounded-tr-none'
                        : 'bg-slate-900/60 border-white/5 text-slate-300 rounded-tl-none'
                    }`}>
                      <p>{msg.text_content}</p>

                      {/* Play Aloud Button for AI responses */}
                      {msg.sender === 'AI' && (
                        <button
                          onClick={() => speakTutorResponse(msg.text_content)}
                          className="absolute -right-8 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                          title="Read Aloud"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}

              {/* Chat loading AI thinking */}
              {chatLoading && (
                <div className="flex gap-3 max-w-[80%]">
                  <div className="w-8 h-8 rounded-full bg-purple-950 border border-purple-500/20 text-purple-400 flex items-center justify-center text-xs shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-4 rounded-2xl border border-white/5 bg-slate-900/60 text-slate-400 text-xs rounded-tl-none flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Vocal and Text Controls Section */}
            <div className="p-4 border-t border-white/5 bg-slate-950/20 space-y-4">
              
              {/* Voice level mic area */}
              <div className="flex items-center justify-center gap-4">
                {isRecording ? (
                  <button
                    onClick={stopRecording}
                    className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-600 to-red-500 shadow-xl shadow-rose-500/20 flex flex-col items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform cursor-pointer relative"
                  >
                    {/* Ring visualizer pulses */}
                    <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-75" />
                    <Square className="w-5 h-5 relative z-10" />
                    <span className="text-[9px] font-mono font-bold mt-1 relative z-10">
                      {Math.floor(recordDuration / 60)}:{(recordDuration % 60).toString().padStart(2, '0')}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    disabled={chatLoading}
                    className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 disabled:opacity-50 shadow-xl shadow-indigo-500/20 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                  >
                    <Mic className="w-6 h-6" />
                  </button>
                )}
                
                {!isRecording && (
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    {chatLoading ? 'AI is composing...' : 'Hold mic to speak'}
                  </span>
                )}
              </div>

              {/* Alternative Text box form */}
              <form onSubmit={handleSendText} className="flex gap-2">
                <input
                  type="text"
                  value={textMessage}
                  onChange={(e) => setTextMessage(e.target.value)}
                  placeholder="Type a message instead..."
                  className="flex-1 px-4 py-3 rounded-xl text-xs glass-input"
                  disabled={chatLoading || isRecording}
                />
                <button
                  type="submit"
                  disabled={chatLoading || isRecording || !textMessage.trim()}
                  className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 max-w-sm mx-auto space-y-4">
            <Mic className="w-12 h-12 text-slate-600 animate-pulse" />
            <h3 className="font-bold text-slate-200">No Session Active</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Create a new voice session in the sidebar topic field (e.g. Science) to start practicing vocal conversations with Gemini AI.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
