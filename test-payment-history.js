#!/usr/bin/env node

// Debug script to test the payment history modal issue
const fetch = require('node-fetch');

async function testPaymentHistoryAPI() {
  try {
    console.log('🔍 Testing Payment History API...');
    
    // Test the all-months endpoint
    const response = await fetch('http://localhost:3000/api/payments/all-months', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: This will fail without proper authentication
        'Cookie': 'your-auth-cookie-here'
      }
    });
    
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response Success');
      console.log('📊 Data received:', {
        count: data.length,
        sample: data.slice(0, 2)
      });
    } else {
      console.log('❌ API Response Error');
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

// Run the test
testPaymentHistoryAPI();