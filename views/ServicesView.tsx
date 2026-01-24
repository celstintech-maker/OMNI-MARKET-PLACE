
import React from 'react';
import { SiteConfig } from '../App';

export const ServicesView: React.FC<{ config: SiteConfig }> = ({ config }) => {
  const services = [
    {
      title: "AI Sales Agents",
      icon: "🤖",
      desc: "Every vendor store is equipped with a custom-trained Gemini AI agent that handles inquiries, provides product insights, and manages multi-language support 24/7.",
      tag: "Intelligence"
    },
    {
      title: "Secure Settlement",
      icon: "🏦",
      desc: "Our cross-border payment protocol supports bank transfers, cards, and digital wallets with automated escrow and verified merchant payouts.",
      tag: "Finance"
    },
    {
      title: "Store Analytics",
      icon: "📊",
      desc: "Sellers gain access to high-fidelity dashboards tracking gross transaction volume, inventory velocity, and global performance metrics.",
      tag: "Analytics"
    },
    {
      title: "Verification Vault",
      icon: "🔐",
      desc: "We use high-grade encryption for merchant identity documents, verifying every license and origin point to maintain a counterfeit-free network.",
      tag: "Security"
    },
    {
      title: "Logistics Sync",
      icon: "📦",
      desc: "Automated delivery tracking integrated with global carriers. Omni handles complex last-mile communications through decentralized notifications.",
      tag: "Supply Chain"
    },
    {
      title: "Multi-Vendor Hub",
      icon: "🏙️",
      desc: "A unified portal for buyers to manage purchases from hundreds of independent stores under a single, secure Global authentication.",
      tag: "Experience"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 space-y-16 min-h-screen animate-fade-in">
      <div className="space-y-4">
        <h1 className="text-6xl font-black tracking-tighter dark:text-white uppercase leading-none">ECOSYSTEM <br/> CAPABILITIES</h1>
        <p className="text-gray-500 font-black text-[10px] uppercase tracking-[0.4em]">Infrastructure for the Next Generation of Global Merchants</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {services.map((s, i) => (
          <div key={i} className="group bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-[2.5rem] border dark:border-slate-800 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
            <div className="flex justify-between items-start mb-8">
              <div className="text-4xl bg-gray-50 dark:bg-slate-800 w-16 h-16 flex items-center justify-center rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
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

      <div className="bg-indigo-600 rounded-[3.5rem] p-10 sm:p-20 text-center text-white space-y-8 shadow-2xl">
        <h2 className="text-3xl sm:text-5xl font-black tracking-tighter uppercase">READY TO DEPLOY YOUR STORE?</h2>
        <p className="text-indigo-100 font-medium max-w-xl mx-auto">Join the {config.siteName} network today and start selling to a global audience with AI-powered support and secure settlements.</p>
        <button 
          onClick={() => { window.location.hash = '#/auth'; }}
          className="bg-white text-indigo-600 px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:scale-110 active:scale-95 transition"
        >
          Open Store
        </button>
      </div>
    </div>
  );
};
