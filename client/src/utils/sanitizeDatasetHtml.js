import sanitizeHtml from 'sanitize-html';

// 'mark' is how the API marks search matches (highlights in search results). Stored dataset
// text cannot contain it: the API strips everything but b, i, sub and sup on import.
const DATASET_HTML_OPTIONS = {
  allowedTags: ['b', 'i', 'sub', 'sup', 'mark'],
  allowedAttributes: {},
};

export function sanitizeDatasetHtml(html) {
  return sanitizeHtml(html ?? '', DATASET_HTML_OPTIONS);
}
