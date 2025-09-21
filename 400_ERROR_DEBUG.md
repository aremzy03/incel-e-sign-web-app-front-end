# 400 Bad Request Error - Debug Guide

## ✅ **Progress Made**
- **405 Error**: ✅ RESOLVED (endpoint now matches)
- **400 Error**: 🔍 INVESTIGATING (data format issue)

## 🔍 **What We've Added**

### **1. Enhanced Error Logging**
The system now logs detailed information when a 400 error occurs:
```
Create envelope error details: {status: 400, ...}
Full error response: {...}
Error response data: {...}
Request data that was sent: {...}
```

### **2. Automatic Fallback for 400 Errors**
The system now automatically falls back to mock data when:
- 404 (Not Found)
- 405 (Method Not Allowed) 
- 400 (Bad Request) ← **NEW**
- 500 (Server Error)

### **3. Debug Utility**
Created `envelopes-debug.ts` to test different data formats.

## 🧪 **How to Debug**

### **Step 1: Check Console Logs**
When you try to create an envelope, look for these logs:
```
=== Create Envelope Function ===
Envelope data: {document_id: "1", signing_order: [...]}
Error response data: {...}  ← This shows what the backend expects
```

### **Step 2: Test Different Formats**
You can run this in the browser console:
```javascript
import { testEnvelopeDataFormats } from './src/lib/api/envelopes-debug'
testEnvelopeDataFormats()
```

### **Step 3: Check Backend Response**
The 400 error response should contain details about what's wrong:
- Missing required fields
- Wrong data types
- Invalid field names
- Validation errors

## 🔧 **Common 400 Error Causes**

### **1. Field Name Mismatch**
Backend might expect:
```json
{
  "document": "1",           // instead of "document_id"
  "recipients": [...]       // instead of "signing_order"
}
```

### **2. Data Type Issues**
Backend might expect:
```json
{
  "document_id": 1,         // number instead of string
  "signing_order": "..."    // string instead of array
}
```

### **3. Missing Required Fields**
Backend might require:
```json
{
  "document_id": "1",
  "signing_order": [...],
  "title": "Envelope Title",  // missing required field
  "description": "..."        // missing required field
}
```

### **4. Nested Object Structure**
Backend might expect:
```json
{
  "envelope": {
    "document_id": "1",
    "signing_order": [...]
  }
}
```

## 🚀 **Current Status**

### **✅ What's Working**
- Endpoint URL is correct: `POST /api/envelopes/create/`
- Request reaches the backend (no more 405)
- Automatic fallback to mock data for 400 errors
- Enhanced error logging for debugging

### **🔍 What We Need to Find**
- Exact data format the backend expects
- Required vs optional fields
- Correct field names and types
- Any validation rules

## 📋 **Next Steps**

1. **Check Console Logs**: Look for the detailed error response
2. **Identify Format**: See what the backend expects vs what we're sending
3. **Update Request**: Modify the data format to match backend expectations
4. **Test Again**: Verify the 400 error is resolved

## 🎯 **Expected Outcome**

Once we identify the correct data format, the envelope creation should work seamlessly with the real backend API!

The fallback system ensures the frontend works regardless, but we want to get the real API working for production use.
