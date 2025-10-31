"use client";

import type { AdminHomeSection } from "@/types/home";
import type { CategoryRecord } from "@/app/admin/cms/products/CategoryManager";
import SectionCard from "./SectionCard";

type SectionsListProps = {
  sections: AdminHomeSection[];
  onSectionsChange: (sections: AdminHomeSection[]) => void;
  onMove: (index: number, delta: number) => void;
  onDelete: (id: string) => void;
  onSaveSection: (section: AdminHomeSection) => void;
  onAddCollection: (sectionId: string) => void;
  onSaveCollectionsOrder: (sectionId: string, collections: AdminHomeSection["collections"]) => void;
  onUpdateCollection: (sectionId: string, collection: { id: string; label: string; href: string }) => void;
  onDeleteCollection: (sectionId: string, collectionId: string) => void;
  categoryOptions: CategoryRecord[];
};

export default function SectionsList({
  sections,
  onSectionsChange,
  onMove,
  onDelete,
  onSaveSection,
  onAddCollection,
  onSaveCollectionsOrder,
  onUpdateCollection,
  onDeleteCollection,
  categoryOptions,
}: SectionsListProps) {
  const handleSectionChange = (updated: AdminHomeSection) => {
    onSectionsChange(sections.map((section) => (section.id === updated.id ? updated : section)));
  };

  return (
    <div className="grid gap-3">
      {sections.map((section, index) => (
        <SectionCard
          key={section.id}
          section={section}
          index={index}
          onMove={onMove}
          onDelete={onDelete}
          onChange={handleSectionChange}
          onSave={onSaveSection}
          onAddCollection={onAddCollection}
          onSaveCollectionsOrder={onSaveCollectionsOrder}
          onUpdateCollection={onUpdateCollection}
          onDeleteCollection={onDeleteCollection}
          categoryOptions={categoryOptions}
        />
      ))}
    </div>
  );
}
