// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Welcome to Incel eSign Frontend
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        Secure and efficient digital document signing platform
      </p>
      <div className="flex justify-center space-x-4">
        <a
          href="/login"
          className="bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 transition-colors"
        >
          Login
        </a>
        <a
          href="/register"
          className="bg-secondary text-secondary-foreground px-6 py-3 rounded-md hover:bg-secondary/90 transition-colors"
        >
          Register
        </a>
      </div>
    </div>
  )
}
