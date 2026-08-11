import { useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";

// Parse all line numbers from javac-style error messages:
//   Main.java:5: error: ';' expected
const JAVAC_LINE_RE = /\bMain\.java:(\d+):.*?error:\s*(.+)/g;

function CodeEditor({
  code,
  setCode,
  errorLine,
  errorMessage,
  readOnly,
  isFullscreen,
  editorHeight,
}) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const model = editor.getModel();
    if (!model) return;

    const markers = [];

    // Parse all compilation error lines from javac output
    if (errorMessage) {
      JAVAC_LINE_RE.lastIndex = 0;
      let match;
      while ((match = JAVAC_LINE_RE.exec(errorMessage)) !== null) {
        const line = parseInt(match[1], 10);
        const msg = match[2].trim();
        if (line >= 1 && line <= model.getLineCount()) {
          markers.push({
            startLineNumber: line,
            startColumn: 1,
            endLineNumber: line,
            endColumn: model.getLineMaxColumn(line),
            message: msg,
            severity: monaco.MarkerSeverity.Error,
          });
        }
      }
    }

    // If no markers were parsed from the message but we have an errorLine,
    // fall back to marking that single line (e.g. for runtime errors)
    if (markers.length === 0 && errorLine && errorLine >= 1 && errorLine <= model.getLineCount()) {
      markers.push({
        startLineNumber: errorLine,
        startColumn: 1,
        endLineNumber: errorLine,
        endColumn: model.getLineMaxColumn(errorLine),
        message: "Error on this line",
        severity: monaco.MarkerSeverity.Error,
      });
    }

    monaco.editor.setModelMarkers(model, "java-errors", markers);
  }, [errorLine, errorMessage]);

  const handleChange = (value) => {
    setCode(value);
    // Clear error markers as user edits
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (editor && monaco) {
      const model = editor.getModel();
      if (model) {
        monaco.editor.setModelMarkers(model, "java-errors", []);
      }
    }
  };

  return (
    <Editor
      height={isFullscreen ? "calc(100vh - 72px)" : `${editorHeight || 380}px`}
      defaultLanguage="java"
      theme="vs-dark"
      value={code}
      onChange={handleChange}
      onMount={handleEditorMount}
      options={{
        fontSize: 14,
        fontFamily:
          "'JetBrains Mono', 'Fira Code', Consolas, monospace",
        fontLigatures: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
        padding: { top: 16, bottom: 16 },
        renderLineHighlight: "gutter",
        scrollbar: {
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10,
        },
        readOnly: readOnly || false,
      }}
    />
  );
}

export default CodeEditor;
