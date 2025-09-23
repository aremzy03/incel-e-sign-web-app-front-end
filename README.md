# Incel eSign Frontend

A modern Next.js 14 frontend application for the Incel eSign digital document signing platform.

## 🚀 Features

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **React Query** for data fetching
- **Axios** for API client
- **React Hook Form + Zod** for form validation
- **ESLint + Prettier** for code quality
- **Dashboard landing page** with quick actions and recent activity
- **Profile page** for user information management
- **Upload Document** (`/documents/upload`) → integrates with backend API
- **List Documents** (`/documents`) → fetches and displays documents
- **Document Detail** (`/documents/{id}`) → shows preview + metadata
- **Delete Document** (`/documents/{id}/delete/`) → delete support
- **Download Document** (`/documents/{id}/download`) → download document
- **Envelope Creation Page** with document selection and signer management
- **Envelope List Page** with status tracking and management
- **Envelope Detail & Signing Simulation** with progress tracking and audit trail
- **Signature Management Page** (UI only) for uploading and managing reusable signatures
- **Signature Placement UI** (UI only) for drag-and-drop signature placement on documents
- **Signing Simulation Page** (UI only) for document signing with reusable signatures
- **Notifications Page** (UI only) for viewing and managing user notifications
- **Notification Bell with Dropdown** (UI only) for quick access to recent notifications
- **Audit Log UI Page** (Admin only, UI only) for viewing system audit trails and activity logs
- **Document Review Page** (UI only) for reviewing individual documents with preview and actions
- **Envelope Review Page** (UI only) for reviewing envelopes before sending with document preview and recipient management
- **Commenting UI for Envelope Review** (UI only) for leaving notes and comments before sending envelopes
- **Final Sign-Off UI** (UI only) for signers to confirm and apply their signature to documents
- **Review Actions Integration** (UI only) for triggering notifications and audit logs on envelope and document review actions
- **Workflow Integration** with notifications and audit trails in document upload, envelope creation, and envelope detail pages

## 🔧 Tech Notes

### Notifications & Audit Logs
- **Notifications and Audit Logs** are mock-only implementations for now; backend integration coming in future sprints.
- **Audit Log UI** is only visible for admin users with proper access control.
- **Notification Bell** shows real-time unread count and integrates with workflow pages.
- **Workflow Integration** provides inline alerts and dummy audit trail updates for user actions.

### Sprint 4 Features
- ✅ **Notifications Page** - Complete UI for viewing and managing notifications
- ✅ **Notification Bell with Dropdown** - Quick access to recent notifications in header
- ✅ **Audit Log UI (Admin only)** - System audit trails and activity logs
- ✅ **Workflow Integration** - Inline alerts and dummy audit trail in document/envelope flows

### Sprint 5 Features
- ✅ **Document Review Page** - Preview documents with metadata and admin audit trail access
- ✅ **Envelope Review Page** - Review envelopes before sending with document preview and recipient management
- ✅ **Commenting UI on Envelopes** - Leave notes and comments before sending envelopes
- ✅ **Final Sign-Off UI** - Signer confirmation/decline interface with legal compliance messaging
- ✅ **Review Actions Integration** - Notifications and audit logs triggered by review actions (mock-only)

### Review Flows & Mock Integration
- **Review Actions** are mock-only implementations for now; no backend calls made.
- **Audit Trail + Notifications** updated via local state arrays for testing purposes.
- **Admin Role Checks** implemented for audit trail button visibility.
- **Inline Alerts** provide immediate user feedback for all review actions.

## 📁 Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (auth)/        # Auth route group
│   │   │   ├── login/     # Login page
│   │   │   └── register/  # Registration page
│   │   ├── dashboard/     # Dashboard page
│   │   ├── layout.tsx     # Root layout
│   │   ├── page.tsx       # Home page
│   │   └── globals.css    # Global styles
│   ├── components/        # Shared UI components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and configurations
│   │   ├── axios.ts      # API client setup
│   │   └── utils.ts      # Utility functions
│   ├── styles/           # Additional styles
│   └── types/            # TypeScript type definitions
├── .eslintrc.json        # ESLint configuration
├── .prettierrc           # Prettier configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies and scripts
```

## 🛠️ Installation

1. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📦 Installed Dependencies

### Core Dependencies
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety

### Styling & UI
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Re-usable component library
- **Lucide React** - Icon library

### Data Fetching & API
- **@tanstack/react-query** - Data fetching and caching
- **Axios** - HTTP client with interceptors

### Forms & Validation
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **@hookform/resolvers** - Form validation integration

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript ESLint** - TypeScript-specific linting rules

## 🎯 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## 🧭 Navigation & Routing Structure

The application uses Next.js 14 App Router with the following route structure:

### Public Routes
- `/` - Home page with welcome message
- `/login` - User login page
- `/register` - User registration page

### Dashboard Routes (Protected)
All dashboard routes are wrapped with a `DashboardLayout` that includes:
- Navigation sidebar with icons
- Top header with page title
- Main content area

#### Dashboard Pages:
- `/dashboard` - Main dashboard overview
- `/dashboard/documents` - Document management and upload
- `/dashboard/envelopes` - Document envelope management and sending
- `/dashboard/signatures` - Digital signature management and creation
- `/dashboard/notifications` - User notifications and alerts
- `/dashboard/audit` - System audit trails and activity logs
- `/dashboard/settings` - User preferences and account settings

#### Admin Features:
- **Admin Dashboard** (`/dashboard/admin`) - System overview with statistics, charts, and quick links
- **User Management** (`/dashboard/admin/users`) - Manage user accounts, roles, and permissions with search and filtering
- **System Settings** (`/dashboard/admin/settings`) - Configure global app-wide settings including max upload size, allowed file types, branding, and notifications. Currently uses dummy data; will connect to backend APIs later.
- **Audit Log Viewer** (`/dashboard/admin/audit`) - Displays a searchable and filterable list of audit logs with details on actor, action, target, and message. Currently uses dummy data; will connect to backend audit API later.
- **Notifications Center** (`/dashboard/admin/notifications`) - Provides an overview of all system notifications. Admins can filter, search, and manage notifications. Currently uses dummy data; will connect to backend notification API later.

### Route Structure Mapping
```
src/app/
├── (auth)/                    # Auth route group
│   ├── login/page.tsx         # Login form
│   └── register/page.tsx      # Registration form
├── dashboard/                 # Dashboard route group
│   ├── layout.tsx            # Dashboard layout with sidebar
│   ├── page.tsx              # Dashboard overview
│   ├── documents/page.tsx    # Document management
│   ├── envelopes/page.tsx    # Envelope management
│   ├── signatures/page.tsx   # Signature management
│   ├── notifications/page.tsx # Notifications
│   ├── audit/page.tsx        # Audit logs
│   └── settings/page.tsx     # User settings
├── layout.tsx                # Global layout
└── page.tsx                  # Home page
```

### Frontend to Backend Route Mapping
| Frontend Route | Backend Feature | Description |
|---------------|----------------|-------------|
| `/login` | Authentication | User login and JWT token generation |
| `/register` | User Management | User registration and account creation |
| `/dashboard/documents` | Document API | Document upload, storage, and management |
| `/dashboard/envelopes` | Envelope API | Document envelope creation and sending |
| `/dashboard/signatures` | Signature API | Digital signature creation and management |
| `/dashboard/notifications` | Notification API | User notifications and alerts |
| `/dashboard/audit` | Audit API | System audit trails and activity logs |
| `/dashboard/settings` | User API | User preferences and account settings |

## 🔧 Configuration

### Tailwind CSS
The project uses Tailwind CSS with a custom configuration that includes:
- CSS variables for theming
- Custom color palette
- Responsive design utilities
- Dark mode support

### API Client
The Axios client is configured with:
- Base URL from environment variables
- Request/response interceptors
- JWT token handling
- Error handling for authentication

### TypeScript
Strict TypeScript configuration with:
- Path aliases (`@/*` for `src/*`)
- Strict type checking
- Next.js specific types

## 🔐 Authentication

The application uses **NextAuth.js** for authentication with JWT tokens from the Django backend API.

### Authentication Features

- **Register Page** (`/auth/register`) → integrates with backend API
- **Login Page** (`/auth/login`) → uses NextAuth with Django API
- **Token Refresh** handled via `/auth/refresh/`
- **Profile Fetch** integrated with `/auth/profile/`

### Authentication Flow

1. **Registration Process:**
   - User submits form via `/auth/register` page
   - Frontend calls backend `/auth/register/` endpoint
   - Backend returns success response
   - User is redirected to login page with success message

2. **Login Process:**
   - User submits credentials via `/auth/login` page
   - NextAuth calls backend `/auth/login/` endpoint
   - Backend returns `access_token`, `refresh_token`, and `user` object
   - Tokens are stored in NextAuth session
   - User is redirected to dashboard

3. **Token Management:**
   - Access tokens expire after 15 minutes
   - Automatic token refresh using `/auth/refresh/` endpoint
   - Failed refresh attempts redirect to login page

4. **Profile Management:**
   - Profile data fetched from `/auth/profile/` endpoint
   - Cached in React Query for performance
   - Displayed in dashboard header/sidebar

5. **Protected Routes:**
   - All `/dashboard/*` routes require authentication
   - Server-side session validation using `getServerSession`
   - Unauthenticated users are redirected to `/login`

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-in-production

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### API Integration

- **Axios Client:** Automatically attaches `Authorization: Bearer <token>` headers
- **401 Handling:** Automatically refreshes tokens on authentication errors
- **Session Management:** NextAuth handles token storage and refresh logic
- **Profile Fetching:** React Query manages profile data caching

### Backend Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/register/` | User registration | ❌ |
| `POST` | `/api/auth/login/` | User login (JWT tokens) | ❌ |
| `POST` | `/api/auth/logout/` | User logout (blacklist token) | ✅ |
| `GET` | `/api/auth/profile/` | Get user profile | ✅ |
| `POST` | `/api/auth/refresh/` | Refresh access token | ❌ |

## Frontend Features → Envelopes

- **Create Envelope** (`/envelopes/create`)
- **Send Envelope** (`/envelopes/{id}/send`)
- **List Envelopes** (`/envelopes`)
- **Envelope Detail** (`/envelopes/{id}`)
- **Reject Envelope** (`/envelopes/{id}/reject`)

## 🎨 Authentication UI

The application features polished authentication pages built with **shadcn/ui** components and **React Hook Form** with **Zod** validation.

### Login Page Features

- **Modern Design:** Centered card layout with app branding
- **Form Validation:** Real-time validation with error messages
- **Input Icons:** Visual icons for email (✉️) and password (🔒) fields
- **Loading States:** Spinner animation during authentication
- **Error Handling:** Red alert for authentication failures
- **Success Feedback:** Toast notifications for successful login
- **Auto-redirect:** Authenticated users are redirected to dashboard

### Register Page Features

- **Comprehensive Form:** First name, last name, email, password, and confirmation
- **Password Validation:** 
  - Minimum 8 characters
  - Must contain uppercase, lowercase, and number
  - Password confirmation matching
- **Real-time Validation:** Instant feedback on form errors
- **Success Flow:** Toast notification and automatic redirect to login
- **Error Handling:** Detailed error messages for various failure scenarios

### UI Components Used

- **shadcn/ui Components:**
  - `Card` - Main container with header and content
  - `Input` - Form input fields with focus states
  - `Button` - Primary action buttons with loading states
  - `Form` - Form wrapper with validation integration
  - `Alert` - Error message display
  - `Label` - Form field labels

- **Custom Components:**
  - `InputWithIcon` - Input fields with embedded icons
  - Toast notifications for success/error feedback

### Form Validation

- **React Hook Form:** Efficient form state management
- **Zod Schemas:** Type-safe validation rules
- **Real-time Validation:** Instant feedback on field errors
- **Password Requirements:** Strong password enforcement
- **Email Format:** Proper email validation
- **Required Fields:** All necessary fields are validated

### User Experience Features

- **Responsive Design:** Works on all screen sizes
- **Loading States:** Visual feedback during API calls
- **Error Recovery:** Clear error messages with retry options
- **Success Feedback:** Toast notifications for successful actions
- **Auto-redirect:** Seamless navigation after authentication
- **Accessibility:** Proper form labels and ARIA attributes

## 🔒 Protected Routes

The application implements comprehensive route protection using NextAuth.js server-side session validation.

### Dashboard Protection

All dashboard routes (`/dashboard/*`) are protected by server-side authentication checks:

- **Server-Side Validation:** Uses `getServerSession()` in dashboard layout
- **Automatic Redirects:** Unauthenticated users are redirected to `/login`
- **Session Persistence:** Authenticated sessions are maintained across page refreshes
- **Secure Access:** No client-side authentication bypass possible

### Protection Flow

1. **Route Access:** User attempts to access `/dashboard/*`
2. **Session Check:** Server validates NextAuth session
3. **Redirect Logic:** 
   - ✅ Valid session → Render dashboard layout
   - ❌ No session → Redirect to `/login`
4. **User Experience:** Seamless redirect without flash of content

### Dashboard Layout Features

- **Responsive Design:** Mobile-friendly sidebar with hamburger menu
- **User Information:** Displays user's full name, email, and avatar
- **Navigation:** Active link highlighting with smooth transitions
- **Logout Functionality:** Secure logout with session cleanup
- **Professional UI:** Clean, modern design with shadcn/ui components

### Navigation Structure

```
Dashboard Layout
├── Sidebar Navigation
│   ├── Dashboard Overview
│   ├── Documents Management
│   ├── Envelopes
│   ├── Signatures
│   ├── Notifications
│   ├── Audit Logs
│   └── Settings
├── User Section
│   ├── User Avatar & Info
│   └── Logout Button
└── Main Content Area
    └── Page-specific content
```

### Security Features

- **Server-Side Protection:** Authentication checked on every request
- **Session Validation:** NextAuth handles secure session management
- **Automatic Logout:** Session expiry and refresh token handling
- **Route Guards:** No unauthorized access to protected content
- **Secure Redirects:** Proper callback URLs for authentication flow

## 🧪 Testing

The application includes a comprehensive testing setup using **Jest** and **React Testing Library**.

### Testing Stack

- **Jest:** JavaScript testing framework with TypeScript support
- **React Testing Library:** Simple and complete testing utilities for React components
- **@testing-library/user-event:** Utilities for simulating user interactions
- **ts-jest:** TypeScript preprocessor for Jest
- **jest-environment-jsdom:** DOM environment for testing React components

### Test Configuration

- **Jest Config:** Configured with Next.js integration and TypeScript support
- **Test Environment:** jsdom for DOM simulation
- **Coverage Collection:** From `src/**/*.{ts,tsx}` files
- **Path Mapping:** Supports `@/*` imports for clean test imports
- **Mock Setup:** Comprehensive mocks for Next.js, NextAuth, and external dependencies

### Test Coverage

The test suite covers:

#### Authentication Pages
- **Login Page Tests:**
  - Component rendering and form elements
  - Form validation (email format, password length)
  - User interactions and form submission
  - Error handling and loading states
  - NextAuth integration

- **Register Page Tests:**
  - Form field validation (name, email, password)
  - Password strength requirements
  - Password confirmation matching
  - API integration and error handling
  - Success flow and redirects

#### Protected Routes
- **Dashboard Layout Tests:**
  - Server-side session validation
  - Authentication redirects
  - User information display
  - Navigation and logout functionality
  - Mobile responsive behavior

### Running Tests

#### Local Development
```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:ci

# Run tests with coverage
npm run test:coverage
```

#### Continuous Integration
```bash
# Run tests in CI environment
npm run test:ci
```

### Test Structure

```
tests/
├── __tests__/
│   ├── login.test.tsx          # Login page tests
│   ├── register.test.tsx       # Registration page tests
│   └── protected.test.tsx      # Protected route tests
src/
├── setupTests.ts               # Test setup and mocks
└── components/                 # Component tests (future)
```

### Mock Configuration

The test setup includes comprehensive mocks for:

- **Next.js Router:** Navigation and routing functions
- **NextAuth:** Session management and authentication
- **Axios:** HTTP client for API calls
- **React Hot Toast:** Notification system
- **Environment Variables:** Test configuration

### Writing Tests

#### Component Testing
```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

test('renders component correctly', () => {
  render(<MyComponent />)
  expect(screen.getByText('Expected Text')).toBeInTheDocument()
})
```

#### User Interaction Testing
```typescript
test('handles user input', async () => {
  const user = userEvent.setup()
  render(<MyForm />)
  
  await user.type(screen.getByLabelText('Email'), 'test@example.com')
  await user.click(screen.getByRole('button', { name: /submit/i }))
  
  expect(mockFunction).toHaveBeenCalledWith('test@example.com')
})
```

### Coverage Reports

Test coverage reports are generated in multiple formats:
- **Text:** Console output during test runs
- **LCOV:** For CI/CD integration
- **HTML:** Detailed coverage reports in `coverage/` directory

### Admin Dashboard Integration Tests

Frontend integration tests validate that all admin dashboard pages (users, settings, audit logs, notifications) work as expected with dummy data. Uses Jest + React Testing Library.

#### Test Coverage:
- **Dashboard Overview** - Renders system metrics and charts correctly
- **User Management** - Table display, search, block/unblock, delete functionality
- **System Settings** - Form rendering, field updates, save operations
- **Audit Log Viewer** - Log display, search filtering, pagination
- **Notifications Center** - Notification list, status toggles, mark all as read

#### Example Test:
```typescript
it('displays user management table with dummy data', async () => {
  render(<UserManagementPage />)
  
  await waitFor(() => {
    expect(screen.getByText('User Management')).toBeInTheDocument()
  })

  expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
  expect(screen.getByText('alice@test.com')).toBeInTheDocument()
})
```

## 🚀 Getting Started

1. **Environment Setup:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

2. **Development:**
   ```bash
   npm run dev
   ```

3. **Build:**
   ```bash
   npm run build
   ```

4. **Production:**
   ```bash
   npm run start
   ```

## 📝 Next Steps

- Implement authentication forms
- Add protected route middleware
- Create dashboard components
- Integrate with backend API
- Add document upload functionality
- Implement e-signature features

## 🤝 Contributing

1. Follow the established code style (ESLint + Prettier)
2. Use TypeScript for all new files
3. Follow the existing folder structure
4. Write meaningful commit messages

## 📄 License

This project is part of the Incel eSign application suite.