
import React, { useState } from 'react';
import { User, Message } from '../types';

interface ChatSupportProps {
  currentUser: User | null;
  targetSellerName: string;
  theme: 'light' | 'dark';
}

export const ChatSupport: React.FC<ChatSupportProps> = ({ currentUser, targetSellerName, theme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', senderId: 'system', senderName: targetSellerName, text: `Hello! How can we help you today at ${targetSellerName}?`, timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentUser) return;

    const newMessage: Message = {
      id: Math.random().toString(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: input,
      timestamp: Date.now()
    };

    setMessages([...messages, newMessage]);
    setInput('');

    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        senderId: 'seller',
        senderName: targetSellerName,
        text: "Thanks for your message! Our team will get back to you shortly.",
        timestamp: Date.now()
      }]);
    }, 1500);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-indigo-600 dark:bg-indigo-500 text-white p-4 rounded-full shadow-2xl hover:bg-indigo-700 dark:hover:bg-indigo-400 transition-all z-50 flex items-center gap-2 group"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-semibold whitespace-nowrap">Chat with {targetSellerName}</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 md:w-96 h-[500px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl z-50 flex flex-col border border-gray-100 dark:border-slate-800 animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">
      <div className="p-4 bg-indigo-600 dark:bg-indigo-900 text-white flex justify-between items-center shadow-lg">
        <div>
          <h3 className="font-bold">Chat Support</h3>
          <p className="text-xs text-indigo-100">Talking to {targetSellerName}</p>
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-950">
        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.senderId === currentUser?.id ? 'items-end' : 'items-start'}`}>
            <span className="text-[10px] text-gray-400 dark:text-slate-500 mb-1 px-1 uppercase font-bold tracking-tighter">{msg.senderName}</span>
            <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm shadow-sm ${msg.senderId === currentUser?.id ? 'bg-indigo-600 dark:bg-indigo-500 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-tl-none'}`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-gray-100 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition"
        />
        <button type="submit" className="bg-indigo-600 dark:bg-indigo-500 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition shadow-md shadow-indigo-200/50 dark:shadow-none">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
        </button>
      </form>
    </div>
  );
};
