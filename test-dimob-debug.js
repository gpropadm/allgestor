// Test script to debug DIMOB payment distribution
import { gerarArquivoDimobTxt } from './src/lib/dimob-txt-generator.ts'

async function testDimobDebug() {
  try {
    console.log('🔍 Testing DIMOB generation with debug logs...')
    
    // You'll need to replace with actual userId and ownerId from your system
    // This is just to show the structure - run this through proper API
    const result = await gerarArquivoDimobTxt('user-id', 2024, 'owner-id')
    console.log('✅ DIMOB generated successfully')
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testDimobDebug()