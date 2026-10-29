import { useRef, type KeyboardEvent, type PointerEvent } from 'react';

// A horizontal swipe longer than this, and clearly more horizontal than vertical, changes capsule.
const SWIPE_DISTANCE_PX = 60;
const SWIPE_DIRECTNESS = 1.5;
// Controls that use arrow keys or drags themselves keep them.
const OWN_GESTURES = 'input, select, textarea, canvas, [contenteditable="true"], [role="slider"]';

function ownsGesture(target: EventTarget) {
  return target instanceof Element && target.closest(OWN_GESTURES) !== null;
}

export function useDeckGestures(onPrevious: () => void, onNext: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);

  function onKeyDown(event: KeyboardEvent) {
    if (event.altKey || event.ctrlKey || event.metaKey || ownsGesture(event.target)) return;
    if (event.key === 'ArrowLeft') onPrevious();
    else if (event.key === 'ArrowRight') onNext();
  }

  function onPointerDown(event: PointerEvent) {
    start.current =
      event.pointerType === 'touch' && !ownsGesture(event.target)
        ? { x: event.clientX, y: event.clientY }
        : null;
  }

  function onPointerUp(event: PointerEvent) {
    const from = start.current;
    start.current = null;
    if (!from) return;
    const dx = event.clientX - from.x;
    const dy = event.clientY - from.y;
    if (Math.abs(dx) < SWIPE_DISTANCE_PX || Math.abs(dx) < Math.abs(dy) * SWIPE_DIRECTNESS) return;
    if (dx > 0) onPrevious();
    else onNext();
  }

  return { onKeyDown, onPointerDown, onPointerUp };
}
