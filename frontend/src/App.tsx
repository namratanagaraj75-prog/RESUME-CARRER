import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { ResumePage } from './pages/ResumePage';
import { AnalysisPage } from './pages/AnalysisPage';
import { CareerMatchPage } from './pages/CareerMatchPage';
import { SkillGapPage } from './pages/SkillGapPage';
import { AICareerGuidePage } from './pages/AICareerGuidePage';
import { CareerRoadmapPage } from './pages/CareerRoadmapPage';
import { CodeExplorerPage } from './pages/CodeExplorerPage';
import { PresentationPage } from './pages/PresentationPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ResumeWorkflowState, SampleResume, WorkflowTraceStep } from './types';
import { api } from './api';

export interface RecentActivity {
  id: string;
  title: string;
  detail: string;
  createdAt: string;
}

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [workflowState, setWorkflowState] = useState<ResumeWorkflowState | null>(null);
  const [samples, setSamples] = useState<SampleResume[]>([]);
  const [rawResumeText, setRawResumeText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [resumeSource, setResumeSource] = useState<'none' | 'uploaded' | 'sample' | 'pasted'>('none');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStage, setAnalysisStage] = useState<string>('idle');
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [liveWorkflowTrace, setLiveWorkflowTrace] = useState<WorkflowTraceStep[]>([]);
  const [isPresenting, setIsPresenting] = useState(false);

  useEffect(() => {
    api.getSampleResumes().then(setSamples).catch((err) => {
      console.error('Failed to load optional demo resumes:', err);
    });
  }, []);

  const addActivity = (title: string, detail: string, createdAt = new Date().toISOString()) => {
    setRecentActivity((items) => [
      { id: `${Date.now()}-${items.length}`, title, detail, createdAt },
      ...items,
    ].slice(0, 8));
  };

  const handleSelectSample = (sample: SampleResume) => {
    setWorkflowState(null);
    setResumeSource('sample');
    setFileName(sample.filename);
    setRawResumeText(sample.full_text);
    setFileSize(sample.full_text.length);
    setAnalysisStage('idle');
    addActivity('Demo resume selected', sample.filename);
  };

  const handleUploadFile = async (file: File) => {
    setAnalysisStage('uploading');
    try {
      const res = await api.uploadResume(file);
      setWorkflowState(null);
      setResumeSource('uploaded');
      setFileName(res.filename);
      setFileSize(res.file_size);
      setRawResumeText(res.text);
      // Upload and extraction both completed in the API response.
      setAnalysisStage('idle');
      addActivity('Resume uploaded', res.filename);
    } catch (err) {
      setAnalysisStage('error');
      throw err;
    }
  };

  const runAnalysis = async (text: string, name: string, size: number, targetRoleId?: string | null) => {
    try {
      setIsAnalyzing(true);
      setWorkflowState(null);
      setLiveWorkflowTrace([]);
      // The workflow endpoint returns after all LangGraph nodes finish, so keep
      // processing active until those operations have actually completed.
      setAnalysisStage('processing');

      const res = await api.streamWorkflow(
        text,
        name || 'resume.txt',
        size,
        targetRoleId,
        (step) => setLiveWorkflowTrace((items) => [...items.filter((item) => item.node_name !== step.node_name), step]),
      );

      setWorkflowState(res);
      setLiveWorkflowTrace(res.workflow_trace || []);
      setAnalysisStage('complete');
      const trace = res.workflow_trace || [];
      const activityNodes: Record<string, string> = {
        node_career_match: 'Career matching completed',
        node_skill_gap: 'Skill-gap analysis completed',
        node_roadmap_generation: 'Roadmap generated',
      };
      trace.forEach((step) => {
        const title = activityNodes[step.node_name];
        if (title && step.status === 'COMPLETED') {
          addActivity(title, step.summary, step.timestamp);
        }
      });
      addActivity('Analysis completed', name || 'Resume analysis');
    } catch (err: any) {
      console.error('Workflow execution error:', err);
      setAnalysisStage('error');
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRunWorkflow = async (targetRoleId?: string) => {
    if (!rawResumeText || rawResumeText.trim().length < 15) return;
    try {
      await runAnalysis(rawResumeText, fileName || 'resume.txt', fileSize, targetRoleId || workflowState?.target_role_id);
    } catch {
      addActivity('Analysis failed', 'Check the resume and API connection, then retry.');
    }
  };

  const handleSelectTargetRole = async (roleId: string) => {
    if (workflowState) {
      handleRunWorkflow(roleId);
    }
  };

  const candidateName = workflowState?.preprocessed_data?.contact_info?.name;
  const topMatch = workflowState?.career_match_results?.top_match;

  return (
    <div className={`flex h-screen w-screen overflow-hidden font-sans ${isPresenting ? 'fixed inset-0 z-[100] bg-slate-950' : 'bg-slate-50'}`}>
      {/* Consistent Application Sidebar */}
      {!isPresenting && <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasResume={!!workflowState || !!rawResumeText}
        candidateName={candidateName}
        topRole={topMatch?.title}
        topScore={topMatch?.match_percentage}
        onGetStarted={() => setActiveTab(workflowState ? 'guide' : 'resume')}
      />}

      {/* Main Content Viewport */}
      <div className={`flex min-w-0 flex-1 flex-col overflow-hidden ${isPresenting ? 'h-screen' : ''}`}>
        {!isPresenting && <Header
          setActiveTab={setActiveTab}
          onOpenSettings={() => setActiveTab('settings')}
          recentActivity={recentActivity}
        />}

        <main className={`flex-1 overflow-y-auto ${isPresenting ? 'h-screen overflow-hidden bg-slate-950' : activeTab === 'dashboard' ? 'bg-[#f6f8fc]' : 'bg-slate-950'}`}>
          {activeTab === 'dashboard' && (
            <DashboardPage
              state={workflowState}
              onNavigate={setActiveTab}
              onUploadResume={() => setActiveTab('resume')}
              onRunWorkflow={() => handleRunWorkflow()}
              isAnalyzing={isAnalyzing}
              hasResume={!!rawResumeText}
              recentActivity={recentActivity}
              resumeSource={resumeSource}
              workflowTrace={liveWorkflowTrace}
              onPresent={() => setActiveTab('presentation')}
              analysisStage={analysisStage}
            />
          )}

          {activeTab === 'resume' && (
            <ResumePage
              rawText={rawResumeText}
              setRawText={(text) => {
                setRawResumeText(text);
                setWorkflowState(null);
                setResumeSource(text.trim() ? 'pasted' : 'none');
                setAnalysisStage('idle');
              }}
              resumeSource={resumeSource}
              fileName={fileName}
              setFileName={setFileName}
              fileSize={fileSize}
              setFileSize={setFileSize}
              samples={samples}
              onSelectSample={handleSelectSample}
              onRunWorkflow={() => handleRunWorkflow()}
              isAnalyzing={isAnalyzing}
              analysisStage={analysisStage}
              onUploadFile={handleUploadFile}
              hasState={!!workflowState}
              onViewAnalysis={() => setActiveTab('analysis')}
            />
          )}

          {activeTab === 'analysis' && (
            <AnalysisPage
              state={workflowState}
              onGoToResume={() => setActiveTab('resume')}
            />
          )}

          {activeTab === 'match' && (
            <CareerMatchPage
              state={workflowState}
              onSelectTargetRole={handleSelectTargetRole}
              onGoToRoadmap={() => setActiveTab('roadmap')}
            />
          )}

          {activeTab === 'gap' && (
            <SkillGapPage
              state={workflowState}
              onSelectRole={handleSelectTargetRole}
              onGoToRoadmap={() => setActiveTab('roadmap')}
              onGoToResume={() => setActiveTab('resume')}
            />
          )}

          {activeTab === 'guide' && (
            <AICareerGuidePage
              state={workflowState}
              onGoToResume={() => setActiveTab('resume')}
            />
          )}

          {activeTab === 'roadmap' && (
            <CareerRoadmapPage
              state={workflowState}
              onGoToResume={() => setActiveTab('resume')}
            />
          )}

          {activeTab === 'code' && <CodeExplorerPage />}

          {activeTab === 'presentation' && <PresentationPage onPresentModeChange={setIsPresenting} />}

          {activeTab === 'reports' && (
            <ReportsPage
              state={workflowState}
              onGoToResume={() => setActiveTab('resume')}
            />
          )}

          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
};

export default App;
