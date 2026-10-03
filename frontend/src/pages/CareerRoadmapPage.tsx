import React, { useState, useEffect } from 'react';
import {
  Map,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Code2,
  FolderGit2,
  FileText,
  Target,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ResumeWorkflowState, RoadmapStage } from '../types';

interface CareerRoadmapPageProps {
  state: ResumeWorkflowState | null;
  onGoToResume: () => void;
}

export function roadmapStorageKey(state: ResumeWorkflowState | null): string {
  if (!state) return 'career-roadmap:none';
  let hash = 2166136261;
  for (let i = 0; i < state.raw_text.length; i += 1) {
    hash = Math.imul(hash ^ state.raw_text.charCodeAt(i), 16777619);
  }
  return `career-roadmap:${encodeURIComponent(state.file_meta?.filename || 'resume')}:${state.target_role_id || 'recommended'}:${(hash >>> 0).toString(16)}`;
}

function readCompletedStages(key: string): number[] {
  try {
    const stored = JSON.parse(window.localStorage.getItem(key) || '[]');
    return Array.isArray(stored) ? stored.filter((stage): stage is number => Number.isInteger(stage)) : [];
  } catch {
    return [];
  }
}

export const CareerRoadmapPage: React.FC<CareerRoadmapPageProps> = ({ state, onGoToResume }) => {
  const progressKey = roadmapStorageKey(state);
  const [expandedStage, setExpandedStage] = useState<number | null>(1);
  const [completedStages, setCompletedStages] = useState<number[]>(() => readCompletedStages(progressKey));

  useEffect(() => {
    setCompletedStages(readCompletedStages(progressKey));
  }, [progressKey]);

  if (!state) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-3 rounded-2xl bg-slate-800 text-slate-400 w-fit mx-auto mb-3">
          <Map className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">No Career Roadmap Generated</h3>
        <p className="text-xs text-slate-400 mb-4">
          Please upload or select a resume to generate an actionable 16-week milestone roadmap.
        </p>
        <button
          onClick={onGoToResume}
          className="px-4 py-2 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-500 transition-colors"
        >
          Go to Resume Ingestion
        </button>
      </div>
    );
  }

  const roadmap: RoadmapStage[] = state.roadmap || [];
  const targetRole = state.skill_gap_results?.target_role_title || 'Target Role';

  const toggleStage = (stageNumber: number) => {
    setCompletedStages((previous) => {
      const next = previous.includes(stageNumber)
        ? previous.filter((item) => item !== stageNumber)
        : [...previous, stageNumber].sort((a, b) => a - b);
      try {
        window.localStorage.setItem(progressKey, JSON.stringify(next));
      } catch {
        // Keep progress usable for this view if browser storage is unavailable.
      }
      return next;
    });
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'CheckCircle2':
        return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
      case 'AlertTriangle':
        return <AlertTriangle className="h-5 w-5 text-amber-400" />;
      case 'BookOpen':
        return <BookOpen className="h-5 w-5 text-blue-400" />;
      case 'Code2':
        return <Code2 className="h-5 w-5 text-indigo-400" />;
      case 'FolderGit2':
        return <FolderGit2 className="h-5 w-5 text-purple-400" />;
      case 'FileText':
        return <FileText className="h-5 w-5 text-pink-400" />;
      case 'Target':
        return <Target className="h-5 w-5 text-brand-400" />;
      default:
        return <Sparkles className="h-5 w-5 text-brand-400" />;
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-400 uppercase tracking-wider mb-1">
            <Map className="h-4 w-4" />
            <span>Role-Focused Learning Roadmap</span>
          </div>
          <h3 className="text-base font-bold text-white">
            Personalized 16-Week Strategic Roadmap targeting {targetRole}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Built from detected resume skills, calculated role-template gaps, and portfolio project steps.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 shrink-0 min-w-44">
          <div className="text-slate-500 text-[10px] mb-0.5">Timeline Overview</div>
          <div className="text-brand-300 font-bold">16 Total Weeks · {roadmap.length} Stages</div>
          <div className="mt-2 flex justify-between text-[10px] text-slate-400">
            <span>Self-reported progress</span>
            <span>{completedStages.length} / {roadmap.length}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-emerald-400 transition-all" style={{ width: `${roadmap.length ? completedStages.length / roadmap.length * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      <p className="-mt-3 text-[11px] text-slate-500">
        Mark milestones complete as you finish them. Progress is saved in this browser for this resume.
      </p>

      {/* Progression Timeline List */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-800">
        {roadmap.map((stage) => {
          const isComplete = completedStages.includes(stage.stage_number);
          const isExpanded = expandedStage === stage.stage_number;
          return (
            <div key={stage.stage_number} className="relative group">
              {/* Timeline marker */}
              <div className="absolute -left-6 top-4 h-6 w-6 rounded-full bg-slate-900 border-2 border-brand-500/60 flex items-center justify-center -translate-x-1/2 shadow-md">
                <span className="text-[10px] font-bold text-brand-300 font-mono">
                  {stage.stage_number}
                </span>
              </div>

              {/* Stage Card */}
              <div
                className={`glass-panel rounded-2xl p-5 border transition-all ${
                  isComplete
                    ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                      {getIcon(stage.icon)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{stage.stage_name}</h4>
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${isComplete ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                          {isComplete ? 'Completed' : 'Planned'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <Clock className="h-3 w-3 text-slate-500" />
                        <span className="font-mono text-[11px] text-brand-300">{stage.timeline}</span>
                        <span>•</span>
                        <span className="text-slate-400">{stage.description}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleStage(stage.stage_number)}
                      className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-semibold transition-colors ${isComplete ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'}`}
                    >
                      {isComplete ? 'Mark planned' : 'Mark complete'}
                    </button>
                    <button
                      onClick={() => setExpandedStage(expandedStage === stage.stage_number ? null : stage.stage_number)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${stage.stage_name}`}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Action Items & Deliverables */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Key Deliverables
                      </div>
                      <div className="space-y-1">
                        {stage.deliverables.map((del, didx) => (
                          <div
                            key={didx}
                            className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs text-slate-200 font-medium flex items-center gap-2"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                            <span>{del}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Action Checklist
                      </div>
                      <div className="space-y-1">
                        {stage.action_items.map((act, aidx) => (
                          <div
                            key={aidx}
                            className="text-xs text-slate-300 flex items-start gap-2 pl-1"
                          >
                            <span className="text-brand-400">•</span>
                            <span>{act}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
