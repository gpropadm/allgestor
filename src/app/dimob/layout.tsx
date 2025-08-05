'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { 
  LayoutDashboard,
  Upload,
  FileText,
  BarChart3
} from 'lucide-react'

const dimobMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dimob' },
  { icon: Upload, label: 'Upload XMLs', href: '/dimob/upload' },
  { icon: FileText, label: 'Gerar DIMOB', href: '/dimob/generate' },
  { icon: BarChart3, label: 'Relatórios', href: '/dimob/reports' }
]

export default function DimobLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'loading') return // Still loading
    if (!session) {
      router.push('/login')
      return
    }
  }, [session, status, router])

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen">
      {/* DIMOB Navigation */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 mb-6">
        <div className="max-w-7xl mx-auto">
          <nav className="flex space-x-8">
            {dimobMenuItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
      
      {/* Content */}
      {children}
    </div>
  )
}