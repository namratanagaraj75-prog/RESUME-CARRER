import React, { useState, useEffect, useRef } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  Copy,
  Check,
  Sparkles,
  ChevronRight,
  ChevronDown,
  RotateCw,
  Code2,
  Terminal,
  BookOpen,
  X
} from 'lucide-react';
import { CodeTreeNode } from '../types';
import { api } from '../api';

const codeTokenPattern = /(#[^\n]*|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:async|await|class|const|def|else|export|False|false|for|from|function|if|import|in|interface|let|None|null|pass|return|self|True|true|try|type|var|while|yield)\b|\b\d+(?:\.\d+)?\b)/g;

function highlightLine(line: string): React.ReactNode[] {
  return (line.match(/(?:[^\n])/g) || []).join('').split(codeTokenPattern).map((token, index) => {
    let color = '';
    if (/^(#|\/\/)/.test(token)) color = 'text-slate-500 italic';
    else if (/^("|'|`)/.test(token)) color = 'text-emerald-300';
    else if (/^\d/.test(token)) color = 'text-amber-300';
    else if (/^(async|await|class|const|def|else|export|False|false|for|from|function|if|import|in|interface|let|None|null|pass|return|self|True|true|try|type|var|while|yield)$/.test(token)) color = 'text-purple-300';
    return color ? <span key={index} className={color}>{token}</span> : token;
  });
}

export const CodeExplorerPage: React.FC = () => {
  const [tree, setTree] = useState<CodeTreeNode[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string>('backend/app.py');
  const [fileContent, setFileContent] = useState<string>('');
  const [lineCount, setLineCount] = useState<number>(0);
  const [fileSize, setFileSize] = useState<number>(0);
  const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false);
  const [isLoadingTree, setIsLoadingTree] = useState<boolean>(true);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [selectedCode, setSelectedCode] = useState<string>('');
  const codeLinesRef = useRef<HTMLDivElement>(null);

  // AI Explanation State
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState<boolean>(false);
  const [showExplanationPanel, setShowExplanationPanel] = useState<boolean>(false);

  // Expanded folders set
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'frontend': false,
    'backend': true,
    'ml': true,
    'agents': true,
    'llm': true,
    'data': false,
    'tests': true
  });

  useEffect(() => {
    loadTree();
  }, []);

  useEffect(() => {
    if (activeFilePath) {
      loadFile(activeFilePath);
    }
  }, [activeFilePath]);

  const loadTree = async () => {
    try {
      setIsLoadingTree(true);
      const res = await api.getCodeTree();
      setTree(res.tree);
    } catch (err) {
      console.error('Failed to load code tree:', err);
    } finally {
      setIsLoadingTree(false);
    }
  };

  const loadFile = async (path: string) => {
    try {
      setIsLoadingFile(true);
      const res = await api.readCodeFile(path);
      setFileContent(res.content);
      setLineCount(res.lines_count);
      setFileSize(res.size_bytes);
      setSelectedCode('');
      setExplanation(null);
    } catch (err) {
      console.error('Failed to read file:', err);
      setFileContent('// Error reading file.');
    } finally {
      setIsLoadingFile(false);
    }
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(fileContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleExplainCode = async () => {
    try {
      setIsExplaining(true);
      setShowExplanationPanel(true);
      const res = await api.explainCode(activeFilePath, fileContent, selectedCode || undefined);
      setExplanation(res.explanation);
    } catch (err) {
      setExplanation('Failed to generate AI code explanation.');
    } finally {
      setIsExplaining(false);
    }
  };

  const getFileIcon = (node: CodeTreeNode) => {
    const ext = node.extension || '';
    if (['py', 'ts', 'tsx', 'js', 'jsx'].includes(ext)) {
      return <FileCode className="h-3.5 w-3.5 text-brand-400 shrink-0" />;
    }
    if (ext === 'json') {
      return <FileJson className="h-3.5 w-3.5 text-amber-400 shrink-0" />;
    }
    return <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />;
  };

  const renderTree = (nodes: CodeTreeNode[], depth = 0) => {
    return nodes.map((node) => {
      const isDir = node.type === 'directory';
      const isExpanded = !!expandedFolders[node.path];
      const isActive = activeFilePath === node.path;

      if (isDir) {
        return (
          <div key={node.path} className="select-none">
            <button
              onClick={() => toggleFolder(node.path)}
              className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
              style={{ paddingLeft: `${depth * 14 + 8}px` }}
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
              )}
              {isExpanded ? (
                <FolderOpen className="h-3.5 w-3.5 text-brand-400" />
              ) : (
                <Folder className="h-3.5 w-3.5 text-slate-400" />
              )}
              <span className="font-mono text-[11px] font-semibold">{node.name}</span>
            </button>
            {isExpanded && node.children && (
              <div>{renderTree(node.children, depth + 1)}</div>
            )}
          </div>
        );
      }

      return (
        <button
          key={node.path}
          onClick={() => setActiveFilePath(node.path)}
          className={`w-full flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors font-mono text-[11px] ${
            isActive
              ? 'bg-brand-600/20 text-brand-300 font-semibold border-l-2 border-brand-500'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
          style={{ paddingLeft: `${depth * 14 + 20}px` }}
        >
          {getFileIcon(node)}
          <span className="truncate">{node.name}</span>
        </button>
      );
    });
  };

  const lines = fileContent.split('\n');

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Left File Tree Sidebar */}
      <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-brand-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Workspace Source
            </span>
          </div>
          <button
            onClick={loadTree}
            className="p-1 rounded text-slate-400 hover:text-white"
            title="Refresh tree"
          >
            <RotateCw className="h-3 w-3" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {isLoadingTree ? (
            <div className="p-4 text-center text-xs text-slate-500 font-mono flex items-center justify-center gap-2">
              <RotateCw className="h-3.5 w-3.5 animate-spin" />
              <span>Scanning project...</span>
            </div>
          ) : (
            renderTree(tree)
          )}
        </div>

        <div className="p-2 border-t border-slate-800/80 bg-slate-900/40 text-[10px] text-slate-500 font-mono px-3">
          Live workspace files
        </div>
      </div>

      {/* Main Code View Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900/40">
        {/* Editor Top Bar */}
        <div className="h-11 border-b border-slate-800 px-4 flex items-center justify-between bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
            <Code2 className="h-4 w-4 text-brand-400" />
            <span className="text-brand-300 font-semibold">{activeFilePath}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-500 text-[11px]">{lineCount} lines</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-500 text-[11px]">{(fileSize / 1024).toFixed(1)} KB</span>
            {selectedCode && <span className="text-emerald-300 text-[10px]">{selectedCode.length} selected characters</span>}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              {isCopied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              onClick={handleExplainCode}
              disabled={isExplaining}
              className="px-3 py-1 rounded bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm glow-brand"
            >
              {isExplaining ? (
                <>
                  <RotateCw className="h-3 w-3 animate-spin" />
                  <span>Explaining...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3" />
                  <span>{selectedCode ? 'Explain Selection' : 'Explain File'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Code Content Container */}
        <div className="flex-1 overflow-auto bg-slate-950 font-mono text-xs flex">
          {isLoadingFile ? (
            <div className="w-full h-full flex items-center justify-center text-slate-500 gap-2">
              <RotateCw className="h-4 w-4 animate-spin text-brand-400" />
              <span>Loading file contents...</span>
            </div>
          ) : (
            <div className="w-full flex py-3">
              {/* Line Numbers */}
              <div className="select-none text-right pr-4 pl-3 text-slate-600 font-mono border-r border-slate-800/80 shrink-0">
                {lines.map((_, i) => (
                  <div key={i} className="leading-5 h-5 text-[11px]">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Code Lines */}
              <div
                ref={codeLinesRef}
                onMouseUp={() => {
                  const selection = window.getSelection();
                  const selected = selection?.toString().trim() || '';
                  if (selected && selection?.anchorNode && codeLinesRef.current?.contains(selection.anchorNode)) {
                    setSelectedCode(selected);
                  }
                }}
                className="pl-4 pr-6 flex-1 overflow-x-auto"
              >
                {lines.map((line, i) => (
                  <div
                    key={i}
                    className="leading-5 h-5 text-[11px] whitespace-pre text-slate-300 hover:bg-slate-800/40 rounded px-1 transition-colors"
                  >
                    {line ? highlightLine(line) : ' '}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Code Explanation Panel (Collapsible Drawer) */}
      {showExplanationPanel && (
        <div className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 shadow-2xl z-20">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Senior Staff AI Explanation
              </span>
            </div>
            <button
              onClick={() => setShowExplanationPanel(false)}
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 text-xs text-slate-300 leading-relaxed font-sans space-y-3 prose prose-invert prose-xs max-w-none">
            {isExplaining ? (
              <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400 space-y-2">
                <RotateCw className="h-6 w-6 animate-spin text-brand-400" />
                <p className="text-xs font-mono">
                  Synthesizing architectural purpose, function signatures, and component connections...
                </p>
              </div>
            ) : explanation ? (
              <div className="whitespace-pre-line">{explanation}</div>
            ) : (
              <div className="text-slate-500 italic text-center py-10">
                Click "Ask AI to Explain Code" to analyze this source file.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
