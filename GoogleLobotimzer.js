// ==UserScript==
// @name         Google Map Lobotomizer
// @namespace    https://github.com/DeoTime
// @version      1.0
// @description  fuck you google maps
// @author       DeoTime
// @match        *://*/*
// @match        file:///*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const css = `
    .gm-err-container { display: none !important; }
    .dismissButton { display: none !important; }
  `;
  try {
    const style = document.createElement('style');
    style.textContent = css;
    // Insert as early as possible
    (document.head || document.documentElement).appendChild(style);
  } catch (e) {
    // ignore
  }

  // Remove a node if it (or a descendant) contains the error text.
  function removeIfContainsErrorText(node) {
    try {
      if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;
      if (node.textContent && node.textContent.indexOf(ERROR_TEXT) !== -1) {
        node.remove();
        return true;
      }
    } catch (e) {
    }
    return false;
  }

  // Scan an element and its subtree for matches and remove them.
  function scanAndRemove(root) {
    if (!root) return;
    if (removeIfContainsErrorText(root)) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null, false);
    let n;
    const toRemove = [];
    while ((n = walker.nextNode())) {
      if (n.textContent && n.textContent.indexOf(ERROR_TEXT) !== -1) {
        toRemove.push(n);
      }
    }
    for (const el of toRemove) {
      try { el.remove(); } catch (e) { /* ignore */ }
    }
  }

  // Observe mutations so the overlay can't be re-inserted.
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        if (removeIfContainsErrorText(node)) continue;
        scanAndRemove(node);
      }
    }
  });

  // Start observing as soon as possible
  try {
    observer.observe(document.documentElement || document, {
      childList: true,
      subtree: true
    });
  } catch (e) {
    window.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.documentElement || document, {
        childList: true,
        subtree: true
      });
    }, { once: true });
  }

  // Also attempt a quick initial cleanup once DOM is available.
  function initialCleanup() {
    try {
      scanAndRemove(document.body || document.documentElement);
    } catch (e) {
    }
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initialCleanup, { once: true });
  } else {
    initialCleanup();
  }

  // Provide an escape hatch for debugging (console)
  window.__gmErrorBlocker = {
    removeNow: () => scanAndRemove(document.body || document.documentElement),
    stop: () => observer.disconnect()
  };
})();
