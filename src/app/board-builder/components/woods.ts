export type Wood = {
  key: string;
  name: string;
  color: string;
};

export const WOODS: Wood[] = [
  { key: "cherry", name: "Cherry", color: "#B35C44" },
  { key: "walnut", name: "Walnut", color: "#6B4F3A" },
  { key: "maple", name: "Maple", color: "#E8D6B6" },
  { key: "purpleheart", name: "Purple Heart", color: "#6E1E6A" },
  { key: "canarywood", name: "Canarywood", color: "#D7A321" },
  { key: "padauk", name: "Padauk", color: "#D24B1F" },
];

export const woodByKey: Record<string, Wood> = Object.fromEntries(
  WOODS.map((w) => [w.key, w])
);

