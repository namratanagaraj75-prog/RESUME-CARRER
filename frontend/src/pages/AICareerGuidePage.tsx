import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  User,
  Send,
  Sparkles,
  HelpCircle,
  Copy,
  Check,
  RotateCw,
  Lightbulb,
  Target,
  Flame,
  ArrowRight
} from 'lucide-react';
import { ResumeWorkflowState } from '../types';
import { api } from '../api';

interface AICareerGuidePageProps {
  state: ResumeWorkflowState | null;
  onGoToResume: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const AICareerGuidePage: React.FC<AICareerGuidePageProps> = ({ state, onGoToResume }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const targetRole = state?.skill_gap_results?.target_role_title || state?.career_match_results?.top_match?.title || 'Target Career';
  const matchScore = state?.career_match_results?.top_match?.match_percentage || 0;

  useEffect(() => {
    const welcomeMessage = state
      ? `Welcome! I am your AI Career Guide. I compare your resume with the application's curated role templates.\n\nYour profile has a **${matchScore}% text similarity** with **${targetRole}**.\n\nI have loaded ${state.extracted_skills?.total_count || 0} detected skill mentions and ${state.skill_gap_results?.missing_required?.length || 0} required skills not detected in the resume. How can I help you plan next steps?`
      : `Hello! I am your AI Career Guidance Advisor.\n\nLoad or select a resume to get advice grounded in detected skills, role-template similarity, and skill gaps.`;
    setMessages([{
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
    setInput('');
  }, [state, targetRole, matchScore]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const context = state
        ? {
            top_match_title: targetRole,
            match_score: matchScore,
            extracted_skills: state.extracted_skills?.skills || [],
            missing_required: state.skill_gap_results?.missing_required || [],
            missing_preferred: state.skill_gap_results?.missing_preferred || [],
            education: state.preprocessed_data?.sections?.education || '',
          }
        : {};

      const response = await api.chat(text, history, context);
      const assistantMsg: Message = {
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an issue processing your query. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const suggestedPrompts = [
    'Why is my match score what it is?',
    'What critical skills am I missing?',
    'What skill should I learn first?',
    'How can I improve my resume bullet points?',
    'What portfolio project will have the highest leverage?',
    'Explain my mathematical analysis.',
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col h-[calc(100vh-5rem)] pb-6">
      {/* Top Context Pill */}
      <div className="glass-panel rounded-2xl p-3.5 border border-slate-800 mb-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-300">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>AI Career Guidance Intelligence</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-brand-500/30 text-brand-200 font-mono">
                Context-Grounded
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Active Context: <strong className="text-brand-300">{targetRole}</strong> ({matchScore}% ML Match)
            </div>
          </div>
        </div>

        {!state && (
          <button
            onClick={onGoToResume}
            className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-500 transition-colors"
          >
            Load Resume
          </button>
        )}
      </div>

      {/* Chat Messages Scroll Container */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={idx}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-800 text-brand-400 border border-slate-700'
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed relative group ${
                  isUser
                    ? 'bg-brand-600/90 text-white rounded-tr-none'
                    : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-line font-sans prose prose-invert max-w-none text-xs">
                  {m.content}
                </div>

                <div
                  className={`mt-2 text-[10px] flex items-center justify-between gap-3 ${
                    isUser ? 'text-brand-200' : 'text-slate-500'
                  }`}
                >
                  <span>{m.timestamp}</span>
                  {!isUser && (
                    <button
                      onClick={() => copyToClipboard(m.content, idx)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white flex items-center gap-1"
                      title="Copy response"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-[9px]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span className="text-[9px]">Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-slate-800 text-brand-400 border border-slate-700 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-3 text-xs text-slate-400 flex items-center gap-2">
              <RotateCw className="h-3.5 w-3.5 animate-spin text-brand-400" />
              <span>Analyzing resume vectors and synthesizing career advice...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts Strip */}
      <div className="mt-3 pt-3 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium mb-1.5">
          <Lightbulb className="h-3 w-3 text-amber-400" />
          <span>Suggested Questions:</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
          {suggestedPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-white whitespace-nowrap transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="mt-2 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask about your ${targetRole} match, skill gaps, or resume advice...`}
          disabled={isLoading}
          className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-brand-500/20"
        >
          <span>Send</span>
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
};
