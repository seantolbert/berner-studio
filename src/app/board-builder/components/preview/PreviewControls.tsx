type Props = {
  className?: string;
  onSave?: () => void;
  onExport?: () => void;
};

export default function PreviewControls({ className = "", onSave, onExport }: Props) {
  return (
    <div className={`absolute top-3 left-3 flex items-center gap-2 z-10 ${className}`}>
      <button
        type="button"
        aria-label="Save"
        title="Save"
        onClick={onSave}
        className="h-9 w-9 rounded-full border border-black/15 dark:border-white/15 bg-white/70 dark:bg-black/30 backdrop-blur flex items-center justify-center shadow-sm hover:bg-black/5 dark:hover:bg-white/10 active:scale-[.98]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
          <path d="M17 21V7H7v14" />
          <path d="M7 3v4h8" />
        </svg>
      </button>

      <button
        type="button"
        aria-label="Export"
        title="Export"
        onClick={onExport}
        className="h-9 w-9 rounded-full border border-black/15 dark:border-white/15 bg-white/70 dark:bg-black/30 backdrop-blur flex items-center justify-center shadow-sm hover:bg-black/5 dark:hover:bg-white/10 active:scale-[.98]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M14 3h7v7" />
          <path d="M10 14L21 3" />
          <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
        </svg>
      </button>
    </div>
  );
}

