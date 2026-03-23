const registerForm = document.getElementById('registerForm')
const activateForm = document.getElementById('activateForm')
const loginForm = document.getElementById('loginForm')
const accountPageRoot = document.querySelector('[data-account-page]')
const messageBox = document.getElementById('message')
const logoutButton = document.getElementById('logoutButton')
const passwordForm = document.getElementById('passwordForm')
const activationCodeForm = document.getElementById('activationCodeForm')
const activationLicenseId = document.getElementById('activationLicenseId')
const activationServerUrl = document.getElementById('activationServerUrl')
const activationCodeResult = document.getElementById('activationCodeResult')
const activationCodeValue = document.getElementById('activationCodeValue')
const activationCodeMeta = document.getElementById('activationCodeMeta')
const activationCodeStatus = document.getElementById('activationCodeStatus')
const activationCodeIssuedAt = document.getElementById('activationCodeIssuedAt')
const activationCodeExpiresAt = document.getElementById('activationCodeExpiresAt')
const profileName = document.getElementById('profileName')
const profileSurname = document.getElementById('profileSurname')
const profileJob = document.getElementById('profileJob')
const profileEmail = document.getElementById('profileEmail')
const profilePhone = document.getElementById('profilePhone')
const profileCompany = document.getElementById('profileCompany')
const profileStatus = document.getElementById('profileStatus')
const profileCreatedAt = document.getElementById('profileCreatedAt')
const profileActivatedAt = document.getElementById('profileActivatedAt')
const profileFullName = document.getElementById('profileFullName')
const profileJobHero = document.getElementById('profileJobHero')
const heroEmail = document.getElementById('heroEmail')
const heroCompany = document.getElementById('heroCompany')
const heroStatusBadge = document.getElementById('heroStatusBadge')
const heroInitials = document.getElementById('heroInitials')
const heroActiveLicenseCount = document.getElementById('heroActiveLicenseCount')
const heroTotalLicenseCount = document.getElementById('heroTotalLicenseCount')
const heroCreatedAt = document.getElementById('heroCreatedAt')
const heroActivatedAt = document.getElementById('heroActivatedAt')
const licenseList = document.getElementById('licenseList')
const licenseCountBadge = document.getElementById('licenseCountBadge')
const licenseDetailModal = document.getElementById('licenseDetailModal')
const licenseDetailModalTitle = document.getElementById('licenseDetailModalTitle')
const licenseDetailContent = document.getElementById('licenseDetailContent')
const closeLicenseDetailModalButton = document.getElementById('closeLicenseDetailModal')
const installedLicenseModal = document.getElementById('installedLicenseModal')
const installedLicenseModalTitle = document.getElementById('installedLicenseModalTitle')
const installedLicenseModalValue = document.getElementById('installedLicenseModalValue')
const closeInstalledLicenseModalButton = document.getElementById('closeInstalledLicenseModal')
const copyInstalledLicenseButton = document.getElementById('copyInstalledLicenseButton')
const deleteLicenseModal = document.getElementById('deleteLicenseModal')
const deleteLicenseModalName = document.getElementById('deleteLicenseModalName')
const confirmDeleteLicenseButton = document.getElementById('confirmDeleteLicenseButton')
const cancelDeleteLicenseButton = document.getElementById('cancelDeleteLicenseButton')

let currentLicenses = []
let pendingDeleteLicenseId = null

function showMessage(text, tone = 'success') {
  if (!messageBox) {
    return
  }

  messageBox.textContent = text
  messageBox.className = `message ${tone}`
}

function hideMessage() {
  if (!messageBox) {
    return
  }

  messageBox.textContent = ''
  messageBox.className = 'message hidden'
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  })

  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload.message || 'Request failed.')
  }

  return payload
}

async function readErrorMessage(response) {
  const contentType = response.headers.get('Content-Type') || ''

  if (contentType.includes('application/json')) {
    const payload = await response.json().catch(() => null)
    return payload?.message || 'Request failed.'
  }

  const text = await response.text().catch(() => '')
  return text || 'Request failed.'
}

function readForm(form) {
  return Object.fromEntries(new FormData(form).entries())
}

function formatDate(value) {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleString('en-US')
}

function defaultLicenseServerUrl() {
  return `${window.location.origin}/api`
}

function setTextContent(element, value) {
  if (element) {
    element.textContent = value
  }
}

function findLicenseById(publicId) {
  return currentLicenses.find((license) => license.publicId === publicId) || null
}

function getPreferredLicenseDeviceId(license) {
  if (typeof license?.deviceId === 'string' && license.deviceId.trim()) {
    return license.deviceId.trim()
  }

  if (!Array.isArray(license?.devices)) {
    return ''
  }

  const activeDevice = license.devices.find((device) => device?.status === 'active' && device?.deviceId)
  return activeDevice?.deviceId || ''
}

function getInitials(customer) {
  return [customer?.name, customer?.surname]
    .filter(Boolean)
    .map((value) => String(value).trim().charAt(0).toUpperCase())
    .join('')
    .slice(0, 2) || 'SP'
}

function renderAccountStatus(isActive) {
  const label = isActive ? 'Active' : 'Pending'

  if (profileStatus) {
    profileStatus.textContent = label
  }

  if (heroStatusBadge) {
    heroStatusBadge.textContent = label
    heroStatusBadge.classList.toggle('active', isActive)
    heroStatusBadge.classList.toggle('pending', !isActive)
  }
}

function renderProfile(customer) {
  if (!customer) {
    return
  }

  setTextContent(profileName, customer.name)
  setTextContent(profileSurname, customer.surname)
  setTextContent(profileJob, customer.job)
  setTextContent(profileEmail, customer.email)
  setTextContent(profilePhone, customer.phone)
  setTextContent(profileCompany, customer.companyName)
  setTextContent(profileCreatedAt, formatDate(customer.createdAt))
  setTextContent(profileActivatedAt, formatDate(customer.activatedAt))

  renderAccountStatus(customer.isActive)

  setTextContent(profileFullName, `${customer.name} ${customer.surname}`.trim())
  setTextContent(profileJobHero, customer.job)
  setTextContent(heroEmail, customer.email)
  setTextContent(heroCompany, customer.companyName)
  setTextContent(heroInitials, getInitials(customer))
  setTextContent(heroCreatedAt, formatDate(customer.createdAt))
  setTextContent(heroActivatedAt, formatDate(customer.activatedAt))
}

async function loadCurrentCustomer() {
  return requestJson('/api/auth/me')
}

function formatField(value) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  return value
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function buildStatusLabel(license) {
  const status = license.status || 'Unknown'

  if (!license.expiresAt) {
    return status
  }

  const diff = new Date(license.expiresAt).getTime() - Date.now()
  const daysLeft = Math.ceil(diff / 86400000)

  if (Number.isFinite(daysLeft) && daysLeft >= 0) {
    return `${status} (${daysLeft}d left)`
  }

  return status
}

function isActiveLicense(license) {
  return license?.status === 'active' || license?.status === 'trial_active'
}

function isExpiredLicense(license) {
  if (!license?.expiresAt) return false
  return new Date(license.expiresAt).getTime() < Date.now()
}

function getRemainingTimeText(license) {
  if (!license?.expiresAt) return '-'
  const diff = new Date(license.expiresAt).getTime() - Date.now()
  const daysLeft = Math.ceil(diff / 86400000)
  if (!Number.isFinite(daysLeft) || daysLeft < 0) return 'Expired'
  if (daysLeft === 0) return 'Expires today'
  if (daysLeft === 1) return '1 day left'
  return `${daysLeft} days left`
}

function truncateMiddle(value, startLength = 18, endLength = 12) {
  const text = String(value ?? '')

  if (!text || text.length <= startLength + endLength + 3) {
    return text || '-'
  }

  return `${text.slice(0, startLength)}...${text.slice(-endLength)}`
}

function buildInstalledLicenseMarkup(license) {
  if (!license.installedLicense) {
    return '-'
  }

  return `
    <div class="license-inline-actions">
      <span class="license-token-summary">${escapeHtml(truncateMiddle(license.installedLicense))}</span>
      <button
        class="inline-link-button"
        type="button"
        data-open-installed-license="${escapeHtml(license.publicId)}"
      >
        View
      </button>
    </div>
  `
}

function buildActivationCodeMarkup(license) {
  if (license.activationCode) {
    return escapeHtml(license.activationCode)
  }

  if (license.activationCodeStatus && license.activationCodeStatus !== 'active') {
    return '<span class="table-subtle">No active code</span>'
  }

  return '-'
}

function buildOfflineExportMarkup(license) {
  const preferredDeviceId = escapeHtml(getPreferredLicenseDeviceId(license))

  return `
    <section class="license-download-card" aria-label="Offline license download">
      <div class="license-download-copy">
        <h4 class="license-block-title">Offline .lic Export</h4>
        <p class="muted">Download a device-bound file and import it in SQL Performance Intelligence™ with Settings &gt; License &gt; Import .lic.</p>
      </div>
      <form class="license-download-form" data-license-download-form="${escapeHtml(license.publicId)}">
        <div class="license-download-fields">
          <label class="license-download-label">
            <span>Device ID</span>
            <input name="deviceId" type="text" value="${preferredDeviceId}" placeholder="APP-DEVICE-001" required />
          </label>
        </div>
        <div class="license-download-actions">
          <button class="secondary-button secondary-button-compact" type="submit">Download .lic</button>
          <span class="license-download-hint">Use the Device ID shown in the desktop app.</span>
        </div>
      </form>
    </section>
  `
}

function buildLicenseDeleteMarkup(license) {
  if (!license.customerManaged) {
    return ''
  }

  return `
    <div class="license-card-actions">
      <button
        class="danger-button danger-button-compact"
        type="button"
        data-delete-license="${escapeHtml(license.publicId)}"
      >
        Delete License
      </button>
    </div>
  `
}

function buildLicenseListRows(licenses) {
  if (!Array.isArray(licenses) || licenses.length === 0) {
    return ''
  }

  return licenses
    .map((license) => {
      const expired = isExpiredLicense(license)
      const remaining = getRemainingTimeText(license)
      const rowClass = expired ? 'license-list-row license-list-row-expired' : 'license-list-row'

      return `
        <div class="${rowClass}" data-license-id="${escapeHtml(license.publicId)}">
          <div class="license-list-row-main">
            <span class="license-list-row-name">${escapeHtml(license.licenseName || license.publicId)}</span>
            <span class="license-list-row-remaining">${escapeHtml(remaining)}</span>
          </div>
          <div class="license-list-row-actions">
            <button type="button" class="secondary-button secondary-button-compact" data-detail-license="${escapeHtml(license.publicId)}">
              Detail
            </button>
          </div>
        </div>
      `
    })
    .join('')
}

function buildLicenseCards(licenses, options = {}) {
  const { includeDeleteAction = false, includeDownloadForm = false } = options

  return licenses
    .map((license) => {
      const activeDevices = Array.isArray(license.devices)
        ? license.devices.filter((device) => device.status === 'active').length
        : 0

      return `
        <article class="license-card">
          <div class="section-heading">
            <h3 class="license-title">${escapeHtml(license.licenseName)}</h3>
            <span class="license-chip">${escapeHtml(buildStatusLabel(license))}</span>
          </div>
          <div class="license-detail-grid">
            <div class="license-block">
              <h4 class="license-block-title">License Status</h4>
              <dl class="license-fields">
                <div><dt>License ID</dt><dd>${escapeHtml(formatField(license.publicId))}</dd></div>
                <div><dt>License Type</dt><dd>${escapeHtml(formatField(license.licenseType))}</dd></div>
                <div><dt>Status</dt><dd>${escapeHtml(buildStatusLabel(license))}</dd></div>
                <div><dt>Expires</dt><dd>${escapeHtml(formatDate(license.expiresAt))}</dd></div>
                <div><dt>Refresh After</dt><dd>${escapeHtml(formatDate(license.refreshAfter))}</dd></div>
                <div><dt>Offline Grace Until</dt><dd>${escapeHtml(formatDate(license.offlineGraceUntil))}</dd></div>
                <div><dt>Last Validated</dt><dd>${escapeHtml(formatDate(license.lastValidatedAt))}</dd></div>
                <div><dt>License Count</dt><dd>${escapeHtml(formatField(license.licenseCount))}</dd></div>
                <div><dt>Allowed Devices</dt><dd>${escapeHtml(formatField(license.allowedDevices))}</dd></div>
                <div><dt>Active Devices</dt><dd>${escapeHtml(formatField(activeDevices))}</dd></div>
              </dl>
            </div>
            <div class="license-block">
              <h4 class="license-block-title">License Configuration</h4>
              <dl class="license-fields">
                <div><dt>Server URL</dt><dd>${escapeHtml(formatField(license.serverUrl))}</dd></div>
                <div><dt>Email</dt><dd>${escapeHtml(formatField(license.email))}</dd></div>
                <div><dt>Activation Code</dt><dd>${buildActivationCodeMarkup(license)}</dd></div>
                <div><dt>Code Status</dt><dd>${escapeHtml(formatField(license.activationCodeStatus))}</dd></div>
                <div><dt>Code Issued</dt><dd>${escapeHtml(formatDate(license.activationCodeIssuedAt))}</dd></div>
                <div><dt>Code Expires</dt><dd>${escapeHtml(formatDate(license.activationCodeExpiresAt))}</dd></div>
                <div><dt>Code Used At</dt><dd>${escapeHtml(formatDate(license.activationCodeUsedAt))}</dd></div>
                <div><dt>Installed License</dt><dd>${buildInstalledLicenseMarkup(license)}</dd></div>
                <div><dt>Device ID</dt><dd class="license-code">${escapeHtml(formatField(license.deviceId))}</dd></div>
                <div><dt>Imported File</dt><dd>${escapeHtml(formatField(license.importedFile))}</dd></div>
              </dl>
            </div>
          </div>
          ${includeDownloadForm ? buildOfflineExportMarkup(license) : ''}
          ${includeDeleteAction ? buildLicenseDeleteMarkup(license) : ''}
        </article>
      `
    })
    .join('')
}

function renderLicenseCollection(container, licenses, emptyMessage, options = {}) {
  if (!container) {
    return
  }

  if (!Array.isArray(licenses) || licenses.length === 0) {
    container.innerHTML = `<div class="empty-state">${escapeHtml(emptyMessage)}</div>`
    return
  }

  container.innerHTML = buildLicenseCards(licenses, options)
}

function renderLicenses(licenses) {
  const allLicenses = Array.isArray(licenses) ? licenses : []
  currentLicenses = allLicenses
  const activeLicenses = allLicenses.filter(isActiveLicense)
  const expiredCount = allLicenses.filter(isExpiredLicense).length

  if (heroActiveLicenseCount) {
    heroActiveLicenseCount.textContent = String(activeLicenses.length)
  }

  if (heroTotalLicenseCount) {
    heroTotalLicenseCount.textContent = String(allLicenses.length)
  }

  if (licenseCountBadge) {
    if (expiredCount > 0) {
      licenseCountBadge.textContent = `${allLicenses.length} licenses (${activeLicenses.length} active, ${expiredCount} expired)`
    } else {
      licenseCountBadge.textContent = `${allLicenses.length} ${allLicenses.length === 1 ? 'license' : 'licenses'}`
    }
  }

  if (!licenseList) {
    renderLicenseOptions(allLicenses)
    return
  }

  if (allLicenses.length === 0) {
    licenseList.innerHTML = '<div class="empty-state">No license has been assigned to this customer yet.</div>'
    renderLicenseOptions(allLicenses)
    return
  }

  licenseList.innerHTML = buildLicenseListRows(allLicenses)
  renderLicenseOptions(allLicenses)
}

function renderLicenseOptions(licenses) {
  if (!activationLicenseId) {
    return
  }

  const options = ['<option value="">Create new license record</option>']

  for (const license of licenses) {
    options.push(
      `<option value="${escapeHtml(license.publicId)}">${escapeHtml(
        `${license.publicId} - ${license.licenseName} (${license.status})`,
      )}</option>`,
    )
  }

  activationLicenseId.innerHTML = options.join('')
}

function renderGeneratedActivationCode(payload) {
  if (!activationCodeResult || !activationCodeValue) {
    return
  }

  const hasPayload = payload && typeof payload === 'object'
  const code = hasPayload ? payload.activationCode : ''

  if (!code) {
    activationCodeValue.textContent = '-'
    activationCodeResult.classList.add('hidden')
    if (activationCodeMeta) {
      activationCodeMeta.classList.add('hidden')
    }
    setTextContent(activationCodeStatus, '-')
    setTextContent(activationCodeIssuedAt, '-')
    setTextContent(activationCodeExpiresAt, '-')
    return
  }

  activationCodeValue.textContent = code
  activationCodeResult.classList.remove('hidden')
  setTextContent(activationCodeStatus, payload.status || 'active')
  setTextContent(activationCodeIssuedAt, formatDate(payload.issuedAt || payload.issued_at))
  setTextContent(activationCodeExpiresAt, formatDate(payload.expiresAt || payload.expires_at))
  if (activationCodeMeta) {
    activationCodeMeta.classList.remove('hidden')
  }
}

function openLicenseDetailModal(publicLicenseId) {
  if (!licenseDetailModal || !licenseDetailContent || !licenseDetailModalTitle) {
    return
  }

  const license = findLicenseById(publicLicenseId)
  if (!license) {
    showMessage('License not found.', 'error')
    return
  }

  const isActive = isActiveLicense(license)
  const options = {
    includeDownloadForm: isActive,
    includeDeleteAction: Boolean(license.customerManaged),
  }
  licenseDetailModalTitle.textContent = `${license.licenseName} — ${license.publicId}`
  licenseDetailContent.innerHTML = buildLicenseCards([license], options)
  licenseDetailModal.classList.remove('hidden')
  licenseDetailModal.setAttribute('aria-hidden', 'false')
}

function closeLicenseDetailModal() {
  if (!licenseDetailModal) return
  licenseDetailModal.classList.add('hidden')
  licenseDetailModal.setAttribute('aria-hidden', 'true')
  if (licenseDetailContent) licenseDetailContent.innerHTML = ''
}

function closeInstalledLicenseModal() {
  if (!installedLicenseModal) {
    return
  }

  installedLicenseModal.classList.add('hidden')
  installedLicenseModal.setAttribute('aria-hidden', 'true')
  delete installedLicenseModal.dataset.token
}

function openDeleteLicenseModal(publicLicenseId) {
  if (!deleteLicenseModal || !deleteLicenseModalName || !confirmDeleteLicenseButton) {
    showMessage('Delete confirmation is not available.', 'error')
    return
  }

  const license = findLicenseById(publicLicenseId)

  if (!license?.customerManaged) {
    showMessage('Only licenses created from the customer portal can be deleted.', 'error')
    return
  }

  pendingDeleteLicenseId = publicLicenseId
  deleteLicenseModalName.textContent = `${license.licenseName} (${license.publicId})`
  confirmDeleteLicenseButton.disabled = false

  if (cancelDeleteLicenseButton) {
    cancelDeleteLicenseButton.disabled = false
  }

  deleteLicenseModal.classList.remove('hidden')
  deleteLicenseModal.setAttribute('aria-hidden', 'false')
}

function closeDeleteLicenseModal(force = false) {
  if (!deleteLicenseModal) {
    return
  }

  if (!force && confirmDeleteLicenseButton?.disabled) {
    return
  }

  deleteLicenseModal.classList.add('hidden')
  deleteLicenseModal.setAttribute('aria-hidden', 'true')
  pendingDeleteLicenseId = null
}

function openInstalledLicenseModal(publicLicenseId) {
  if (!installedLicenseModal || !installedLicenseModalValue || !installedLicenseModalTitle) {
    return
  }

  const license = findLicenseById(publicLicenseId)

  if (!license?.installedLicense) {
    showMessage('Installed license token is not available for this record.', 'error')
    return
  }

  installedLicenseModalTitle.textContent = `${license.licenseName} - ${license.publicId}`
  installedLicenseModalValue.textContent = license.installedLicense
  installedLicenseModal.dataset.token = license.installedLicense
  installedLicenseModal.classList.remove('hidden')
  installedLicenseModal.setAttribute('aria-hidden', 'false')
}

async function copyInstalledLicenseToken() {
  if (!installedLicenseModal?.dataset.token) {
    return
  }

  await navigator.clipboard.writeText(installedLicenseModal.dataset.token)
  showMessage('Installed license token copied to clipboard.', 'success')
}

function getDownloadFileName(contentDisposition, fallbackName) {
  if (!contentDisposition) {
    return fallbackName
  }

  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition)

  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1])
  }

  const plainMatch = /filename="?([^";]+)"?/i.exec(contentDisposition)
  return plainMatch?.[1] || fallbackName
}

function triggerFileDownload(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()

  window.setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 0)
}

async function downloadOfflineLicense(publicLicenseId, form) {
  const license = findLicenseById(publicLicenseId)

  if (!license) {
    throw new Error('License record could not be found.')
  }

  const formData = new FormData(form)
  const deviceId = String(formData.get('deviceId') || '').trim()

  if (!deviceId) {
    throw new Error('Device ID is required to download the offline license file.')
  }

  const params = new URLSearchParams({ deviceId })

  const response = await fetch(`/api/license/download/${encodeURIComponent(publicLicenseId)}?${params.toString()}`, {
    method: 'GET',
    credentials: 'same-origin',
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  const fallbackName = `${(license.licenseName || 'SQL-Performance-Intelligence-License').replace(/[^A-Za-z0-9_-]+/g, '-')}-${publicLicenseId}.lic`
  const fileName = getDownloadFileName(response.headers.get('Content-Disposition'), fallbackName)
  const blob = await response.blob()
  triggerFileDownload(blob, fileName)

  try {
    const current = await loadCurrentCustomer()
    renderLicenses(current.licenses)
  } catch (_error) {
    // Keep the successful download path intact even if the follow-up refresh fails.
  }

  showMessage(
    `${license.licenseName} .lic downloaded. Import it in SQL Performance Intelligence™ from Settings > License > Import .lic.`,
    'success',
  )
}

async function confirmDeleteLicense() {
  if (!pendingDeleteLicenseId || !confirmDeleteLicenseButton) {
    return
  }

  hideMessage()
  confirmDeleteLicenseButton.disabled = true

  if (cancelDeleteLicenseButton) {
    cancelDeleteLicenseButton.disabled = true
  }

  try {
    const payload = await requestJson(`/api/auth/licenses/${encodeURIComponent(pendingDeleteLicenseId)}`, {
      method: 'DELETE',
    })

    renderLicenses(payload.licenses)
    closeDeleteLicenseModal(true)
    showMessage(payload.message, 'success')
  } catch (error) {
    showMessage(error.message, 'error')
    confirmDeleteLicenseButton.disabled = false

    if (cancelDeleteLicenseButton) {
      cancelDeleteLicenseButton.disabled = false
    }
  }
}

if (registerForm) {
  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    hideMessage()

    try {
      const payload = await requestJson('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(readForm(registerForm)),
      })

      showMessage(payload.message, 'success')
      registerForm.reset()
    } catch (error) {
      showMessage(error.message, 'error')
    }
  })
}

if (activateForm) {
  activateForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    hideMessage()

    try {
      const payload = await requestJson('/api/auth/activate', {
        method: 'POST',
        body: JSON.stringify(readForm(activateForm)),
      })

      showMessage(payload.message, 'success')
      activateForm.reset()
    } catch (error) {
      showMessage(error.message, 'error')
    }
  })
}

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    hideMessage()

    try {
      await requestJson('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(readForm(loginForm)),
      })

      loginForm.reset()
      window.location.href = '/account'
    } catch (error) {
      showMessage(error.message, 'error')
    }
  })
}

if (logoutButton) {
  logoutButton.addEventListener('click', async () => {
    hideMessage()

    try {
      const payload = await requestJson('/api/auth/logout', {
        method: 'POST',
      })

      showMessage(payload.message, 'success')
      window.location.href = '/'
    } catch (error) {
      showMessage(error.message, 'error')
    }
  })
}

document.addEventListener('click', (event) => {
  const target = event.target

  if (!(target instanceof Element)) {
    return
  }

  const detailButton = target.closest('[data-detail-license]')
  if (detailButton instanceof HTMLElement) {
    openLicenseDetailModal(detailButton.dataset.detailLicense)
    return
  }

  const closeDetailButton = target.closest('[data-close-license-detail]')
  if (closeDetailButton) {
    closeLicenseDetailModal()
    return
  }

  const openButton = target.closest('[data-open-installed-license]')

  if (openButton instanceof HTMLElement) {
    openInstalledLicenseModal(openButton.dataset.openInstalledLicense)
    return
  }

  const deleteButton = target.closest('[data-delete-license]')

  if (deleteButton instanceof HTMLElement) {
    openDeleteLicenseModal(deleteButton.dataset.deleteLicense)
    return
  }

  const closeButton = target.closest('[data-close-installed-license]')

  if (closeButton) {
    closeInstalledLicenseModal()
    return
  }

  const closeDeleteButton = target.closest('[data-close-delete-license-modal]')

  if (closeDeleteButton) {
    closeDeleteLicenseModal()
  }
})

document.addEventListener('submit', (event) => {
  const target = event.target

  if (!(target instanceof HTMLFormElement)) {
    return
  }

  if (!target.matches('[data-license-download-form]')) {
    return
  }

  event.preventDefault()
  hideMessage()

  const submitButton = target.querySelector('button[type="submit"]')
  const originalLabel = submitButton?.textContent || 'Download .lic'

  if (submitButton) {
    submitButton.disabled = true
    submitButton.textContent = 'Downloading...'
  }

  downloadOfflineLicense(target.dataset.licenseDownloadForm, target)
    .catch((error) => {
      showMessage(error.message, 'error')
    })
    .finally(() => {
      if (submitButton) {
        submitButton.disabled = false
        submitButton.textContent = originalLabel
      }
    })
})

if (closeLicenseDetailModalButton) {
  closeLicenseDetailModalButton.addEventListener('click', () => {
    closeLicenseDetailModal()
  })
}

if (closeInstalledLicenseModalButton) {
  closeInstalledLicenseModalButton.addEventListener('click', () => {
    closeInstalledLicenseModal()
  })
}

if (confirmDeleteLicenseButton) {
  confirmDeleteLicenseButton.addEventListener('click', () => {
    confirmDeleteLicense().catch((error) => {
      showMessage(error.message, 'error')
    })
  })
}

if (copyInstalledLicenseButton) {
  copyInstalledLicenseButton.addEventListener('click', () => {
    copyInstalledLicenseToken().catch(() => {
      showMessage('Installed license token could not be copied.', 'error')
    })
  })
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeLicenseDetailModal()
    closeInstalledLicenseModal()
    closeDeleteLicenseModal()
  }
})

if (passwordForm) {
  passwordForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    hideMessage()

    try {
      const payload = await requestJson('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(readForm(passwordForm)),
      })

      showMessage(payload.message, 'success')
      passwordForm.reset()
    } catch (error) {
      showMessage(error.message, 'error')
    }
  })
}

if (activationCodeForm) {
  if (activationServerUrl && !activationServerUrl.value) {
    activationServerUrl.value = defaultLicenseServerUrl()
  }

  if (activationLicenseId) {
    activationLicenseId.addEventListener('change', () => {
      const selected = findLicenseById(activationLicenseId.value)
      const licenseNameInput = activationCodeForm.elements.namedItem('licenseName')

      if (selected && licenseNameInput instanceof HTMLInputElement) {
        licenseNameInput.value = selected.licenseName || 'Desktop License'
      }

      if (selected && activationServerUrl) {
        activationServerUrl.value = selected.serverUrl || defaultLicenseServerUrl()
      }

      if (!selected && activationServerUrl && !activationServerUrl.value) {
        activationServerUrl.value = defaultLicenseServerUrl()
      }
    })
  }

  activationCodeForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    hideMessage()
    renderGeneratedActivationCode(null)

    const formPayload = readForm(activationCodeForm)
    formPayload.createNewLicense = !formPayload.licenseId

    try {
      const payload = await requestJson('/api/auth/license/activation-code', {
        method: 'POST',
        body: JSON.stringify(formPayload),
      })

      renderGeneratedActivationCode(payload)
      showMessage(payload.message, 'success')

      const current = await loadCurrentCustomer()
      renderLicenses(current.licenses)
    } catch (error) {
      showMessage(error.message, 'error')
    }
  })
}

if (accountPageRoot) {
  loadCurrentCustomer()
    .then((payload) => {
      if (!payload.customer) {
        window.location.href = '/'
        return
      }

      renderProfile(payload.customer)
      renderLicenses(payload.licenses)

      if (activationServerUrl && !activationServerUrl.value) {
        activationServerUrl.value = defaultLicenseServerUrl()
      }
    })
    .catch(() => {
      window.location.href = '/'
    })
}

if (loginForm && !accountPageRoot) {
  loadCurrentCustomer()
    .then((payload) => {
      if (payload.customer) {
        window.location.href = '/account'
      }
    })
    .catch(() => undefined)
}

// Backend version in footer
const appVersionEl = document.getElementById('appVersion')
if (appVersionEl) {
  fetch('/api/version', { credentials: 'same-origin' })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data?.version) appVersionEl.textContent = data.version
    })
    .catch(() => {})
}
