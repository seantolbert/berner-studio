export type ClassValue = string | number | null | false | undefined | ClassDictionary | ClassArray;

interface ClassDictionary {
  [id: string]: any;
}

interface ClassArray extends Array<ClassValue> {}

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
        // eslint-disable-next-line no-prototype-builtins
        if (Object.prototype.hasOwnProperty.call(arg, key) && (arg as ClassDictionary)[key]) {
          classes.push(key);
        }
      }
    }
  }
  return classes.join(" ");
}

