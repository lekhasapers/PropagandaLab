require('dotenv').config();
const express = require('express');
const path    = require('path');

const app    = express();
const PORT   = process.env.PORT || 3000;
const TOKEN  = process.env.FB_ACCESS_TOKEN;

// Debug: confirm that the token is loaded
console.log('Loaded FB_ACCESS_TOKEN:', TOKEN);

if (!TOKEN) {
  console.error('Error: FB_ACCESS_TOKEN not set in .env');
  process.exit(1);
}

// Serve static front-end files from "public/"
app.use(express.static(path.join(__dirname, 'public')));

// Route: Fetch Facebook user profile (/api/fb-profile)
app.get('/api/fb-profile', async (req, res) => {
  try {
    const url = new URL('https://graph.facebook.com/me');
    url.searchParams.set('access_token', TOKEN);
    url.searchParams.set('fields', 'id,name,email');

    const response = await fetch(url);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || `Status ${response.status}`);
    }

    const profile = await response.json();
    return res.json(profile);
  } catch (err) {
    console.error('[GET /api/fb-profile] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Route: Fetch Facebook Ads Archive (/api/scrape-targeted-ads)
app.get('/api/scrape-targeted-ads', async (req, res) => {
  try {
    // Adjusted search params to match Graph API requirements
    const searchTerms = 'AI privacy';          // plain text
    const countries   = ['US'];                // array of country codes
    const fields      = ['page_id','page_name','ad_snapshot_url'];
    const limit       = 5;

    const apiUrl = new URL('https://graph.facebook.com/v15.0/ads_archive');
    apiUrl.searchParams.set('access_token', TOKEN);
    apiUrl.searchParams.set('search_terms', searchTerms);
    apiUrl.searchParams.set('ad_reached_countries', "['US']"); // literal array format
    apiUrl.searchParams.set('ad_type', 'ALL');                  // ensure non-EU/non-political ads show
    apiUrl.searchParams.set('fields', fields.join(','));        // only supported fields
    apiUrl.searchParams.set('limit', limit);

    const fbRes  = await fetch(apiUrl);
    const fbData = await fbRes.json();

    if (!fbRes.ok) {
      console.error('[GET /api/scrape-targeted-ads] Facebook API error:', fbData.error);
      return res.status(fbRes.status).json({ error: fbData.error?.message || 'Unknown error' });
    }

    // Format and return
    if (!Array.isArray(fbData.data)) {
      console.error('[GET /api/scrape-targeted-ads] Unexpected response format:', fbData);
      return res.status(500).json({ error: 'Invalid response format from Facebook API' });
    }

    const items = fbData.data.map(ad => ({
      page_id:       ad.page_id,
      page_name:     ad.page_name,
      snapshot:      ad.ad_snapshot_url || null
    }));

    return res.json({ items });
  } catch (err) {
    console.error('[GET /api/scrape-targeted-ads] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Start the server
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
