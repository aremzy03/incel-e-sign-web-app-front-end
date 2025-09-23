import '@testing-library/jest-dom'
import { jest } from '@jest/globals'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  })),
  usePathname: jest.fn(() => '/dashboard'),
  redirect: jest.fn(),
}))

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  getSession: jest.fn(() => Promise.resolve(null)),
  signIn: jest.fn(() => Promise.resolve({ error: null })),
  signOut: jest.fn(() => Promise.resolve()),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock react-hot-toast
jest.mock('react-hot-toast', () => {
  const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  }
  
  return {
    __esModule: true,
    default: mockToast,
    toast: mockToast,
    Toaster: () => null,
  }
})

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})) as any

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})) as any

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock Radix UI Select to simplify interaction in tests
jest.mock('@radix-ui/react-select', () => {
  const React = require('react')
  const make = (role?: string) => {
    const Cmp = ({ children, ...props }: any) => React.createElement(role ? 'div' : 'div', role ? { role, ...props } : props, children)
    Cmp.displayName = 'Mock'
    return Cmp
  }
  const Root = make()
  const Trigger = ({ children, ...props }: any) => React.createElement('button', { role: 'combobox', ...props }, children)
  Trigger.displayName = 'Trigger'
  const Content = make('listbox')
  Content.displayName = 'Content'
  const Item = ({ children, value, onSelect, ...props }: any) => React.createElement('div', { role: 'option', onClick: () => (onSelect ? onSelect(value) : null), ...props }, children)
  Item.displayName = 'Item'
  const ItemIndicator = make()
  const ItemText = ({ children }: any) => React.createElement('span', null, children)
  const Value = ({ placeholder }: any) => React.createElement('span', null, placeholder)
  Value.displayName = 'Value'
  const ScrollUpButton = make()
  const ScrollDownButton = make()
  const Group = make()
  const Label = make()
  const Separator = make()
  const Icon = make()
  const Portal = ({ children }: any) => React.createElement(React.Fragment, null, children)
  const Viewport = make()
  return {
    __esModule: true,
    Root,
    Trigger,
    Content,
    Item,
    ItemIndicator,
    ItemText,
    Value,
    ScrollUpButton,
    ScrollDownButton,
    Group,
    Label,
    Separator,
    Icon,
    Portal,
    Viewport,
  }
})

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000/api'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
