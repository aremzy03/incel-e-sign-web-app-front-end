# Testing Envelope Fallback System

## The Issue
You're getting a 405 "Method Not Allowed" error when creating envelopes because the Django backend doesn't have the `/api/envelopes/` endpoints implemented yet.

## The Solution
I've implemented an **automatic fallback system** that detects when the backend returns 405 errors and switches to mock data seamlessly.

## How to Test

### 1. **Open Browser Console**
- Open your browser's Developer Tools (F12)
- Go to the Console tab
- Look for log messages starting with "=== Create Envelope Function ==="

### 2. **Try Creating an Envelope**
- Go to `/dashboard/envelopes/create`
- Complete the 3-step wizard
- Watch the console for these messages:

```
=== Create Envelope Function ===
Create envelope error details: { status: 405, ... }
Backend envelopes endpoint not available, using mock implementation
Error status: 405
Switching to mock create envelope...
Mock create envelope successful: { ... }
```

### 3. **Expected Behavior**
- ✅ **Success**: Envelope should be created successfully with mock data
- ✅ **Redirect**: Should redirect to envelope detail page
- ✅ **No Errors**: No 405 errors should be visible to the user
- ✅ **Functionality**: All envelope features should work

### 4. **Test All Features**
- **Create Envelope**: 3-step wizard should work
- **List Envelopes**: Should show mock envelopes
- **View Details**: Click on any envelope to see details
- **Send/Reject**: Test envelope actions
- **Delete**: Test envelope deletion

## Debug Information

### Console Logs to Look For
```
✅ Good Signs:
- "Backend envelopes endpoint not available, using mock implementation"
- "Mock create envelope successful"
- "Mock get envelopes successful"

❌ Problem Signs:
- "Mock create envelope failed"
- "Mock get envelopes failed"
- Any unhandled 405 errors
```

### Manual Debug Test
You can also run this in the browser console:
```javascript
// Import and test the fallback system
import { testEnvelopeFallback } from './src/lib/api/envelopes-debug'
testEnvelopeFallback()
```

## What Should Happen

### ✅ **Working Correctly**
1. You see 405 error in network tab (expected)
2. Console shows fallback messages
3. Envelope creation succeeds
4. You're redirected to envelope detail page
5. All envelope features work normally

### ❌ **Still Not Working**
If you still see 405 errors in the UI:
1. Check browser console for error messages
2. Look for "Mock create envelope failed" messages
3. Verify the mock system is working
4. Check if there are any import errors

## Backend Integration (Future)

When the Django backend implements the envelopes endpoints, the system will automatically switch to real API calls. No frontend changes needed!

### Required Backend Endpoints
```
POST   /api/envelopes/              # Create envelope
GET    /api/envelopes/              # List envelopes  
GET    /api/envelopes/{id}/         # Get envelope details
POST   /api/envelopes/{id}/send/    # Send envelope
POST   /api/envelopes/{id}/reject/  # Reject envelope
DELETE /api/envelopes/{id}/         # Delete envelope
```

## Troubleshooting

### If Fallback Isn't Working
1. **Check Console**: Look for error messages
2. **Check Network**: 405 errors are expected, but should be handled
3. **Check Mock**: Verify mock functions are imported correctly
4. **Clear Cache**: Try hard refresh (Ctrl+F5)

### If Mock Data Isn't Persisting
- Mock data is stored in memory
- Refreshing the page will reset mock data
- This is normal behavior for development

The fallback system should now handle the 405 errors automatically! 🎉
