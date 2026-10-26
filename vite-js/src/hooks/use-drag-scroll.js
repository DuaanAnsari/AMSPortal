import { useRef, useEffect } from 'react';

/**
 * Custom hook to enable mouse drag-to-scroll on any scrollable DOM element or container.
 * 
 * @param {Object} options
 * @param {string} [options.scrollableSelector] - Optional selector if scrollable container is nested inside ref (e.g. '.MuiDataGrid-virtualScroller')
 * @returns {import('react').RefObject} containerRef
 */
export function useDragScroll(options = {}) {
  const containerRef = useRef(null);
  const { scrollableSelector } = options;

  useEffect(() => {
    const rootEl = containerRef.current;
    if (!rootEl) return;

    let targetEl = scrollableSelector ? rootEl.querySelector(scrollableSelector) : rootEl;

    // Helper to find actual scrollable target (for DataGrid virtualScroller or TableContainer)
    const getScrollTarget = () => {
      if (scrollableSelector) {
        return rootEl.querySelector(scrollableSelector) || rootEl;
      }
      return rootEl;
    };

    let isDown = false;
    let startX = 0;
    let startY = 0;
    let scrollLeft = 0;
    let scrollTop = 0;
    let hasDragged = false;

    const isInteractive = (el) => {
      if (!el) return false;
      const interactiveTags = ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A'];
      return Boolean(
        el.closest(interactiveTags.join(',')) ||
        el.closest('.MuiIconButton-root') ||
        el.closest('.MuiButton-root') ||
        el.closest('.MuiCheckbox-root') ||
        el.closest('.MuiRadio-root') ||
        el.closest('.MuiSwitch-root') ||
        el.closest('.MuiDataGrid-columnHeader') ||
        el.closest('.MuiDataGrid-menuIcon') ||
        el.closest('.MuiDataGrid-columnSeparator') ||
        el.closest('.MuiPagination-root') ||
        el.closest('.MuiTablePagination-root')
      );
    };

    const onMouseDown = (e) => {
      // Only handle left click
      if (e.button !== 0) return;

      // Do not initiate drag if clicked on an interactive element
      if (isInteractive(e.target)) return;

      const target = getScrollTarget();
      if (!target) return;

      isDown = true;
      hasDragged = false;
      startX = e.pageX;
      startY = e.pageY;
      scrollLeft = target.scrollLeft;
      scrollTop = target.scrollTop;
    };

    const onMouseMove = (e) => {
      if (!isDown) return;

      const target = getScrollTarget();
      if (!target) return;

      const deltaX = e.pageX - startX;
      const deltaY = e.pageY - startY;

      // Threshold to detect genuine drag
      if (!hasDragged && (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4)) {
        hasDragged = true;
        target.style.cursor = 'grabbing';
        target.style.userSelect = 'none';
        document.body.style.userSelect = 'none';
      }

      if (hasDragged) {
        e.preventDefault();
        target.scrollLeft = scrollLeft - deltaX;
        target.scrollTop = scrollTop - deltaY;
      }
    };

    const stopDragging = () => {
      if (!isDown) return;
      isDown = false;
      const target = getScrollTarget();
      if (target) {
        target.style.cursor = '';
        target.style.userSelect = '';
      }
      document.body.style.userSelect = '';
    };

    const onClickCapture = (e) => {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
        hasDragged = false;
      }
    };

    rootEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stopDragging);
    rootEl.addEventListener('click', onClickCapture, true);

    return () => {
      rootEl.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', stopDragging);
      rootEl.removeEventListener('click', onClickCapture, true);
      document.body.style.userSelect = '';
    };
  }, [scrollableSelector]);

  return containerRef;
}
