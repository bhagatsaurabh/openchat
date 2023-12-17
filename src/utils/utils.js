export const getSlug = (title) => `#pop-${title.toLowerCase().replaceAll(' ', '-')}`;

export const trapBetween = (root) => {
  if (!root) return { first: null, last: null };

  const treeWalker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT,
    { acceptNode: (node) => (node.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP) },
    false
  );

  let currNode = null,
    firstTabbableNode = treeWalker.nextNode(),
    lastTabbableNode = null;

  while ((currNode = treeWalker.nextNode()) !== null) {
    lastTabbableNode = currNode;
  }

  if (!lastTabbableNode) lastTabbableNode = firstTabbableNode;

  return { first: firstTabbableNode, last: lastTabbableNode };
};

export const trapFocus = (event, el, bound) => {
  if (event.key === 'Tab') {
    if (!el.contains(document.activeElement)) {
      bound.first?.focus();
      return;
    }

    if (event.shiftKey) {
      if (document.activeElement === bound.first) {
        bound.last.focus();
        event.preventDefault();
      }
    } else {
      if (document.activeElement === bound.last) {
        bound.first.focus();
        event.preventDefault();
      }
    }
  }
};
