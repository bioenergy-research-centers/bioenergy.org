
import Dataset_0_1_0 from "./Dataset_0_1_0.vue";

// Version to component mappings
// Keys should match versions returned from api with datasets
// Any non-matching version will fallback to the default version
const versionMappings = [
  { versions: ['default', '0.1.0', '0.1.1', '0.1.2', '0.1.3'], component: Dataset_0_1_0 }
];

// Build lookup table from version mappings
const componentForVersion = versionMappings.reduce((map_entry, array_element) => {
  array_element.versions.forEach(v => {
    map_entry[v] = array_element.component;
  });
  return map_entry;
}, {});

// Export resolver with default value
export function resolveComponentVersion(selectedItem) {
  return componentForVersion[selectedItem.schema_version] || componentForVersion['default'];
}
