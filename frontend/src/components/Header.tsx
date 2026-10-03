import React, { useMemo, useState } from "react";
import {
  Bell,
  ChevronDown,
  Search,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import { NavTab } from "./Sidebar";

interface HeaderProps {
  setActiveTab: (tab: NavTab) => void;
  onOpenSettings: () => void;
  recentActivity: Array<{
    id: string;
    title: string;
    detail: string;
    createdAt: string;
  }>;
}

const destinations: Array<{ label: string; tab: NavTab }> = [
  { label: "Dashboard", tab: "dashboard" },
  { label: "Upload Resume", tab: "resume" },
  { label: "Analysis", tab: "analysis" },
  { label: "Career Match", tab: "match" },
  { label: "AI Career Guide", tab: "guide" },
  { label: "Career Roadmap", tab: "roadmap" },
  { label: "Code & AI", tab: "code" },
  { label: "Project Presentation", tab: "presentation" },
  { label: "Reports", tab: "reports" },
  { label: "Settings", tab: "settings" },
];

function relativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Just now";
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 60000),
  );
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export const Header: React.FC<HeaderProps> = ({
  setActiveTab,
  onOpenSettings,
  recentActivity,
}) => {
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const filteredDestinations = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? destinations.filter((item) => item.label.toLowerCase().includes(query))
      : [];
  }, [search]);

  const navigate = (tab: NavTab) => {
    setActiveTab(tab);
    setSearch("");
    setShowSearch(false);
    setShowProfile(false);
  };

  return (
    <header className="relative z-20 flex h-16 shrink-0 items-center justify-between border-b border-[#e7edf6] bg-white px-4 sm:px-6">
      <div className="relative w-full max-w-[460px]">
        <label htmlFor="app-search" className="sr-only">
          Search pages
        </label>
        <div className="flex h-10 items-center gap-2.5 rounded-lg border border-[#edf1f7] bg-[#f4f7fc] px-3 text-slate-400 focus-within:border-blue-300 focus-within:bg-white">
          <Search className="h-4 w-4 shrink-0" />
          <input
            id="app-search"
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setShowSearch(true);
            }}
            onFocus={() => setShowSearch(true)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setShowSearch(false);
              if (event.key === "Enter" && filteredDestinations[0])
                navigate(filteredDestinations[0].tab);
            }}
            placeholder="Search anything..."
            className="w-full bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
          />
          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearch("")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {showSearch && search && (
          <div className="absolute left-0 right-0 top-12 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
            {filteredDestinations.length ? (
              filteredDestinations.map((item) => (
                <button
                  key={item.tab}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => navigate(item.tab)}
                  className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                >
                  {item.label}
                </button>
              ))
            ) : (
              <p className="px-3 py-2.5 text-xs text-slate-500">
                No matching pages.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="ml-3 flex shrink-0 items-center gap-3 sm:gap-5">
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            aria-label="Recent activity notifications"
            className="relative rounded-full p-2 text-[#243b61] transition hover:bg-slate-100"
          >
            <Bell className="h-[18px] w-[18px]" />
            {recentActivity.length > 0 && (
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 top-11 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800">
                  Recent Activity
                </h3>
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  aria-label="Close notifications"
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {recentActivity.length ? (
                recentActivity.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="border-t border-slate-100 py-2 first:border-0"
                  >
                    <p className="text-[11px] font-medium text-slate-700">
                      {item.title}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-slate-400">
                      {item.detail} · {relativeTime(item.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="py-3 text-[11px] text-slate-500">
                  No recent activity yet.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            aria-expanded={showProfile}
            className="flex items-center gap-2.5 rounded-lg px-1 py-1 text-left hover:bg-slate-50"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-100 bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700">
              <UserRound className="h-[18px] w-[18px]" />
            </span>
            <ChevronDown className="hidden h-3.5 w-3.5 text-slate-500 sm:block" />
          </button>
          {showProfile && (
            <div className="absolute right-0 top-12 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
              <button
                type="button"
                onClick={() => {
                  onOpenSettings();
                  setShowProfile(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs text-slate-700 hover:bg-slate-50"
              >
                <Settings className="h-3.5 w-3.5" /> Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
