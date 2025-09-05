type Props = {
  onUndo?: () => void;
  onRedo?: () => void;
  onRandomize?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onSave?: () => void;
  canSave?: boolean;
  saving?: boolean;
};

export default function ControlPanel({
  onUndo,
  onRedo,
  onRandomize,
  canUndo = false,
  canRedo = false,
  onSave,
  canSave = false,
  saving = false,
}: Props) {
  return (
    <section className="rounded-md bg-black/[.02] dark:bg-white/[.04] h-full w-full flex items-center justify-center overflow-y-auto">
      <div className="flex flex-col items-center gap-4 py-2">
        {/* Randomize */}
        <button
          type="button"
          aria-label="Randomize"
          title="Randomize"
          onClick={onRandomize}
          className="h-12 w-12 rounded-full border border-black/15 dark:border-white/15 bg-white/60 dark:bg-black/20 flex items-center justify-center shadow-sm hover:bg-black/5 dark:hover:bg-white/10 active:scale-[.98]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
            aria-hidden="true"
          >
            {/* Feather-like shuffle icon */}
            <polyline points="16 3 21 3 21 8" />
            <line x1="4" y1="20" x2="21" y2="3" />
            <polyline points="21 16 21 21 16 21" />
            <line x1="15" y1="15" x2="21" y2="21" />
            <line x1="4" y1="4" x2="9" y2="9" />
          </svg>
        </button>

        {/* Undo */}
        <button
          type="button"
          aria-label="Undo"
          title="Undo"
          onClick={onUndo}
          disabled={!canUndo}
          className={`h-12 w-12 rounded-full border border-black/15 dark:border-white/15 flex items-center justify-center shadow-sm active:scale-[.98] ${
            canUndo
              ? "bg-white/60 dark:bg-black/20 hover:bg-black/5 dark:hover:bg-white/10"
              : "opacity-50 cursor-not-allowed bg-white/40 dark:bg-black/10"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <path d="M9 14l-5-5 5-5" />
            <path d="M4 9h8a7 7 0 1 1 0 14H9" />
          </svg>
        </button>

        {/* Redo */}
        <button
          type="button"
          aria-label="Redo"
          title="Redo"
          onClick={onRedo}
          disabled={!canRedo}
          className={`h-12 w-12 rounded-full border border-black/15 dark:border-white/15 flex items-center justify-center shadow-sm active:scale-[.98] ${
            canRedo
              ? "bg-white/60 dark:bg-black/20 hover:bg-black/5 dark:hover:bg-white/10"
              : "opacity-50 cursor-not-allowed bg-white/40 dark:bg-black/10"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <path d="M15 14l5-5-5-5" />
            <path d="M20 9h-8a7 7 0 1 0 0 14h3" />
          </svg>
        </button>

        {/* Save */}
        <button
          type="button"
          aria-label="Save"
          title={canSave ? "Save" : "Complete the board to save"}
          onClick={onSave}
          disabled={!canSave || saving}
          className={`h-12 w-12 rounded-full border border-black/15 dark:border-white/15 flex items-center justify-center shadow-sm active:scale-[.98] ${
            canSave && !saving
              ? "bg-white/60 dark:bg-black/20 hover:bg-black/5 dark:hover:bg-white/10"
              : "opacity-50 cursor-not-allowed bg-white/40 dark:bg-black/10"
          }`}
        >
          {saving ? (
            <svg
              className="animate-spin h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
              aria-hidden="true"
            >
              {/* Save icon (floppy) */}
              <path d="M4 4h11l5 5v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
              <path d="M13 4v6H6V4h7z" />
              <path d="M6 18h12" />
            </svg>
          )}
        </button>
      </div>
    </section>
  );
}
