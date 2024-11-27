import { NextResponse } from 'next/server'
import { StressTest } from '@/lib/stressTest'

if (!process.env.PRIVATE_KEY) {
  throw new Error('PRIVATE_KEY environment variable is not set')
}

const stressTest = new StressTest(process.env.PRIVATE_KEY)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { networks, ...config } = body

    // Run tests for each network sequentially
    const results: Record<string, any> = {}
    for (const network of networks) {
      const networkResults = await stressTest.runTest(network, config)
      
      // Serialize BigInt values before sending response
      results[network] = {
        ...networkResults,
        transactions: networkResults.transactions.map(tx => ({
          ...tx,
          gasUsed: tx.gasUsed ? Number(tx.gasUsed) : undefined
        })),
        avgGasUsed: Number(networkResults.avgGasUsed)
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Stress test failed:', error)
    return NextResponse.json(
      { error: 'Stress test failed' }, 
      { status: 500 }
    )
  }
}