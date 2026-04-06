import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * useDragReorder
 *
 * Headless drag-to-reorder hook using native Pointer Events.
 * Works across touch, mouse, and pen. No external DnD libraries.
 *
 * Usage:
 *   const { state, handlers, reorderMode, enterReorderMode, exitReorderMode,
 *           hasChanged, saveOrder, cancelOrder, workingItems } =
 *     useDragReorder({ items, keyExtractor, onReorder, longPressMs: 500 });
 *
 * Attach handlers to each row's outer element:
 *   <div {...handlers.getItemProps(index)}>...</div>
 *
 * @param {Object}   cfg
 * @param {Array}    cfg.items          Source-of-truth array (controlled from parent).
 * @param {Function} cfg.keyExtractor   (item) => string | number
 * @param {Function} cfg.onReorder      (newItems) => void   called on saveOrder()
 * @param {number}   [cfg.longPressMs]  ms to hold before entering reorder mode (default 500)
 * @param {number}   [cfg.edgeScrollPx] px from viewport edge that triggers auto-scroll (default 80)
 * @param {number}   [cfg.edgeScrollSpeed] px per frame when auto-scrolling (default 12)
 */
export default function useDragReorder({
  items,
  keyExtractor,
  onReorder,
  longPressMs = 500,
  edgeScrollPx = 80,
  edgeScrollSpeed = 12,
}) {
  const [reorderMode, setReorderMode] = useState(false);
  const [workingItems, setWorkingItems] = useState(items);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [hoverIndex, setHoverIndex] = useState(null);

  // Sync workingItems when parent items change AND we're not in reorder mode
  useEffect(() => {
    if (!reorderMode) setWorkingItems(items);
  }, [items, reorderMode]);

  const longPressTimer = useRef(null);
  const pointerStart = useRef({ x: 0, y: 0 });
  const itemRects = useRef([]);            // bounding rects of each item at drag start
  const itemStartTop = useRef(0);           // top of dragged item at drag start
  const scrollRaf = useRef(null);
  const scrollDir = useRef(0);              // -1 up, 1 down, 0 none
  const activePointerId = useRef(null);
  const draggingIndexRef = useRef(null);
  const workingItemsRef = useRef(workingItems);

  useEffect(() => { workingItemsRef.current = workingItems; }, [workingItems]);
  useEffect(() => { draggingIndexRef.current = draggingIndex; }, [draggingIndex]);

  const hapticTick = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(15); } catch (_) {}
    }
  };

  const hasChanged =
    workingItems.length !== items.length ||
    workingItems.some((it, i) => keyExtractor(it) !== keyExtractor(items[i]));

  const enterReorderMode = useCallback(() => {
    setWorkingItems(items);
    setReorderMode(true);
    hapticTick();
  }, [items]);

  const exitReorderMode = useCallback(() => {
    setReorderMode(false);
    setDraggingIndex(null);
    setHoverIndex(null);
    setDragOffsetY(0);
    setWorkingItems(items);
  }, [items]);

  const saveOrder = useCallback(() => {
    onReorder?.(workingItems);
    setReorderMode(false);
    setDraggingIndex(null);
    setHoverIndex(null);
    setDragOffsetY(0);
  }, [workingItems, onReorder]);

  const cancelOrder = useCallback(() => {
    exitReorderMode();
  }, [exitReorderMode]);

  // Auto-scroll loop during drag
  const startAutoScrollLoop = useCallback(() => {
    if (scrollRaf.current) return;
    const tick = () => {
      if (scrollDir.current !== 0) {
        window.scrollBy(0, scrollDir.current * edgeScrollSpeed);
      }
      scrollRaf.current = requestAnimationFrame(tick);
    };
    scrollRaf.current = requestAnimationFrame(tick);
  }, [edgeScrollSpeed]);

  const stopAutoScrollLoop = useCallback(() => {
    if (scrollRaf.current) {
      cancelAnimationFrame(scrollRaf.current);
      scrollRaf.current = null;
    }
    scrollDir.current = 0;
  }, []);

  // Compute hover index from current pointer Y
  const computeHoverIndex = useCallback((clientY) => {
    const rects = itemRects.current;
    if (!rects.length) return null;
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      const mid = r.top + r.height / 2;
      if (clientY < mid) return i;
    }
    return rects.length - 1;
  }, []);

  const onPointerDown = useCallback((index) => (e) => {
    if (!reorderMode) {
      // Long-press to enter reorder mode
      pointerStart.current = { x: e.clientX, y: e.clientY };
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      longPressTimer.current = setTimeout(() => {
        enterReorderMode();
        longPressTimer.current = null;
      }, longPressMs);
      return;
    }

    // Already in reorder mode — start drag on this item
    e.preventDefault();
    const target = e.currentTarget;
    if (target.setPointerCapture && e.pointerId != null) {
      try { target.setPointerCapture(e.pointerId); } catch (_) {}
    }
    activePointerId.current = e.pointerId;

    // Snapshot all item rects
    const parent = target.parentElement;
    if (parent) {
      itemRects.current = Array.from(parent.children).map((el) =>
        el.getBoundingClientRect()
      );
    }
    itemStartTop.current = e.clientY;

    setDraggingIndex(index);
    setHoverIndex(index);
    setDragOffsetY(0);
    hapticTick();
    startAutoScrollLoop();
  }, [reorderMode, enterReorderMode, longPressMs, startAutoScrollLoop]);

  const onPointerMove = useCallback((index) => (e) => {
    // Long-press cancellation if finger moves too much
    if (!reorderMode && longPressTimer.current) {
      const dx = e.clientX - pointerStart.current.x;
      const dy = e.clientY - pointerStart.current.y;
      if (dx * dx + dy * dy > 100) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      return;
    }

    if (draggingIndexRef.current == null) return;
    if (activePointerId.current !== e.pointerId) return;

    e.preventDefault();
    const offset = e.clientY - itemStartTop.current;
    setDragOffsetY(offset);

    // Edge-scroll detection
    const vh = window.innerHeight;
    if (e.clientY < edgeScrollPx) {
      scrollDir.current = -1;
    } else if (e.clientY > vh - edgeScrollPx) {
      scrollDir.current = 1;
    } else {
      scrollDir.current = 0;
    }

    const newHover = computeHoverIndex(e.clientY);
    if (newHover != null && newHover !== hoverIndex) {
      setHoverIndex(newHover);
      hapticTick();
    }
  }, [reorderMode, hoverIndex, computeHoverIndex, edgeScrollPx]);

  const onPointerUp = useCallback((index) => (e) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (draggingIndexRef.current == null) return;
    if (activePointerId.current !== e.pointerId) return;

    const from = draggingIndexRef.current;
    const to = hoverIndex ?? from;

    if (from !== to) {
      const next = workingItemsRef.current.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      setWorkingItems(next);
    }

    setDraggingIndex(null);
    setHoverIndex(null);
    setDragOffsetY(0);
    activePointerId.current = null;
    stopAutoScrollLoop();
  }, [hoverIndex, stopAutoScrollLoop]);

  const onPointerCancel = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setDraggingIndex(null);
    setHoverIndex(null);
    setDragOffsetY(0);
    activePointerId.current = null;
    stopAutoScrollLoop();
  }, [stopAutoScrollLoop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
    };
  }, []);

  const getItemProps = (index) => ({
    onPointerDown: onPointerDown(index),
    onPointerMove: onPointerMove(index),
    onPointerUp: onPointerUp(index),
    onPointerCancel: onPointerCancel,
    style: { touchAction: reorderMode ? 'none' : 'auto' },
  });

  return {
    reorderMode,
    enterReorderMode,
    exitReorderMode,
    saveOrder,
    cancelOrder,
    hasChanged,
    workingItems,
    draggingIndex,
    hoverIndex,
    dragOffsetY,
    handlers: { getItemProps },
  };
}
