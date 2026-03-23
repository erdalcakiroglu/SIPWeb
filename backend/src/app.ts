import path from 'node:path'
import express from 'express'
import session from 'express-session'
import cors from 'cors'
import FileStore from 'session-file-store'
import { env } from './config/env'
import { getVersionInfo } from './lib/version'
import { authRouter } from './routes/auth'
import { adminRouter } from './routes/admin'
import { licenseRouter } from './routes/license'
import { errorHandler } from './middleware/errorHandler'
import {
  generalLimiter,
  authLimiter,
  licenseSensitiveLimiter,
  adminLoginLimiter,
} from './middleware/rateLimit'

const FileStoreSession = FileStore(session)

export function createApp() {
  const app = express()

  const publicDir = path.resolve(__dirname, '..', 'public')
  const indexPath = path.join(publicDir, 'index.html')
  const createAccountPath = path.join(publicDir, 'create-account.html')
  const activateAccountPath = path.join(publicDir, 'activate-account.html')
  const accountPath = path.join(publicDir, 'account.html')
  const accountProfilePath = path.join(publicDir, 'account-profile.html')
  const accountPasswordPath = path.join(publicDir, 'account-password.html')
  const accountActivationCodePath = path.join(publicDir, 'account-activation-code.html')
  const adminLoginPath = path.join(publicDir, 'admin-login.html')
  const adminPath = path.join(publicDir, 'admin.html')

  function sendProtectedAccountPage(
    request: express.Request,
    response: express.Response,
    filePath: string,
  ) {
    if (!request.session.userId) {
      response.redirect('/')
      return
    }

    response.sendFile(filePath)
  }

  if (env.corsOrigin) {
    const origins = env.corsOrigin.split(',').map((o) => o.trim()).filter(Boolean)
    app.use(cors({ origin: origins.length > 0 ? origins : true, credentials: true }))
  } else {
    app.use(cors({ origin: true, credentials: true }))
  }

  app.use(express.json())

  const sessionStore = new FileStoreSession({
    path: path.join(env.dataDir, 'sessions'),
    ttl: 60 * 60 * 24,
  })

  app.use(
    session({
      secret: env.sessionSecret,
      resave: false,
      saveUninitialized: false,
      store: sessionStore,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24,
      },
    }),
  )

  app.use(generalLimiter)

  app.get('/api/version', (_request, response) => {
    response.json(getVersionInfo())
  })

  app.use(express.static(publicDir))
  app.get('/', (_request, response) => {
    response.sendFile(indexPath)
  })
  app.get('/create-account', (_request, response) => {
    response.sendFile(createAccountPath)
  })
  app.get('/activate-account', (_request, response) => {
    response.sendFile(activateAccountPath)
  })
  app.get('/account', (request, response) => {
    sendProtectedAccountPage(request, response, accountPath)
  })
  app.get('/account/profile', (request, response) => {
    sendProtectedAccountPage(request, response, accountProfilePath)
  })
  app.get('/account/password', (request, response) => {
    sendProtectedAccountPage(request, response, accountPasswordPath)
  })
  app.get('/account/activation-code', (request, response) => {
    sendProtectedAccountPage(request, response, accountActivationCodePath)
  })
  app.get('/admin/login', (_request, response) => {
    response.sendFile(adminLoginPath)
  })
  app.get('/admin', (request, response) => {
    if (!request.session.adminAuthenticated) {
      response.redirect('/admin/login')
      return
    }

    response.sendFile(adminPath)
  })

  app.use('/api/auth', authLimiter, authRouter)
  app.use('/api/admin', adminRouter)
  app.use('/api', licenseRouter)

  app.use((request, response) => {
    response.status(404).json({
      message: `Route not found: ${request.method} ${request.originalUrl}`,
    })
  })

  app.use(errorHandler)

  return app
}
