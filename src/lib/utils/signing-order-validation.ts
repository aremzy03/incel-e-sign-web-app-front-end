import { User } from '@/lib/api/users'

export interface SigningOrderItem {
  signer_id: string
  order: number
  email?: string // For validation purposes
}

export interface SigningOrderValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// Validate UUID format
export const isValidUUID = (uuid: string): boolean => {
  return UUID_REGEX.test(uuid)
}

// Validate signing order requirements
export const validateSigningOrder = (
  signingOrder: SigningOrderItem[],
  users?: User[]
): SigningOrderValidationResult => {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!signingOrder || signingOrder.length === 0) {
    errors.push('At least one signer is required')
    return { isValid: false, errors, warnings }
  }
  
  // Check for duplicate signer IDs
  const signerIds = signingOrder.map(item => item.signer_id)
  const uniqueSignerIds = new Set(signerIds)
  if (signerIds.length !== uniqueSignerIds.size) {
    errors.push('Duplicate signer IDs are not allowed')
  }
  
  // Check for duplicate order numbers
  const orders = signingOrder.map(item => item.order)
  const uniqueOrders = new Set(orders)
  if (orders.length !== uniqueOrders.size) {
    errors.push('Duplicate order numbers are not allowed')
  }
  
  // Validate each signing order item
  for (const item of signingOrder) {
    // Validate UUID format
    if (!isValidUUID(item.signer_id)) {
      errors.push(`Invalid UUID format for signer_id: ${item.signer_id}`)
    }
    
    // Validate order number (must be positive integer)
    if (!Number.isInteger(item.order) || item.order < 1) {
      errors.push(`Invalid order number: ${item.order}. Order must be a positive integer starting from 1`)
    }
  }
  
  // Check for gaps in order sequence
  const sortedOrders = [...orders].sort((a, b) => a - b)
  const expectedOrders = Array.from({ length: signingOrder.length }, (_, i) => i + 1)
  const hasGaps = !sortedOrders.every((order, index) => order === expectedOrders[index])
  
  if (hasGaps) {
    errors.push('Order numbers must start from 1 and have no gaps (e.g., 1, 2, 3, not 1, 3, 5)')
  }
  
  // Validate that orders start from 1
  if (sortedOrders.length > 0 && sortedOrders[0] !== 1) {
    errors.push('Order numbers must start from 1')
  }
  
  // Validate user existence if users array is provided
  if (users && users.length > 0) {
    const userIds = users.map(user => user.id)
    const invalidUserIds = signerIds.filter(signerId => !userIds.includes(signerId))
    
    if (invalidUserIds.length > 0) {
      errors.push(`Invalid user IDs: ${invalidUserIds.join(', ')}. These users do not exist in the system.`)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate recipient data before creating signing order
export const validateRecipients = (recipients: Array<{
  id: number
  email: string
  name: string
  order: number
}>): SigningOrderValidationResult => {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!recipients || recipients.length === 0) {
    errors.push('At least one recipient is required')
    return { isValid: false, errors, warnings }
  }
  
  // Check for duplicate emails
  const emails = recipients.map(r => r.email.toLowerCase())
  const uniqueEmails = new Set(emails)
  if (emails.length !== uniqueEmails.size) {
    errors.push('Duplicate email addresses are not allowed')
  }
  
  // Validate each recipient
  for (const recipient of recipients) {
    if (!recipient.email.trim()) {
      errors.push('Email address is required for all recipients')
    } else if (!isValidEmail(recipient.email)) {
      errors.push(`Invalid email format: ${recipient.email}`)
    }
    
    if (!recipient.name.trim()) {
      errors.push('Name is required for all recipients')
    }
    
    if (!Number.isInteger(recipient.order) || recipient.order < 1) {
      errors.push(`Invalid order number for ${recipient.email}: ${recipient.order}`)
    }
  }
  
  // Check for gaps in order sequence
  const orders = recipients.map(r => r.order)
  const sortedOrders = [...orders].sort((a, b) => a - b)
  const expectedOrders = Array.from({ length: recipients.length }, (_, i) => i + 1)
  const hasGaps = !sortedOrders.every((order, index) => order === expectedOrders[index])
  
  if (hasGaps) {
    errors.push('Order numbers must start from 1 and have no gaps')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// Convert recipients to signing order format
export const convertRecipientsToSigningOrder = (
  recipients: Array<{
    id: number
    email: string
    name: string
    order: number
  }>,
  userMap: Map<string, User>
): SigningOrderItem[] => {
  return recipients.map(recipient => {
    const user = userMap.get(recipient.email.toLowerCase())
    if (!user || !user.id) {
      throw new Error(`User not found for email: ${recipient.email}`)
    }
    return {
      signer_id: user.id,
      order: recipient.order,
      email: recipient.email
    }
  })
}
