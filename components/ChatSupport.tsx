import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, Message, UserRole, Store, SiteConfig } from '../types';
import { GoogleGenAI } from "@google/genai";
import { Icons } from '../constants';

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
  config?: SiteConfig;
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
  decayMinutes = 0,
  config
}) => {
  const [isOpen, setIsOpen] = useState(isEmbedded);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(forcedChannelId || null);
  const [input, setInput] = useState('');
  const [channelSearchQuery, setChannelSearchQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [attachment, setAttachment] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  }, [globalMessages, selectedChannel, isThinking, attachment]);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size too large. Max 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAIService = async (userMessage: string, userAttachment: string | null, channelId: string) => {
    // Check Env Var first, then fallback to Site Config
    const effectiveKey = process.env.API_KEY || config?.geminiApiKey;
    
    if (!effectiveKey) {
      onSendMessage?.(channelId, {
        id: `ai-err-${Date.now()}`,
        senderId: 'ai-agent',
        senderName: 'System',
        text: "System Alert: AI Agent offline. API Key configuration missing on server or admin settings.",
        timestamp: Date.now()
      });
      return;
    }

    setIsThinking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: effectiveKey });
      const isSystemSupport = channelId === 'system';
      
      const systemPrompt = isSystemSupport 
        ? `You are the Omni Global Support AI. Support User: ${activeUser.name}. Role: ${activeUser.role}. You can see images the user uploads. Analyze them if provided.`
        : `You are the Sales Agent for "${activeChannelName}". Help the visitor: ${activeUser.name}. If they upload an image of a product, analyze it, describe it, and suggest if we might have something similar.`;

      // Construct content parts
      const parts: any[] = [{ text: userMessage }];
      
      if (userAttachment) {
        // userAttachment is data:image/png;base64,....
        const base64Data = userAttachment.split(',')[1];
        const mimeType = userAttachment.split(';')[0].split(':')[1];
        
        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: parts },
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
      onSendMessage?.(channelId, {
        id: `ai-err-${Date.now()}`,
        senderId: 'ai-agent',
        senderName: 'System',
        text: "Agent connection interrupted. Please try again.",
        timestamp: Date.now()
      });
    } finally {
      setIsThinking(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    const currentAttachment = attachment;

    if ((!text && !currentAttachment) || !selectedChannel || !onSendMessage) return;

    onSendMessage(selectedChannel, {
      id: `msg-${Date.now()}`,
      senderId: activeUser.id,
      senderName: activeUser.name,
      text: text,
      attachment: currentAttachment || undefined,
      timestamp: Date.now()
    });
    
    setInput('');
    setAttachment(null);
    updateActivity();
    
    // Trigger AI response
    handleAIService(text || (currentAttachment ? "Analyze this image." : ""), currentAttachment, selectedChannel);
  };

  if (!isOpen && !isEmbedded) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 sm:bottom-28 sm:right-6 bg-indigo-600 text-white p-4 rounded-2xl shadow-[0_10px_30px_rgba(79,70,229,0.4)] hover:scale-105 active:scale-95 transition-all z-[150] flex items-center gap-3 animate-slide-up"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        <span className="font-black uppercase text-[10px] tracking-widest hidden sm:inline">Support</span>
      </button>
    );
  }

  return (
    <div className={`
      ${isEmbedded ? 'w-full h-full' : 'fixed inset-0 h-[100dvh] sm:h-[600px] sm:inset-auto sm:bottom-28 sm:right-6 sm:w-96 z-[500]'} 
      bg-white dark:bg-slate-900 flex flex-col sm:rounded-[2rem] shadow-2xl overflow-hidden animate-slide-up font-sans border-0 sm:border dark:border-slate-800
    `}>
      <div className="p-4 sm:p-5 bg-indigo-600 text-white flex justify-between items-center shrink-0 shadow-lg relative z-10">
        <div className="flex items-center gap-3">
          {selectedChannel && (
            <button onClick={() => setSelectedChannel(null)} className="p-2 hover:bg-white/20 rounded-xl transition -ml-2">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
            </button>
          )}
          <div>
            <h3 className="font-black text-sm sm:text-base uppercase tracking-tight leading-none truncate max-w-[200px]">{selectedChannel ? activeChannelName : 'Support Hub'}</h3>
            <p className="text-[8px] sm:text-[9px] uppercase tracking-widest text-indigo-200 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
              Live Network
            </p>
          </div>
        </div>
        {!isEmbedded && (
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-xl transition -mr-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      {!selectedChannel ? (
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-slate-950 overflow-y-auto p-4 space-y-4 no-scrollbar">
           <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 sticky top-0 z-10">
             <div className="flex items-center gap-3 text-gray-400">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
               <input 
                 type="text"
                 value={channelSearchQuery}
                 onChange={(e) => setChannelSearchQuery(e.target.value)}
                 placeholder="Search nodes..."
                 className="w-full bg-transparent text-sm font-bold outline-none dark:text-white placeholder:text-gray-400"
               />
             </div>
           </div>
           
           <button 
              onClick={() => setSelectedChannel('system')}
              className="w-full flex items-center gap-4 p-5 bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800 hover:border-indigo-600 transition-all text-left shadow-sm group"
            >
              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <div>
                <p className="font-black text-sm uppercase dark:text-white">Global Support</p>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Network Admin AI</p>
              </div>
            </button>

            <div className="space-y-3">
              <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 pl-2">Marketplace Nodes</h4>
              {filteredStores.length === 0 ? (
                <div className="text-center py-10 text-gray-300 font-bold text-xs uppercase">No active nodes found</div>
              ) : (
                filteredStores.map(store => (
                  <button 
                    key={store.id}
                    onClick={() => setSelectedChannel(store.id)}
                    className="w-full flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 hover:border-indigo-600 transition-all text-left shadow-sm"
                  >
                    <img src={store.bannerUrl} className="w-12 h-12 rounded-xl object-cover" alt="" />
                    <div className="min-w-0">
                      <p className="font-black text-xs uppercase truncate dark:text-white">{store.name}</p>
                      <p className="text-[8px] text-indigo-500 font-bold uppercase tracking-widest">Verified Vendor</p>
                    </div>
                  </button>
                ))
              )}
            </div>
        </div>
      ) : (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50 dark:bg-slate-950 no-scrollbar">
            {messages.length === 0 && (
              <div className="text-center py-20 opacity-50">
                <p className="text-4xl mb-4">💬</p>
                <p className="text-[10px] font-black uppercase tracking-widest">Start Transmitting</p>
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`flex flex-col ${msg.senderId === activeUser.id ? 'items-end' : 'items-start'}`}>
                <span className="text-[8px] text-gray-400 font-black uppercase tracking-widest mb-1.5 px-1">{msg.senderName}</span>
                
                {msg.attachment && (
                  <div className="mb-2 max-w-[85%] rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700">
                    <img src={msg.attachment} alt="attachment" className="w-full h-auto object-cover max-h-48" />
                  </div>
                )}

                {msg.text && (
                  <div className={`
                    max-w-[85%] px-5 py-3.5 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed
                    ${msg.senderId === activeUser.id 
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg' 
                      : msg.senderId === 'ai-agent' && msg.id.includes('err')
                        ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900 rounded-tl-none shadow-sm'
                        : 'bg-white dark:bg-slate-800 dark:text-white border dark:border-slate-700 rounded-tl-none shadow-sm'
                    }
                  `}>
                    {msg.text}
                  </div>
                )}
              </div>
            ))}
            {isThinking && (
              <div className="flex gap-2 p-2">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            )}
          </div>

          {attachment && (
            <div className="px-4 pb-2 bg-white dark:bg-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 px-3 py-2 rounded-lg">
                <img src={attachment} className="w-8 h-8 object-cover rounded" />
                <span className="text-[9px] font-bold text-gray-500 uppercase">Image Attached</span>
              </div>
              <button onClick={() => setAttachment(null)} className="text-gray-400 hover:text-red-500">✕</button>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t dark:border-slate-800 flex gap-2 shrink-0 pb-6 sm:pb-4 items-center">
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileSelect} 
            />
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
            >
              <Icons.Camera />
            </button>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your inquiry..."
              className="flex-1 bg-gray-100 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-3 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-medium"
            />
            <button 
              type="submit" 
              disabled={!input.trim() && !attachment}
              className="bg-indigo-600 text-white p-3 sm:p-4 rounded-xl disabled:opacity-50 active:scale-90 transition shadow-lg"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </form>
        </>
      )}
    </div>
  );
};