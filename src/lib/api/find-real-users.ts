// Utility to help find real users in your backend for testing
import apiClient from '@/lib/axios'

export const findRealUsers = async () => {
  console.log('=== Finding Real Users in Backend ===')
  
  try {
    // Try to get all users (without search filter)
    const response = await apiClient.get('/auth/users/', {
      params: {
        page_size: 50  // Get more users
      }
    })
    
    console.log('Backend users response:', response.data)
    
    if (response.data.results && response.data.results.length > 0) {
      console.log(`Found ${response.data.results.length} users in backend:`)
      response.data.results.forEach((user: any, index: number) => {
        console.log(`${index + 1}. ${user.email} (ID: ${user.id})`)
      })
      
      // Return first few users for testing
      return response.data.results.slice(0, 5)
    } else {
      console.log('No users found in backend')
      return []
    }
  } catch (error: any) {
    console.error('Error getting users from backend:', error)
    return []
  }
}

export const testWithRealUsers = async () => {
  console.log('=== Testing with Real Users ===')
  
  const realUsers = await findRealUsers()
  
  if (realUsers.length > 0) {
    console.log('You can test envelope creation with these real user emails:')
    realUsers.forEach((user: any) => {
      console.log(`- ${user.email} (UUID: ${user.id})`)
    })
    
    // Test envelope creation with first real user
    const testUser = realUsers[0]
    console.log(`\nTest envelope creation with: ${testUser.email}`)
    
    const testData = {
      document_id: "221389ff-6dd2-4fdf-baa5-1450e62f49e1", // Use your document ID
      signing_order: [
        {
          signer_id: testUser.id,
          order: 1
        }
      ]
    }
    
    console.log('Test data:', JSON.stringify(testData, null, 2))
    
    try {
      const response = await apiClient.post('/envelopes/create/', testData)
      console.log('✅ Envelope creation successful!', response.data)
    } catch (error: any) {
      console.error('❌ Envelope creation failed:', error.response?.data)
    }
  } else {
    console.log('No real users found. You may need to:')
    console.log('1. Create users in your backend first')
    console.log('2. Or use the mock implementation for testing')
  }
}

// Auto-run when imported (for debugging)
if (typeof window !== 'undefined') {
  console.log('Real users finder loaded. Call findRealUsers() or testWithRealUsers() to test.')
}
