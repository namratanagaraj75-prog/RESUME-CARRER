import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Presentation } from 'lucide-react';
import './PresentationPage.css';

const slideTitles = [
  'Title',
  'Abstract',
  'Introduction',
  'Problem Statement',
  'Existing System',
  'Proposed System',
  'Objectives',
  'Project Architecture',
  'Technology Stack',
  'Major System Components',
  'Resume Upload & PDF Extraction',
  'Resume Text Preprocessing',
  'Skill Extraction Using NLP',
  'TF-IDF',
  'Cosine Similarity',
  'Career Matching',
  'Skill Gap Analysis',
  'AI Career Guidance Agent',
  'Large Language Model',
  'LangGraph Workflow',
  'Backend & API — FastAPI',
  'User Interface',
  'Complete System Workflow',
  'Actual System Outputs',
  'System Testing & Validation',
  'Limitations',
  'Future Enhancements',
  'Project Value & System Outcomes',
  'Conclusion & Key Takeaways',
  'Thank You / Questions & Answers',
] as const;

const slideCount = 30;
const slideImage = (index: number) => `/presentation/pages/slide-${String(index + 1).padStart(2, '0')}.png`;
const slideFullImage = (index: number) => `/presentation/full/slide-${String(index + 1).padStart(2, '0')}.png`;

type PresentationPageProps = {
  onPresentModeChange: (presenting: boolean) => void;
};

export const PresentationPage: React.FC<PresentationPageProps> = ({ onPresentModeChange }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const thumbnailRailRef = useRef<HTMLElement>(null);

  const selectSlide = useCallback((index: number) => {
    setActiveSlide(Math.max(0, Math.min(slideCount - 1, index)));
  }, []);

  const previous = useCallback(() => selectSlide(activeSlide - 1), [activeSlide, selectSlide]);
  const next = useCallback(() => selectSlide(activeSlide + 1), [activeSlide, selectSlide]);

  const exitFullscreen = useCallback(async () => {
    if (document.fullscreenElement === shellRef.current) {
      try {
        await document.exitFullscreen();
      } catch {
        setIsFullscreen(false);
        onPresentModeChange(false);
      }
    } else {
      setIsFullscreen(false);
      onPresentModeChange(false);
    }
  }, [onPresentModeChange]);

  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      await exitFullscreen();
      return;
    }

    try {
      if (shellRef.current?.requestFullscreen) {
        await shellRef.current.requestFullscreen();
      }
    } catch {
      // Keep a CSS full-window presentation available when browser fullscreen is unavailable.
    }
    setIsFullscreen(true);
    onPresentModeChange(true);
  }, [exitFullscreen, isFullscreen, onPresentModeChange]);

  useEffect(() => {
    const shell = shellRef.current;
    const handleFullscreenChange = () => {
      const fullscreen = document.fullscreenElement === shell;
      setIsFullscreen(fullscreen);
      onPresentModeChange(fullscreen);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (document.fullscreenElement === shell) void document.exitFullscreen();
      onPresentModeChange(false);
    };
  }, [onPresentModeChange]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName || '')) return;

      if (event.key === 'Escape' && isFullscreen) {
        event.preventDefault();
        void exitFullscreen();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        previous();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        next();
      } else if ((event.code === 'Space' || event.key === ' ') && !target?.closest('button, a')) {
        event.preventDefault();
        next();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [exitFullscreen, isFullscreen, next, previous]);

  useEffect(() => {
    const rail = thumbnailRailRef.current;
    const activeThumbnail = rail?.querySelector<HTMLButtonElement>(`[data-slide-index="${activeSlide}"]`);
    if (!rail || !activeThumbnail) return;

    const left = activeThumbnail.offsetLeft;
    const right = left + activeThumbnail.offsetWidth;
    if (left < rail.scrollLeft) rail.scrollTo({ left, behavior: 'smooth' });
    else if (right > rail.scrollLeft + rail.clientWidth) {
      rail.scrollTo({ left: right - rail.clientWidth, behavior: 'smooth' });
    }
  }, [activeSlide]);

  return (
    <div ref={shellRef} className={`presentation-viewer${isFullscreen ? ' presentation-viewer-fullscreen' : ''}`}>
      <header className="presentation-viewer-header">
        <div className="presentation-viewer-title">
          <span className="presentation-viewer-icon"><Presentation size={19} strokeWidth={1.8} /></span>
          <div>
            <h1>Project Presentation</h1>
            <p>AI Career Guidance System <i /> 30 slides</p>
          </div>
        </div>
        <div className="presentation-viewer-actions">
          <span className="presentation-counter" aria-live="polite">{activeSlide + 1} <i>/</i> {slideCount}</span>
          <button className="presentation-fullscreen-toggle" type="button" onClick={() => void toggleFullscreen()} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'} title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}>
            {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
            <span>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
          </button>
        </div>
      </header>

      <section className="presentation-slide-stage" aria-label={`Slide ${activeSlide + 1} of ${slideCount}: ${slideTitles[activeSlide]}`}>
        <div className="presentation-slide-frame" key={activeSlide}>
          <img src={slideFullImage(activeSlide)} alt={`Slide ${activeSlide + 1}: ${slideTitles[activeSlide]}`} width="1920" height="1080" decoding="async" fetchPriority="high" draggable={false} />
        </div>
      </section>

      <nav className="presentation-thumbnail-rail" aria-label="Slide thumbnails" ref={thumbnailRailRef}>
        {slideTitles.map((title, index) => (
          <button
            className={`presentation-thumbnail${activeSlide === index ? ' presentation-thumbnail-active' : ''}`}
            key={title}
            type="button"
            data-slide-index={index}
            aria-label={`Go to slide ${index + 1}: ${title}`}
            aria-current={activeSlide === index ? 'step' : undefined}
            aria-pressed={activeSlide === index}
            title={`${index + 1}. ${title}`}
            onClick={() => selectSlide(index)}
          >
            <img src={slideImage(index)} alt="" width="320" height="180" loading="lazy" decoding="async" draggable={false} />
            <span>{String(index + 1).padStart(2, '0')}</span>
          </button>
        ))}
      </nav>

      <footer className="presentation-viewer-footer">
        <div className="presentation-keyboard-hint" aria-label="Keyboard shortcuts">
          <kbd>←</kbd><kbd>→</kbd><span>navigate</span><kbd>SPACE</kbd><span>next</span><kbd>ESC</kbd><span>exit fullscreen</span>
        </div>
        <div className="presentation-slide-controls">
          <button type="button" className="presentation-control-button" onClick={previous} disabled={activeSlide === 0}>
            <ChevronLeft size={18} /><span>Previous</span>
          </button>
          <span className="presentation-footer-counter" aria-live="polite">{activeSlide + 1} / {slideCount}</span>
          <button type="button" className="presentation-control-button" onClick={next} disabled={activeSlide === slideCount - 1}>
            <span>Next</span><ChevronRight size={18} />
          </button>
        </div>
      </footer>
    </div>
  );
};
