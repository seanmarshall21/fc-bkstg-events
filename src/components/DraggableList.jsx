import React from 'react';
import useDragReorder from '../hooks/useDragReorder';

/**
 * DraggableList
 *
 * Universal long-press drag-to-reorder list component.
 * Touch + mouse + pen via native Pointer Events. No external DnD libraries.
 *
 * Props:
 *   items         Array                        Source list (controlled from parent).
 *   renderItem    (item, isDragging) => Node   Row content renderer.
 *   keyExtractor  (item) => string|number      Stable key per item.
 *   onReorder     (newItems) => void           Called on Save.
 *   className     string                       Optional wrapper class override.
 *
 * Visual spec: white bg, purple #6b21e8 accents, rounded, subtle shadows.
 */
export default function DraggableList({
  items,
  renderItem,
  keyExtractor,
  onReorder,
  className = '',
}) {
  const {
    reorderMode,
    saveOrder,
    cancelOrder,
    hasChanged,
    workingItems,
    draggingIndex,
    hoverIndex,
    dragOffsetY,
    handlers,
  } = useDragReorder({ items, keyExtractor, onReorder });

  // Compute per-row visual transform offsets so non-dragging items shift to
  // indicate the drop position.
  const computeRowTransform = (idx) => {
    if (draggingIndex == null) return 0;
    if (idx === draggingIndex) return dragOffsetY;
    if (hoverIndex == null) return 0;
    // Assume uniform row height ~ first rect; if no rects available fallback 64
    const rowH = 68;
    if (draggingIndex < hoverIndex && idx > draggingIndex && idx <= hoverIndex) {
      return -rowH;
    }
    if (draggingIndex > hoverIndex && idx < draggingIndex && idx >= hoverIndex) {
      return rowH;
    }
    return 0;
  };

  return (
    <div className={`relative ${className}`}>
      <ul className="flex flex-col gap-2 list-none m-0 p-0 select-none">
        {workingItems.map((item, idx) => {
          const isDragging = draggingIndex === idx;
          const translateY = computeRowTransform(idx);
          return (
            <li
              key={keyExtractor(item)}
              {...handlers.getItemProps(idx)}
              className={[
                'relative flex items-center gap-3 rounded-xl bg-white px-3 py-3',
                'transition-shadow transition-transform duration-150 ease-out',
                isDragging
                  ? 'z-20 shadow-lg scale-[1.02] ring-2 ring-purple-600'
                  : reorderMode
                  ? 'shadow-sm ring-1 ring-purple-200'
                  : 'shadow-sm',
              ].join(' ')}
              style={{
                transform: `translateY(${translateY}px)`,
                transition: isDragging ? 'none' : 'transform 150ms ease-out, box-shadow 150ms ease-out',
                touchAction: reorderMode ? 'none' : 'auto',
                cursor: reorderMode ? (isDragging ? 'grabbing' : 'grab') : 'default',
              }}
            >
              {reorderMode && (
                <span
                  aria-hidden="true"
                  className="flex-none w-6 h-6 flex flex-col justify-center items-center gap-[3px] text-purple-600"
                >
                  <span className="block w-4 h-[2px] bg-current rounded" />
                  <span className="block w-4 h-[2px] bg-current rounded" />
                  <span className="block w-4 h-[2px] bg-current rounded" />
                </span>
              )}
              <div className="flex-1 min-w-0">{renderItem(item, isDragging)}</div>
            </li>
          );
        })}
      </ul>

      {reorderMode && (
        <div className="sticky bottom-0 left-0 right-0 mt-4 flex items-center justify-end gap-2 bg-white/95 backdrop-blur px-3 py-3 rounded-xl shadow-lg ring-1 ring-purple-100">
          <button
            type="button"
            onClick={cancelOrder}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={saveOrder}
            disabled={!hasChanged}
            className={[
              'px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors',
              hasChanged
                ? 'bg-purple-600 hover:bg-purple-700 shadow-md'
                : 'bg-purple-300 cursor-not-allowed',
            ].join(' ')}
            style={hasChanged ? { backgroundColor: '#6b21e8' } : undefined}
          >
            Save Order
          </button>
        </div>
      )}
    </div>
  );
}
