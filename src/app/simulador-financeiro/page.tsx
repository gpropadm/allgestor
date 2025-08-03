'use client'

import React from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { FinancialSimulator } from '@/components/financial-simulator'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

export default function FinancialSimulatorPage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!session) {
    redirect('/login')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Simulador Financeiro
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Calcule financiamentos e compare opções bancárias
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <FinancialSimulator />
        </div>
      </div>
    </DashboardLayout>
  )
}