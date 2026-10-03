import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Layers,
  Compass
} from 'lucide-react';
import { ResumeWorkflowState } from '../types';

interface SkillGapPageProps {
  state: ResumeWorkflowState | null;
  onSelectRole: (roleId: string) => void;
  onGoToRoadmap: () => void;
  onGoToResume: () => void;
}

export const SkillGapPage: React.FC<SkillGapPageProps> = ({
  state,
  onSelectRole,
  onGoToRoadmap,
  onGoToResume,
}) => {
  if (!state) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-3 rounded-2xl bg-slate-800 text-slate-400 w-fit mx-auto mb-3">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">No Skill Gap Analysis Available</h3>
        <p className="text-xs text-slate-400 mb-4">
          Please upload and analyze a candidate resume to evaluate skill disparities.
        </p>
        <button
          onClick={onGoToResume}
          className="px-4 py-2 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-500 transition-colors"
        >
          Upload Resume
        </button>
      </div>
    );
  }

  const gap = state.skill_gap_results;
  const rankings = state.career_match_results?.rankings || [];
  const currentRoleId = state.target_role_id || rankings[0]?.role_id;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 pb-16">
      {/* Top Role Selector & Metrics Banner */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span>Skill Gap & Prerequisite Disparity Matrix</span>
            </div>
            <h3 className="text-base font-bold text-white">
              Target Evaluation Role: {gap.target_role_title}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Comparison between detected resume skill mentions and the selected role template.
            </p>
          </div>

          {/* Role Switcher Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Evaluate for:</span>
            <select
              value={currentRoleId}
              onChange={(e) => onSelectRole(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-brand-300 font-semibold focus:outline-none focus:border-brand-500"
            >
              {rankings.map((r) => (
                <option key={r.role_id} value={r.role_id}>
                  {r.title} ({r.match_percentage}%)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Readiness Metric Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 pt-4 border-t border-slate-800/80">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Required Skill Terms Detected</span>
              <span className="font-bold text-emerald-400 font-mono">
                {gap.required_match_rate}%
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${gap.required_match_rate}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Overall Skill Coverage</span>
              <span className="font-bold text-brand-400 font-mono">
                {gap.overall_readiness_score}%
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-brand-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${gap.overall_readiness_score}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Disparity Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Skills detected in the resume and listed by the role template */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>Required Skills Detected</span>
            </h4>
            <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              {gap.matched_required.length} Detected
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {gap.matched_required.length > 0 ? (
              gap.matched_required.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium"
                >
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No required terms from this template were detected.</p>
            )}
          </div>
        </div>

        {/* Missing Required Skills */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <XCircle className="h-4 w-4" />
              <span>Critical Missing Skills (Screening Barrier)</span>
            </h4>
            <span className="text-[10px] font-mono text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded-full">
              {gap.missing_required.length} Gaps
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {gap.missing_required.length > 0 ? (
              gap.missing_required.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium"
                >
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-xs text-emerald-400 font-medium">All core requirements met!</p>
            )}
          </div>
        </div>
      </div>

      {/* Priority Learning Areas Table */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
          <Compass className="h-4 w-4 text-brand-400" />
          <span>Priority Learning Ranking (Based on Prerequisite Dependencies)</span>
        </h4>
        <p className="text-xs text-slate-400 mb-4">
          Ordered by foundational prerequisite requirements and role criticality.
        </p>

        <div className="space-y-3">
          {gap.prioritized_learning.map((item, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                item.priority_level === 1
                  ? 'bg-rose-500/5 border-rose-500/20'
                  : 'bg-amber-500/5 border-amber-500/20'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.priority_level === 1
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    Priority {item.priority_level}
                  </span>
                  <span className="text-sm font-bold text-white">{item.skill}</span>
                  <span className="text-xs text-slate-400 font-medium">({item.importance})</span>
                </div>
                <p className="text-xs text-slate-300">{item.reason}</p>
                {item.missing_prerequisites && item.missing_prerequisites.length > 0 && (
                  <div className="text-[11px] text-amber-300 flex items-center gap-1.5 pt-0.5">
                    <span>Missing Prerequisite:</span>
                    <strong>{item.missing_prerequisites.join(', ')}</strong>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actionable Next Steps */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>Actionable Remediation Next Steps</span>
          </h4>
          <button
            onClick={onGoToRoadmap}
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
          >
            <span>Proceed to 16-Week Roadmap</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="space-y-2">
          {gap.actionable_steps.map((step, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-200 flex items-start gap-2.5"
            >
              <span className="h-5 w-5 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span className="leading-relaxed">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
