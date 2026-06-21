# CORS and Frontend Fixes

## Changes Summary

### 1. CORS Headers - Backend Lambda Functions
Added CORS headers to all Lambda function responses:
- ✅ `src/health/index.js`
- ✅ `src/listItems/index.js`
- ✅ `src/createItem/index.js`
- ✅ `src/getItem/index.js`
- ✅ `src/updateItem/index.js`
- ✅ `src/deleteItem/index.js`

**Headers added:**
```javascript
headers: {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}
```

### 2. CORS Middleware - Backend ECS (Express)
Added CORS middleware to `backend/ecs/src/app.js`:
```javascript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});
```

### 3. Frontend Behavior Improvements
Updated `frontend/app.js` with:
- ✅ New function `updateUrlField()` that auto-populates the URL field based on selection
- ✅ URL field becomes **read-only** (grayed out) when Lambda or ECS is selected
- ✅ URL field is **editable** only when "Manual URL" is selected
- ✅ Visual feedback: gray background when read-only, red background when not deployed
- ✅ Event listener on dropdown to trigger URL field updates automatically

**Behavior:**
- Select "Lambda (from config)" → URL field shows Lambda API URL (read-only)
- Select "ECS (from config)" → URL field shows ECS API URL (read-only)
- Select "Manual URL" → URL field becomes editable
- Select nothing → URL field disabled with placeholder

## How to Redeploy

### Option 1: Redeploy Everything
```bash
# Redeploy Lambda
./infra-script.sh deploy lambda

# Redeploy ECS (requires rebuild)
./infra-script.sh deploy ecs

# Redeploy Frontend
./infra-script.sh deploy frontend
```

### Option 2: Deploy Only What Changed
```bash
# If you only want to test one backend:
./infra-script.sh deploy lambda
# OR
./infra-script.sh deploy ecs

# Always redeploy frontend to get the UI fixes
./infra-script.sh deploy frontend
```

### Verify Status
```bash
# Check deployment status
./infra-script.sh status all
```

## Testing

### 1. Test CORS is Fixed
Open browser console and try the API:
```javascript
fetch('https://your-api-url.com/health')
  .then(r => r.json())
  .then(console.log)
```

Should NOT show CORS error anymore.

### 2. Test Frontend Behavior
1. Open the frontend URL
2. Select "Lambda (from config)" → URL field should auto-populate and be grayed out
3. Select "ECS (from config)" → URL field should auto-populate and be grayed out
4. Select "Manual URL" → URL field should be editable
5. Click "Set API" → Should load items from the selected API

## Expected Result
- ✅ No more CORS errors
- ✅ URL field auto-populates when Lambda/ECS is selected
- ✅ URL field is read-only (grayed out) for Lambda/ECS
- ✅ URL field is editable only for Manual URL mode
- ✅ Full CRUD operations work from frontend
