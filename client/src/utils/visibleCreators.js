// Chooses which creators a trimmed author list shows: the first `maxVisible`, plus any
// whose name matched the search wherever they are in the list, so a result never hides the
// author it was found by. Each entry records whether it was matched and whether creators
// were skipped just before it, so the list can show "…" there.
// An invalid `maxVisible` (not a non-negative integer) shows every creator.
export function selectVisibleCreators(creators, maxVisible, highlightedNames = []) {
  if (!Array.isArray(creators)) return [];

  const highlighted = new Set(highlightedNames ?? []);
  const limit = Number.isInteger(maxVisible) && maxVisible >= 0 ? maxVisible : creators.length;

  const visible = [];
  creators.forEach((creator, index) => {
    const isHighlighted = highlighted.has(creator?.name);
    if (index >= limit && !isHighlighted) return;

    const previousIndex = visible.length > 0 ? visible[visible.length - 1].index : -1;
    visible.push({ creator, index, highlighted: isHighlighted, afterGap: index > previousIndex + 1 });
  });
  return visible;
}
