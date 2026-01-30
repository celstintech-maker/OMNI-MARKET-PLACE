
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, Message, UserRole, Store, SiteConfig, Product } from '../types';
import { GoogleGenAI } from "@google/genai";
import { Icons } from '../constants';

interface ChatSupportProps {
  currentUser: User | null;
  stores?: Store[];
  products?: Product[];
  globalMessages?: Record<string, Message[]>;
  onSendMessage?: (channelId: string, message: Message) => void;
  onClearChat?: (channelId: string) => void;
  onArchiveChat?: (channelId: string) => void;
  onNotifySeller?: (storeId: string, message: string) => void;
  theme: 'light' | 'dark';
  isEmbedded?: boolean;
  forcedChannelId?: string;
  aiInstructions?: string[]; 
  decayMinutes?: number;
  config?: SiteConfig;
}

const ChatSupportBase: React.FC<ChatSupportProps> = ({ 
  currentUser, 
  stores = [], 
  products = [],
  globalMessages = {}, 
  onSendMessage, 
  onClearChat,
  onArchiveChat,
  onNotifySeller,
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
  
  // Persist guest ID so it doesn't change on re-renders/refresh
  const [guestId] = useState(() => {
    const stored = localStorage.getItem('omni_guest_id');
    if(stored) return stored;
    const newId = `guest-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('omni_guest_id', newId);
    return newId;
  });
  
  const activeUser: User = useMemo(() => currentUser || {
    id: guestId,
    name: 'Guest User',
    role: UserRole.BUYER,
    email: 'guest@omni.link'
  }, [currentUser, guestId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [globalMessages, selectedChannel, isThinking, attachment]);

  const getChannelInfo = (channelId: string) => {
    if (channelId === 'system') return { name: 'Omni Global Support', storeId: null };
    const [storeId, userId] = channelId.split('_');
    const store = stores.find(s => s.id === storeId);
    
    if (activeUser.role === UserRole.SELLER) {
       return { name: `Customer (${userId?.slice(-4) || 'Unk'})`, storeId: storeId };
    }
    
    return { name: store ? store.name : 'Unknown Channel', storeId: storeId };
  };

  const currentChannelInfo = selectedChannel ? getChannelInfo(selectedChannel) : null;
  const messages = selectedChannel ? (globalMessages[selectedChannel] || []) : [];

  const availableChannels = useMemo(() => {
    if (activeUser.role === UserRole.ADMIN) {
        return Object.keys(globalMessages).filter(k => k !== 'system');
    }
    if (activeUser.role === UserRole.SELLER) {
        const myStoreIds = stores.filter(s => s.sellerId === activeUser.id).map(s => s.id);
        return Object.keys(globalMessages).filter(k => {
            const [sId] = k.split('_');
            return myStoreIds.includes(sId);
        });
    }
    return []; 
  }, [activeUser, globalMessages, stores]);

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
    const effectiveKey = config?.geminiApiKey || process.env.API_KEY;
    
    if (!effectiveKey) return;

    setIsThinking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: effectiveKey });
      const { storeId, name } = getChannelInfo(channelId);
      
      let contextString = "";
      if (storeId) {
          const storeProds = products.filter(p => p.sellerId === stores.find(s => s.id === storeId)?.sellerId);
          const store = stores.find(s => s.id === storeId);
          contextString = `
            You are the specialized support AI for "${store?.name}".
            Store Description: ${store?.description}.
            
            PRODUCT CATALOG (Use these exact links):
            ${storeProds.map(p => `- ${p.name} (${p.price} ${p.currencySymbol || '₦'}) - [Link to ${p.name}](#/store/${encodeURIComponent(p.storeName)})`).join('\n')}
          `;
      } else {
          contextString = `
            You are the Omni Global System Support Agent acting as a unified seller representative.
            You have access to all products across the marketplace.
            
            FULL MARKETPLACE CATALOG SAMPLES (Use these exact links):
            ${products.slice(0, 20).map(p => `- ${p.name} by ${p.storeName} (${p.price} ${p.currencySymbol || '₦'}) - [Link to Store](#/store/${encodeURIComponent(p.storeName)})`).join('\n')}
          `;
      }

      const systemPrompt = `
        ${contextString}
        User Role: ${activeUser.role}.
        User Name: ${activeUser.name}.
        
        INSTRUCTIONS:
        1. Act as the SELLER/MERCHANT. Be helpful, sales-oriented, and polite.
        2. If the user asks for a product, recommend it from the catalog above.
        3. CRITICAL: When recommending a product, YOU MUST PROVIDE THE LINK provided in the catalog using markdown format [Link Text](URL).
        4. Give clear steps on how to buy (e.g., "Click the link, select size, add to cart").
        5. If the user asks for a human, seller, or admin, reply exactly: "I have notified the human agent. They will connect shortly."
        6. Do not hallucinate products not in the provided list.
        7. Keep responses concise (under 3 sentences unless detailing steps).
      `;

      const parts: any[] = [{ text: userMessage }];
      if (userAttachment) {
        const base64Data = userAttachment.split(',')[1];
        const mimeType = userAttachment.split(';')[0].split(':')[1];
        parts.push({
          inlineData: { mimeType, data: base64Data }
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: parts },
        config: { systemInstruction: systemPrompt, temperature: 0.4, maxOutputTokens: 250 }
      });

      const aiResponseText = response.text || "I've noted that.";
      
      // Notify seller if AI signals handoff
      if (aiResponseText.includes("I have notified the human agent") && storeId && onNotifySeller) {
          onNotifySeller(storeId, `URGENT: Customer ${activeUser.name} requested human support in ${name}.`);
      }
      
      onSendMessage?.(channelId, {
        id: `ai-${Date.now()}`,
        senderId: 'ai-agent',
        senderName: `${name} (AI)`,
        text: aiResponseText,
        timestamp: Date.now()
      });

    } catch (error: any) {
      console.error(error);
      const errorMessage = error.message || error.toString();
      
      // Default to busy
      let replyText = "I apologize, but I am unable to process your request at this moment. Please try again later.";
      let senderName = 'System';

      // Graceful handling for Rate Limits / Quota -> Auto Handoff
      if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
          const { storeId, name: storeName } = getChannelInfo(channelId);
          
          if (storeId && onNotifySeller) {
              // Notify seller of incoming chat waiting
              onNotifySeller(storeId, `🔔 Message Alert: ${activeUser.name} is waiting for a manual reply. (AI Capacity Reached)`);
              
              replyText = `We have notified ${storeName} staff to attend to you personally. Please stand by for a human agent.`;
              senderName = 'System (Handoff)';
          } else {
              replyText = "Our AI agents are currently at capacity. A human admin has been notified of your inquiry.";
          }
      }

      onSendMessage?.(channelId, {
        id: `ai-err-${Date.now()}`,
        senderId: 'ai-agent',
        senderName: senderName,
        text: replyText,
        timestamp: Date.now()
      });
    } finally {
      setIsThinking(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachment) || !selectedChannel || !onSendMessage) return;

    const messagePayload = {
      id: `msg-${Date.now()}`,
      senderId: activeUser.id,
      senderName: activeUser.name,
      text: input.trim(),
      attachment: attachment || undefined,
      timestamp: Date.now()
    };

    onSendMessage(selectedChannel, messagePayload);
    
    // Clear input AFTER sending signal
    const textToSend = input.trim();
    const attachmentToSend = attachment;
    
    setInput('');
    setAttachment(null);
    
    // Trigger AI response
    if (activeUser.role === UserRole.BUYER || activeUser.role === UserRole.ADMIN) {
       handleAIService(textToSend || (attachmentToSend ? "Analyze this image." : ""), attachmentToSend, selectedChannel);
    }
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
      {/* Header */}
      <div className="p-4 sm:p-5 bg-indigo-600 text-white flex justify-between items-center shrink-0 shadow-lg relative z-10">
        <div className="flex items-center gap-3">
          {selectedChannel && (
            <button onClick={() => setSelectedChannel(null)} className="p-2 hover:bg-white/20 rounded-xl transition -ml-2">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
            </button>
          )}
          <div>
            <h3 className="font-black text-sm sm:text-base uppercase tracking-tight leading-none truncate max-w-[200px]">
                {currentChannelInfo ? currentChannelInfo.name : (activeUser.role === UserRole.BUYER ? 'Support Hub' : 'Incoming Chats')}
            </h3>
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
           {activeUser.role === UserRole.BUYER && (
               <>
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
                            onClick={() => setSelectedChannel(`${store.id}_${activeUser.id}`)}
                            className="w-full flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 hover:border-indigo-600 transition-all text-left shadow-sm"
                        >
                            <img src={store.bannerUrl} className="w-12 h-12 rounded-xl object-cover" alt="" />
                            <div className="min-w-0">
                            <p className="font-black text-xs uppercase truncate dark:text-white">{store.name}</p>
                            <p className="text-[8px] text-indigo-500 font-bold uppercase tracking-widest">Connect</p>
                            </div>
                        </button>
                        ))
                    )}
                </div>
               </>
           )}

           {(activeUser.role === UserRole.SELLER || activeUser.role === UserRole.ADMIN) && (
               <div className="space-y-3">
                   {availableChannels.length === 0 ? (
                       <div className="text-center py-20 text-gray-400 font-bold text-xs uppercase tracking-widest">No active transmissions</div>
                   ) : (
                       availableChannels.map(cid => {
                           const info = getChannelInfo(cid);
                           return (
                               <button 
                                   key={cid}
                                   onClick={() => setSelectedChannel(cid)}
                                   className="w-full flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 hover:border-indigo-600 transition-all text-left shadow-sm relative group"
                               >
                                   <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-xl flex items-center justify-center font-black text-indigo-600">
                                       {info.name[0]}
                                   </div>
                                   <div className="flex-1 min-w-0">
                                       <p className="font-black text-xs uppercase truncate dark:text-white">{info.name}</p>
                                       <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest truncate">{globalMessages[cid]?.slice(-1)[0]?.text || 'No messages'}</p>
                                   </div>
                                   {activeUser.role === UserRole.ADMIN && (
                                       <div 
                                         onClick={(e) => { e.stopPropagation(); if(confirm('Clear this chat permanently?')) onClearChat?.(cid); }}
                                         className="absolute right-4 bg-red-100 text-red-600 p-2 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-red-200"
                                       >
                                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                       </div>
                                   )}
                                   {activeUser.role === UserRole.SELLER && (
                                       <div 
                                         onClick={(e) => { e.stopPropagation(); onArchiveChat?.(cid); }}
                                         className="absolute right-4 bg-gray-100 text-gray-600 p-2 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-gray-200"
                                         title="Archive Chat"
                                       >
                                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                                       </div>
                                   )}
                               </button>
                           );
                       })
                   )}
               </div>
           )}
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
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 rounded-tl-none shadow-sm'
                        : 'bg-white dark:bg-slate-800 dark:text-white border dark:border-slate-700 rounded-tl-none shadow-sm'
                    }
                  `}>
                    {msg.text.split(/(\[.*?\]\(.*?\))/g).map((part, i) => {
                        const match = part.match(/\[(.*?)\]\((.*?)\)/);
                        if (match) {
                            return (
                                <a key={i} href={match[2]} className="text-indigo-300 hover:text-white underline font-bold" target="_blank" rel="noopener noreferrer">
                                    {match[1]}
                                </a>
                            );
                        }
                        return part;
                    })}
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

          <div className="bg-white dark:bg-slate-900 border-t dark:border-slate-800 flex flex-col">
             {activeUser.role === UserRole.ADMIN && (
                 <button onClick={() => { if(confirm('Clear history?')) onClearChat?.(selectedChannel!); }} className="w-full py-1 text-[8px] font-black uppercase text-red-500 hover:bg-red-50 bg-red-50/20">Admin: Clear Chat</button>
             )}
             {activeUser.role === UserRole.SELLER && (
                 <button onClick={() => onArchiveChat?.(selectedChannel!)} className="w-full py-1 text-[8px] font-black uppercase text-gray-500 hover:bg-gray-50">Archive Chat</button>
             )}
             <form onSubmit={handleFormSubmit} className="p-3 sm:p-4 flex gap-2 shrink-0 pb-6 sm:pb-4 items-center">
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
          </div>
        </>
      )}
    </div>
  );
};

// Export as memoized component to prevent re-renders from parent (App.tsx timer) clearing input state
export const ChatSupport = React.memo(ChatSupportBase);
