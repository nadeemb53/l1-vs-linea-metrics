import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const response = new NextResponse(
    new ReadableStream({
      start(controller) {
        const connectionId = Math.random().toString(36).substring(7)
        console.log(`Client connected: ${connectionId}`)
        
        // Initialize controllers if not exists
        if (!global.stressTestControllers) {
          global.stressTestControllers = new Map()
        }
        
        let isConnected = true
        global.stressTestControllers.set(connectionId, controller)
        console.log(`Active connections: ${global.stressTestControllers.size}`)

        // Keep connection alive
        const keepAlive = setInterval(() => {
          if (!isConnected) {
            clearInterval(keepAlive)
            return
          }

          try {
            controller.enqueue(new TextEncoder().encode(': keepalive\n\n'))
          } catch (error) {
            console.error('Error sending keepalive:', error)
            clearInterval(keepAlive)
            isConnected = false
            global.stressTestControllers.delete(connectionId)
          }
        }, 15000)

        // Cleanup function
        return () => {
          isConnected = false
          clearInterval(keepAlive)
          global.stressTestControllers.delete(connectionId)
          console.log(`Client disconnected: ${connectionId}`)
          console.log(`Remaining connections: ${global.stressTestControllers.size}`)
        }
      }
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    }
  )

  return response
} 