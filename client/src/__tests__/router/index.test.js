import { describe, it, expect } from 'vitest';
import router from '@/router/index';

describe('router', () => {
  const routes = router.getRoutes();

  it('defines all expected routes', () => {
    const names = routes.map((r) => r.name);
    expect(names).toContain('home');
    expect(names).toContain('datasetSearch');
    expect(names).toContain('datasetShow');
    expect(names).toContain('schema-index');
    expect(names).toContain('schemaShow');
    expect(names).toContain('contact');
    expect(names).toContain('about');
  });

  it('maps / to home', () => {
    const home = routes.find((r) => r.name === 'home');
    expect(home.path).toBe('/');
  });

  it('maps /search to datasetSearch', () => {
    const search = routes.find((r) => r.name === 'datasetSearch');
    expect(search.path).toBe('/search');
  });

  it('maps /datasets/:id to datasetShow with props', () => {
    const show = routes.find((r) => r.name === 'datasetShow');
    expect(show.path).toBe('/datasets/:id');
    expect(show.props[0]?.default).not.toBeUndefined;
  });

  it('lazy loads contact route', () => {
    const contact = routes.find((r) => r.name === 'contact');
    expect(contact.path).toBe('/contact');
  });
});
