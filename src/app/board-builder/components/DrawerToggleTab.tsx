type Props = {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
};

export default function DrawerToggleTab({ isOpen, onToggle, className }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`z-50 ${className ?? 'fixed right-0 top-1/2 -translate-y-1/2'} h-[4.67rem] w-6 trapezoid-tab bg-black text-white dark:bg-white dark:text-black shadow-md flex items-center justify-center active:scale-[.98]`}
      aria-expanded={isOpen}
      aria-controls="builder-drawer"
      aria-label="Toggle controls drawer"
    >
      <span className="sr-only">Toggle controls drawer</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="M4 6h16v2H4V6zm3 5h13v2H7v-2zM2 16h18v2H2v-2z" />
      </svg>
    </button>
  );
}
