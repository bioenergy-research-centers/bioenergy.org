const { parseCurie, getRegistry } = require("./bioregistryClient");

// Expects an array of strings formatted as compact URIs (CURIEs) formatted as 'prefix:identifier'
// Returns array of objects with resolved details for each identifier
async function enrichIds(ids = []) {
  if (!Array.isArray(ids) || ids.length === 0) return [];

  const parsedIds = ids.map(parseCurie);
  const uniquePrefixes = new Set(
      parsedIds.map(id => id.prefix?.toLowerCase())
               .filter(id => typeof id === "string" && id.trim().length > 0)
    );
  const prefixes = Array.from(uniquePrefixes);
  const registryEntries = await Promise.all(
    prefixes.map(async (prefix) => [prefix, await getRegistry(prefix)])
  );
  const registries = new Map(registryEntries);

  return parsedIds.map((item) => {
    const registry = item.prefix
      ? registries.get(item.prefix.toLowerCase())
      : null;

    return {
      id: item.id,
      prefix: item.prefix,
      local_id: item.localId,
      registered: Boolean(registry),
      valid: registry ? validateLocalId(registry, item.localId) : null,
      url: registry ? resolveUrl(registry, item.localId) : null,
      registry: registry ? publicRegistry(item.prefix, registry) : null,
    };
  });
}

function resolveUrl(registry, localId) {
  if (!registry?.uri_format || registry.uri_format_resolvable === false) {
    return null;
  }

  // Get URI pattern and replace according to bioregistry conventions
  // https://github.com/biopragmatics/bioregistry/blob/main/src/bioregistry/uri_format.py

  // Use function value as replacement to avoid potential special replacement patterns in localId
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_function_as_the_replacement
  return registry.uri_format.replaceAll("$1", () => localId);
}

function validateLocalId(registry, localId) {
  if (!registry?.pattern) return null;

  try {
    return new RegExp(registry.pattern).test(localId);
  } catch {
    return null;
  }
}

function publicRegistry(inputPrefix, registry) {
  const prefix = registry.prefix || inputPrefix;

  return {
    prefix,
    name: registry.name || registry.preferred_prefix || prefix,
    homepage: registry.homepage || null,
    bioregistry_url: `https://bioregistry.io/registry/${encodeURIComponent(prefix)}`,
  };
}

module.exports = {
  enrichIds,
  parseCurie,
};
