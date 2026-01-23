
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, Message, UserRole, Store } from '../types';
import { GoogleGenAI } from "@google/genai";

interface ChatSupportProps {
  currentUser: User | null;
  stores?: Store[];
  globalMessages?: Record<string, Message[]>;
  onSendMessage?: (channelId: string, message: Message) => void;
  onClearChat?: (channelId: string) => void;
  theme: 'light' | 'dark';
  isEmbedded?: boolean;
  forcedChannelId?: string;
  aiInstructions?: string[]; 
  decayMinutes?: number; 
}

export const ChatSupport: React.FC<ChatSupportProps> = ({ 
  currentUser, 
  stores = [], 
  globalMessages = {}, 
  onSendMessage, 
  onClearChat,
  theme, 
  isEmbedded = false,
  forcedChannelId,
  aiInstructions = [],
  decayMinutes = 0
}) => {
  const [isOpen, setIsOpen] = useState(isEmbedded);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(forcedChannelId || null);
  const [input, setInput] = useState('');
  const [channelSearchQuery, setChannelSearchQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [queueStatus, setQueueStatus] = useState<{inQueue: boolean, position: number} | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const [guestId] = useState(() => `guest-${Math.random().toString(36).substr(2, 9)}`);
  
  const activeUser: User = currentUser || {
    id: guestId,
    name: 'Guest User',
    role: UserRole.BUYER,
    email: 'guest@omni.link'
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [globalMessages, selectedChannel, isThinking, queueStatus]);

  const updateActivity = () => {
    lastActivityRef.current = Date.now();
  };

  const activeChannelName = selectedChannel === 'system' 
    ? 'Omni Global Support' 
    : stores.find(s => s.id === selectedChannel)?.name || 'Direct Inquiry';

  const messages = selectedChannel ? (globalMessages[selectedChannel] || []) : [];

  const filteredStores = useMemo(() => {
    return stores.filter(s => s.name.toLowerCase().includes(channelSearchQuery.toLowerCase()));
  }, [stores, channelSearchQuery]);

  const handleAIService = async (userMessage: string, channelId: string) => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return;

    setIsThinking(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const isSystemSupport = channelId === 'system';
      
      const systemPrompt = isSystemSupport 
        ? `You are the Omni Global Support AI. Support User: ${activeUser.name}. Role: ${activeUser.role}.`
        : `You are the Sales Agent for "${activeChannelName}". Help the visitor: ${activeUser.name}.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMessage,
        config: { systemInstruction: systemPrompt, temperature: 0.7 }
      });

      const aiResponseText = response.text || "Synchronizing...";
      
      onSendMessage?.(channelId, {
        id: `ai-${Date.now()}`,
        senderId: 'ai-agent',
        senderName: `${activeChannelName} (AI)`,
        text: aiResponseText,
        timestamp: Date.now()
      });

      updateActivity();
    } catch (error) {
      console.error(error);
    } finally {
      setIsThinking(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !selectedChannel || !onSendMessage) return;

    onSendMessage(selectedChannel, {
      id: `msg-${Date.now()}`,
      senderId: activeUser.id,
      senderName: activeUser.name,
      text,
      timestamp: Date.now()
    });
    setInput('');
    updateActivity();
    handleAIService(text, selectedChannel);
  };

  if (!isOpen && !isEmbedded) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 sm:bottom-28 sm:right-6 bg-indigo-600 text-white p-4 rounded-2xl shadow-[0_10px_30px_rgba(79,70,229,0.4)] hover:scale-105 active:scale-95 transition-all z-[150] flex items-center gap-3"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        <span className="font-black uppercase text-[10px] tracking-widest">Support</span>
      </button>
    );
  }

  return (
    <div className={`
      ${isEmbedded ? 'w-full h-full' : 'fixed inset-0 sm:inset-auto sm:bottom-28 sm:right-6 sm:w-96 sm:h-[600px] z-[200]'} 
      bg-white dark:bg-slate-900 flex flex-col sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-up
    `}>
      <div className="p-5 sm:p-6 bg-indigo-600 text-white flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          {selectedChannel && (
            <button onClick={() => setSelectedChannel(null)} className="p-2 hover:bg-white/20 rounded-xl transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
            </button>
          )}
          <div>
            <h3 className="font-black text-sm uppercase tracking-tight leading-none">{selectedChannel ? activeChannelName : 'Support Hub'}</h3>
            <p className="text-[8px] uppercase tracking-widest text-indigo-200 mt-1">Ecosystem Node Active</p>
          </div>
        </div>
        {!isEmbedded && (
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-xl transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      {!selectedChannel ? (
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-slate-950 overflow-y-auto p-4 sm:p-6 space-y-4 no-scrollbar">
           <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm mb-2">
             <input 
               type="text"
               value={channelSearchQuery}
               onChange={(e) => setChannelSearchQuery(e.target.value)}
               placeholder="Search support nodes..."
               className="w-full bg-transparent text-sm font-bold outline-none dark:text-white"
             />
           </div>
           
           <button 
              onClick={() => setSelectedChannel('system')}
              className="w-full flex items-center gap-4 p-5 bg-white dark:bg-slate-900 rounded-3xl border-2 border-transparent hover:border-indigo-600 transition-all text-left"
            >
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <div>
                <p className="font-black text-xs uppercase">Global Support</p>
                <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest">Network Admin AI</p>
              </div>
            </button>

            <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 pt-4">Marketplace Nodes</h4>
            {filteredStores.map(store => (
              <button 
                key={store.id}
                onClick={() => setSelectedChannel(store.id)}
                className="w-full flex items-center gap-4 p-5 bg-white dark:bg-slate-900 rounded-3xl hover:border-indigo-600 border-2 border-transparent transition-all text-left"
              >
                <img src={store.bannerUrl} className="w-12 h-12 rounded-2xl object-cover" alt="" />
                <div>
                  <p className="font-black text-xs uppercase">{store.name}</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Verified Vendor</p>
                </div>
              </button>
            ))}
        </div>
      ) : (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-gray-50 dark:bg-slate-950 no-scrollbar">
            {messages.map(msg => (
              <div key={msg.id} className={`flex flex-col ${msg.senderId === activeUser.id ? 'items-end' : 'items-start'}`}>
                <span className="text-[8px] text-gray-400 font-black uppercase tracking-widest mb-1.5 px-1">{msg.senderName}</span>
                <div className={`
                  max-w-[85%] px-5 py-3.5 rounded-2xl text-[13px] font-medium leading-relaxed
                  ${msg.senderId === activeUser.id 
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg' 
                    : 'bg-white dark:bg-slate-800 dark:text-white border dark:border-slate-700 rounded-tl-none shadow-sm'
                  }
                `}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex gap-2 p-2 animate-pulse">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            )}
          </div>

          <form onSubmit={handleFormSubmit} className="p-4 sm:p-6 bg-white dark:bg-slate-900 border-t dark:border-slate-800 flex gap-3 shrink-0">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your inquiry..."
              className="flex-1 bg-gray-100 dark:bg-slate-800 dark:text-white rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
            />
            <button 
              type="submit" 
              disabled={!input.trim()}
              className="bg-indigo-600 text-white p-4 rounded-2xl disabled:opacity-50 active:scale-90 transition"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </form>
        </>
      )}
    </div>
  );
};
