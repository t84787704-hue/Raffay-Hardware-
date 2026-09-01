import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit3, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Category } from '../../types';
import { formatImageSrc, handleImageError, DEFAULT_CATEGORY_FALLBACK_IMAGE } from '../../utils/imageUtils';

interface SortableCategoryRowProps {
  key?: string | number;
  category: Category;
  index: number;
  totalCount: number;
  linkedCount: number;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isDragDisabled?: boolean;
}

export function SortableCategoryRow({
  category,
  index,
  totalCount,
  linkedCount,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  isDragDisabled = false
}: SortableCategoryRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: category.id,
    disabled: isDragDisabled
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: isDragging ? 'relative' : undefined,
    opacity: isDragging ? 0.75 : 1
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`transition-colors border-b border-gray-100 ${
        isDragging
          ? 'bg-amber-50 shadow-lg ring-2 ring-[#C8A165]'
          : 'hover:bg-gray-50/90 bg-white'
      }`}
    >
      {/* 0. Drag & Drop Grip Handle + Order Index */}
      <td className="py-3 px-3 w-16 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className={`p-1.5 rounded-lg text-gray-400 hover:text-[#0A2E24] hover:bg-gray-100 transition-colors touch-none ${
              isDragDisabled ? 'cursor-not-allowed opacity-40' : 'cursor-grab active:cursor-grabbing'
            }`}
            title="Drag to reorder category on storefront"
            aria-label={`Reorder ${category.name}`}
          >
            <GripVertical className="w-4 h-4 text-gray-400 group-hover:text-gray-700" />
          </button>
          <span className="text-[10px] font-bold text-gray-400 min-w-[18px]">
            #{index + 1}
          </span>
        </div>
      </td>

      {/* 1. Category Name & Image */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <img
            src={formatImageSrc(category.image, DEFAULT_CATEGORY_FALLBACK_IMAGE)}
            alt={category.name}
            onError={(e) => handleImageError(e, DEFAULT_CATEGORY_FALLBACK_IMAGE)}
            className="w-10 h-10 rounded-xl object-cover bg-white border border-gray-200 flex-shrink-0 shadow-sm"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-gray-900 text-xs truncate max-w-[200px]">
                {category.name}
              </span>
              {category.badge && (
                <span className="text-[9px] font-extrabold bg-[#0A2E24]/10 text-[#0A2E24] px-1.5 py-0.5 rounded flex-shrink-0">
                  {category.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] text-gray-500 block truncate max-w-xs">
              {category.tagline}
            </span>
          </div>
        </div>
      </td>

      {/* 2. Linked Products Count */}
      <td className="py-3 px-4">
        <span
          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border whitespace-nowrap ${
            linkedCount > 0
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}
        >
          {linkedCount > 0 ? `${linkedCount} SKUs in Stock` : `${category.itemCount || '0 items'}`}
        </span>
      </td>

      {/* 4. Material & Specs */}
      <td className="py-3 px-4 text-gray-700 font-medium max-w-xs truncate">
        {category.material}
      </td>

      {/* 5. Finishes */}
      <td className="py-3 px-4">
        <div className="flex flex-wrap gap-1 max-w-xs">
          {(category.popularFinishes || []).slice(0, 3).map((fin, fIdx) => (
            <span
              key={fIdx}
              className="text-[10px] bg-[#F4F7F5] px-1.5 py-0.5 rounded text-gray-600 border border-gray-200 whitespace-nowrap"
            >
              {fin}
            </span>
          ))}
          {(category.popularFinishes || []).length > 3 && (
            <span className="text-[10px] text-gray-400 font-bold">
              +{(category.popularFinishes || []).length - 3}
            </span>
          )}
        </div>
      </td>

      {/* 6. Actions */}
      <td className="py-3 px-4 text-right">
        <div className="flex items-center justify-end gap-1">
          {/* Accessible Move Up / Down Buttons */}
          {onMoveUp && (
            <button
              type="button"
              disabled={index === 0}
              onClick={onMoveUp}
              className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-200 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Move Up in display order"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          )}

          {onMoveDown && (
            <button
              type="button"
              disabled={index === totalCount - 1}
              onClick={onMoveDown}
              className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-200 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Move Down in display order"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Edit */}
          <button
            type="button"
            onClick={() => onEdit(category)}
            className="p-1.5 rounded-lg bg-gray-100 hover:bg-[#0A2E24] hover:text-white text-gray-700 transition-colors cursor-pointer"
            title="Edit Category"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => onDelete(category)}
            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-600 hover:text-white text-red-600 transition-colors cursor-pointer"
            title="Delete Category"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
