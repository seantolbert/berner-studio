"use client";

import { useState } from "react";
import AvailableWoods from "./AvailableWoods";
import Strips from "./Strips";

type Props = {
  boardData: { strips: (string | null)[][] };
  setBoardData: (
    updater:
      | { strips: (string | null)[][] }
      | ((prev: { strips: (string | null)[][] }) => { strips: (string | null)[][] })
  ) => void;
};

export default function StripBuilder({ boardData, setBoardData }: Props) {
  const [selectedWoodKey, setSelectedWoodKey] = useState<string | null>(null);

  return (
    <section className="row-span-1 p-4">
      <div className="w-full h-full grid grid-rows-[20%_1fr] gap-3">
        <AvailableWoods selectedKey={selectedWoodKey} onSelect={setSelectedWoodKey} />
        <Strips selectedKey={selectedWoodKey} boardData={boardData} setBoardData={setBoardData} />
      </div>
    </section>
  );
}
