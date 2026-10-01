const axios = require("axios");

const BIOREGISTRY_CONFIG = {
  baseURL: "https://bioregistry.io",
  timeout: 3000,
  successTTL: 24 * 60 * 60 * 1000, // cache registry details for 24 hours
  errorTTL: 30 * 60 * 1000, // cache failed lookup for 30 minutes
};

const bioregistry_api = axios.create({
  baseURL: BIOREGISTRY_CONFIG.baseURL,
  timeout: BIOREGISTRY_CONFIG.timeout,
  headers: { accept: "application/json" },
});

const registryCache = new Map();
const pendingRequests = new Map();

// Get the registry details for a prefix using a simple cache to reduce API requests
function getRegistry(prefix) {
  if (!prefix) return Promise.resolve(null);

  const key = prefix.toLowerCase();
  const now = Date.now();

  // check for valid cached value.
  const cached = registryCache.get(key);
  if (cached?.expiresAt > now) {
    return Promise.resolve(cached.value);
  }

  // If expired, clear the cache value.
  // this lazy cleanup only removes prefixes when requested and expired.
  if (cached) {
    registryCache.delete(key);
  }

  //  Check and reuse any active request to avoid overlapping lookups.
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  const request = fetchRegistry(key).finally(() => pendingRequests.delete(key));
  pendingRequests.set(key, request);

  return request;
}

// Fetches registry details for prefix and updates stored cache value.
// async promise allows caller to store and reuse active queries.
async function fetchRegistry(prefix) {
  try {
    const response = await bioregistry_api.get(
      `/api/registry/${encodeURIComponent(prefix)}`
    );

    if (
      !response.data ||
      typeof response.data !== "object" ||
      typeof response.data.prefix !== "string" ||
      !response.data.prefix.trim()
    ) {
      console.warn(`Bioregistry returned an invalid response for ${prefix}.`);
      registryCache.set(prefix, {
        value: null,
        expiresAt: Date.now() + BIOREGISTRY_CONFIG.errorTTL,
      });
      return null;
    }

    registryCache.set(prefix, {
      value: response.data,
      expiresAt: Date.now() + BIOREGISTRY_CONFIG.successTTL,
    });
    return response.data;
  } catch (error) {
    const status = error?.response?.status;
    const reason = error?.message || (status ? `HTTP ${status}` : "unknown error");
    console.warn(`Bioregistry lookup failed for ${prefix}: ${reason}`);

    registryCache.set(prefix, {
      value: null,
      expiresAt: Date.now() + BIOREGISTRY_CONFIG.errorTTL,
    });
    return null;
  }
}

// Convert a compact uri into component values
function parseCurie(value) {
  const prefix = getPrefix(value);

  if (!prefix) {
    return { id: value, prefix: null, localId: value };
  }

  return {
    id: value,
    prefix,
    localId: value.slice(prefix.length + 1),
  };
}

// Get the bioregistry prefix from an identifier string
// Simple string split on ':' matching bioregistry default.
function getPrefix(value) {
  if (typeof value !== "string") return null;

  const separator = value.indexOf(":");
  return separator > 0 ? value.slice(0, separator) : null;
}

function resetCache() {
  registryCache.clear();
  pendingRequests.clear();
}

module.exports = {
  getPrefix,
  getRegistry,
  parseCurie,
  resetCache,
  bioregistry_api,
};
