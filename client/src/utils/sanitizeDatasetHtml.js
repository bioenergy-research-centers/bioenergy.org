import sanitizeHtml from 'sanitize-html';

const DATASET_HTML_OPTIONS = {
  allowedTags: ['b', 'i', 'sub', 'sup'],
  allowedAttributes: {},
};

export function sanitizeDatasetHtml(html) {
  return sanitizeHtml(html ?? '', DATASET_HTML_OPTIONS);
}
