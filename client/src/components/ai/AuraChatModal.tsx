import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Bot, User, ArrowRight, Star, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { IAuraChatResponse } from '../../types';

interface Message {
  sender: 'user' | 'aura';
  text: string;
  products?: any[];
  isFallback?: boolean;
}

const DEFAULT_PROMPTS = [
  'Find a good laptop under ₹60,000',
  'Where is my latest order?',
  'Recommend noise-cancelling headphones',
  'What is your return policy?'
];

export const AuraChatModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'aura',
      text: "Hi! I'm **AURA AI**, your AuraMart shopping assistant. Tell me what you're looking for, and I'll help you find the right product, check live deals, or track your orders!"
    }
  ]);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>(DEFAULT_PROMPTS);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages, isLoading]);

  const handleSendMessage = async (msgToSend?: string) => {
    const text = (msgToSend || inputMessage).trim();
    if (!text || isLoading) return;

    setInputMessage('');
    setMessages(prev => [...prev, { sender: 'user', text }]);
    setIsLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: text });
      if (res.data.success) {
        const data: IAuraChatResponse = res.data.data;
        setMessages(prev => [
          ...prev,
          {
            sender: 'aura',
            text: data.reply,
            products: data.products,
            isFallback: data.isFallback
          }
        ]);
        if (data.suggestedQueries && data.suggestedQueries.length > 0) {
          setSuggestedPrompts(data.suggestedQueries);
        }
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'aura',
          text: "I'm having a brief connection issue. Please try asking again in a moment!"
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating launcher button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 group flex items-center gap-2.5 bg-gradient-to-r from-aura-navy via-aura-indigo to-aura-violet text-white pl-4 pr-5 py-3 rounded-full shadow-modal hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20"
          aria-label="Open AURA AI Assistant"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center relative">
            <Sparkles className="w-4 h-4 text-white animate-spin-slow" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-aura-green rounded-full border-2 border-aura-navy animate-pulse" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold leading-tight">Ask AURA AI</span>
            <span className="text-[10px] text-indigo-200 leading-tight">Shopping Assistant</span>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[580px] max-h-[85vh] bg-white rounded-3xl shadow-modal border border-aura-border flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="bg-aura-navy text-white px-5 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-aura-indigo to-aura-violet flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm text-white">AURA AI</h3>
                  <span className="bg-green-500/20 text-green-300 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    Online
                  </span>
                </div>
                <p className="text-[11px] text-gray-300">Catalog-Grounded Shopping Assistant</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-aura-bg">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'aura' && (
                  <div className="w-7 h-7 rounded-full bg-aura-indigo text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className="flex flex-col max-w-[85%]">
                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-aura-indigo text-white rounded-tr-none font-medium'
                        : 'bg-white text-aura-navy border border-aura-border shadow-subtle rounded-tl-none'
                    }`}
                  >
                    {/* Render basic bold formatting */}
                    <div className="whitespace-pre-line">
                      {m.text}
                    </div>

                    {m.isFallback && (
                      <div className="mt-2 text-[10px] text-gray-400 italic border-t pt-1 border-gray-100">
                        ⚡ AuraMart catalog-grounded assistant
                      </div>
                    )}
                  </div>

                  {/* Matching Products Cards inside Chat */}
                  {m.products && m.products.length > 0 && (
                    <div className="mt-2.5 space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-aura-textSecondary">
                        Recommended Matches:
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {m.products.map(p => (
                          <Link
                            key={p._id}
                            to={`/products/${p._id}`}
                            onClick={() => setIsOpen(false)}
                            className="bg-white p-2.5 rounded-xl border border-aura-border hover:border-aura-indigo hover:shadow-md transition-all flex items-center gap-3 group"
                          >
                            <img
                              src={p.image}
                              alt={p.title}
                              className="w-12 h-12 object-cover rounded-lg border shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-aura-textPrimary group-hover:text-aura-indigo truncate">
                                {p.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-bold text-aura-navy">
                                  ₹{p.discountedPrice.toLocaleString('en-IN')}
                                </span>
                                <div className="flex items-center text-[10px] text-amber-600 font-bold">
                                  <Star className="w-3 h-3 fill-amber-500 text-amber-500 mr-0.5" />
                                  {p.rating}
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-aura-indigo shrink-0" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {m.sender === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-aura-navy text-white flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 items-center">
                <div className="w-7 h-7 rounded-full bg-aura-indigo text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white px-4 py-2.5 rounded-2xl rounded-tl-none border border-aura-border flex items-center gap-1.5 shadow-subtle">
                  <span className="w-1.5 h-1.5 bg-aura-indigo rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-aura-indigo rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-aura-indigo rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts Strip */}
          <div className="px-4 py-2 bg-white border-t border-aura-border overflow-x-auto no-scrollbar flex gap-1.5 shrink-0">
            {suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="text-[11px] whitespace-nowrap bg-indigo-50/70 hover:bg-indigo-100 text-aura-indigo font-medium px-2.5 py-1 rounded-full transition-colors border border-indigo-100"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-aura-border shrink-0">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask about products, orders, returns..."
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                disabled={isLoading}
                className="flex-1 bg-gray-50 text-xs px-3.5 py-2.5 rounded-xl border border-aura-border focus:outline-none focus:border-aura-indigo focus:bg-white text-aura-textPrimary"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="bg-aura-indigo hover:bg-indigo-600 disabled:opacity-40 text-white p-2.5 rounded-xl transition-colors shadow-sm shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      )}
    </>
  );
};

