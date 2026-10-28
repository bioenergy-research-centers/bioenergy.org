import { describe, it, expect } from 'vitest';
import { mount, RouterLinkStub } from '@vue/test-utils';
import DatasetListItem from '@/components/DatasetListItem.vue';

const item = (overrides = {}) => ({
  uid: 'JBEI_1',
  title: 'Lignin degradation in switchgrass',
  description: 'A plain description.',
  creator: ['Ana', 'Ben', 'Cy', 'Di', 'Quill'].map((name) => ({ name })),
  repository: 'NCBI',
  date: '2024-01-01',
  ...overrides,
});

const render = (overrides) =>
  mount(DatasetListItem, {
    props: { item: item(overrides) },
    global: { stubs: { 'router-link': RouterLinkStub } },
  });

describe('DatasetListItem', () => {
  it('shows the plain title and description when there are no highlights', () => {
    const wrapper = render();
    expect(wrapper.text()).toContain('Lignin degradation in switchgrass');
    expect(wrapper.text()).toContain('A plain description.');
    expect(wrapper.find('mark').exists()).toBe(false);
    expect(wrapper.text()).toContain('+2 more');
  });

  it('marks matched words in the title', () => {
    const wrapper = render({ highlights: { title: '<mark>Lignin</mark> degradation in switchgrass' } });
    expect(wrapper.find('a mark, mark').text()).toBe('Lignin');
  });

  it('shows the matched snippet in place of the description', () => {
    const wrapper = render({ highlights: { snippet: '… breakdown of <mark>lignin</mark> …', snippetField: 'description' } });
    expect(wrapper.find('.snippet').text()).toBe('… breakdown of lignin …');
    expect(wrapper.text()).not.toContain('A plain description.');
    expect(wrapper.text()).not.toContain('From the abstract');
  });

  it('labels a snippet taken from the abstract', () => {
    const wrapper = render({ highlights: { snippet: '<mark>lignin</mark> again', snippetField: 'abstract' } });
    expect(wrapper.find('.snippet').text()).toContain('From the abstract:');
  });

  it('shows a matched author past the first three and counts only the hidden ones', () => {
    const wrapper = render({ highlights: { creators: ['Quill'] } });
    expect(wrapper.find('mark').text()).toBe('Quill');
    expect(wrapper.text()).toContain('+1 more');
  });

  it('shows matched contributors, who are otherwise not listed', () => {
    const wrapper = render({ highlights: { contributors: ['Dana Contributor'] } });
    expect(wrapper.find('.contributor-matches').text()).toBe('Contributor: Dana Contributor');
  });

  it('lists matches in fields the item does not show', () => {
    const wrapper = render({ highlights: { matchedIn: {
      keywords: ['<mark>lignin</mark> degradation'],
      species: ['<mark>Panicum</mark> virgatum'],
    } } });
    const line = wrapper.find('.matching-fields');
    expect(line.text().replace(/\s+/g, ' ')).toBe('Matching fields — Keywords: lignin degradation · Species: Panicum virgatum');
    expect(line.findAll('mark').map((m) => m.text())).toEqual(['lignin', 'Panicum']);
  });

  it('leaves out a value identical to the title', () => {
    const wrapper = render({ highlights: { matchedIn: {
      datasetName: ['<mark>Lignin</mark> degradation in switchgrass'],
      keywords: ['<mark>lignin</mark>'],
    } } });
    expect(wrapper.find('.matching-fields').text().replace(/\s+/g, ' ')).toBe('Matching fields — Keywords: lignin');
  });

  it('shows at most three values per field', () => {
    const wrapper = render({ highlights: { matchedIn: { keywords: ['a', 'b', 'c', 'd', 'e'].map((k) => `<mark>${k}</mark>`) } } });
    expect(wrapper.find('.matching-fields').text().replace(/\s+/g, ' ')).toBe('Matching fields — Keywords: a, b, c +2 more');
  });

  it('marks analysis type and repository in place rather than repeating them', () => {
    const wrapper = render({
      analysisType: 'Transcriptomics',
      highlights: { matchedIn: { analysisType: ['<mark>Transcriptomics</mark>'], repository: ['<mark>NCBI</mark>'] } },
    });
    expect(wrapper.find('.matching-fields').exists()).toBe(false);
    expect(wrapper.findAll('mark').map((m) => m.text())).toEqual(['Transcriptomics', 'NCBI']);
  });

  it('has no matching-fields line without such matches', () => {
    expect(render({ highlights: { title: '<mark>Lignin</mark>' } }).find('.matching-fields').exists()).toBe(false);
  });

  it.each([
    ['title', { title: '<mark>Lignin</mark> degradation' }],
    ['snippet', { snippet: '<mark>lignin</mark>', snippetField: 'description' }],
    ['author', { creators: ['Ana'] }],
    ['contributor', { contributors: ['Dana'] }],
    ['repository', { matchedIn: { repository: ['<mark>NCBI</mark>'] } }],
  ])('leaves out the matching-fields line when the %s is already marked', (_field, shown) => {
    const wrapper = render({ highlights: { ...shown, matchedIn: { ...shown.matchedIn, keywords: ['<mark>lignin</mark>'] } } });
    expect(wrapper.find('.matching-fields').exists()).toBe(false);
  });

  it('keeps marks but strips other markup from highlights', () => {
    const wrapper = render({ highlights: { title: '<mark>Lignin</mark><script>alert(1)</script><img src=x onerror=alert(1)>' } });
    expect(wrapper.html()).toContain('<mark>Lignin</mark>');
    expect(wrapper.html()).not.toContain('<script');
    expect(wrapper.html()).not.toContain('<img');
  });
});
