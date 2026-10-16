/**
 * Scroll ownership lives with the page column — AppShell's `.app-scroll`
 * pane — not the document. This module hands that element to the few
 * scroll-driven widgets (ambient field, blog reading bar, parallax) that
 * used to watch the window.
 *
 * `setScrollPane` is called from the pane's ref callback, which fires
 * during commit — before any consumer's effect — so a widget mounting on a
 * lazy route always finds the pane in place. The fallback to the document
 * scroller keeps renders outside the shell (prerender, tests) working.
 */
let pane: HTMLElement | null = null

export function setScrollPane(el: HTMLElement | null): void {
  pane = el
}

/** The element whose scroll position *is* the page. Scroll events do not
    bubble, so listeners must attach to this element directly. */
export function getScrollPane(): HTMLElement {
  return pane ?? document.documentElement
}
