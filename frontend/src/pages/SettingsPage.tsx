import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Cpu,
  Key,
  RotateCw,
  Server,
  Settings,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { api } from '../api';

type Health = {
  status?: string;
  ml_engine?: string;
  agent_framework?: string;
  llm_status?: { provider?: string; model?: string; has_key?: boolean };
};

export const SettingsPage: React.FC = () => {
  const [provider, setProvider] = useState('auto');
  const [model, setModel] = useState('gpt-4o-mini');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const [systemHealth, setSystemHealth] = useState<Health | null>(null);

  useEffect(() => {
    void loadHealth();
  }, []);

  const loadHealth = async () => {
    try {
      const data = await api.getHealth();
      setSystemHealth(data);
      if (data.llm_status?.provider) setProvider(data.llm_status.provider);
      if (data.llm_status?.provider === 'openai' && data.llm_status.model) {
        setModel(data.llm_status.model);
      }
    } catch (err) {
      console.error('Failed to load health:', err);
    }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setError('');
    try {
      await api.updateSettings({ provider, model });
      setSaveSuccess(true);
      await loadHealth();
      window.setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update settings:', err);
      setError('Could not update runtime settings. Check that the backend is running and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const llm = systemHealth?.llm_status;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 pb-16">
      <div>
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Settings className="h-5 w-5 text-brand-400" />
          <span>System Settings &amp; LLM Configuration</span>
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Choose the guidance provider and inspect live system status.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <form onSubmit={handleSave} className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Key className="h-4 w-4 text-brand-400" />
              <span>Guidance Provider</span>
            </h4>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Active provider
              </label>
              <select
                value={provider}
                onChange={(event) => setProvider(event.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="auto">OpenAI when configured; otherwise local rules</option>
                <option value="openai">OpenAI API</option>
                <option value="local_synthesizer">Local rule based guidance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                OpenAI model
              </label>
              <input
                type="text"
                value={model}
                onChange={(event) => setModel(event.target.value)}
                placeholder="gpt-4o-mini"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>

            <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-3 text-[11px] text-slate-400 leading-relaxed">
              Set <code className="text-brand-300">OPENAI_API_KEY</code> in the backend environment before startup to enable OpenAI. The key is not collected or transmitted by this page. Without it, the backend uses local rule based guidance.
            </div>

            {saveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Runtime configuration updated.</span>
              </div>
            )}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center gap-2 transition-all disabled:opacity-60"
            >
              {isSaving ? <RotateCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              <span>{isSaving ? 'Saving...' : 'Update runtime settings'}</span>
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="glass-panel rounded-2xl p-5 border border-slate-800">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-3">
              <Server className="h-4 w-4 text-emerald-400" />
              <span>Runtime Health</span>
            </h4>
            {systemHealth ? (
              <div className="space-y-3 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center gap-2">
                  <span className="text-slate-400">Backend API</span>
                  <span className={systemHealth.status === 'healthy' ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                    {systemHealth.status === 'healthy' ? 'Healthy' : 'Unavailable'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 flex items-center gap-2 mb-1"><Cpu className="h-3.5 w-3.5" />ML engine</span>
                  <span className="text-brand-300 break-words">{systemHealth.ml_engine || 'Not reported'}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Workflow framework</span>
                  <span className="text-brand-300 break-words">{systemHealth.agent_framework || 'Not reported'}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Active guidance provider</span>
                  <span className="text-white break-words">{llm?.provider || 'Not reported'}{llm?.model ? ` · ${llm.model}` : ''}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center gap-2">
                  <span className="text-slate-400">OpenAI key</span>
                  <span className={llm?.has_key ? 'text-emerald-400' : 'text-slate-400'}>{llm?.has_key ? 'Configured' : 'Not configured'}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500">Waiting for backend health data...</div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-brand-500/5 border border-brand-500/20 text-xs text-slate-300 space-y-1.5">
            <div className="font-semibold text-brand-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>How matching works</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Resume and role text are compared with TF-IDF and cosine similarity. The LLM provider supplies written guidance; it does not calculate the numerical similarity score.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
