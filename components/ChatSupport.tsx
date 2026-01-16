
import React, { useState, useEffect, useRef } from 'react';
import { User, Message, UserRole, Store } from '../types';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

  useEffect(() => {
    if (decayMinutes <= 0 || !selectedChannel || !onClearChat) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const diffMins = (now - lastActivityRef.current) / 1000 / 60;
      if (diffMins >= decayMinutes) {
        const currentMsgs = globalMessages[selectedChannel] || [];
        if (currentMsgs.length > 0) {
          onClearChat(selectedChannel);
        }
      }
    }, 15000); 
    return () => clearInterval(interval);
  }, [decayMinutes, selectedChannel, globalMessages, onClearChat]);

  const updateActivity = () => {
    lastActivityRef.current = Date.now();
  };

  const activeChannelName = selectedChannel === 'system' 
    ? 'Omni Global Support' 
    : stores.find(s => s.id === selectedChannel)?.name || 'Direct Inquiry';

  const messages = selectedChannel ? (globalMessages[selectedChannel] || []) : [];

  const handleAIService = async (userMessage: string, channelId: string) => {
    if (!process.env.API_KEY) return;
    setIsThinking(true);
    try {
      const isSystemSupport = channelId === 'system';
      
      const systemPrompt = isSystemSupport 
        ? `You are the Omni Global Support AI. You assist users (Buyers and Sellers).
           User Name: ${activeUser.name}. User Role: ${activeUser.role}.
           If the user asks for a "human", "admin", or "manager", respond with exactly: "[ESCALATE] Protocol initiated. Connecting to a live Omni Admin..."
           Common tasks: Helping sellers with verification, explaining commission (10%), or assisting guests with navigation.`
        : `You are the Sales Agent for the store "${activeChannelName}". 
           Visitor: ${activeUser.name}. Status: ${currentUser ? 'Verified' : 'Guest'}.
           Custom Rules: ${aiInstructions.length > 0 ? aiInstructions.join(". ") : "Be professional and help sell products."}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMessage,
        config: { systemInstruction: systemPrompt, temperature: 0.7 }
      });

      const aiResponseText = response.text || "Synchronizing with support hub... Please restate your query.";
      
      onSendMessage?.(channelId, {
        id: `ai-${Date.now()}`,
        senderId: 'ai-agent',
        senderName: `${activeChannelName} (AI)`,
        text: aiResponseText,
        timestamp: Date.now()
      });

      if (aiResponseText.includes('[ESCALATE]')) {
        setQueueStatus({ inQueue: true, position: Math.floor(Math.random() * 3) + 1 });
      }

      updateActivity();
    } catch (error) {
      console.error("Support Interface Error:", error);
    } finally {
      setIsThinking(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !selectedChannel || !onSendMessage) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: activeUser.id,
      senderName: activeUser.name,
      text,
      timestamp: Date.now()
    };

    onSendMessage(selectedChannel, newMessage);
    setInput('');
    updateActivity();

    const targetStore = stores.find(s => s.id === selectedChannel);
    const isSystemAdmin = (selectedChannel === 'system' && currentUser?.role === UserRole.ADMIN);
    const isStoreOwner = (targetStore && currentUser?.id === targetStore.sellerId);

    if (!isSystemAdmin && !isStoreOwner && !queueStatus?.inQueue) {
      handleAIService(text, selectedChannel);
    }
  };

  const ChannelList = (
    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-slate-950 no-scrollbar">
      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6">Available Channels</h4>
      <button 
        onClick={() => { setSelectedChannel('system'); updateActivity(); }}
        className="w-full flex items-center gap-4 p-5 bg-white dark:bg-slate-900 rounded-3xl border-2 border-transparent hover:border-indigo-600 shadow-sm transition-all text-left group"
      >
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        </div>
        <div className="flex-1">
          <p className="font-black text-sm">Omni Global Support</p>
          <p className="text-[10px] text-indigo-500 uppercase font-black">AI Managed Support</p>
        </div>
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
      </button>

      {stores.length > 0 && <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mt-8 mb-6">Marketplace Stores</h4>}
      {stores.map(store => (
        <button 
          key={store.id}
          onClick={() => { setSelectedChannel(store.id); updateActivity(); }}
          className="w-full flex items-center gap-4 p-5 bg-white dark:bg-slate-900 rounded-3xl border-2 border-transparent hover:border-indigo-600 shadow-sm transition-all text-left group"
        >
          <img src={store.bannerUrl} className="w-12 h-12 rounded-2xl object-cover" alt="" />
          <div>
            <p className="font-black text-sm">{store.name}</p>
            <p className="text-[10px] text-gray-400 uppercase font-black">Vendor Node</p>
          </div>
        </button>
      ))}
    </div>
  );

  if (!isOpen && !isEmbedded) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all z-[100] border-4 border-white dark:border-slate-950 flex items-center gap-2"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        <span className="font-black uppercase text-[10px] tracking-widest pr-2">Chat Support</span>
      </button>
    );
  }

  return (
    <div className={`${isEmbedded ? 'w-full h-full' : 'fixed bottom-6 right-6 w-80 md:w-96 h-[550px] shadow-2xl z-[100] rounded-3xl'} bg-white dark:bg-slate-900 flex flex-col border dark:border-slate-800 overflow-hidden animate-slide-up`}>
      <div className="p-5 bg-indigo-600 text-white flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          {selectedChannel && !forcedChannelId && (
            <button onClick={() => setSelectedChannel(null)} className="hover:bg-white/20 p-2 rounded-xl transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
            </button>
          )}
          <div>
            <h3 className="font-black text-sm tracking-tight">{selectedChannel ? activeChannelName : 'Omni Support'}</h3>
            {queueStatus?.inQueue && <p className="text-[7px] uppercase tracking-widest text-indigo-200 animate-pulse">Awaiting Omni Admin...</p>}
            {!selectedChannel && <p className="text-[7px] uppercase tracking-widest text-indigo-200">Select a support node</p>}
          </div>
        </div>
        {!isEmbedded && (
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-xl transition active:scale-90">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      {!selectedChannel ? ChannelList : (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-950 no-scrollbar">
            {messages.length === 0 && (
              <div className="py-10 text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Protocol Initialized</p>
                <p className="text-xs text-gray-400 mt-2">Send a message to begin.</p>
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`flex flex-col ${msg.senderId === activeUser.id ? 'items-end' : 'items-start'}`}>
                <span className="text-[9px] text-gray-400 mb-1 px-1 font-black uppercase tracking-widest">{msg.senderName}</span>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm font-medium ${msg.senderId === activeUser.id ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 dark:text-white border dark:border-slate-700 rounded-tl-none'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {queueStatus?.inQueue && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-6 rounded-3xl text-center space-y-3 animate-slide-up mt-4">
                <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto shadow-sm">
                   <div className="w-3 h-3 bg-indigo-600 rounded-full animate-ping"></div>
                </div>
                <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Admin Queue Position: #{queueStatus.position}</p>
                <p className="text-[10px] font-bold text-gray-400">Estimated wait: {queueStatus.position * 2} minutes</p>
              </div>
            )}

            {isThinking && (
              <div className="flex flex-col items-start animate-pulse p-2">
                <div className="bg-white dark:bg-slate-800 w-16 h-10 rounded-2xl flex items-center justify-center gap-1.5 border dark:border-slate-700">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.3s]"></div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleFormSubmit} className="p-4 bg-white dark:bg-slate-900 border-t dark:border-slate-800 flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={queueStatus?.inQueue ? "Awaiting admin connection..." : "Query support agent..."}
              disabled={queueStatus?.inQueue}
              className="flex-1 bg-gray-100 dark:bg-slate-800 dark:text-white rounded-2xl px-5 py-3.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
            />
            <button 
              type="submit" 
              disabled={!input.trim() || queueStatus?.inQueue}
              className="bg-indigo-600 text-white p-4 rounded-2xl hover:bg-indigo-700 transition active:scale-90 disabled:opacity-50"
            >
              <svg className="w-6 h-6 rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
            </button>
          </form>
        </>
      )}
    </div>
  );
};
