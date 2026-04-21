"use client";

import { FileSpreadsheet, FileText, Globe, Loader2, ScrollText, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { sourceKey, formatDate, type Source } from "./types";

function getSourcePresentation(sourceType: Source["source_type"]) {
  switch (sourceType) {
    case "scrape":
      return {
        icon: Globe,
        badgeClassName: "bg-[#2D3A31] text-white",
        label: "Scraped",
      };
    case "upload":
      return {
        icon: FileText,
        badgeClassName: "bg-[#F2F0EB] text-[#2D3A31]",
        label: "Uploaded",
      };
    case "xlsx":
    case "csv":
      return {
        icon: FileSpreadsheet,
        badgeClassName: "bg-[#F2F0EB] text-[#2D3A31]",
        label: sourceType.toUpperCase(),
      };
    case "docx":
      return {
        icon: ScrollText,
        badgeClassName: "bg-[#F2F0EB] text-[#2D3A31]",
        label: "DOCX",
      };
    case "pdf":
    case "txt":
    case "md":
      return {
        icon: FileText,
        badgeClassName: "bg-[#F2F0EB] text-[#2D3A31]",
        label: sourceType.toUpperCase(),
      };
  }
}

interface SourcesTableProps {
  sources: Source[];
  selected: Set<string>;
  deletingKey: string | null;
  togglingKey: string | null;
  bulkDeleting: boolean;
  trainingDisabled: boolean;
  onToggleSelect: (key: string) => void;
  onToggleSelectAll: () => void;
  onDelete: (source: Source) => void;
  onToggleEnabled: (source: Source, isEnabled: boolean) => void;
}

export function SourcesTable({
  sources,
  selected,
  deletingKey,
  togglingKey,
  bulkDeleting,
  trainingDisabled,
  onToggleSelect,
  onToggleSelectAll,
  onDelete,
  onToggleEnabled,
}: SourcesTableProps) {
  return (
    <Card hover={false} className="p-0 overflow-hidden">
      <div className="hidden md:grid grid-cols-[56px_1fr_120px_90px_110px_120px_64px] gap-4 px-6 py-4 bg-[#F9F8F4] border-b border-[#E6E2DA]">
        <div className="flex items-center justify-center">
          <Checkbox
            checked={selected.size === sources.length && sources.length > 0}
            onCheckedChange={onToggleSelectAll}
            aria-label="Select all"
            className="border-[#8C9A84]"
          />
        </div>
        <span className="font-sans text-xs uppercase tracking-widest text-[#8C9A84]">Source</span>
        <span className="font-sans text-xs uppercase tracking-widest text-[#8C9A84]">Type</span>
        <span className="font-sans text-xs uppercase tracking-widest text-[#8C9A84]">Chunks</span>
        <span className="font-sans text-xs uppercase tracking-widest text-[#8C9A84]">Enabled</span>
        <span className="font-sans text-xs uppercase tracking-widest text-[#8C9A84]">Added</span>
        <span className="font-sans text-xs uppercase tracking-widest text-[#8C9A84] text-center">Actions</span>
      </div>

      <ul className="divide-y divide-[#E6E2DA]">
        {sources.map((source) => {
          const key = sourceKey(source);
          const isSelected = selected.has(key);
          const presentation = getSourcePresentation(source.source_type);
          const Icon = presentation.icon;
          return (
            <motion.li
              layout
              key={key}
              className={`flex flex-col md:grid md:grid-cols-[56px_1fr_120px_90px_110px_120px_64px] gap-3 md:gap-4 items-start md:items-center px-6 py-5 transition-colors ${isSelected ? "bg-[#F9F8F4]" : "hover:bg-[#FCFBF8]"}`}
            >
              <div className="flex items-center justify-center w-full md:w-auto">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelect(key)}
                  aria-label={`Select ${source.title}`}
                  className="border-[#8C9A84]"
                />
              </div>
              <div className="min-w-0 w-full">
                <div className="flex items-center gap-3 mb-1">
                  <Icon size={16} strokeWidth={1.5} className="text-[#8C9A84] flex-shrink-0" />
                  <p className="font-sans text-sm font-semibold text-[#2D3A31] truncate">
                    {source.title}
                  </p>
                </div>
                {source.url && (
                  <p className="font-sans text-sm text-[#8C9A84] truncate pl-7">
                    {source.url}
                  </p>
                )}
              </div>
              <div>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-sans uppercase tracking-widest ${presentation.badgeClassName}`}>
                  {presentation.label}
                </span>
              </div>
              <span className="font-sans text-sm font-semibold text-[#2D3A31]">
                {source.chunk_count}
              </span>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={source.isEnabled}
                  onCheckedChange={(checked) => onToggleEnabled(source, checked === true)}
                  disabled={trainingDisabled || bulkDeleting || deletingKey === key || togglingKey === key}
                  aria-label={`${source.isEnabled ? "Disable" : "Enable"} ${source.title}`}
                  className="border-[#8C9A84]"
                />
                <span className="font-sans text-sm text-[#2D3A31]">
                  {togglingKey === key ? "Saving..." : source.isEnabled ? "On" : "Off"}
                </span>
              </label>
              <span className="font-sans text-sm text-[#8C9A84]">
                {formatDate(source.created_at)}
              </span>
              <div className="flex justify-center w-full md:w-auto">
                <button
                  onClick={() => onDelete(source)}
                  disabled={deletingKey === key || bulkDeleting || trainingDisabled}
                  aria-label="Delete source"
                  className="flex items-center justify-center w-9 h-9 rounded-full text-[#8C9A84] hover:bg-[#F2F0EB] hover:text-[#C27B66] transition-colors disabled:opacity-40"
                >
                  {deletingKey === key ? (
                    <Loader2 size={16} strokeWidth={1.5} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </Card>
  );
}
