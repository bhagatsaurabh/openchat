export const getSlug = (title) => `#pop-${title.toLowerCase().replace(' ', '-')}`;

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
