import React, { useState } from 'react';
import {
  Target,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingUp,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Cpu,
  Calculator,
  ArrowRight
} from 'lucide-react';
import { ResumeWorkflowState, RoleMatch } from '../types';

interface CareerMatchPageProps {
  state: ResumeWorkflowState | null;
  onSelectTargetRole: (roleId: string) => void;
  onGoToRoadmap: () => void;
}

export const CareerMatchPage: React.FC<CareerMatchPageProps> = ({
  state,
  onSelectTargetRole,
  onGoToRoadmap,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);

  if (!state) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-3 rounded-2xl bg-slate-800 text-slate-400 w-fit mx-auto mb-3">
          <Target className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">No Career Match Data</h3>
        <p className="text-xs text-slate-400 mb-4">
          Please run the AI pipeline on a resume to view Scikit-Learn TF-IDF Cosine Similarity rankings.
        </p>
      </div>
    );
  }

  const matches = state.career_match_results;
  const rankings = matches?.rankings || [];
  const topMatch = matches?.top_match;
  const vectorMeta = matches?.vector_metadata;

  const categories = Array.from(new Set(rankings.map((r) => r.category)));

  const filteredRankings = rankings.filter(
    (r) => selectedCategory === 'all' || r.category === selectedCategory
  );

  const toggleExpand = (id: string) => {
    setExpandedRoleId(expandedRoleId === id ? null : id);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 pb-16">
      {/* Mathematical Engine Transparency Banner */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 bg-slate-900/60">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-brand-400 uppercase tracking-wider mb-1">
              <Calculator className="h-4 w-4" />
              <span>Measurable Machine Learning Core</span>
            </div>
            <h3 className="text-sm font-bold text-white">
              Scikit-Learn TF-IDF Vectorization & Cosine Similarity Metric
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Matching scores are computed empirically by transforming resume n-grams (1,2) and curated role corpora into sparse feature spaces. The cosine metric measures the exact directional angle in {vectorMeta?.vocabulary_size || 2500}-dimensional space.
            </p>
          </div>

          {/* Math Formula Card */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-[11px] text-slate-300 shrink-0">
            <div className="text-slate-500 text-[10px] mb-1">Vector Formula</div>
            <div className="text-brand-300 font-semibold">
              cos(θ) = (A · B) / (||A|| · ||B||)
            </div>
            <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between gap-3">
              <span>Metric: [0.0 - 1.0]</span>
              <span>Angle: {topMatch?.math_breakdown?.cosine_angle_deg || 0}°</span>
            </div>
          </div>
        </div>

        {/* Top TF-IDF Tokens from Candidate */}
        {vectorMeta?.top_resume_terms && vectorMeta.top_resume_terms.length > 0 && (
          <div className="mt-4 pt-3.5 border-t border-slate-800/80">
            <span className="text-[11px] font-semibold text-slate-400 block mb-2">
              Top TF-IDF Weighted Terms Extracted from Active Resume:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {vectorMeta.top_resume_terms.map((item, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300 border border-slate-700/60 flex items-center gap-1"
                >
                  <span className="text-brand-300">{item.term}</span>
                  <span className="text-slate-500 font-normal">({item.tfidf_weight})</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter and Role List Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-400" />
            <span>Empirical Career Role Rankings ({filteredRankings.length} Evaluated)</span>
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Ranked by mathematical similarity score from highest alignment to lowest.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-brand-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Roles
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Role Cards List */}
      <div className="space-y-4">
        {filteredRankings.map((role, idx) => {
          const isTop = idx === 0 && selectedCategory === 'all';
          const isExpanded = expandedRoleId === role.role_id;
          const isCurrentTarget = state.target_role_id === role.role_id;

          return (
            <div
              key={role.role_id}
              className={`glass-panel rounded-2xl p-5 border transition-all ${
                isTop
                  ? 'border-brand-500/40 shadow-lg shadow-brand-500/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`h-11 w-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      isTop
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-bold text-white">{role.title}</h5>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                        {role.category}
                      </span>
                      {isTop && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/40 font-semibold">
                          Top Match
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 max-w-xl line-clamp-2">
                      {role.description}
                    </p>
                    <div className="text-[11px] text-slate-500 font-mono mt-1.5 flex items-center gap-3">
                      <span>Required Coverage: <strong className="text-emerald-400">{role.required_coverage}%</strong></span>
                    </div>
                  </div>
                </div>

                {/* Score & Actions */}
                <div className="flex items-center gap-4 shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                  <div className="text-right">
                    <div className="text-2xl font-extrabold text-brand-400 font-mono">
                      {role.match_percentage}%
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Cosine Sim: {role.similarity_score}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectTargetRole(role.role_id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        isCurrentTarget
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {isCurrentTarget ? 'Active Target' : 'Set as Target'}
                    </button>
                    <button
                      onClick={() => toggleExpand(role.role_id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                      title="Toggle skill details"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden my-3">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isTop
                      ? 'bg-gradient-to-r from-brand-500 to-indigo-500'
                      : 'bg-slate-600'
                  }`}
                  style={{ width: `${Math.min(role.match_percentage, 100)}%` }}
                ></div>
              </div>

              {/* Expanded Skill Comparison & Math Details */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Matched Required Skills */}
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="text-xs font-bold text-emerald-400 mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Matched Required Skills</span>
                        </span>
                        <span className="font-mono text-[10px]">
                          {role.matched_required_skills.length} skills
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {role.matched_required_skills.length > 0 ? (
                          role.matched_required_skills.map((s, si) => (
                            <span
                              key={si}
                              className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-medium"
                            >
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">No direct required skills matched.</span>
                        )}
                      </div>
                    </div>

                    {/* Missing Required Skills */}
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="text-xs font-bold text-rose-400 mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Missing Required Skills</span>
                        </span>
                        <span className="font-mono text-[10px]">
                          {role.missing_required_skills.length} critical gaps
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {role.missing_required_skills.length > 0 ? (
                          role.missing_required_skills.map((s, si) => (
                            <span
                              key={si}
                              className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px] font-medium"
                            >
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-medium">All required skill terms detected in resume text.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Math Breakdown Table */}
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 font-mono text-[10px] text-slate-400 flex items-center justify-between flex-wrap gap-3">
                    <span>Dot Product: <strong className="text-white">{role.math_breakdown.dot_product}</strong></span>
                    <span>Resume Norm: <strong className="text-white">{role.math_breakdown.resume_norm}</strong></span>
                    <span>Role Norm: <strong className="text-white">{role.math_breakdown.role_norm}</strong></span>
                    <span>Cosine Angle: <strong className="text-brand-300">{role.math_breakdown.cosine_angle_deg}°</strong></span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
