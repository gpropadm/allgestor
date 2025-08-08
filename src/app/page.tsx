'use client'

import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    window.location.href = '/login'
  }, [])

  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial' }}>
      <h1 style={{ fontSize: '48px', color: '#f63c6a' }}>ALL GESTOR</h1>
      <p>Redirecionando para login...</p>
    </div>
  )
}