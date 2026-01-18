
import React from 'react';
import { SiteConfig } from '../App';

interface LegalViewProps {
  view: 'privacy' | 'terms' | 'sourcing' | 'cookies';
  config: SiteConfig;
}

export const LegalView: React.FC<LegalViewProps> = ({ view, config }) => {
  const renderContent = () => {
    switch (view) {
      case 'privacy':
        return (
          <div className="space-y-8 animate-fade-in">
            <h1 className="text-5xl font-black tracking-tighter">Privacy Policy</h1>
            <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 space-y-6 font-medium">
              <p className="text-lg">Last Updated: {new Date().toLocaleDateString()}</p>
              <section className="space-y-4">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest">1. Data Encryption & Distribution</h2>
                <p>At {config.siteName}, we operate a distributed marketplace protocol. Your personal identification data is encrypted at the source and only shared with verified vendors strictly for transaction fulfillment purposes.</p>
              </section>
              <section className="space-y-4">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest">2. Verification Documents</h2>
                <p>Documents uploaded by sellers for verification (ID cards, business licenses) are stored in a high-security vault accessible only to Super Admins. These are never shared with buyers or third-party marketing entities.</p>
              </section>
              <section className="space-y-4">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest">3. Transaction Logs</h2>
                <p>All financial logs, including bank transfers and credit card interactions, are handled via industry-standard protocols. We do not store raw PINs or CVV numbers on our primary servers.</p>
              </section>
            </div>
          </div>
        );
      case 'terms':
        return (
          <div className="space-y-8 animate-fade-in">
            <h1 className="text-5xl font-black tracking-tighter">Terms of Service</h1>
            <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 space-y-6 font-medium">
              <p className="text-lg">Governance Framework for the Omni Network</p>
              <section className="space-y-4">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest">1. Vendor Conduct</h2>
                <p>Sellers agree to a {config.commissionRate * 100}% platform commission on all gross transactions. Vendors are responsible for accurate inventory levels and timely fulfillment (within 24-48 hours of bank verification).</p>
              </section>
              <section className="space-y-4">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest">2. Buyer Responsibility</h2>
                <p>Buyers must provide valid delivery credentials. Intentional chargeback fraud or falsifying payment screenshots for bank transfers will result in immediate permanent suspension of the associated Global PIN.</p>
              </section>
              <section className="space-y-4">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest">3. Dispute Resolution</h2>
                <p>Disputes are mediated by {config.siteName} Global Support. AI-initial mediation is mandatory before escalation to human oversight nodes.</p>
              </section>
            </div>
          </div>
        );
      case 'sourcing':
        return (
          <div className="space-y-8 animate-fade-in">
            <h1 className="text-5xl font-black tracking-tighter">Sourcing Protocol</h1>
            <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 space-y-6 font-medium">
              <p className="text-lg">Supply Chain Verification & Ethical Standards</p>
              <section className="space-y-4">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest">1. Verified Sourcing</h2>
                <p>All products on the Global Feed must pass our Sourcing Verification. Vendors must prove the origin of high-value electronics and luxury fashion items to ensure network integrity.</p>
              </section>
              <section className="space-y-4">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest">2. Node Synchronization</h2>
                <p>Store inventory is synchronized across our distributed network. Cross-border sellers must adhere to local export laws of their registered country and the import laws of the buyer's region.</p>
              </section>
              <section className="space-y-4">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest">3. Quality Assurance</h2>
                <p>Each product listing is subject to AI-driven sentiment and quality analysis. Consistent low ratings for a particular vendor node will trigger an automatic quality audit by Super Admins.</p>
              </section>
            </div>
          </div>
        );
      case 'cookies':
        return (
          <div className="space-y-8 animate-fade-in">
            <h1 className="text-5xl font-black tracking-tighter">Cookie Settings</h1>
            <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 space-y-6 font-medium">
              <p className="text-lg">Managing Session Integrity</p>
              <section className="space-y-4">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest">1. Essential Session Cookies</h2>
                <p>We use essential cookies to maintain your authentication state and shopping bag contents across browser refreshes. These cannot be disabled as they are required for the marketplace to function.</p>
              </section>
              <section className="space-y-4">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest">2. UI Preferences</h2>
                <p>Cookies store your preference for "Dark Mode" vs "Light Mode" and your selected currency symbols based on your geo-location.</p>
              </section>
              <section className="space-y-4">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest">3. Support Continuity</h2>
                <p>Our AI Support Agent uses locally stored session data to remember your conversation context during the "AI Auto-Delete" window configured by each store owner.</p>
              </section>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-12 min-h-screen">
      <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-[3.5rem] border dark:border-slate-800 shadow-sm leading-relaxed">
        {renderContent()}
      </div>
      <div className="flex justify-center">
         <button 
           onClick={() => { window.location.hash = '#/home'; }}
           className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:scale-110 active:scale-95 transition"
         >
           Return to Marketplace
         </button>
      </div>
    </div>
  );
};
