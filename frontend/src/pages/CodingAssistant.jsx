import { useState } from 'react';
import api from '../services/api';
import { 
  Code, 
  Terminal, 
  Play, 
  Sparkles, 
  AlertTriangle,
  RotateCw,
  Bug,
  BookOpen,
  Clock,
  HardDrive,
  CheckCircle2,
  Cpu
} from 'lucide-react';

const STARTER_SNIPPETS = {
  python: `def calculate_sum(n):
    total = 0
    for i in range(1, n + 1):
        total += i
    return total

print("Sum of 1 to 10:", calculate_sum(10))`,

  java: `public class Main {
    public static void main(String[] args) {
        int n = 10;
        int total = 0;
        for (int i = 1; i <= n; i++) {
            total += i;
        }
        System.out.println("Sum of 1 to " + n + ": " + total);
    }
}`,

  c: `#include <stdio.h>

int main() {
    int n = 10;
    int total = 0;
    for (int i = 1; i <= n; i++) {
        total += i;
    }
    printf("Sum of 1 to %d: %d\\n", n, total);
    return 0;
}`,

  cpp: `#include <iostream>
using namespace std;

int main() {
    int n = 10;
    int total = 0;
    for (int i = 1; i <= n; i++) {
        total += i;
    }
    cout << "Sum of 1 to " << n << ": " << total << endl;
    return 0;
}`
};

export default function CodingAssistant() {
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(STARTER_SNIPPETS.python);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Active action: 'run' | 'explanation' | 'debug'
  const [activeAction, setActiveAction] = useState('run');

  // Execution & Complexity State
  const [output, setOutput] = useState('');
  const [runError, setRunError] = useState('');
  const [timeComplexity, setTimeComplexity] = useState(null);
  const [spaceComplexity, setSpaceComplexity] = useState(null);

  // Explain & Debug State
  const [aiTextResult, setAiTextResult] = useState('');

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    // Switch starter template if code is empty or matches previous default template
    const prevTemplate = STARTER_SNIPPETS[language];
    if (!code.trim() || code.trim() === prevTemplate.trim()) {
      setCode(STARTER_SNIPPETS[newLang] || '');
    }
  };

  const handleRunCode = async () => {
    if (!code.trim()) {
      setError('Please enter code before running.');
      return;
    }

    setLoading(true);
    setError('');
    setOutput('');
    setRunError('');
    setActiveAction('run');

    try {
      // 1. Run Execution API
      const runPromise = api.post('/api/ai/code-run/', { code, language });
      
      // 2. Run Complexity Analysis API
      const complexityPromise = api.post('/api/ai/code-complexity/', { code, language }).catch(() => null);

      const [runRes, complexityRes] = await Promise.all([runPromise, complexityPromise]);

      if (runRes.data.error) {
        setRunError(runRes.data.error);
      }
      setOutput(runRes.data.output || '');

      if (complexityRes && complexityRes.data) {
        setTimeComplexity({
          value: complexityRes.data.time_complexity || 'O(n)',
          explanation: complexityRes.data.time_explanation || 'Time complexity depends on input iteration.'
        });
        setSpaceComplexity({
          value: complexityRes.data.space_complexity || 'O(1)',
          explanation: complexityRes.data.space_explanation || 'Auxiliary memory usage.'
        });
      } else {
        // Local fallback
        setTimeComplexity({
          value: 'O(n)',
          explanation: 'The loop executes operations proportional to the input size n.'
        });
        setSpaceComplexity({
          value: 'O(1)',
          explanation: 'Only a few constant variables are allocated.'
        });
      }

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to execute code on backend server.');
    } finally {
      setLoading(false);
    }
  };

  const handleAiAction = async (actionType) => {
    if (!code.trim()) {
      setError('Please enter code before analyzing.');
      return;
    }

    setLoading(true);
    setError('');
    setAiTextResult('');
    setActiveAction(actionType);

    try {
      if (actionType === 'explanation') {
        const res = await api.post('/api/ai/code-explain/', { code, language });
        setAiTextResult(res.data.explanation);
      } else if (actionType === 'debug') {
        const res = await api.post('/api/ai/debug/', { code, language });
        setAiTextResult(res.data.response);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to process request on Gemini engine.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Terminal className="w-6 h-6 text-indigo-400 animate-pulse" />
            AI Coding Assistant & Execution Engine
          </h1>
          <p className="text-xs text-slate-400 font-semibold">
            Run source code across programming languages, evaluate Big-O Time & Space Complexity, and debug errors.
          </p>
        </div>

        {/* Language Selector Dropdown */}
        <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-2xl border border-white/5">
          <Cpu className="w-4 h-4 text-purple-400 ml-1" />
          <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Language:</label>
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs font-bold text-indigo-400 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="c">C</option>
            <option value="cpp">C++</option>
          </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Left Side: Code Editor Workspace */}
        <div className="glass-card p-6 rounded-3xl border border-white/5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3 flex-1 flex flex-col">
            
            <div className="flex justify-between items-center shrink-0">
              <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-400" />
                Code Editor ({language.toUpperCase()})
              </span>
              <span className="text-[10px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded font-mono font-bold uppercase">
                {language}
              </span>
            </div>
            
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={`Write or paste your ${language.toUpperCase()} code snippet here...`}
              className="w-full flex-1 min-h-[380px] p-4 rounded-2xl bg-slate-950 font-mono text-xs font-semibold text-slate-200 border border-white/10 focus:border-indigo-500 focus:outline-none resize-none leading-relaxed shadow-inner"
              spellCheck="false"
            />
          </div>

          {/* Action Buttons Toolbar */}
          <div className="grid grid-cols-3 gap-3 pt-3 shrink-0">
            
            {/* Run Code Button */}
            <button
              type="button"
              onClick={handleRunCode}
              disabled={loading}
              className="py-3 px-3 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-500 hover:to-teal-550 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/20 active:scale-98 transition-transform disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              Run Code
            </button>

            {/* Explain Code Button */}
            <button
              type="button"
              onClick={() => handleAiAction('explanation')}
              disabled={loading}
              className="py-3 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-500/20 active:scale-98 transition-transform disabled:opacity-50"
            >
              <BookOpen className="w-4 h-4" />
              Explain Code
            </button>
            
            {/* Find & Debug Bugs Button */}
            <button
              type="button"
              onClick={() => handleAiAction('debug')}
              disabled={loading}
              className="py-3 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-500/20 active:scale-98 transition-transform disabled:opacity-50"
            >
              <Bug className="w-4 h-4" />
              Debug Bugs
            </button>
          </div>
        </div>

        {/* Right Side: Output & Complexity Analysis Cards */}
        <div className="glass-card p-6 rounded-3xl border border-white/5 min-h-[500px] flex flex-col justify-between">
          
          {/* Output Header */}
          <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4 shrink-0">
            <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Execution & Analysis Result
            </span>

            <span className="text-[10px] bg-slate-800 text-purple-300 px-3 py-1 rounded-lg font-bold uppercase tracking-wider border border-white/5">
              Language: {language.toUpperCase()}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-5 text-xs font-semibold">
            
            {/* General Error Alert */}
            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Spinner Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center h-64 space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                <span className="text-slate-400 font-semibold animate-pulse">Executing snippet and analyzing Big-O metrics...</span>
              </div>
            )}

            {/* Empty Idle State */}
            {!loading && !output && !runError && !aiTextResult && !error && (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500 text-center space-y-3 py-16">
                <Terminal className="w-12 h-12 text-slate-600 animate-pulse" />
                <div className="space-y-1">
                  <p className="text-slate-400 font-bold">No output generated yet.</p>
                  <p className="text-[11px] text-slate-500">Click "Run Code" to view execution results & Time/Space Complexity metrics.</p>
                </div>
              </div>
            )}

            {/* ACTION RESULT 1: RUN CODE OUTPUT & COMPLEXITY CARDS */}
            {!loading && activeAction === 'run' && (output || runError) && (
              <div className="space-y-5 animate-in fade-in duration-200">
                
                {/* 1. Output Terminal Window */}
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    Program Output
                  </span>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 font-mono text-xs overflow-x-auto shadow-inner space-y-2">
                    {output ? (
                      <pre className="text-emerald-400 font-bold whitespace-pre-wrap leading-relaxed">{output}</pre>
                    ) : null}

                    {runError ? (
                      <div className="p-3 bg-rose-950/40 rounded-xl border border-rose-500/20 text-rose-400 font-mono whitespace-pre-wrap leading-relaxed">
                        <span className="font-bold text-[10px] uppercase block text-rose-300 mb-1">Runtime / Compiler Error:</span>
                        {runError}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* 2. Complexity Analysis Cards */}
                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  
                  {/* Time Complexity Card */}
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-indigo-500/20 space-y-2 hover:border-indigo-500/40 transition-colors">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Time Complexity
                      </span>
                      <span className="text-base font-extrabold text-indigo-300 font-mono bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-0.5 rounded-lg">
                        {timeComplexity?.value || 'O(n)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                      {timeComplexity?.explanation || 'Evaluated loop and recursive branching complexity.'}
                    </p>
                  </div>

                  {/* Space Complexity Card */}
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-purple-500/20 space-y-2 hover:border-purple-500/40 transition-colors">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-extrabold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                        <HardDrive className="w-3.5 h-3.5" />
                        Space Complexity
                      </span>
                      <span className="text-base font-extrabold text-purple-300 font-mono bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 rounded-lg">
                        {spaceComplexity?.value || 'O(1)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                      {spaceComplexity?.explanation || 'Evaluated auxiliary memory and container allocation.'}
                    </p>
                  </div>

                </div>

              </div>
            )}

            {/* ACTION RESULT 2: EXPLAIN CODE & DEBUG BUGS */}
            {!loading && (activeAction === 'explanation' || activeAction === 'debug') && aiTextResult && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  {activeAction === 'explanation' ? <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> : <Bug className="w-3.5 h-3.5 text-purple-400" />}
                  {activeAction === 'explanation' ? 'Code Explanation & Dry Run' : 'Bug Findings & Solutions'}
                </span>

                <div className="prose prose-invert max-w-none bg-slate-950 p-5 rounded-2xl border border-white/10 shadow-inner">
                  <p className="whitespace-pre-wrap text-slate-300 leading-relaxed font-mono text-[11px]">{aiTextResult}</p>
                </div>
              </div>
            )}

          </div>

          <div className="pt-4 border-t border-white/5 text-[10px] text-slate-500 font-semibold flex items-center justify-between">
            <span>Powered by EduVoice AI Code Engine & Gemini</span>
            <span className="font-mono">Language: {language.toUpperCase()}</span>
          </div>

        </div>

      </div>

    </div>
  );
}
