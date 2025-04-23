require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
if (!ACCESS_TOKEN) {
  console.error('Error: FB_ACCESS_TOKEN not set in environment.');
  process.exit(1);
}

// Serve static frontend files from "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint: scrape Facebook Ad Library
app.get('/api/scrape-targeted-ads', async (req, res) => {
  try {
    // Customize your search terms and fields below:
    const searchTerms = ['AI', 'privacy'];
    const countries = ['US'];
    const fields = ['ad_creative_body', 'ad_creative_link_url', 'ad_snapshot_url'];
    const limit = 10;

    const apiUrl = new URL('https://graph.facebook.com/v13.0/ads_archive');
    apiUrl.searchParams.set('access_token', ACCESS_TOKEN);
    apiUrl.searchParams.set('search_terms', JSON.stringify(searchTerms));
    apiUrl.searchParams.set('ad_reached_countries', JSON.stringify(countries));
    apiUrl.searchParams.set('fields', fields.join(','));
    apiUrl.searchParams.set('limit', limit);

    const response = await fetch(apiUrl.toString());
    if (!response.ok) throw new Error(`Facebook API error: ${response.status}`);
    const data = await response.json();
    if (!data.data) throw new Error('No data field in Facebook response.');

    // Map to simple items array
    const items = data.data.map(ad => ({
      title: ad.ad_creative_body || 'No text',
      link: ad.ad_creative_link_url || '',
      snapshot: ad.ad_snapshot_url || ''
    }));

    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
