import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { highlightLine } from "./highlightLine";

function SimulationEditor({
  code,
  setCode,
  language = "javascript",
  currentLine,
  highlightType,
  bubbleText,
  bubbleStepKey,
  bubbleShowDelayMs = 0,
  bubbleAutoHideMs = 0,
  bubbleRightOffsetPx = 16,
}) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationRef = useRef([]);
  const bubbleShowTimerRef = useRef(null);
  const bubbleHideTimerRef = useRef(null);
  const scrollListenerRef = useRef(null);
  const currentLineRef = useRef(currentLine);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [bubbleTop, setBubbleTop] = useState(16);

  const applyEditorLanguage = (editor, monaco, nextLanguage) => {
    const model = editor?.getModel?.();
    if (!model || !nextLanguage) return;
    monaco.editor.setModelLanguage(model, nextLanguage);
  };

  const updateBubbleTop = () => {
    const editor = editorRef.current;
    const activeLine = currentLineRef.current;
    if (!editor || !activeLine || activeLine < 1) return;

    const lineTop = editor.getTopForLineNumber(activeLine);
    const nextTop = Math.max(16, lineTop - editor.getScrollTop() - 2);
    setBubbleTop(nextTop);
  };

  useEffect(() => {
    currentLineRef.current = currentLine;
  }, [currentLine]);

  const onMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.updateOptions({
      minimap: { enabled: false },
      fontSize: 15,
      lineHeight: 32,
      fontFamily: "JetBrains Mono, Consolas, monospace",
      scrollBeyondLastLine: false,
      padding: { top: 10, bottom: 10 },
    });

    scrollListenerRef.current = editor.onDidScrollChange(() => updateBubbleTop());
    applyEditorLanguage(editor, monaco, language);
    updateBubbleTop();
  };

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;
    applyEditorLanguage(editor, monaco, language);
  }, [language]);

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    if (!editor || !monaco) return;

    if (!currentLine || currentLine < 1) {
      decorationRef.current = editor.deltaDecorations(decorationRef.current, []);
      return;
    }

    const highlight = highlightLine(currentLine, highlightType);

    if (!highlight) {
      decorationRef.current = editor.deltaDecorations(decorationRef.current, []);
      return;
    }

    decorationRef.current = editor.deltaDecorations(decorationRef.current, [
      {
        range: new monaco.Range(highlight.lineNumber, 1, highlight.lineNumber, 1),
        options: {
          isWholeLine: true,
          className: highlight.className,
          glyphMarginClassName: highlight.className,
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      },
    ]);

    editor.revealLineInCenter(highlight.lineNumber, monaco.editor.ScrollType.Smooth);
    updateBubbleTop();
  }, [currentLine, highlightType]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    if (bubbleHideTimerRef.current) {
      window.clearTimeout(bubbleHideTimerRef.current);
      bubbleHideTimerRef.current = null;
    }
    if (bubbleShowTimerRef.current) {
      window.clearTimeout(bubbleShowTimerRef.current);
      bubbleShowTimerRef.current = null;
    }

    if (!currentLine || !bubbleText) {
      setBubbleVisible(false);
      return;
    }

    updateBubbleTop();

    const showBubble = () => {
      setBubbleVisible(true);

      if (bubbleAutoHideMs > 0) {
        bubbleHideTimerRef.current = window.setTimeout(() => {
          setBubbleVisible(false);
        }, bubbleAutoHideMs);
      }
    };

    if (bubbleShowDelayMs > 0) {
      bubbleShowTimerRef.current = window.setTimeout(showBubble, bubbleShowDelayMs);
    } else {
      showBubble();
    }

    return () => {
      if (bubbleHideTimerRef.current) {
        window.clearTimeout(bubbleHideTimerRef.current);
        bubbleHideTimerRef.current = null;
      }
      if (bubbleShowTimerRef.current) {
        window.clearTimeout(bubbleShowTimerRef.current);
        bubbleShowTimerRef.current = null;
      }
    };
  }, [currentLine, bubbleText, bubbleStepKey, bubbleShowDelayMs, bubbleAutoHideMs]);

  useEffect(() => {
    return () => {
      if (bubbleHideTimerRef.current) {
        window.clearTimeout(bubbleHideTimerRef.current);
      }
      if (bubbleShowTimerRef.current) {
        window.clearTimeout(bubbleShowTimerRef.current);
      }
      if (scrollListenerRef.current) {
        scrollListenerRef.current.dispose();
      }
    };
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-260px)] overflow-hidden rounded-xl border border-slate-700/70 bg-slate-950/55 shadow-panel">
      <Editor
        height="calc(100vh - 260px)"
        language={language}
        theme="vs-dark"
        value={code}
        onChange={(value) => setCode(value || "")}
        onMount={onMount}
      />

      {bubbleText ? (
        <div
          className="pointer-events-none absolute right-4 z-20 transition-all duration-200 ease-out"
          style={{ right: `${bubbleRightOffsetPx}px`, top: `${bubbleTop}px`, opacity: bubbleVisible ? 1 : 0, transform: bubbleVisible ? "translateY(0)" : "translateY(4px)" }}
        >
          <div className="relative max-w-[min(620px,calc(100vw-180px))] rounded-[14px] border border-slate-500/35 bg-slate-900/38 px-4 py-2.5 text-[14px] font-normal leading-7 text-slate-100 shadow-[0_8px_24px_rgba(15,23,42,0.18)] backdrop-blur-md">
            <div className="absolute left-[-7px] top-5 h-3.5 w-3.5 rotate-45 border-l border-t border-slate-500/35 bg-slate-900/40 backdrop-blur-md" />
            <div className="whitespace-pre-line">{bubbleText}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default SimulationEditor;
