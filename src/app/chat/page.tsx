'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { ChatMessage } from '@/types';
import {
  MessageSquareText,
  Send,
  Sparkles,
  BookOpen,
  AlertCircle,
  HelpCircle,
  FileText,
  Loader2,
  RefreshCw,
  User,
  Bot,
  Trash2,
  PlusCircle,
  ThumbsUp,
  ThumbsDown,
  Check,
} from 'lucide-react';

const QUICK_PROMPTS = [
  'Which topics should I study first?',
  'Explain my weak topics and why I struggled.',
  'Explain supervised learning in simple words.',
  'What is the difference between bias and variance?',
  'Explain K-means clustering with an example.',
  'Generate five interview questions from my uploaded notes.',
  'Give me a short revision summary of regression.',
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedbackState, setFeedbackState] = useState<Record<string, 'helpful' | 'unhelpful'>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/chat');
      const data = await res.json();
      if (data.success && data.messages) {
        setMessages(data.messages);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `local-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
      } else {
        throw new Error(data.error || 'Chat request failed');
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${err.message || 'Unable to connect to AI Assistant'}. Please check your connection or GROQ_API_KEY.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!confirm('Are you sure you want to clear your chat history?')) return;
    try {
      await fetch('/api/chat', { method: 'DELETE' });
      setMessages([]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInputText('');
  };

  const setFeedback = (msgId: string, type: 'helpful' | 'unhelpful') => {
    setFeedbackState((prev) => ({
      ...prev,
      [msgId]: type,
    }));
  };

  return (
    <AppLayout
      title="AI Study Assistant"
      subtitle="Ask questions grounded in your course materials, explore explanations, and diagnose weak topics"
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleNewChat}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-xs"
            title="Start new conversation"
          >
            <PlusCircle className="w-3.5 h-3.5 text-indigo-600" />
            <span>New Chat</span>
          </button>
          <button
            type="button"
            onClick={handleClearChat}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-rose-50 hover:text-rose-600 shadow-xs"
            title="Clear all chat history"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        </div>
      }
    >
      <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-14rem)] bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Chat Header Notice */}
        <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-700">
              RAG Active: Grounded in CS301 Textbook, Syllabus & Lecture Notes
            </span>
          </div>
          <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium border border-indigo-200">
            Groq LLaMA 3.3
          </span>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {messages.length === 0 && (
            <div className="text-center py-16 px-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-4 shadow-sm">
                <Bot className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900">How can I help you study today?</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Ask me about concepts from your uploaded study materials, request exam explanations, or ask which topics you need to revise first!
              </p>
            </div>
          )}

          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const feedback = feedbackState[msg.id];

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[88%] ${
                  isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-purple-100 text-purple-700 border border-purple-200 shadow-xs'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-800 border border-slate-200/80 shadow-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Grounded Citations Box */}
                  {!isUser && msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-1.5">
                      <div className="text-[11px] font-bold text-indigo-700 flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Source Citations from Uploaded Materials:</span>
                      </div>
                      {msg.citations.map((cite, cIdx) => (
                        <div
                          key={cIdx}
                          className="p-2 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-600"
                        >
                          <div className="font-semibold text-slate-800">
                            {cite.source} (Page {cite.page})
                          </div>
                          {cite.textExcerpt && (
                            <div className="text-slate-500 italic mt-0.5 line-clamp-2">
                              "{cite.textExcerpt}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Message Footer: Timestamp + Helpful / Not Helpful */}
                  <div
                    className={`mt-3 pt-2 border-t flex items-center justify-between text-[10px] ${
                      isUser
                        ? 'border-indigo-500/50 text-indigo-200'
                        : 'border-slate-200/60 text-slate-400'
                    }`}
                  >
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    {!isUser && (
                      <div className="flex items-center gap-2">
                        {feedback ? (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Thanks for your feedback!</span>
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">Helpful?</span>
                            <button
                              onClick={() => setFeedback(msg.id, 'helpful')}
                              className="p-1 hover:text-emerald-600 hover:bg-slate-200/50 rounded"
                              title="Helpful"
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setFeedback(msg.id, 'unhelpful')}
                              className="p-1 hover:text-rose-600 hover:bg-slate-200/50 rounded"
                              title="Not helpful"
                            >
                              <ThumbsDown className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 max-w-[80%] mr-auto">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Searching study materials and generating answer...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-4 py-2 border-t border-slate-100 bg-white flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            Suggested:
          </span>
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              className="px-2.5 py-1 rounded-full bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border border-slate-200 text-[11px] shrink-0 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Message Input Box */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask a question about your uploaded notes or weak topics..."
              className="flex-1 text-xs sm:text-sm px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-slate-50/50"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Send question"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
