import SizeSelector from "./SizeSelector";
import ControlPanel from "./ControlPanel";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onRandomize?: () => void;
  size: "small" | "regular" | "large";
  onSelectSize: (s: "small" | "regular" | "large") => void;
  onSave?: () => void;
  canSave?: boolean;
  saving?: boolean;
};

export default function Drawer({
  isOpen,
  onClose,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onRandomize,
  size,
  onSelectSize,
  onSave,
  canSave,
  saving,
}: Props) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 transition-opacity duration-300 z-40 md:hidden ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        id="builder-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Builder Drawer"
        className={`fixed right-0 top-0 h-[100svh] w-1/3 bg-background text-foreground shadow-xl z-50 transform transition-transform duration-300 
          md:relative md:right-auto md:top-auto md:h-full md:w-full md:max-w-[420px] md:translate-x-0 md:shadow-none md:col-start-2 md:row-span-1 md:bg-black md:text-white md:border md:border-white/10 md:rounded-md md:p-3
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="h-full flex flex-col">
          <div className="p-3 border-b border-black/10 dark:border-white/10 flex items-center justify-end md:hidden">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close drawer"
              className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-black/5 dark:hover:bg-white/10"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M6.225 4.811a1 1 0 0 1 1.414 0L12 9.172l4.361-4.361a1 1 0 1 1 1.414 1.414L13.414 10.586l4.361 4.361a1 1 0 1 1-1.414 1.414L12 12l-4.361 4.361a1 1 0 0 1-1.414-1.414l4.361-4.361-4.361-4.361a1 1 0 0 1 0-1.414Z" />
              </svg>
            </button>
          </div>

          <div className="flex-1 grid grid-rows-[auto_1fr] md:grid-rows-1 md:grid-cols-2 gap-2 md:gap-3 overflow-y-auto items-start content-start">
            <SizeSelector selected={size} onSelect={onSelectSize} />
            <ControlPanel
              {...(onUndo ? { onUndo } : {})}
              {...(onRedo ? { onRedo } : {})}
              {...(onRandomize ? { onRandomize } : {})}
              canUndo={!!canUndo}
              canRedo={!!canRedo}
              {...(onSave ? { onSave } : {})}
              canSave={!!canSave}
              saving={!!saving}
            />
          </div>
        </div>
      </aside>
    </>
  );
}
