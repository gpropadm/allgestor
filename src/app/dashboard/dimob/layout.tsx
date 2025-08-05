'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard,
  Upload,
  FileText,
  BarChart3
} from 'lucide-react'

const dimobMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/dimob' },
  { icon: Upload, label: 'Upload XMLs', href: '/dashboard/dimob/upload' },
  { icon: FileText, label: 'Gerar DIMOB', href: '/dashboard/dimob/generate' },
  { icon: BarChart3, label: 'Relatórios', href: '/dashboard/dimob/reports' }
]

export default function DimobLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

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