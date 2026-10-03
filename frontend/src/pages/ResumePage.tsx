import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  ArrowRight,
  Eye,
  Trash2,
  Zap,
} from "lucide-react";
import { SampleResume } from "../types";

interface ResumePageProps {
  rawText: string;
  setRawText: (text: string) => void;
  fileName: string;
  setFileName: (name: string) => void;
  fileSize: number;
  resumeSource: "none" | "uploaded" | "sample" | "pasted";
  setFileSize: (size: number) => void;
  samples: SampleResume[];
  onSelectSample: (sample: SampleResume) => void;
  onRunWorkflow: () => void;
  isAnalyzing: boolean;
  analysisStage: string;
  onUploadFile: (file: File) => Promise<void>;
  hasState: boolean;
  onViewAnalysis: () => void;
}

export const ResumePage: React.FC<ResumePageProps> = ({
  rawText,
  setRawText,
  fileName,
  setFileName,
  fileSize,
  resumeSource,
  setFileSize,
  samples,
  onSelectSample,
  onRunWorkflow,
  isAnalyzing,
  analysisStage,
  onUploadFile,
  hasState,
  onViewAnalysis,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stages = [
    { id: "uploading", label: "Uploading" },
    { id: "extracting", label: "Extracting" },
    { id: "processing", label: "Processing" },
    { id: "analyzing", label: "Analyzing" },
    { id: "matching", label: "Matching" },
    { id: "guidance", label: "Guidance" },
    { id: "complete", label: "Complete" },
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setUploadError(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processSelectedFile(file);
    }
  };

  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await processSelectedFile(file);
      e.target.value = "";
    }
  };

  const processSelectedFile = async (file: File) => {
    setUploadError(null);
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "txt", "md"].includes(ext || "")) {
      setUploadError("Invalid format. Please upload a PDF or TXT file.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError("File is too large (max 15MB).");
      return;
    }

    try {
      setIsUploading(true);
      await onUploadFile(file);
    } catch (err: any) {
      setUploadError(err.message || "Failed to extract text from file.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setRawText("");
    setFileName("");
    setFileSize(0);
    setUploadError(null);
  };

  const currentStageIndex = stages.findIndex((s) => s.id === analysisStage);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-brand-400" />
            <span>Resume Ingestion & PDF Extraction</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Extracts text, normalizes whitespace, segments sections, and detects
            contact details.
          </p>
        </div>

        {rawText && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5 text-slate-400" />
              <span>Clear</span>
            </button>
            <button
              onClick={onRunWorkflow}
              disabled={isAnalyzing}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold shadow-md transition-all flex items-center gap-1.5 ${
                isAnalyzing
                  ? "bg-brand-700/50 text-brand-300 cursor-not-allowed"
                  : "bg-brand-600 hover:bg-brand-500 text-white shadow-brand-500/25 glow-brand"
              }`}
            >
              {isAnalyzing ? (
                <>
                  <RotateCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Analyzing Profile...</span>
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5" />
                  <span>Run Full AI Pipeline</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Stage Progression Stepper */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
          <span>Actual Pipeline Processing Stages</span>
          <span className="font-mono text-brand-300 lowercase text-[11px]">
            {analysisStage ? `status: ${analysisStage}` : "status: idle"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {stages.map((stage, idx) => {
            const isSkipped =
              (resumeSource === "sample" || resumeSource === "pasted") &&
              (stage.id === "uploading" || stage.id === "extracting");
            const isCompleted =
              !isSkipped &&
              (analysisStage === "complete" ||
                (currentStageIndex >= 0 && idx < currentStageIndex));
            const isCurrent = analysisStage === stage.id && isAnalyzing;
            return (
              <div
                key={stage.id}
                title={
                  isSkipped
                    ? `${stage.label} skipped for ${resumeSource} input`
                    : stage.label
                }
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                  isCompleted
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : isSkipped
                      ? "bg-slate-900/30 border-slate-800/60 text-slate-600"
                      : isCurrent
                        ? "bg-brand-500/20 border-brand-500/50 text-brand-200 ring-1 ring-brand-500/30 animate-pulse"
                        : "bg-slate-900/60 border-slate-800 text-slate-500"
                }`}
              >
                <div className="flex items-center gap-1 mb-1">
                  {isCompleted ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  ) : isCurrent ? (
                    <RotateCw className="h-3.5 w-3.5 text-brand-400 animate-spin" />
                  ) : (
                    <span className="h-3 w-3 rounded-full border border-slate-700 flex items-center justify-center text-[9px] font-mono">
                      {idx + 1}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-semibold tracking-tight">
                  {isSkipped ? "Skipped" : stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {analysisStage === "error" && (
        <div
          role="status"
          className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs"
        >
          The last upload or analysis did not finish. Review the error above or
          retry the operation.
        </div>
      )}

      {/* Upload Box */}
      <div className="space-y-6">
        <div className="space-y-4">
          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragging
                ? "border-brand-500 bg-brand-500/10 scale-[1.01]"
                : "border-slate-700/80 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/70"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".pdf,.txt,.md"
              className="hidden"
            />
            <div className="h-12 w-12 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center mb-3">
              <UploadCloud className="h-6 w-6 text-brand-400" />
            </div>
            <div className="font-semibold text-sm text-slate-200 mb-1">
              Drag & drop your PDF resume here, or{" "}
              <span className="text-brand-400 underline">browse</span>
            </div>
            <p className="text-[11px] text-slate-400 max-w-sm">
              Supports real PDF documents with multi-page text extraction via
              PyPDF. Maximum file size: 15MB.
            </p>

            {isUploading && (
              <div className="mt-4 flex items-center gap-2 text-xs text-brand-300 font-mono">
                <RotateCw className="h-3.5 w-3.5 animate-spin" />
                <span>Extracting binary stream & normalizing text...</span>
              </div>
            )}
          </div>

          {uploadError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Active File Info Banner */}
          {fileName && (
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">
                    {fileName}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {fileSize > 0
                      ? `${(fileSize / 1024).toFixed(1)} KB`
                      : "Text format"}{" "}
                    • {rawText.length} characters
                  </div>
                </div>
              </div>
              {hasState && (
                <button
                  onClick={onViewAnalysis}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>View Analysis Results</span>
                </button>
              )}
            </div>
          )}

          {/* Extracted Text Preview Area */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <span>Extracted Resume Text Preview</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  (Editable)
                </span>
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {rawText.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Resume text will appear here once uploaded, or paste your plain text resume directly..."
              rows={12}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-brand-500/50 leading-relaxed resize-y"
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  );
};
