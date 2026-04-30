const MAX_ROW_LIMIT = 500;
const DEFAULT_PAGE_INDEX = 1;
const DEFAULT_PAGE_SIZE = 10;

function parsePositiveInt(value, fallback = null) {
  const parsed = parseInt(value, DEFAULT_PAGE_SIZE);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function getPaginationParams(query) {
  const page = parsePositiveInt(query.page, DEFAULT_PAGE_INDEX);

  const rows = parsePositiveInt(query.rows);
  const legacyLimit = parsePositiveInt(query.limit);

  const size = rows ?? legacyLimit ?? 50;
  const limit = Math.min(size, MAX_ROW_LIMIT);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

module.exports = {
  getPaginationParams
};