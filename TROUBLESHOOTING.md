# 🔧 Troubleshooting Guide

This guide helps you diagnose and fix common issues in the SanctifAi application.

---

## 🚨 Search always shows "Unable to Complete Analysis"

This typically means the OpenAI API is unavailable or misconfigured. Follow this diagnostic checklist:

### Quick Diagnostic Checklist

1. **Verify `.env` file exists in project root**
   ```bash
   ls -la .env
   ```
   - ✅ File should exist alongside `package.json`
   - ❌ If missing, create it (see [CONFIG.md](./CONFIG.md))

2. **Run configuration check**
   ```bash
   npm run check:config
   ```

3. **Check server logs for OpenAI/TMDB status**
   - Look for `[Config]` and `[OpenAI]` log entries when the server starts
   - Check browser Network tab for API responses

### Understanding Log Output

**✅ HEALTHY Configuration:**
```bash
[Config] Loaded env: { hasOpenAI: true, hasTMDB: true }
[OpenAI] getOpenAIClient env check: { hasOpenAI: true, preview: 'sk-pro...' }
[TMDB] getTMDBApiKey env check: { hasTMDB: true, preview: 'eyJhbG...' }
```

**❌ BROKEN Configuration (Missing Keys):**
```bash
[Config] Loaded env: { hasOpenAI: false, hasTMDB: false }
[OpenAI] getOpenAIClient env check: { hasOpenAI: false, preview: null }
[TMDB] getTMDBApiKey env check: { hasTMDB: false, preview: null }
```

**⚠️ PARTIAL Configuration (OpenAI works, TMDB missing):**
```bash
[Config] Loaded env: { hasOpenAI: true, hasTMDB: false }
[OpenAI] getOpenAIClient env check: { hasOpenAI: true, preview: 'sk-pro...' }
[TMDB] getTMDBApiKey env check: { hasTMDB: false, preview: null }
```

### Common Fixes

- **No API keys detected:**
  1. Check that `.env` file contains `OPENAI_API_KEY=sk-...`
  2. Verify no extra spaces around the `=` sign
  3. Restart the dev server after changes

- **OpenAI returns errors:**
  1. Verify API key is valid at [platform.openai.com](https://platform.openai.com)
  2. Check your OpenAI account has available credits
  3. Look for `401 Unauthorized` or `429 Rate Limit` in console

- **Analysis returns fallback response:**
  ```json
  {
    "discernmentScore": 50,
    "faithAnalysis": "AI service is unavailable right now.",
    "tags": ["service-unavailable"]
  }
  ```
  This means OpenAI client is `null` - check `OPENAI_API_KEY` in `.env`

### Debugging Example: Missing OpenAI Key

**Symptom:** Search completes but shows generic analysis

**Log Pattern:**
```
[OpenAI] getOpenAIClient env check: { hasOpenAI: false, preview: null }
[Search] Analyzing media: "Inception" (movie), year=2010
```

**Fix:**
```bash
# 1. Add key to .env
echo "OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_KEY_HERE" >> .env

# 2. Restart server
# Press Ctrl+C to stop, then:
npm run dev

# 3. Verify
npm run check:config
# Should show: hasOpenAI: true
```

---

## 🌐 Dev server runs but UI shows network error

This usually indicates a broken API endpoint or CORS issue. Follow these steps to diagnose:

### Manual API Testing

#### Test 1: Check Server Health

Open your browser and navigate to:
```
http://localhost:5000/api/auth/user
```

**Expected Response:**
```json
{
  "user": null,
  "isAuthenticated": false
}
```

If you get this response, the server is running correctly.

#### Test 2: Test TMDB Search Endpoint

**Using Browser:**
```
http://localhost:5000/api/tmdb/search?query=Inception&mediaType=movie
```

**Using curl:**
```bash
curl "http://localhost:5000/api/tmdb/search?query=Inception&mediaType=movie"
```

**Expected Response (with TMDB key configured):**
```json
{
  "results": [
    {
      "tmdbId": 27205,
      "title": "Inception",
      "posterUrl": "https://image.tmdb.org/t/p/w500/...",
      "releaseYear": "2010",
      "overview": "Cobb, a skilled thief...",
      "rating": 8.4,
      "mediaType": "movie"
    }
  ]
}
```

**Expected Response (without TMDB key):**
```json
{
  "results": []
}
```

#### Test 3: Test Main Search Endpoint

```bash
curl -X POST http://localhost:5000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Inception",
    "mediaType": "movie",
    "releaseYear": "2010",
    "overview": "A thief who steals secrets through dreams"
  }'
```

**Expected Response (with OpenAI key):**
```json
{
  "analysis": {
    "id": "uuid-here",
    "title": "Inception",
    "mediaType": "movie",
    "discernmentScore": 75,
    "faithAnalysis": "Inception explores themes of...",
    "tags": ["Action", "Sci-Fi"],
    "verse": {
      "text": "For God is not a God of confusion...",
      "reference": "1 Corinthians 14:33 (NLT)"
    },
    "alternatives": [...]
  }
}
```

#### Test 4: Test Lyrics Analysis Endpoint

```bash
curl -X POST http://localhost:5000/api/analyze/lyrics \
  -H "Content-Type: application/json" \
  -d '{
    "artist": "Hillsong United",
    "title": "Oceans",
    "rawLyrics": "You call me out upon the waters..."
  }'
```

**Expected Response:**
```json
{
  "meta": {
    "title": "Oceans",
    "artist": "Hillsong United"
  },
  "lyricsAvailable": true,
  "provider": "manual",
  "cached": false,
  "analysis": {
    "signals": {...},
    "score": {...},
    "verses": {...}
  }
}
```

### Common Network Issues

**Port 5000 in use:**
```bash
# Check if port is already in use
lsof -i :5000

# Kill existing process
kill -9 <PID>

# Or use a different port
PORT=3000 npm run dev
```

**CORS errors in browser console:**
- Check browser console for red CORS errors
- Verify you're accessing `http://localhost:5000` (not a different domain)
- In Bolt.new, the app should open automatically in the correct webview

**Timeout errors:**
- OpenAI API calls can take 5-10 seconds
- Check your internet connection
- Verify no firewall blocking `api.openai.com` or `api.themoviedb.org`

---

## 🔐 Auth-related 401s in the logs

**Important:** Authentication is **intentionally stubbed** in this hackathon build to simplify deployment and testing.

### Understanding Auth in This Build

The `server/replitAuth.ts` file contains a **no-op implementation**:

```typescript
// No-op auth setup for Bolt demo build
export async function setupAuth(app: Express) {
  // Auth is disabled in this hackathon build
  return;
}

export const isAuthenticated: RequestHandler = (_req, res) => {
  return res.status(401).json({ message: "Auth disabled in this demo build" });
};
```

### Expected Behavior

✅ **These endpoints work WITHOUT authentication:**
- `GET /api/auth/user` - Returns `{ user: null, isAuthenticated: false }`
- `POST /api/search` - Main search and analysis endpoint
- `GET /api/tmdb/search` - TMDB media search
- `POST /api/analyze/lyrics` - Lyrics analysis
- `GET /api/search/:id` - Get cached analysis by ID
- `GET /api/music/search` - iTunes music search

❌ **These endpoints return 401 (authentication required):**
- `GET /api/saved-analyses` - User's saved library
- `POST /api/saved-analyses/:analysisId` - Save to library
- `DELETE /api/saved-analyses/:analysisId` - Remove from library
- `GET /api/saved-analyses/check/:analysisId` - Check if saved
- All `/api/comments/*` routes (return 501 - not implemented)
- All `/api/reviews/*` routes (return 501 - not implemented)
- All `/api/discussions/*` routes (return 501 - not implemented)

### Why You See 401s

If you see 401 errors in your logs, it's likely:

1. **Frontend trying to access user library features**
   - The app auto-detects no auth and hides these features
   - 401s are expected and harmless if UI doesn't show errors

2. **Old code still calling authenticated endpoints**
   - Check browser Network tab for failing requests
   - Update frontend to skip authenticated features when `isAuthenticated: false`

### Enabling Full Authentication (Advanced)

If you need real authentication for production deployment:

1. **Update `server/replitAuth.ts`** to implement actual Replit Auth or another provider
2. **Restore authentication middleware** in routes that need protection
3. **Configure session secrets** in `.env`:
   ```env
   SESSION_SECRET=your-random-secret-key-here
   ```

4. **Update frontend auth hooks** in `client/src/hooks/useAuth.ts`

**Reference Implementation:**
- See Git history for original Replit Auth implementation
- Check `server/replitAuth.ts` comments for integration notes

---

## 🤖 Using Bolt Terminal and AI for Debugging

Bolt.new provides powerful tools to help you debug quickly. Here's how to leverage them:

### Using the Bolt Terminal

**Quick Diagnostics:**
```bash
# 1. Check configuration
npm run check:config

# 2. View server logs (shows API key status)
npm run dev
# Look for [Config] and [OpenAI] log lines

# 3. Test TypeScript compilation
npm run check

# 4. Build for production (catches errors)
npm run build
```

**View Key Configuration Files:**
```bash
# Check environment setup
cat .env

# View centralized config
cat server/config.ts

# Check OpenAI integration
cat server/openai.ts

# Check TMDB integration
cat server/tmdb.ts
```

### Using AI to Debug

When asking the Bolt AI for help, provide:

1. **Error messages** (copy from console or terminal)
2. **Configuration check output** (`npm run check:config`)
3. **Relevant log snippets** (especially `[Config]` and `[OpenAI]` lines)
4. **Steps to reproduce** (what you clicked, what you searched for)

**Example AI Prompt:**
```
I'm getting "Unable to Complete Analysis" errors. Here's my config check:

[Config] Loaded env: { hasOpenAI: false, hasTMDB: true }

The search endpoint returns a score of 50 with "service-unavailable" tag.
What should I do?
```

### Key Server Files Reference

When debugging, these files control core functionality:

| File | Purpose | What to Check |
|------|---------|---------------|
| `server/config.ts` | Environment variable loading and validation | Zod schema, dotenv path |
| `server/openai.ts` | OpenAI GPT-4o integration | API key handling, fallback logic |
| `server/tmdb.ts` | TMDB media search | Bearer token, API endpoints |
| `server/routes.ts` | API endpoint definitions | Request/response handling |
| `server/storage.ts` | Database caching layer | Supabase queries |
| `.env` | Environment variables | API keys, configuration |

### Inspecting Live Requests

**Browser DevTools:**
1. Open DevTools (F12 or Cmd+Option+I)
2. Go to **Network** tab
3. Filter by **Fetch/XHR**
4. Trigger a search
5. Click on `/api/search` request
6. Check:
   - **Request payload** (what you sent)
   - **Response** (what came back)
   - **Status code** (200 = success, 500 = server error)
   - **Console** tab for error messages

**Common Patterns:**

**✅ Successful Request:**
- Status: `200 OK`
- Response contains `discernmentScore`, `faithAnalysis`, `alternatives`
- Console shows: `[OpenAI] Analyzing media: "Title"...`

**❌ Failed Request:**
- Status: `200 OK` but response has `error` field
- Response: `{ error: "analysis_failed", message: "..." }`
- Console shows error stack trace

**⚠️ Fallback Response (no API key):**
- Status: `200 OK`
- `discernmentScore: 50`
- `tags: ["service-unavailable"]`
- `faithAnalysis: "AI service is unavailable right now."`

### Database Debugging

If you suspect caching issues:

```bash
# Check Supabase connection (in Bolt.new)
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# View database schema
cat shared/schema.ts
```

**Test Database Access:**
1. Open Supabase dashboard (URL from `.env`)
2. Go to **Table Editor**
3. Check `media_analyses` table for cached results
4. Check `lyrics_cache` table for lyrics data

---

## 📞 Still Stuck?

If none of these solutions work:

1. **Check the README** - [README.md](./README.md) for setup instructions
2. **Review CONFIG.md** - [CONFIG.md](./CONFIG.md) for environment variable guide
3. **Check Git history** - Look for recent changes that might have broken something
4. **Ask the AI** - Use Bolt's AI assistant with detailed error messages
5. **Check external services:**
   - [OpenAI Status](https://status.openai.com)
   - [TMDB Status](https://www.themoviedb.org)

---

**Remember:** Most issues stem from missing or invalid API keys. Always start with `npm run check:config`! 🔑
