// Fila mínima em processo para processamento de webhooks.
// Processa os jobs em sequência (concorrência 1) sem travar a resposta do webhook.
type Job = () => Promise<void>

const queue: Job[] = []
let processing = false

export function enqueueWebhookJob(job: Job): void {
  queue.push(job)
  void drain()
}

async function drain(): Promise<void> {
  if (processing) return
  processing = true
  try {
    while (queue.length > 0) {
      const job = queue.shift()!
      try {
        await job()
      } catch (err) {
        console.error("Erro ao processar job do webhook:", err)
      }
    }
  } finally {
    processing = false
  }
}
