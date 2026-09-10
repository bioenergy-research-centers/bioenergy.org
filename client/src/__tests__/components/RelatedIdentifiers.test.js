import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import RelatedIdentifiers from '@/components/RelatedIdentifiers.vue';

const registry = {
  prefix: 'biosample',
  name: 'NCBI BioSample',
  homepage: 'https://www.ncbi.nlm.nih.gov/biosample/',
  bioregistry_url: 'https://bioregistry.io/registry/biosample',
};

function resolved(id) {
  return {
    id: `biosample:${id}`,
    prefix: 'biosample',
    local_id: id,
    registered: true,
    valid: true,
    url: `https://example.org/${id}`,
    registry,
  };
}

describe('RelatedIdentifiers', () => {
  it('shows five resolved identifiers before expanding a large group', async () => {
    const wrapper = mount(RelatedIdentifiers, {
      props: { identifiers: Array.from({ length: 6 }, (_, index) => resolved(`SAMN${index}`)) },
    });

    const biosampleGroup = wrapper.get('[data-related-identifier-prefix="biosample"]');

    expect(wrapper.text()).toContain('Show all 6');
    expect(wrapper.text()).toContain('NCBI BioSample');
    expect(wrapper.findAll('[data-related-identifier-prefix="biosample"]')).toHaveLength(1);
    expect(biosampleGroup.findAll('li')).toHaveLength(5);

    await wrapper.get('button').trigger('click');

    expect(wrapper.text()).toContain('Show fewer');
    expect(biosampleGroup.findAll('li')).toHaveLength(6);
  });

  it('does not show unresolved identifiers', async () => {
    const wrapper = mount(RelatedIdentifiers, {
      props: {
        identifiers: [
          resolved('SAMN1'),
          { id: 'private-id', registered: false, url: null, registry: null },
        ],
      },
    });
    expect(wrapper.text()).toContain('NCBI BioSample');
    expect(wrapper.text()).toContain('SAMN1');
    expect(wrapper.text()).not.toContain("private-id");
  });
});
