
import React from 'react';
import { SiteConfig } from '../App';

export const ServicesView: React.FC<{ config: SiteConfig }> = ({ config }) => {
  const services = [
    {
      title: "AI Sales Agents",
      icon: "🤖",
      desc: "Each vendor node is equipped with a custom-trained Gemini 3 AI agent that handles inquiries, provides product details, and manages multi-language support 24/7.",
      tag: "Intelligence"
    },
    {
      title: "Secure Settlement",
      icon: "🏦",
      desc: "Our cross-border payment protocol supports local bank transfers, global cards, and major digital wallets with automated escrow and vendor payouts.",
      tag: "Finance"
    },
    {
      title: "Node Analytics",
      icon: "📊",
      desc: "Sellers get access to a deep-data dashboard tracking GTV, session decay, user sentiment, and global supply chain performance in real-time.",
      tag: "Analytics"
    },
    {
      title: "Verification Vault",
      icon: "🔐",
      desc: "Highest-grade encryption for merchant identity documents. We verify business licenses and sourcing origins to maintain a counterfeit-free network.",
      tag: "Security"
    },
    {
      title: "Logistics Sync",
      icon: "📦",
      desc: "Automated delivery tracking integrated with global carriers. Omni handles the complex 'last-mile' communication through decentralized notifications.",
      tag: "Supply Chain"
    },
    {
      title: "Multi-Vendor Hubs",
      icon: "🏙️",
      desc: "A unified portal for buyers to manage purchases from hundreds of independent stores under a single, secure Global PIN authentication.",
      tag: "Experience"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 space-y-16 min-h-screen animate-fade-in">
      <div className="space-y-4">
        <h1 className="text-6xl font-black tracking-tighter dark:text-white uppercase leading-none">ECOSYSTEM <br/> CAPABILITIES</h1>
        <p className="text-gray-500 font-black text-[10px] uppercase tracking-[0.4em]">Integrated Infrastructure for the Modern Merchant</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {services.map((s, i) => (
          <div key={i} className="group bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-[2.5rem] border dark:border-slate-800 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
            <div className="flex justify-between items-start mb-8">
              <div className="text-4xl bg-gray-50 dark:bg-slate-800 w-16 h-16 flex items-center justify-center rounded-2xl group-hover:bg-indigo-600 transition-colors">
                {s.icon}
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full">{s.tag}</span>
            </div>
            <h3 className="text-xl font-black dark:text-white mb-4 uppercase tracking-tight">{s.title}</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
              {s.desc}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-indigo-600 rounded-[3.5rem] p-10 sm:p-20 text-center text-white space-y-8">
        <h2 className="text-3xl sm:text-5xl font-black tracking-tighter uppercase">READY TO DEPLOY YOUR NODE?</h2>
        <p className="text-indigo-100 font-medium max-w-xl mx-auto">Join the {config.siteName} network today and start selling to a global audience with AI-powered support and secure settlements.</p>
        <button 
          onClick={() => { window.location.hash = '#/auth'; }}
          className="bg-white text-indigo-600 px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:scale-110 active:scale-95 transition"
        >
          Initialize Store Entry
        </button>
      </div>
    </div>
  );
};
