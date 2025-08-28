"use client";
import React from "react";
import { AttributeItem } from "@/lib/types";
import { X } from "lucide-react";

interface AttributeRowProps {
  attribute: AttributeItem;
  onKeyChange: (id: string, newKey: string) => void;
  onValueChange: (id: string, newValue: string) => void;
  onRemove?: (id: string) => void;
  disabled?: boolean;
}

export const AttributeRow: React.FC<AttributeRowProps> = ({
  attribute,
  onKeyChange,
  onValueChange,
  onRemove,
  disabled = false,
}) => {
  return (
    <div className="flex items-center gap-2 mb-2">
      <input
        value={attribute.key}
        onChange={(e) => onKeyChange(attribute.id, e.target.value)}
        className="flex-1 min-w-0 text-gray-400 text-sm bg-gray-900 border border-gray-700 rounded-sm px-3 py-1 font-mono focus:border-sky-500 outline-none"
        placeholder="Name"
        disabled={disabled}
      />
      <input
        value={attribute.value}
        onChange={(e) => onValueChange(attribute.id, e.target.value)}
        className="flex-1 min-w-0 text-gray-400 text-sm bg-gray-900 border border-gray-700 rounded-sm px-3 py-1 font-mono focus:border-sky-500 outline-none"
        placeholder="Value"
        disabled={disabled}
      />
      {onRemove && (
        <button
          onClick={() => onRemove(attribute.id)}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-500 hover:text-white disabled:hidden"
          disabled={disabled}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};