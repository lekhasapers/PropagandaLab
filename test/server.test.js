const request = require('supertest');
const nock = require('nock');

let app;

beforeEach(() => {
  process.env.FB_ACCESS_TOKEN = 'testtoken';
  jest.resetModules();
  app = require('../server');
});

afterEach(() => {
  nock.cleanAll();
});

describe('GET /api/fb-profile', () => {
  test('returns profile data', async () => {
    nock('https://graph.facebook.com')
      .get('/me')
      .query({ access_token: 'testtoken', fields: 'id,name,email' })
      .reply(200, { id: '1', name: 'Test User', email: 'test@example.com' });

    const res = await request(app).get('/api/fb-profile');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: '1',
      name: 'Test User',
      email: 'test@example.com'
    });
  });
});

describe('GET /api/scrape-targeted-ads', () => {
  test('returns ads data', async () => {
    nock('https://graph.facebook.com')
      .get('/v15.0/ads_archive')
      .query({
        access_token: 'testtoken',
        search_terms: 'AI privacy',
        ad_reached_countries: "['US']",
        ad_type: 'ALL',
        fields: 'page_id,page_name,ad_snapshot_url',
        limit: '5'
      })
      .reply(200, {
        data: [
          { page_id: '1', page_name: 'My Page', ad_snapshot_url: 'http://ad.example' }
        ]
      });

    const res = await request(app).get('/api/scrape-targeted-ads');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      items: [
        { page_id: '1', page_name: 'My Page', snapshot: 'http://ad.example' }
      ]
    });
  });
});
