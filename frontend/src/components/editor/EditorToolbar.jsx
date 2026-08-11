function EditorToolbar({
  onRun,
  onSubmit,
  onReset,
  isRunning,
  isSubmitting,
  onHint,
  hasHints,
  onToggleFullscreen,
  isFullscreen,
}) {
  const busy = isRunning || isSubmitting;

  return (
    <div className="editor-toolbar">
      <div className="editor-toolbar-left">
        <select
          className="editor-select"
          defaultValue="Java"
          disabled={busy}
        >
          <option value="Java">Java</option>
        </select>
        <span className="editor-mode">main.java</span>
      </div>

      <div className="editor-toolbar-right">
        <button
          className="toolbar-btn toolbar-fullscreen"
          onClick={onToggleFullscreen}
          disabled={busy}
          title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? "⤢ Exit" : "⤢ Full"}
        </button>

        {hasHints && (
          <button
            className="toolbar-btn toolbar-hint"
            onClick={onHint}
            disabled={busy}
          >
            ✦ Hint
          </button>
        )}

        <button
          className="toolbar-btn toolbar-reset"
          onClick={onReset}
          disabled={busy}
        >
          ↺ Reset
        </button>

        <button
          className="toolbar-btn toolbar-run"
          onClick={onRun}
          disabled={busy}
        >
          {isRunning ? (
            <span className="run-btn-loading">
              <span className="spinner" />
              Running
            </span>
          ) : (
            "▸ Run"
          )}
        </button>

        <button
          className="toolbar-btn toolbar-submit"
          onClick={onSubmit}
          disabled={busy}
        >
          {isSubmitting ? (
            <span className="run-btn-loading">
              <span className="spinner" />
              Submitting
            </span>
          ) : (
            "✓ Submit"
          )}
        </button>
      </div>
    </div>
  );
}

export default EditorToolbar;
