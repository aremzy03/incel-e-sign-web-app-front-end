import { 
  validateSigningOrder, 
  validateRecipients, 
  isValidUUID, 
  isValidEmail,
  convertRecipientsToSigningOrder 
} from '../signing-order-validation'
import { User } from '@/lib/api/users'

describe('Signing Order Validation', () => {
  const testUsers: User[] = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      email: 'john.doe@example.com',
      full_name: 'John Doe',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      email: 'jane.smith@example.com',
      full_name: 'Jane Smith',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ]

  describe('isValidUUID', () => {
    it('should validate correct UUIDs', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440001')).toBe(true)
      expect(isValidUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true)
    })

    it('should reject invalid UUIDs', () => {
      expect(isValidUUID('invalid-uuid')).toBe(false)
      expect(isValidUUID('123')).toBe(false)
      expect(isValidUUID('')).toBe(false)
      expect(isValidUUID('550e8400-e29b-41d4-a716-44665544000g')).toBe(false)
    })
  })

  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
    })

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('')).toBe(false)
    })
  })

  describe('validateSigningOrder', () => {
    it('should validate correct signing order', () => {
      const signingOrder = [
        { signer_id: '550e8400-e29b-41d4-a716-446655440001', order: 1 },
        { signer_id: '550e8400-e29b-41d4-a716-446655440002', order: 2 }
      ]
      
      const result = validateSigningOrder(signingOrder, testUsers)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject empty signing order', () => {
      const result = validateSigningOrder([], testUsers)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('At least one signer is required')
    })

    it('should reject duplicate signer IDs', () => {
      const signingOrder = [
        { signer_id: '550e8400-e29b-41d4-a716-446655440001', order: 1 },
        { signer_id: '550e8400-e29b-41d4-a716-446655440001', order: 2 }
      ]
      
      const result = validateSigningOrder(signingOrder, testUsers)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Duplicate signer IDs are not allowed')
    })

    it('should reject duplicate order numbers', () => {
      const signingOrder = [
        { signer_id: '550e8400-e29b-41d4-a716-446655440001', order: 1 },
        { signer_id: '550e8400-e29b-41d4-a716-446655440002', order: 1 }
      ]
      
      const result = validateSigningOrder(signingOrder, testUsers)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Duplicate order numbers are not allowed')
    })

    it('should reject invalid UUIDs', () => {
      const signingOrder = [
        { signer_id: 'invalid-uuid', order: 1 }
      ]
      
      const result = validateSigningOrder(signingOrder, testUsers)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid UUID format for signer_id: invalid-uuid')
    })

    it('should reject invalid order numbers', () => {
      const signingOrder = [
        { signer_id: '550e8400-e29b-41d4-a716-446655440001', order: 0 }
      ]
      
      const result = validateSigningOrder(signingOrder, testUsers)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid order number: 0. Order must be a positive integer starting from 1')
    })

    it('should reject gaps in order sequence', () => {
      const signingOrder = [
        { signer_id: '550e8400-e29b-41d4-a716-446655440001', order: 1 },
        { signer_id: '550e8400-e29b-41d4-a716-446655440002', order: 3 }
      ]
      
      const result = validateSigningOrder(signingOrder, testUsers)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Order numbers must start from 1 and have no gaps (e.g., 1, 2, 3, not 1, 3, 5)')
    })

    it('should reject orders not starting from 1', () => {
      const signingOrder = [
        { signer_id: '550e8400-e29b-41d4-a716-446655440001', order: 2 }
      ]
      
      const result = validateSigningOrder(signingOrder, testUsers)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Order numbers must start from 1')
    })

    it('should reject non-existent user IDs', () => {
      const signingOrder = [
        { signer_id: '550e8400-e29b-41d4-a716-446655440999', order: 1 }
      ]
      
      const result = validateSigningOrder(signingOrder, testUsers)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid user IDs: 550e8400-e29b-41d4-a716-446655440999. These users do not exist in the system.')
    })
  })

  describe('validateRecipients', () => {
    it('should validate correct recipients', () => {
      const recipients = [
        { id: 1, email: 'john@example.com', name: 'John Doe', order: 1 },
        { id: 2, email: 'jane@example.com', name: 'Jane Smith', order: 2 }
      ]
      
      const result = validateRecipients(recipients)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject empty recipients', () => {
      const result = validateRecipients([])
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('At least one recipient is required')
    })

    it('should reject duplicate emails', () => {
      const recipients = [
        { id: 1, email: 'john@example.com', name: 'John Doe', order: 1 },
        { id: 2, email: 'john@example.com', name: 'John Smith', order: 2 }
      ]
      
      const result = validateRecipients(recipients)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Duplicate email addresses are not allowed')
    })

    it('should reject invalid email formats', () => {
      const recipients = [
        { id: 1, email: 'invalid-email', name: 'John Doe', order: 1 }
      ]
      
      const result = validateRecipients(recipients)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid email format: invalid-email')
    })

    it('should reject empty names', () => {
      const recipients = [
        { id: 1, email: 'john@example.com', name: '', order: 1 }
      ]
      
      const result = validateRecipients(recipients)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Name is required for all recipients')
    })
  })

  describe('convertRecipientsToSigningOrder', () => {
    it('should convert recipients to signing order correctly', () => {
      const recipients = [
        { id: 1, email: 'john.doe@example.com', name: 'John Doe', order: 1 },
        { id: 2, email: 'jane.smith@example.com', name: 'Jane Smith', order: 2 }
      ]
      
      const userMap = new Map([
        ['john.doe@example.com', testUsers[0]],
        ['jane.smith@example.com', testUsers[1]]
      ])
      
      const result = convertRecipientsToSigningOrder(recipients, userMap)
      
      expect(result).toEqual([
        { signer_id: '550e8400-e29b-41d4-a716-446655440001', order: 1, email: 'john.doe@example.com' },
        { signer_id: '550e8400-e29b-41d4-a716-446655440002', order: 2, email: 'jane.smith@example.com' }
      ])
    })

    it('should handle missing users in map', () => {
      const recipients = [
        { id: 1, email: 'unknown@example.com', name: 'Unknown User', order: 1 }
      ]
      
      const userMap = new Map()
      
      expect(() => convertRecipientsToSigningOrder(recipients, userMap)).toThrow('User not found for email: unknown@example.com')
    })
  })
})
