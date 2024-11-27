const encoder = new TextEncoder();
let sseControllers = new Set<ReadableStreamDefaultController>();

export function broadcastSseMessage(message: any) {
  const encodedMessage = encoder.encode(`data: ${JSON.stringify(message)}\n\n`);
  sseControllers.forEach(controller => {
    try {
      controller.enqueue(encodedMessage);
    } catch (error) {
      console.error('Error sending SSE message:', error);
      sseControllers.delete(controller);
    }
  });
}

export { sseControllers, encoder }; 