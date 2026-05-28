import { createServer } from 'node:net'
import { spawn } from 'node:child_process'

const host = '0.0.0.0'
const startPort = Number.parseInt(process.env.PORT ?? '3000', 10)
const maxPort = startPort + 20

function findFreePort(port) {
  return new Promise((resolve, reject) => {
    const server = createServer()

    server.unref()
    server.on('error', (error) => {
      server.close()
      if (port >= maxPort) {
        reject(error)
        return
      }
      resolve(findFreePort(port + 1))
    })

    server.listen(port, host, () => {
      const address = server.address()
      const chosenPort = typeof address === 'object' && address ? address.port : port
      server.close(() => resolve(chosenPort))
    })
  })
}

const port = await findFreePort(startPort)
const child = spawn('bunx', ['next', 'dev', '--hostname', host, '--port', String(port)], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.exitCode = 1
    return
  }
  process.exitCode = code ?? 0
})
