// Debug utility to test different data formats for envelope creation
import apiClient from '@/lib/axios'

export const testEnvelopeDataFormats = async () => {
  console.log('=== Testing Different Envelope Data Formats ===')
  
  const testData = {
    document_id: '1',
    signing_order: [
      {
        email: 'test@example.com',
        name: 'Test User',
        order: 1
      }
    ]
  }
  
  console.log('Testing with current format:', testData)
  
  try {
    // Test 1: Current format
    console.log('Test 1: Current format')
    const response1 = await apiClient.post('/envelopes/create/', testData)
    console.log('✅ Current format works:', response1.data)
    return { success: true, format: 'current', data: response1.data }
  } catch (error: any) {
    console.log('❌ Current format failed:', error.response?.status, error.response?.data)
    
    // Test 2: Alternative format with different field names
    const altData1 = {
      document: testData.document_id,
      recipients: testData.signing_order.map(r => ({
        email: r.email,
        name: r.name,
        order: r.order
      }))
    }
    
    try {
      console.log('Test 2: Alternative format 1:', altData1)
      const response2 = await apiClient.post('/envelopes/create/', altData1)
      console.log('✅ Alternative format 1 works:', response2.data)
      return { success: true, format: 'alternative1', data: response2.data }
    } catch (error2: any) {
      console.log('❌ Alternative format 1 failed:', error2.response?.status, error2.response?.data)
      
      // Test 3: Another alternative format
      const altData2 = {
        document_id: testData.document_id,
        recipients: testData.signing_order
      }
      
      try {
        console.log('Test 3: Alternative format 2:', altData2)
        const response3 = await apiClient.post('/envelopes/create/', altData2)
        console.log('✅ Alternative format 2 works:', response3.data)
        return { success: true, format: 'alternative2', data: response3.data }
      } catch (error3: any) {
        console.log('❌ Alternative format 2 failed:', error3.response?.status, error3.response?.data)
        
        // Test 4: Minimal format
        const minimalData = {
          document_id: testData.document_id
        }
        
        try {
          console.log('Test 4: Minimal format:', minimalData)
          const response4 = await apiClient.post('/envelopes/create/', minimalData)
          console.log('✅ Minimal format works:', response4.data)
          return { success: true, format: 'minimal', data: response4.data }
        } catch (error4: any) {
          console.log('❌ All formats failed')
          return { 
            success: false, 
            error: 'All data formats failed',
            details: {
              current: error.response?.data,
              alt1: error2.response?.data,
              alt2: error3.response?.data,
              minimal: error4.response?.data
            }
          }
        }
      }
    }
  }
}

// Auto-run test when imported (for debugging)
if (typeof window !== 'undefined') {
  console.log('Envelope debug utility loaded. Call testEnvelopeDataFormats() to test different data formats.')
}