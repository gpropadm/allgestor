// Debug script to check contracts and payments
const sqlite3 = require('sqlite3').verbose()
const path = require('path')

async function main() {
  const dbPath = path.resolve('./prisma/dev.db')
  console.log('🔍 Checking SQLite database for contracts and payments...')
  console.log('📍 Database path:', dbPath)
  
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ Error opening database:', err.message)
      return
    }
    console.log('✅ Connected to SQLite database\n')
  })

  return new Promise((resolve, reject) => {
    // Check contracts with payments
    const contractQuery = `
      SELECT 
        c.id as contract_id,
        c.status as contract_status,
        c.startDate,
        c.endDate,
        c.rentAmount,
        p.title as property_title,
        p.address as property_address,
        t.name as tenant_name,
        t.email as tenant_email,
        pay.id as payment_id,
        pay.amount as payment_amount,
        pay.dueDate as payment_due_date,
        pay.status as payment_status,
        pay.paidDate as payment_paid_date
      FROM contracts c
      LEFT JOIN properties p ON c.propertyId = p.id
      LEFT JOIN tenants t ON c.tenantId = t.id
      LEFT JOIN payments pay ON c.id = pay.contractId
      ORDER BY c.createdAt DESC, pay.dueDate DESC
    `
    
    db.all(contractQuery, [], (err, rows) => {
      if (err) {
        console.error('❌ Error querying database:', err.message)
        reject(err)
        return
      }
      
      console.log(`📋 Found ${rows.length} contract-payment relationships:\n`)
      
      // Group by contract
      const contractsMap = new Map()
      
      rows.forEach(row => {
        const contractId = row.contract_id
        if (!contractsMap.has(contractId)) {
          contractsMap.set(contractId, {
            id: contractId,
            status: row.contract_status,
            startDate: row.startDate,
            endDate: row.endDate,
            rentAmount: row.rentAmount,
            property: {
              title: row.property_title,
              address: row.property_address
            },
            tenant: {
              name: row.tenant_name,
              email: row.tenant_email
            },
            payments: []
          })
        }
        
        if (row.payment_id) {
          contractsMap.get(contractId).payments.push({
            id: row.payment_id,
            amount: row.payment_amount,
            dueDate: row.payment_due_date,
            status: row.payment_status,
            paidDate: row.payment_paid_date
          })
        }
      })
      
      const contracts = Array.from(contractsMap.values())
      
      console.log(`📊 Summary:`)
      console.log(`   Total Contracts: ${contracts.length}`)
      
      contracts.forEach((contract, index) => {
        console.log(`\n${index + 1}. Contract ID: ${contract.id}`)
        console.log(`   Property: ${contract.property?.title || 'N/A'}`)
        console.log(`   Tenant: ${contract.tenant?.name || 'N/A'}`)
        console.log(`   Status: ${contract.status}`)
        console.log(`   Start: ${contract.startDate || 'N/A'}`)
        console.log(`   End: ${contract.endDate || 'N/A'}`)
        console.log(`   Rent: R$ ${contract.rentAmount || 0}`)
        console.log(`   Payments: ${contract.payments.length}`)
        
        if (contract.payments.length > 0) {
          console.log(`   Payment details:`)
          contract.payments.forEach((payment, pIndex) => {
            const dueDate = payment.dueDate ? new Date(payment.dueDate).toISOString().split('T')[0] : 'N/A'
            console.log(`     ${pIndex + 1}. ID: ${payment.id} | Amount: R$ ${payment.amount} | Due: ${dueDate} | Status: ${payment.status}`)
          })
        }
      })
      
      // Now check all payments grouped by month
      console.log('\n📅 Checking payments by month:')
      
      const paymentsQuery = `
        SELECT 
          p.id,
          p.amount,
          p.dueDate,
          p.status,
          p.paidDate,
          c.id as contract_id,
          prop.title as property_title,
          t.name as tenant_name
        FROM payments p
        LEFT JOIN contracts c ON p.contractId = c.id
        LEFT JOIN properties prop ON c.propertyId = prop.id
        LEFT JOIN tenants t ON c.tenantId = t.id
        ORDER BY p.dueDate DESC
      `
      
      db.all(paymentsQuery, [], (err, paymentRows) => {
        if (err) {
          console.error('❌ Error querying payments:', err.message)
          reject(err)
          return
        }
        
        console.log(`💰 Found ${paymentRows.length} total payments`)
        
        // Group by month
        const paymentsByMonth = {}
        const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
        
        paymentRows.forEach(payment => {
          if (payment.dueDate) {
            const month = payment.dueDate.slice(0, 7) // YYYY-MM format
            if (!paymentsByMonth[month]) {
              paymentsByMonth[month] = []
            }
            paymentsByMonth[month].push(payment)
          }
        })
        
        console.log(`\n📊 Payments by month:`)
        Object.keys(paymentsByMonth).sort().reverse().forEach(month => {
          const isCurrentMonth = month === currentMonth
          const payments = paymentsByMonth[month]
          console.log(`\n${month} ${isCurrentMonth ? '(CURRENT MONTH)' : ''}: ${payments.length} payments`)
          
          if (isCurrentMonth) {
            console.log('   Current month payments:')
            payments.forEach((payment, index) => {
              const dueDate = payment.dueDate ? new Date(payment.dueDate).toISOString().split('T')[0] : 'N/A'
              console.log(`     ${index + 1}. ${payment.tenant_name || 'N/A'} - ${payment.property_title || 'N/A'} - R$ ${payment.amount} - ${payment.status} - Due: ${dueDate}`)
            })
          }
        })
        
        // Payment status distribution
        const statusCounts = {}
        paymentRows.forEach(payment => {
          const status = payment.status
          statusCounts[status] = (statusCounts[status] || 0) + 1
        })
        
        console.log(`\n📈 Payment status distribution:`)
        Object.entries(statusCounts).forEach(([status, count]) => {
          console.log(`   ${status}: ${count}`)
        })
        
        console.log(`\n✅ Analysis complete!`)
        console.log(`📊 Key findings:`)
        console.log(`   - Total contracts: ${contracts.length}`)
        console.log(`   - Total payments: ${paymentRows.length}`)
        console.log(`   - Current month payments: ${paymentsByMonth[currentMonth]?.length || 0}`)
        
        if (paymentsByMonth[currentMonth]?.length === 0) {
          console.log(`\n🔍 ISSUE FOUND: No payments for current month (${currentMonth})!`)
          console.log(`   This explains why the payments page is empty.`)
          console.log(`   The payments API is filtering by current month only.`)
        }
        
        db.close((err) => {
          if (err) {
            console.error('❌ Error closing database:', err.message)
          } else {
            console.log('✅ Database connection closed')
          }
          resolve()
        })
      })
    })
  })
}

main().catch(console.error)