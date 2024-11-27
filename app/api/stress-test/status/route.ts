import { NextResponse } from 'next/server'
import { broadcastSseMessage, sseControllers, encoder } from './sseUtils'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      sseControllers.add(controller)
      console.log(`Client connected. Active connections: ${sseControllers.size}`)

      // Send initial connection message
      controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'))

      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode('data: {"type":"keepalive"}\n\n'))
        } catch (error) {
          console.error('Error sending keepalive:', error)
          clearInterval(keepAlive)
          sseControllers.delete(controller)
        }
      }, 5000)

      return () => {
        clearInterval(keepAlive)
        sseControllers.delete(controller)
        console.log(`Client disconnected. Remaining connections: ${sseControllers.size}`)
      }
    }
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  })
} 