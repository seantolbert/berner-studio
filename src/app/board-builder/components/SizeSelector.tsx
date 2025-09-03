type Props = {
  selected: "small" | "regular" | "large";
  onSelect: (size: "small" | "regular" | "large") => void;
};

export default function SizeSelector({ selected, onSelect }: Props) {
  const baseBtn =
    "w-full h-24 rounded-md border transition bg-white/50 dark:bg-black/20 backdrop-blur-sm flex items-center justify-center focus:outline-none";
  const ring = "focus:ring-2 focus:ring-black/30 dark:focus:ring-white/30";
  const border = "border-black/10 dark:border-white/10";

  const Item = ({
    label,
    shape,
    value,
  }: {
    label: string;
    shape: JSX.Element;
    value: "small" | "regular" | "large";
  }) => (
    <div className="w-full space-y-1">
      <button
        type="button"
        aria-pressed={selected === value}
        onClick={() => onSelect(value)}
        className={`${baseBtn} ${ring} ${border} ${
          selected === value ? "ring-2 ring-black/30 dark:ring-white/30" : ""
        }`}
      >
        {shape}
      </button>
      <p className="text-center text-xs text-foreground/80">{label}</p>
    </div>
  );

  return (
    <section className="rounded-md bg-black/[.03] dark:bg-white/[.06] h-full w-full flex items-center justify-center">
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-2">
        <h5 className="text-sm font-semibold uppercase tracking-wide">size</h5>

        <div className="w-full flex flex-col gap-3">
          <Item
            value="small"
            label={'9.5" x 9.5"'}
            shape={<div className="w-12 h-12 rounded-sm border-2 border-current" />}
          />
          <Item
            value="regular"
            label={'10" x 14"'}
            shape={<div className="w-10 h-16 rounded-sm border-2 border-current" />}
          />
          <Item
            value="large"
            label={'12" x 16"'}
            shape={<div className="w-12 h-20 rounded-sm border-2 border-current" />}
          />
        </div>
      </div>
    </section>
  );
}
