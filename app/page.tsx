import { Dashboard } from './components/Dashboard'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Status Network Testing Suite</h1>
        <Dashboard />
      </div>
    </main>
  )
}