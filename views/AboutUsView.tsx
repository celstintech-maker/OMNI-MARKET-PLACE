
import React from 'react';
import { SiteConfig } from '../App';

export const AboutUsView: React.FC<{ config: SiteConfig }> = ({ config }) => {
  return (
    <div className="max-w-5xl mx-auto py-12 px-4 space-y-16 min-h-screen animate-fade-in">
      <div className="text-center space-y-6">
        <div className="inline-block px-4 py-1.5 bg-indigo-600/10 border border-indigo-600/20 rounded-full mb-2">
           <span className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.3em]">The Omni Manifesto</span>
        </div>
        <h1 className="text-5xl sm:text-7xl font-black tracking-tighter leading-none dark:text-white">
          THE FUTURE OF <br/> DISTRIBUTED COMMERCE
        </h1>
        <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
          Omni is not just a marketplace; it is a decentralized protocol designed to empower verified independent vendors across the globe.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border dark:border-slate-800 shadow-sm space-y-6">
          <h3 className="text-2xl font-black tracking-tight dark:text-white uppercase">Our Vision</h3>
          <p className="text-gray-500 font-medium leading-relaxed">
            We envision a world where every merchant, regardless of their geographical node, has access to global capital. By removing traditional gatekeepers, Omni facilitates a direct, trust-based connection between local artisans and global buyers.
          </p>
        </div>
        <div className="bg-indigo-600 p-10 rounded-[3rem] text-white shadow-xl shadow-indigo-200 dark:shadow-none space-y-6">
          <h3 className="text-2xl font-black tracking-tight uppercase">The Protocol</h3>
          <p className="text-indigo-100 font-medium leading-relaxed">
            Every store on Omni operates as an independent node within our network. Our proprietary verification system ensures that every "Trusted Global Seller" adheres to strict quality and ethical standards, protecting the integrity of the network.
          </p>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-slate-900/50 p-12 rounded-[3.5rem] border dark:border-slate-800 text-center space-y-8">
        <h2 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.5em]">Core Pillars</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
          <div>
            <div className="text-3xl mb-4">🛡️</div>
            <h4 className="font-black text-sm uppercase mb-2 dark:text-white">Radical Trust</h4>
            <p className="text-xs text-gray-500 font-bold">Every vendor is manually vetted via our 12-point identification protocol.</p>
          </div>
          <div>
            <div className="text-3xl mb-4">🌍</div>
            <h4 className="font-black text-sm uppercase mb-2 dark:text-white">Global Reach</h4>
            <p className="text-xs text-gray-500 font-bold">Sourcing from Lagos to London, bringing hidden gems to your digital doorstep.</p>
          </div>
          <div>
            <div className="text-3xl mb-4">⚡</div>
            <h4 className="font-black text-sm uppercase mb-2 dark:text-white">Hyper-Speed</h4>
            <p className="text-xs text-gray-500 font-bold">Integrated fulfillment and settlement for instant merchant liquidity.</p>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <button 
          onClick={() => { window.location.hash = '#/home'; }}
          className="bg-slate-900 dark:bg-indigo-600 text-white px-16 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:scale-105 active:scale-95 transition"
        >
          Explore the Feed
        </button>
      </div>
    </div>
  );
};
