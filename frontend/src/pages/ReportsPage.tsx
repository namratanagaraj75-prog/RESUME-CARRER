import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  RotateCw,
  FileText,
  Printer,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { ResumeWorkflowState } from '../types';
import { api } from '../api';

interface ReportsPageProps {
  state: ResumeWorkflowState | null;
  onGoToResume: () => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ state, onGoToResume }) => {
  const [activeTab, setActiveTab] = useState<'comprehensive' | 'analysis' | 'match' | 'roadmap'>('comprehensive');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  if (!state) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-3 rounded-2xl bg-slate-800 text-slate-400 w-fit mx-auto mb-3">
          <FileSpreadsheet className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">No Analysis Reports Available</h3>
        <p className="text-xs text-slate-400 mb-4">
          Please upload and analyze a candidate resume to generate printable and exportable reports.
        </p>
        <button
          onClick={onGoToResume}
          className="px-4 py-2 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-500 transition-colors"
        >
          Go to Resume Page
        </button>
      </div>
    );
  }

  const prep = state.preprocessed_data;
  const contact = prep?.contact_info || { name: 'Candidate' };
  const matches = state.career_match_results;
  const topMatch = matches?.top_match;
  const gap = state.skill_gap_results;
  const guidance = state.llm_guidance;
  const roadmap = state.roadmap || [];
  const trace = state.workflow_trace || [];

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const res = await api.generateReport(state, 'pdf');
      if (res.pdf_download_url) {
        setPdfUrl(res.pdf_download_url);
        window.open(res.pdf_download_url, '_blank');
      }
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header Bar */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-400 uppercase tracking-wider mb-1">
            <FileSpreadsheet className="h-4 w-4" />
            <span>Resume Analysis and Export</span>
          </div>
          <h3 className="text-base font-bold text-white">
            Resume Analysis Reports: {contact.name}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Reports covering TF-IDF role-template comparisons, detected skill terms, and a 16-week learning roadmap.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <Printer className="h-4 w-4" />
            <span>Print View</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-brand-500/25 glow-brand"
          >
            {isGeneratingPdf ? (
              <>
                <RotateCw className="h-4 w-4 animate-spin" />
                <span>Compiling PDF...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Download ReportLab PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800 pb-2">
        {[
          { id: 'comprehensive', label: '1. Comprehensive Executive Report' },
          { id: 'analysis', label: '2. Resume & Skills Breakdown' },
          { id: 'match', label: '3. TF-IDF & ML Matching Report' },
          { id: 'roadmap', label: '4. 16-Week Strategic Roadmap' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === t.id
                ? 'bg-brand-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Report Document Canvas */}
      <div className="glass-panel rounded-2xl p-8 border border-slate-800 bg-slate-950 font-sans space-y-6 text-slate-300 text-xs leading-relaxed shadow-2xl">
        {/* Document Header */}
        <div className="border-b border-slate-800 pb-4 flex justify-between items-start">
          <div>
              <span className="text-[10px] font-mono text-brand-400 uppercase tracking-widest block mb-1">
              AI Resume Analysis Report
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              AI-POWERED RESUME ANALYSIS & CAREER GUIDANCE REPORT
            </h2>
            <div className="text-slate-400 text-xs mt-1">
              Candidate: <strong className="text-white">{contact.name}</strong> • Evaluated on:{' '}
              {new Date().toLocaleDateString()}
            </div>
          </div>
          <div className="text-right text-[11px] font-mono text-slate-400">
            <div>Engine: TF-IDF + LangGraph</div>
            <div className="text-brand-300 font-semibold">Analysis complete</div>
          </div>
        </div>

        {/* Tab 1: Comprehensive Executive Report */}
        {activeTab === 'comprehensive' && (
          <div className="space-y-6">
            {/* Section 1: Executive KPI Summary */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 text-brand-300">
                1. Resume Analysis Summary
              </h4>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Top Role Template Match:</span>
                  <span className="font-bold text-white text-sm">{topMatch?.title}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Cosine Similarity:</span>
                  <span className="font-bold text-brand-400 font-mono text-sm">
                    {topMatch?.match_percentage}% (Cosine Metric: {topMatch?.similarity_score})
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Template Alignment:</span>
                  <span className="font-semibold text-emerald-400">
                    {guidance?.alignment_label || 'Text similarity'}
                  </span>
                </div>
                <p className="mt-2 pt-2 border-t border-slate-800/80 text-xs text-slate-300 leading-relaxed italic">
                  "{guidance?.executive_summary}"
                </p>
              </div>
            </div>

            {/* Section 2: Resume-listed skills & Remediations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="font-bold text-emerald-400 mb-2">Detected Skills in Resume</div>
                <ul className="space-y-1 pl-1">
                  {(guidance?.core_strengths || []).map((s, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[11px]">
                      <span className="text-emerald-400">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="font-bold text-amber-400 mb-2">Critical Remediation Strategy</div>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  {guidance?.critical_gap_strategy}
                </p>
              </div>
            </div>

            {/* Section 3: LangGraph Agent Trace Telemetry */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 text-brand-300">
                2. LangGraph Agent Workflow Trace
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[11px] border border-slate-800">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-2">Step</th>
                      <th className="p-2">Node Name</th>
                      <th className="p-2">Latency</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Telemetry Summary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {trace.map((t, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="p-2 text-slate-500">{idx + 1}</td>
                        <td className="p-2 font-semibold text-brand-300">{t.node_name}</td>
                        <td className="p-2">{t.duration_ms} ms</td>
                        <td className="p-2 text-emerald-400">{t.status}</td>
                        <td className="p-2 text-slate-300 font-sans text-xs">{t.summary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Resume & Skills Breakdown */}
        {activeTab === 'analysis' && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider text-brand-300">
              Taxonomy Breakdown ({state.extracted_skills?.total_count} Skills)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(state.extracted_skills?.by_category || {}).map(([cat, skills]) => (
                <div key={cat} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="font-bold text-slate-300 uppercase text-[10px] mb-1.5">
                    {cat.replace(/_/g, ' ')} ({skills.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono"
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: TF-IDF & ML Matching Report */}
        {activeTab === 'match' && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider text-brand-300">
              Empirical Cosine Similarity Role Rankings
            </h4>
            <table className="w-full text-left font-mono text-[11px] border border-slate-800">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-2">Role</th>
                  <th className="p-2">Category</th>
                  <th className="p-2">Cosine Sim</th>
                  <th className="p-2">Match %</th>
                  <th className="p-2">Req Met</th>
                  <th className="p-2">Req Missing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {(matches?.rankings || []).map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40">
                    <td className="p-2 font-semibold text-white font-sans">{r.title}</td>
                    <td className="p-2 text-slate-400">{r.category}</td>
                    <td className="p-2 text-brand-300">{r.similarity_score}</td>
                    <td className="p-2 font-bold text-brand-400">{r.match_percentage}%</td>
                    <td className="p-2 text-emerald-400">{r.matched_required_skills.length}</td>
                    <td className="p-2 text-rose-400">{r.missing_required_skills.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: 16-Week Strategic Roadmap */}
        {activeTab === 'roadmap' && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider text-brand-300">
              Personalized 16-Week Milestone Progression
            </h4>
            <div className="space-y-3">
              {roadmap.map((stage) => (
                <div key={stage.stage_number} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                    <span>Stage {stage.stage_number}: {stage.stage_name}</span>
                    <span className="text-brand-300 font-mono text-[11px]">{stage.timeline}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-2 italic">{stage.description}</p>
                  <div className="text-[11px] space-y-1">
                    <div className="font-semibold text-slate-300">Deliverables:</div>
                    {stage.deliverables.map((d, didx) => (
                      <div key={didx} className="text-slate-400 pl-2">• {d}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
