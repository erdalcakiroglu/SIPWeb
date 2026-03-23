import { createServer } from 'node:http'
import { env } from './config/env'
import { createApp } from './app'

const app = createApp()
const server = createServer(app)

server.listen(env.port, () => {
  console.log(`SQL Performance Intelligence™ backend is running on http://localhost:${env.port}`)
})
