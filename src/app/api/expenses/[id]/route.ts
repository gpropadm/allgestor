import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔄 Updating expense:', params.id)
    
    // Verificar autenticação
    const user = await requireAuth(request)
    console.log('👤 User authenticated:', user.email)
    
    const body = await request.json()
    const { description, amount, category, date, type = 'operational', receipt, notes } = body

    console.log('📄 Update data:', { description, amount, category, date, type, receipt, notes })

    if (!description || !amount || !category || !date) {
      console.log('❌ Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields: description, amount, category, date' },
        { status: 400 }
      )
    }

    // Verificar se a despesa existe e pertence ao usuário
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    })

    if (!existingExpense) {
      console.log('❌ Expense not found or access denied')
      return NextResponse.json(
        { error: 'Expense not found or access denied' },
        { status: 404 }
      )
    }

    const expenseDate = new Date(date)
    const year = expenseDate.getFullYear()
    const month = expenseDate.getMonth() + 1

    console.log('📅 Date info:', { date, year, month })

    const updatedExpense = await prisma.expense.update({
      where: { id: params.id },
      data: {
        description,
        amount: parseFloat(amount),
        category,
        date: expenseDate,
        year,
        month,
        type,
        receipt: receipt || null,
        notes: notes || null
      }
    })

    console.log('✅ Expense updated:', updatedExpense.id)

    return NextResponse.json({
      success: true,
      expense: updatedExpense,
      message: 'Despesa atualizada com sucesso!'
    })
  } catch (error) {
    console.error('❌ Error updating expense:', error)
    return NextResponse.json(
      { error: 'Failed to update expense', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🗑️ Deleting expense:', params.id)
    
    // Verificar autenticação
    const user = await requireAuth(request)
    console.log('👤 User authenticated:', user.email)

    // Verificar se a despesa existe e pertence ao usuário
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    })

    if (!existingExpense) {
      console.log('❌ Expense not found or access denied')
      return NextResponse.json(
        { error: 'Expense not found or access denied' },
        { status: 404 }
      )
    }

    await prisma.expense.delete({
      where: { id: params.id }
    })

    console.log('✅ Expense deleted:', params.id)

    return NextResponse.json({
      success: true,
      message: 'Despesa excluída com sucesso!'
    })
  } catch (error) {
    console.error('❌ Error deleting expense:', error)
    return NextResponse.json(
      { error: 'Failed to delete expense', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}