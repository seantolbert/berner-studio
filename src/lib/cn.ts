type ClassDictionary = Record<string, boolean | null | undefined>;
type ClassArray = ClassValue[];

export type ClassValue =
  | string
  | number
  | null
  | false
  | undefined
  | ClassDictionary
  | ClassArray;

export function cn(...args: ClassValue[]): string {
  const classes: string[] = [];
  for (const arg of args) {
    if (!arg) continue;
    if (typeof arg === "string" || typeof arg === "number") {
      classes.push(String(arg));
    } else if (Array.isArray(arg)) {
      if (arg.length) {
        const inner = cn(...arg);
        if (inner) classes.push(inner);
      }
    } else if (typeof arg === "object") {
      for (const key in arg) {
        if (Object.prototype.hasOwnProperty.call(arg, key) && (arg as ClassDictionary)[key]) {
          classes.push(key);
        }
      }
    }
  }
  return classes.join(" ");
}
