import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Brain,
  BrainCircuit,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  Clock3,
  Code2,
  Cog,
  FileBarChart,
  FileCheck2,
  FileText,
  Lightbulb,
  ListChecks,
  Map as MapIcon,
  MessageCircle,
  Radar,
  Sparkles,
  Target,
  Upload,
} from 'lucide-react';
import { ResumeWorkflowState, WorkflowTraceStep } from '../types';
import { NavTab } from '../components/Sidebar';
import { roadmapStorageKey } from './CareerRoadmapPage';

type ActivityItem = { id: string; title: string; detail: string; createdAt: string };
type ResumeSource = 'none' | 'uploaded' | 'sample' | 'pasted';

interface DashboardPageProps {
  state: ResumeWorkflowState | null;
  onNavigate: (tab: NavTab) => void;
  onUploadResume: () => void;
  onRunWorkflow: () => void;
  isAnalyzing: boolean;
  hasResume: boolean;
  recentActivity: ActivityItem[];
  resumeSource: ResumeSource;
  workflowTrace: WorkflowTraceStep[];
  onPresent: () => void;
  analysisStage: string;
}

const stats = [
  { key: 'skills', label: 'Skills Detected', icon: Cog, tone: 'green' },
  { key: 'matches', label: 'Career Matches', icon: FileBarChart, tone: 'purple' },
  { key: 'gaps', label: 'Skill Gaps', icon: FileCheck2, tone: 'orange' },
  { key: 'roadmap', label: 'Roadmap Progress', icon: Lightbulb, tone: 'blue' },
] as const;

const toneClasses: Record<string, string> = {
  green: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  purple: 'bg-violet-50 text-violet-600 ring-violet-100',
  orange: 'bg-orange-50 text-orange-600 ring-orange-100',
  blue: 'bg-blue-50 text-blue-600 ring-blue-100',
};

function timeAgo(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) === 1 ? '' : 's'} ago`;
}

const workflowStages = [
  { label: 'Resume', icon: FileText, node: null },
  { label: 'Processing', icon: Cog, node: 'node_parse_preprocess' },
  { label: 'ML Analysis', icon: Radar, node: 'node_extract_skills' },
  { label: 'Career Matching', icon: Target, node: 'node_career_match' },
  { label: 'Skill Gap', icon: ListChecks, node: 'node_skill_gap' },
  { label: 'AI Agent', icon: BrainCircuit, node: null },
  { label: 'LLM', icon: Brain, node: 'node_career_guidance' },
  { label: 'Career Guidance', icon: Lightbulb, node: 'node_career_guidance' },
  { label: 'Roadmap', icon: MapIcon, node: 'node_roadmap_generation' },
] as const;

export const DashboardPage: React.FC<DashboardPageProps> = ({
  state,
  onNavigate,
  onUploadResume,
  onRunWorkflow,
  isAnalyzing,
  hasResume,
  recentActivity,
  resumeSource,
  workflowTrace,
  onPresent,
  analysisStage,
}) => {
  const [completedMilestones, setCompletedMilestones] = useState(0);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const progressKey = roadmapStorageKey(state);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(progressKey) || '[]');
      setCompletedMilestones(Array.isArray(saved) ? saved.length : 0);
    } catch {
      setCompletedMilestones(0);
    }
  }, [progressKey]);

  const prep = state?.preprocessed_data;
  const matches = state?.career_match_results?.rankings || [];
  const topMatch = state?.career_match_results?.top_match;
  const gap = state?.skill_gap_results;
  const detectedCount = state?.extracted_skills?.total_count || 0;
  const gapCount = (gap?.missing_required.length || 0) + (gap?.missing_preferred.length || 0);
  const roadmap = state?.roadmap || [];
  const roadmapProgress = roadmap.length ? Math.round((completedMilestones / roadmap.length) * 100) : 0;
  const activity = useMemo(
    () => [...recentActivity].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [recentActivity],
  );
  const nodeStatuses = new Map(workflowTrace.map((item) => [item.node_name, item.status.toUpperCase()]));

  const resumeStatus = !hasResume
    ? 'No Resume Uploaded'
    : resumeSource === 'sample'
      ? 'Demo Resume'
      : resumeSource === 'pasted'
        ? 'Resume Text Added'
        : 'Resume Uploaded';

  const overviewCards = [
    {
      title: 'Resume Status',
      value: resumeStatus,
      detail: hasResume ? prep?.contact_info?.name || 'Ready to analyze' : 'Upload a PDF to begin',
      icon: FileText,
      tone: 'blue',
      action: () => onNavigate('resume'),
      link: hasResume ? 'View Resume' : 'Upload Resume',
    },
    {
      title: 'Detected Skills',
      value: String(detectedCount),
      detail: hasResume ? 'Terms found in resume text' : 'No resume analyzed yet',
      icon: Cog,
      tone: 'green',
      action: () => onNavigate('analysis'),
      link: 'View Details',
    },
    {
      title: 'Best Career Match',
      value: topMatch?.title || 'No analysis yet',
      detail: topMatch ? `Cosine similarity · ${topMatch.match_percentage}%` : 'Upload and analyze a resume',
      icon: Target,
      tone: 'purple',
      action: () => onNavigate('match'),
      link: 'View Match',
    },
    {
      title: 'Skill Gaps',
      value: String(gapCount),
      detail: gap ? 'Required and preferred terms not detected' : 'No gaps analyzed yet',
      icon: ListChecks,
      tone: 'orange',
      action: () => onNavigate('gap'),
      link: 'View Gaps',
    },
    {
      title: 'Roadmap Progress',
      value: `${roadmapProgress}%`,
      detail: roadmap.length ? `${completedMilestones} of ${roadmap.length} milestones marked done` : 'Not generated',
      icon: MapIcon,
      tone: 'blue',
      action: () => onNavigate('roadmap'),
      link: 'View Roadmap',
    },
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 px-4 py-4 text-[#142849] sm:px-5 lg:px-6 lg:py-5">
      {analysisStage === 'error' && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">The analysis could not be completed. Check the resume and API connection, then try again.</div>}
      <section className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_372px]">
        <div className="relative flex min-h-[204px] overflow-hidden rounded-xl bg-gradient-to-r from-[#101c31] via-[#10284b] to-[#174875] px-6 py-6 text-white shadow-sm sm:px-8">
          <div className="relative z-10 flex w-full flex-col justify-center pr-0 sm:max-w-[58%]">
            <h2 className="text-xl font-bold tracking-tight sm:text-[22px]">Good morning! <span aria-hidden="true">👋</span></h2>
            <p className="mt-2 max-w-[560px] text-[12px] leading-[1.75] text-blue-100/90 sm:text-[13px]">
              Your AI-powered career journey starts here. Upload your resume, get analyzed, find your best career matches and build your future with personalized guidance.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" onClick={onUploadResume} className="inline-flex items-center gap-2 rounded-lg bg-[#347cf6] px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-950/30 transition hover:bg-blue-500">
                <Upload className="h-4 w-4" /> Upload Resume
              </button>
              {hasResume && !state && (
                <button type="button" onClick={onRunWorkflow} disabled={isAnalyzing} className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2.5 text-xs font-semibold text-blue-100 transition hover:bg-white/10 disabled:opacity-60">
                  {isAnalyzing ? 'Analyzing…' : 'Analyze Resume'}
                </button>
              )}
            </div>
          </div>

          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] items-center justify-center sm:flex">
            <div className="absolute right-[9%] top-[15%] h-36 w-64 rounded-full bg-blue-400/10 blur-2xl" />
            <div className="relative h-40 w-full max-w-[430px]">
              <div className="absolute bottom-3 left-[16%] h-16 w-[59%] -skew-x-12 rounded-xl border border-blue-300/30 bg-gradient-to-b from-[#193e70] to-[#0a1730] shadow-2xl shadow-black/30">
                <div className="absolute inset-x-4 top-3 h-1 rounded bg-blue-300/40" />
                <div className="absolute bottom-3 left-5 right-5 flex items-end gap-2">
                  <span className="h-4 flex-1 rounded-t bg-sky-400/50" />
                  <span className="h-8 flex-1 rounded-t bg-blue-400/70" />
                  <span className="h-6 flex-1 rounded-t bg-indigo-300/60" />
                  <span className="h-11 flex-1 rounded-t bg-cyan-300/60" />
                </div>
              </div>
              <div className="absolute left-[24%] top-2 z-10 h-[112px] w-[86px] -rotate-3 rounded-lg border border-blue-100/80 bg-white p-2 text-slate-700 shadow-xl shadow-black/30">
                <div className="text-[9px] font-bold text-blue-700">RESUME</div>
                <div className="mt-2 space-y-1.5"><div className="h-1 w-full rounded bg-slate-200" /><div className="h-1 w-4/5 rounded bg-slate-200" /><div className="mt-2 h-1 w-2/3 rounded bg-blue-200" /><div className="h-1 w-full rounded bg-slate-200" /><div className="h-1 w-3/4 rounded bg-slate-200" /></div>
              </div>
              <div className="absolute left-[55%] top-2 z-20 flex h-12 w-14 items-center justify-center rounded-xl border border-indigo-300/40 bg-[#283f83]/90 text-cyan-200 shadow-lg shadow-indigo-950/30">
                <BrainCircuit className="h-6 w-6" />
                <Sparkles className="absolute -right-1 -top-2 h-4 w-4 text-amber-300" />
              </div>
              <div className="absolute right-[3%] top-[38%] rounded-lg border border-blue-200/20 bg-[#0b1830]/85 p-2.5 text-[9px] text-blue-100 shadow-xl">
                {['Analyze', 'Match', 'Guide', 'Grow'].map((item) => <div key={item} className="my-1 flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-300" />{item}</div>)}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#e4ebf5] bg-white p-4 shadow-[0_2px_10px_rgba(31,58,99,0.04)]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold">Quick Stats</h3>
            {isAnalyzing && <span className="text-[10px] font-medium text-blue-600">Analysis running</span>}
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {stats.map(({ key, label, icon: Icon, tone }) => {
              const value = key === 'skills' ? detectedCount
                : key === 'matches' ? matches.length
                  : key === 'gaps' ? gapCount
                    : `${roadmapProgress}%`;
              return (
                <div key={key} className="flex min-h-[68px] items-center gap-2.5 rounded-lg border border-[#e9eef6] bg-white px-2.5 py-2">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${toneClasses[tone]}`}><Icon className="h-[18px] w-[18px]" /></span>
                  <span className="min-w-0"><span className="block text-[10px] leading-tight text-slate-500">{label}</span><span className="mt-1 block text-lg font-bold leading-none text-[#142849]">{value}</span></span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_372px]">
        <div className="rounded-xl border border-[#e4ebf5] bg-white p-4 shadow-[0_2px_10px_rgba(31,58,99,0.04)] sm:p-5">
          <h3 className="text-[15px] font-bold">Your Career Overview</h3>
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
            {overviewCards.map(({ title, value, detail, icon: Icon, tone, action, link }) => (
              <div key={title} className="flex min-h-[157px] flex-col rounded-lg border border-[#e6edf7] bg-white p-3 transition hover:border-blue-200 hover:shadow-sm">
                <div className="flex items-center gap-2">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 ${toneClasses[tone]}`}><Icon className="h-4 w-4" /></span>
                  <span className="text-[10px] font-semibold leading-tight text-slate-700">{title}</span>
                </div>
                <div className="mt-3 truncate text-[13px] font-bold text-[#142849]" title={value}>{value}</div>
                <p className="mt-1 min-h-7 text-[9px] leading-relaxed text-slate-500">{detail}</p>
                {title === 'Best Career Match' && topMatch && (
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: `${Math.min(topMatch.match_percentage, 100)}%` }} /></div>
                )}
                {title === 'Roadmap Progress' && roadmap.length > 0 && (
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-500" style={{ width: `${roadmapProgress}%` }} /></div>
                )}
                <button type="button" onClick={action} className="mt-auto flex items-center gap-1 pt-2 text-[9px] font-medium text-blue-600 hover:text-blue-800">{link}<ArrowRight className="h-3 w-3" /></button>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-[#e8eef7] bg-[#fbfdff] p-3.5 sm:p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h4 className="text-[13px] font-bold">AI-Powered Career Analysis Workflow</h4>
                <p className="mt-1 text-[10px] text-slate-500">From your resume to your career plan — powered by AI</p>
              </div>
              {isAnalyzing && <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-medium text-blue-700"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />Request in progress</span>}
            </div>
            <div className="mt-4 flex overflow-x-auto pb-1">
              {workflowStages.map(({ label, icon: Icon, node }, index) => {
                const status = label === 'Resume'
                  ? (hasResume ? 'COMPLETED' : 'WAITING')
                  : label === 'AI Agent'
                    ? (state ? 'COMPLETED' : isAnalyzing ? 'RUNNING' : 'WAITING')
                    : (node ? nodeStatuses.get(node) || 'WAITING' : 'WAITING');
                const done = status === 'COMPLETED' || status === 'SUCCESS';
                return (
                  <React.Fragment key={label}>
                    <div className="flex min-w-[72px] flex-1 flex-col items-center text-center">
                      <span className={`flex h-11 w-11 items-center justify-center rounded-full border ${done ? 'border-blue-300 bg-blue-50 text-blue-600' : status === 'RUNNING' ? 'animate-pulse border-blue-300 bg-blue-50 text-blue-600' : 'border-slate-200 bg-white text-slate-400'}`}><Icon className="h-5 w-5" /></span>
                      <span className="mt-1.5 max-w-[78px] text-[9px] font-medium leading-tight text-[#243b61]">{label}</span>
                      <span className={`mt-1 text-[8px] ${done ? 'text-emerald-600' : status === 'FAILED' ? 'text-rose-600' : status === 'RUNNING' ? 'text-blue-600' : 'text-slate-400'}`}>{done ? 'Complete' : status === 'FAILED' ? 'Failed' : status === 'RUNNING' ? 'Running' : 'Waiting'}</span>
                    </div>
                    {index < workflowStages.length - 1 && <span className="mt-[18px] flex shrink-0 items-start text-slate-400"><ChevronRight className="h-4 w-4" /></span>}
                  </React.Fragment>
                );
              })}
            </div>
            {state && <p className="mt-2 text-right text-[9px] text-slate-400">Statuses come from the completed workflow trace.</p>}
          </div>
        </div>

        <aside className="rounded-xl border border-[#e4ebf5] bg-white p-4 shadow-[0_2px_10px_rgba(31,58,99,0.04)]">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-bold">Recent Activity</h3>
            {activity.length > 4 && <button type="button" onClick={() => setShowAllActivity(!showAllActivity)} className="text-[10px] font-medium text-blue-600 hover:text-blue-800">{showAllActivity ? 'Show Less' : 'View All'}</button>}
          </div>
          {activity.length === 0 ? (
            <div className="flex min-h-[180px] flex-col items-center justify-center text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400"><Clock3 className="h-5 w-5" /></span>
              <p className="mt-2 text-xs font-medium text-slate-600">No recent activity</p>
              <p className="mt-1 max-w-[220px] text-[10px] leading-relaxed text-slate-400">Upload a resume to start your analysis history.</p>
            </div>
          ) : (
            <div className="mt-2 divide-y divide-[#edf1f6]">
              {(showAllActivity ? activity : activity.slice(0, 5)).map((item, index) => {
                const Icon = item.title.toLowerCase().includes('upload') ? FileText
                  : item.title.toLowerCase().includes('roadmap') ? MapIcon
                    : item.title.toLowerCase().includes('matching') ? Target
                      : item.title.toLowerCase().includes('skill-gap') ? ListChecks
                        : BrainCircuit;
                const colors = ['bg-emerald-50 text-emerald-600', 'bg-sky-50 text-sky-600', 'bg-orange-50 text-orange-600', 'bg-violet-50 text-violet-600', 'bg-blue-50 text-blue-600'];
                return (
                  <div key={item.id} className="flex items-center gap-2.5 py-2.5 first:pt-2">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${colors[index % colors.length]}`}><Icon className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-medium text-[#243b61]">{item.title}</span><span className="mt-0.5 block truncate text-[9px] text-slate-500">{item.detail}</span><span className="mt-0.5 block text-[8px] text-slate-400">{timeAgo(item.createdAt)}</span></span>
                  </div>
                );
              })}
            </div>
          )}
        </aside>
      </section>

      <section className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_372px]">
        <div className="rounded-xl border border-[#e4ebf5] bg-white p-4 shadow-[0_2px_10px_rgba(31,58,99,0.04)] sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div><h3 className="text-[15px] font-bold">Recommended Career Paths</h3><p className="mt-1 text-[10px] text-slate-500">{state ? 'Ranked by TF-IDF cosine similarity to the current resume.' : 'Based on your skills and experience'}</p></div>
            {state && <button type="button" onClick={() => onNavigate('match')} className="flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-800">View All <ArrowRight className="h-3 w-3" /></button>}
          </div>
          {matches.length === 0 ? (
            <div className="mt-4 flex min-h-[105px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-4 text-center text-xs text-slate-500">Upload and analyze your resume to see career matches.</div>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
              {matches.slice(0, 4).map((role, index) => {
                const iconColors = ['bg-sky-50 text-sky-600', 'bg-violet-50 text-violet-600', 'bg-orange-50 text-orange-600', 'bg-blue-50 text-blue-600'];
                return (
                  <button key={role.role_id} type="button" onClick={() => onNavigate('match')} className="rounded-lg border border-[#e7edf6] p-3 text-left transition hover:border-blue-200 hover:shadow-sm">
                    <span className="flex items-start justify-between gap-2"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconColors[index % iconColors.length]}`}><BriefcaseBusiness className="h-4 w-4" /></span><span className="rounded-md bg-blue-50 px-2 py-1 text-[9px] font-semibold text-blue-700">{role.match_percentage}%</span></span>
                    <span className="mt-2 block min-h-8 text-[10px] font-bold leading-tight text-[#142849]">{role.title}</span>
                    <span className="mt-1 block truncate text-[9px] text-slate-500">{role.category}</span>
                    <span className="mt-2 block text-[8px] text-slate-500">{role.matched_required_skills.length} required terms detected</span>
                    <span className="mt-2 inline-flex items-center gap-1 text-[9px] font-medium text-blue-600">View Details <ArrowRight className="h-3 w-3" /></span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-[#e4ebf5] bg-white p-4 shadow-[0_2px_10px_rgba(31,58,99,0.04)]">
            <h3 className="text-[15px] font-bold">Quick Actions</h3>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {[
                { label: 'Upload Resume', icon: Upload, action: onUploadResume, tone: 'bg-blue-50 text-blue-600' },
                { label: 'View Analysis', icon: Radar, action: () => onNavigate('analysis'), tone: 'bg-indigo-50 text-indigo-600' },
                { label: 'Explore Code', icon: Code2, action: () => onNavigate('code'), tone: 'bg-cyan-50 text-cyan-700' },
                { label: 'View Reports', icon: FileText, action: () => onNavigate('reports'), tone: 'bg-sky-50 text-sky-600' },
              ].map(({ label, icon: Icon, action, tone }) => (
                <button key={label} type="button" onClick={action} className="flex min-h-[56px] items-center gap-2 rounded-lg border border-[#e9eef6] px-2.5 text-left transition hover:border-blue-200 hover:bg-slate-50">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}><Icon className="h-4 w-4" /></span><span className="text-[9px] font-semibold text-[#243b61]">{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-[#e4ebf5] bg-gradient-to-br from-white to-[#f6f9ff] p-4 shadow-[0_2px_10px_rgba(31,58,99,0.04)]">
            <MessageCircle className="h-4 w-4 text-blue-600" />
            <blockquote className="mt-2 text-[11px] italic leading-relaxed text-[#243b61]">“The best time to plant a tree was 20 years ago. The second best time is now.”</blockquote>
            <p className="mt-2 text-[9px] text-slate-500">— Chinese proverb</p>
          </div>
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-2 pb-1 text-[9px] text-slate-400">
        <span className="flex items-center gap-2"><span className="font-medium text-[#243b61]">AI Career Guide</span><span>·</span><span>Build Skills</span><span>·</span><span>Find Opportunities</span><span>·</span><span>Create Your Future</span></span>
        <span className="flex items-center gap-3"><button type="button" onClick={onPresent} className="font-medium text-blue-600 hover:text-blue-800">Open Presentation</button><span>TF-IDF · FastAPI · LangGraph</span></span>
      </footer>
    </div>
  );
};
