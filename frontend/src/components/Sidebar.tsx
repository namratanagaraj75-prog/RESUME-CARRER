import React from "react";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Target,
  Brain,
  Map,
  Code2,
  Presentation,
  FileBarChart,
  Settings,
  Sparkles,
  ArrowRight,
  Cpu,
} from "lucide-react";

export type NavTab =
  | "dashboard"
  | "resume"
  | "analysis"
  | "match"
  | "gap"
  | "guide"
  | "roadmap"
  | "code"
  | "presentation"
  | "reports"
  | "settings";

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  hasResume: boolean;
  candidateName?: string;
  topRole?: string;
  topScore?: number;
  onGetStarted: () => void;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "resume", label: "Resume", icon: FileText },
  { id: "analysis", label: "Analysis", icon: BarChart3 },
  { id: "match", label: "Career Match", icon: Target },
  { id: "guide", label: "AI Career Guide", icon: Brain },
  { id: "roadmap", label: "Career Roadmap", icon: Map },
  { id: "code", label: "Code & AI", icon: Code2 },
  { id: "presentation", label: "Project Presentation", icon: Presentation },
  { id: "reports", label: "Reports", icon: FileBarChart },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  hasResume,
  candidateName,
  topRole,
  topScore,
  onGetStarted,
}) => (
  <aside className="app-sidebar flex h-dvh min-h-0 w-[72px] shrink-0 flex-col overflow-hidden bg-[#101c31] text-white lg:w-64">
    <div className="app-sidebar-main flex min-h-0 flex-1 flex-col">
      <div className="flex h-[68px] items-center gap-3 border-b border-white/10 px-3 lg:px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 shadow-lg shadow-blue-900/40">
          <Cpu className="h-5 w-5 text-white" />
        </div>
        <div className="hidden min-w-0 lg:block">
          <h1 className="truncate text-sm font-bold tracking-tight">
            AI Career Guide
          </h1>
          <p className="mt-0.5 truncate text-[10px] text-slate-300">
            Resume Analysis &amp; Career Guidance
          </p>
        </div>
      </div>

      {hasResume && (
        <div className="mx-3 mt-3 hidden rounded-xl border border-blue-300/15 bg-white/5 px-3 py-2.5 lg:block">
          <div className="truncate text-[10px] text-slate-400">
            Active resume
          </div>
          <div className="mt-0.5 truncate text-xs font-semibold text-slate-100">
            {candidateName || "Resume loaded"}
          </div>
          {topRole && (
            <div className="mt-1 truncate text-[10px] text-blue-300">
              {topRole} · {topScore}%
            </div>
          )}
        </div>
      )}

      <nav
        aria-label="Main navigation"
        className="app-sidebar-nav mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-2"
      >
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              title={label}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              onClick={() => setActiveTab(id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs transition-colors ${
                active
                  ? "bg-[#2457a8] font-semibold text-white shadow-sm shadow-blue-950/30"
                  : "text-slate-300 hover:bg-white/7 hover:text-white"
              }`}
            >
              <Icon
                className={`h-[18px] w-[18px] shrink-0 ${active ? "text-white" : "text-slate-300"}`}
              />
              <span className="hidden truncate lg:block">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>

    <div className="app-sidebar-footer max-h-[42vh] shrink-0 overflow-y-auto overscroll-contain p-2 lg:p-4">
      <div className="app-sidebar-assistant rounded-2xl border border-blue-400/20 bg-gradient-to-br from-[#15284b] to-[#101b32] p-3 lg:p-4">
        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-300">
          <Sparkles className="h-4 w-4" />
        </div>
        <h2 className="hidden text-xs font-bold lg:block">
          Your AI Career Assistant
        </h2>
        <p className="app-sidebar-assistant-description mt-1 hidden text-[11px] leading-relaxed text-slate-300 lg:block">
          Turn your skills into opportunities with AI.
        </p>
        <button
          type="button"
          onClick={onGetStarted}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#2457a8] px-2 py-2 text-[10px] font-semibold text-white transition hover:bg-blue-600 lg:justify-start lg:px-3"
        >
          <span className="hidden lg:inline">Get Started</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="app-sidebar-meta mt-3 hidden space-y-1 border-t border-white/10 pt-3 text-[9px] text-slate-500 lg:block">
        <div className="flex justify-between">
          <span>Matching</span>
          <span>TF-IDF · cosine</span>
        </div>
        <div className="flex justify-between">
          <span>Workflow</span>
          <span>LangGraph</span>
        </div>
        <div className="flex justify-between">
          <span>API</span>
          <span>FastAPI</span>
        </div>
      </div>
    </div>
  </aside>
);
