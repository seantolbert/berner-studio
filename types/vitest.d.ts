declare module "vitest" {
  export const describe: (
    name: string,
    fn: () => void | Promise<void>
  ) => void;
  export const it: (
    name: string,
    fn: () => void | Promise<void>
  ) => void;
  export const expect: (value: unknown) => {
    toEqual: (expected: unknown) => void;
    toBe: (expected: unknown) => void;
    toMatchObject: (expected: Record<string, unknown>) => void;
    toBeNull: () => void;
  };
}
