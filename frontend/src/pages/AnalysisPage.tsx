import React, { useState } from 'react';
import {
  BarChart3,
  Layers,
  GraduationCap,
  Briefcase,
  FolderGit2,
  Award,
  User,
  Mail,
  Phone,
  ExternalLink,
  Code,
  Tag,
  Hash,
  Sparkles
} from 'lucide-react';
import { ResumeWorkflowState } from '../types';

interface AnalysisPageProps {
  state: ResumeWorkflowState | null;
  onGoToResume: () => void;
}

export const AnalysisPage: React.FC<AnalysisPageProps> = ({ state, onGoToResume }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeSection, setActiveSection] = useState<string>('all');

  if (!state) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-3 rounded-2xl bg-slate-800 text-slate-400 w-fit mx-auto mb-3">
          <BarChart3 className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">No Active Resume Analysis</h3>
        <p className="text-xs text-slate-400 mb-4">
          Please upload or select a candidate resume to view the detailed skills taxonomy and parsed sections.
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
  const contact = prep?.contact_info || { name: 'Candidate', links: [] };
  const skillsData = state.extracted_skills;
  const sections = prep?.sections || {};

  const categories = Object.keys(skillsData?.by_category || {});

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 pb-16">
      {/* Candidate Profile Summary Header */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-brand-500/20">
            {contact.name ? contact.name.charAt(0).toUpperCase() : 'C'}
          </div>
          <div>
            <div className="text-base font-bold text-white flex items-center gap-2">
              <span>{contact.name || 'Candidate'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                Resume Parsed
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
              {contact.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3 text-slate-500" />
                  <span>{contact.email}</span>
                </span>
              )}
              {contact.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3 text-slate-500" />
                  <span>{contact.phone}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Links */}
        {contact.links && contact.links.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {contact.links.map((link, idx) => (
              <a
                key={idx}
                href={link.startsWith('http') ? link : `https://${link}`}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-brand-300 font-mono flex items-center gap-1 transition-colors"
              >
                <span>{link.replace('https://', '').replace('http://', '').slice(0, 25)}</span>
                <ExternalLink className="h-3 w-3 text-slate-500" />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Structural Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <span className="text-slate-500 block text-[11px]">Total Extracted Skills</span>
          <span className="text-lg font-bold text-white font-mono mt-0.5 block">
            {skillsData?.total_count || 0}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <span className="text-slate-500 block text-[11px]">Word Count</span>
          <span className="text-lg font-bold text-white font-mono mt-0.5 block">
            {prep?.word_count || 0}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <span className="text-slate-500 block text-[11px]">Character Density</span>
          <span className="text-lg font-bold text-white font-mono mt-0.5 block">
            {prep?.character_count || 0}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <span className="text-slate-500 block text-[11px]">Identified Categories</span>
          <span className="text-lg font-bold text-white font-mono mt-0.5 block">
            {categories.length}
          </span>
        </div>
      </div>

      {/* Skills Taxonomy Section */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-400" />
              <span>Categorized Skills Taxonomy (skills.json Database)</span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Extracted using boundary-aware regex matching, alias resolution, and domain taxonomies.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                activeCategory === 'all'
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
              }`}
            >
              All ({skillsData?.total_count || 0})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  activeCategory === cat
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {cat.replace('_', ' ').replace('and', '&')}
              </button>
            ))}
          </div>
        </div>

        {/* Skills Display by Category */}
        <div className="space-y-4">
          {categories
            .filter((c) => activeCategory === 'all' || activeCategory === c)
            .map((cat) => {
              const items = skillsData?.by_category[cat] || [];
              const formattedCat = cat.replace(/_/g, ' ').toUpperCase();
              return (
                <div key={cat} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="text-[11px] font-bold text-slate-400 mb-2 flex items-center justify-between">
                    <span>{formattedCat}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{items.length} skills</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((skill, sidx) => (
                      <span
                        key={sidx}
                        className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors"
                      >
                        <span>{skill.name}</span>
                        {skill.frequency > 1 && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-brand-500/20 text-brand-300">
                            x{skill.frequency}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Semantic Sections Breakdown */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-brand-400" />
          <span>Parsed Semantic Resume Sections</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Summary / Objective */}
          {sections.summary && (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs font-bold text-brand-300 mb-2 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Professional Summary</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-sans">
                {sections.summary}
              </p>
            </div>
          )}

          {/* Education */}
          {sections.education && (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs font-bold text-indigo-300 mb-2 flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5" />
                <span>Education Background</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-sans">
                {sections.education}
              </p>
            </div>
          )}

          {/* Experience */}
          {sections.experience && (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 md:col-span-2">
              <div className="text-xs font-bold text-emerald-300 mb-2 flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5" />
                <span>Professional Experience</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-sans">
                {sections.experience}
              </p>
            </div>
          )}

          {/* Projects */}
          {sections.projects && (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs font-bold text-amber-300 mb-2 flex items-center gap-1.5">
                <FolderGit2 className="h-3.5 w-3.5" />
                <span>Key Projects</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-sans">
                {sections.projects}
              </p>
            </div>
          )}

          {/* Certifications */}
          {sections.certifications && (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs font-bold text-cyan-300 mb-2 flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5" />
                <span>Certifications & Licenses</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-sans">
                {sections.certifications}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
