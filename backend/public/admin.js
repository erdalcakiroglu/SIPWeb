const adminMessageBox = document.getElementById('message')
const adminLoginForm = document.getElementById('adminLoginForm')
const adminIdentity = document.getElementById('adminIdentity')
const adminRefreshButton = document.getElementById('adminRefreshButton')
const adminLogoutButton = document.getElementById('adminLogoutButton')
const customerSearchInput = document.getElementById('customerSearchInput')
const customerTableBody = document.getElementById('customerTableBody')
const customerDetailSection = document.getElementById('customerDetailSection')
const customerDetailTitle = document.getElementById('customerDetailTitle')
const customerDetailSubtitle = document.getElementById('customerDetailSubtitle')
const customerProfileCardTitle = document.getElementById('customerProfileCardTitle')
const customerProfileDetail = document.getElementById('customerProfileDetail')
const customerLicenseSnapshot = document.getElementById('customerLicenseSnapshot')
const activationCodeTableBody = document.getElementById('activationCodeTableBody')
const licenseEventList = document.getElementById('licenseEventList')
const editCustomerButton = document.getElementById('editCustomerButton')
const cancelEditCustomerButton = document.getElementById('cancelEditCustomerButton')
const saveCustomerButton = document.getElementById('saveCustomerButton')
const deleteCustomerButton = document.getElementById('deleteCustomerButton')
const deleteCustomerModal = document.getElementById('deleteCustomerModal')
const deleteCustomerModalEmail = document.getElementById('deleteCustomerModalEmail')
const cancelDeleteCustomerButton = document.getElementById('cancelDeleteCustomerButton')
const confirmDeleteCustomerButton = document.getElementById('confirmDeleteCustomerButton')
const metricCustomers = document.getElementById('metricCustomers')
const metricActiveCustomers = document.getElementById('metricActiveCustomers')
const metricLicenses = document.getElementById('metricLicenses')
const metricActiveLicenses = document.getElementById('metricActiveLicenses')
const metricActivationCodes = document.getElementById('metricActivationCodes')
const metricDevices = document.getElementById('metricDevices')

let dashboardCustomers = []
let selectedCustomerId = null
let selectedCustomerDetail = null
let customerDetailMode = 'view'
let pendingDeleteCustomer = null

function showMessage(text, tone = 'success') {
  if (!adminMessageBox) {
    return
  }

  adminMessageBox.textContent = text
  adminMessageBox.className = `message ${tone}`
}

function hideMessage() {
  if (!adminMessageBox) {
    return
  }

  adminMessageBox.textContent = ''
  adminMessageBox.className = 'message hidden'
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
    const error = new Error(payload.message || 'Request failed.')
    error.status = response.status
    throw error
  }

  return payload
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

function formatField(value) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  return String(value)
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function buildStatusBadge(status, isPositive) {
  const tone = isPositive ? 'success' : 'neutral'
  return `<span class="admin-chip ${tone}">${escapeHtml(status)}</span>`
}

function scrollCustomerDetailIntoView() {
  if (!customerDetailSection) {
    return
  }

  customerDetailSection.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

function updateDetailActionState() {
  const hasSelection = Boolean(selectedCustomerDetail)
  const isEditMode = hasSelection && customerDetailMode === 'edit'

  if (customerProfileCardTitle) {
    customerProfileCardTitle.textContent = isEditMode ? 'Edit Customer' : 'Customer Profile'
  }

  if (editCustomerButton) {
    editCustomerButton.disabled = !hasSelection
    editCustomerButton.classList.toggle('hidden', isEditMode)
  }

  if (cancelEditCustomerButton) {
    cancelEditCustomerButton.disabled = !hasSelection
    cancelEditCustomerButton.classList.toggle('hidden', !isEditMode)
  }

  if (saveCustomerButton) {
    saveCustomerButton.disabled = !hasSelection
    saveCustomerButton.classList.toggle('hidden', !isEditMode)
  }

  if (deleteCustomerButton) {
    deleteCustomerButton.disabled = !hasSelection
  }
}

function resetCustomerDetail() {
  selectedCustomerId = null
  selectedCustomerDetail = null
  customerDetailMode = 'view'

  if (customerDetailSection) {
    customerDetailSection.classList.add('hidden')
  }

  if (customerDetailTitle) {
    customerDetailTitle.textContent = 'Customer Detail'
  }

  if (customerDetailSubtitle) {
    customerDetailSubtitle.textContent = 'Select a customer from the table above.'
  }

  if (customerProfileDetail) {
    customerProfileDetail.innerHTML = ''
  }

  if (customerLicenseSnapshot) {
    customerLicenseSnapshot.innerHTML = '<div class="empty-state">No license records found for this customer.</div>'
  }

  if (activationCodeTableBody) {
    activationCodeTableBody.innerHTML =
      '<tr><td colspan="6" class="table-empty">No activation code history for this customer.</td></tr>'
  }

  if (licenseEventList) {
    licenseEventList.innerHTML = '<div class="empty-state">No recent license events for this customer.</div>'
  }

  if (deleteCustomerButton) {
    deleteCustomerButton.dataset.customerId = ''
    deleteCustomerButton.dataset.customerEmail = ''
  }

  updateDetailActionState()
}

function syncDashboardCustomerSummary(customer) {
  const existing = dashboardCustomers.find((item) => item.id === customer.id)

  if (!existing) {
    return
  }

  existing.name = customer.name
  existing.surname = customer.surname
  existing.fullName = `${customer.name} ${customer.surname}`.trim()
  existing.job = customer.job
  existing.email = customer.email
  existing.phone = customer.phone
  existing.companyName = customer.companyName
  existing.isActive = customer.isActive
  existing.activatedAt = customer.activatedAt
}

function renderSummary(summary) {
  if (!summary) {
    return
  }

  metricCustomers.textContent = summary.totalCustomers
  metricActiveCustomers.textContent = summary.activeCustomers
  metricLicenses.textContent = summary.totalLicenses
  metricActiveLicenses.textContent = summary.activeLicenses
  metricActivationCodes.textContent = summary.activeActivationCodes
  metricDevices.textContent = summary.activeDevices
}

function matchesCustomerFilter(customer, filterValue) {
  if (!filterValue) {
    return true
  }

  const haystack = [customer.fullName, customer.email, customer.companyName, customer.job]
    .join(' ')
    .toLowerCase()

  return haystack.includes(filterValue)
}

function renderCustomerTable() {
  if (!customerTableBody) {
    return
  }

  const filterValue = customerSearchInput ? customerSearchInput.value.trim().toLowerCase() : ''
  const visibleCustomers = dashboardCustomers.filter((customer) => matchesCustomerFilter(customer, filterValue))

  if (visibleCustomers.length === 0) {
    customerTableBody.innerHTML = '<tr><td colspan="7" class="table-empty">No customers found.</td></tr>'
    return
  }

  customerTableBody.innerHTML = visibleCustomers
    .map((customer) => {
      const statusLabel = customer.isActive ? 'Active' : 'Pending'
      const rowClass = customer.id === selectedCustomerId ? 'selected' : ''

      return `
        <tr class="${rowClass}" data-customer-id="${customer.id}">
          <td>
            <strong>${escapeHtml(customer.fullName)}</strong>
            <div class="table-subtitle">${escapeHtml(customer.job)}</div>
          </td>
          <td>${escapeHtml(customer.email)}</td>
          <td>${escapeHtml(customer.companyName)}</td>
          <td>${buildStatusBadge(statusLabel, customer.isActive)}</td>
          <td>${escapeHtml(`${customer.activeLicenseCount}/${customer.licenseCount}`)}</td>
          <td>${escapeHtml(formatDate(customer.createdAt))}</td>
          <td>
            <div class="admin-row-actions">
              <button class="secondary-button secondary-button-compact" type="button" data-view-customer-id="${customer.id}">
                View
              </button>
              <button class="secondary-button secondary-button-compact" type="button" data-edit-customer-id="${customer.id}">
                Edit
              </button>
              <button
                class="danger-button danger-button-compact"
                type="button"
                data-delete-customer-id="${customer.id}"
                data-delete-customer-email="${escapeHtml(customer.email)}"
              >
                Delete
              </button>
            </div>
          </td>
        </tr>
      `
    })
    .join('')
}

function buildLicenseCards(licenses) {
  if (!Array.isArray(licenses) || licenses.length === 0) {
    return '<div class="empty-state">No license records found for this customer.</div>'
  }

  return licenses
    .map((license) => {
      const activeDevices = Array.isArray(license.devices)
        ? license.devices.filter((device) => device.status === 'active').length
        : 0

      return `
        <article class="license-card admin-license-card admin-compact-license">
          <div class="admin-compact-license-header">
            <div>
              <h3 class="license-title">${escapeHtml(license.licenseName)}</h3>
              <div class="table-subtitle">${escapeHtml(formatField(license.publicId))} • ${escapeHtml(formatField(license.licenseType))}</div>
            </div>
            <span class="license-chip">${escapeHtml(license.status)}</span>
          </div>
          <div class="admin-compact-license-meta">
            <div class="admin-compact-license-meta-item">
              <span>Allowed Devices</span>
              <strong>${escapeHtml(formatField(license.allowedDevices))}</strong>
            </div>
            <div class="admin-compact-license-meta-item">
              <span>Active Devices</span>
              <strong>${escapeHtml(formatField(activeDevices))}</strong>
            </div>
            <div class="admin-compact-license-meta-item">
              <span>Expires</span>
              <strong>${escapeHtml(formatDate(license.expiresAt))}</strong>
            </div>
            <div class="admin-compact-license-meta-item">
              <span>Last Validated</span>
              <strong>${escapeHtml(formatDate(license.lastValidatedAt))}</strong>
            </div>
            <div class="admin-compact-license-meta-item">
              <span>Activation Code</span>
              <strong class="license-code">${escapeHtml(formatField(license.activationCode))}</strong>
            </div>
            <div class="admin-compact-license-meta-item">
              <span>Device ID</span>
              <strong class="license-code">${escapeHtml(formatField(license.deviceId))}</strong>
            </div>
            <div class="admin-compact-license-meta-item">
              <span>Server URL</span>
              <strong>${escapeHtml(formatField(license.serverUrl))}</strong>
            </div>
            <div class="admin-compact-license-meta-item">
              <span>Updated</span>
              <strong>${escapeHtml(formatDate(license.updatedAt))}</strong>
            </div>
          </div>
        </article>
      `
    })
    .join('')
}

function renderCustomerProfile(customer) {
  if (!customerProfileDetail) {
    return
  }

  customerProfileDetail.innerHTML = `
    <div class="detail-field"><span>Name</span><strong>${escapeHtml(customer.name)}</strong></div>
    <div class="detail-field"><span>Surname</span><strong>${escapeHtml(customer.surname)}</strong></div>
    <div class="detail-field"><span>Job</span><strong>${escapeHtml(customer.job)}</strong></div>
    <div class="detail-field"><span>Email</span><strong>${escapeHtml(customer.email)}</strong></div>
    <div class="detail-field"><span>Phone</span><strong>${escapeHtml(customer.phone)}</strong></div>
    <div class="detail-field"><span>Company</span><strong>${escapeHtml(customer.companyName)}</strong></div>
    <div class="detail-field"><span>Status</span><strong>${escapeHtml(customer.isActive ? 'Active' : 'Pending')}</strong></div>
    <div class="detail-field"><span>Created</span><strong>${escapeHtml(formatDate(customer.createdAt))}</strong></div>
    <div class="detail-field"><span>Activated</span><strong>${escapeHtml(formatDate(customer.activatedAt))}</strong></div>
  `
}

function renderCustomerEditForm(customer) {
  if (!customerProfileDetail) {
    return
  }

  customerProfileDetail.innerHTML = `
    <form id="adminCustomerEditForm" class="form detail-form">
      <div class="two-column">
        <label>
          <span class="table-subtitle">Name</span>
          <input name="name" type="text" value="${escapeHtml(customer.name)}" required />
        </label>
        <label>
          <span class="table-subtitle">Surname</span>
          <input name="surname" type="text" value="${escapeHtml(customer.surname)}" required />
        </label>
        <label>
          <span class="table-subtitle">Job</span>
          <input name="job" type="text" value="${escapeHtml(customer.job)}" required />
        </label>
        <label>
          <span class="table-subtitle">Company Name</span>
          <input name="companyName" type="text" value="${escapeHtml(customer.companyName)}" required />
        </label>
        <label>
          <span class="table-subtitle">Email Address</span>
          <input name="email" type="email" value="${escapeHtml(customer.email)}" required />
        </label>
        <label>
          <span class="table-subtitle">Phone</span>
          <input name="phone" type="tel" value="${escapeHtml(customer.phone)}" required />
        </label>
      </div>
      <p class="muted detail-form-note">Email address and phone number are validated before saving.</p>
    </form>
  `
}

function renderCustomerProfileSection() {
  if (!selectedCustomerDetail) {
    return
  }

  if (customerDetailMode === 'edit') {
    renderCustomerEditForm(selectedCustomerDetail.customer)
    return
  }

  renderCustomerProfile(selectedCustomerDetail.customer)
}

function renderActivationCodes(records) {
  if (!activationCodeTableBody) {
    return
  }

  if (!Array.isArray(records) || records.length === 0) {
    activationCodeTableBody.innerHTML =
      '<tr><td colspan="6" class="table-empty">No activation code history for this customer.</td></tr>'
    return
  }

  activationCodeTableBody.innerHTML = records
    .map(
      (record) => `
        <tr>
          <td class="license-code">${escapeHtml(record.code)}</td>
          <td>${escapeHtml(`${record.licensePublicId} - ${record.licenseName}`)}</td>
          <td>${buildStatusBadge(record.status, record.status === 'active')}</td>
          <td class="license-code">${escapeHtml(formatField(record.deviceId))}</td>
          <td>${escapeHtml(formatDate(record.issuedAt))}</td>
          <td>${escapeHtml(formatDate(record.expiresAt))}</td>
        </tr>
      `,
    )
    .join('')
}

function renderEvents(events) {
  if (!licenseEventList) {
    return
  }

  if (!Array.isArray(events) || events.length === 0) {
    licenseEventList.innerHTML = '<div class="empty-state">No recent license events for this customer.</div>'
    return
  }

  licenseEventList.innerHTML = events
    .map((event) => {
      const payloadText = event.payload ? JSON.stringify(event.payload, null, 2) : 'No payload'
      const licenseLabel =
        event.licensePublicId && event.licenseName
          ? `${event.licensePublicId} - ${event.licenseName}`
          : 'No license record'

      return `
        <article class="event-card">
          <div class="section-heading">
            <div>
              <strong>${escapeHtml(event.eventType)}</strong>
              <div class="table-subtitle">${escapeHtml(licenseLabel)}</div>
            </div>
            <span class="table-subtitle">${escapeHtml(formatDate(event.createdAt))}</span>
          </div>
          <div class="table-subtitle">Device ID: ${escapeHtml(formatField(event.deviceId))}</div>
          <pre class="json-block">${escapeHtml(payloadText)}</pre>
        </article>
      `
    })
    .join('')
}

function renderCustomerDetail(detail) {
  if (!customerDetailSection || !customerDetailTitle || !customerDetailSubtitle || !customerLicenseSnapshot) {
    return
  }

  selectedCustomerDetail = detail
  customerDetailSection.classList.remove('hidden')
  customerDetailTitle.textContent = detail.customer.email
  customerDetailSubtitle.textContent = `${detail.customer.name} ${detail.customer.surname} • ${detail.customer.companyName}`
  if (deleteCustomerButton) {
    deleteCustomerButton.dataset.customerId = String(detail.customer.id)
    deleteCustomerButton.dataset.customerEmail = detail.customer.email
  }
  updateDetailActionState()
  renderCustomerProfileSection()
  customerLicenseSnapshot.innerHTML = buildLicenseCards(detail.licenses)
  renderActivationCodes(detail.activationCodes)
  renderEvents(detail.events)
}

async function loadCustomerDetail(customerId, mode = 'view') {
  selectedCustomerId = customerId
  customerDetailMode = mode
  renderCustomerTable()

  try {
    const payload = await requestJson(`/api/admin/customers/${customerId}`)
    renderCustomerDetail(payload)
    scrollCustomerDetailIntoView()
  } catch (error) {
    showMessage(error.message, 'error')
  }
}

function setCustomerDetailMode(mode) {
  if (!selectedCustomerDetail) {
    showMessage('Select a customer first.', 'error')
    return
  }

  customerDetailMode = mode === 'edit' ? 'edit' : 'view'
  updateDetailActionState()
  renderCustomerProfileSection()
  scrollCustomerDetailIntoView()
}

async function saveCustomerChanges() {
  if (!selectedCustomerDetail || !saveCustomerButton) {
    showMessage('Select a customer before saving.', 'error')
    return
  }

  const editForm = document.getElementById('adminCustomerEditForm')

  if (!(editForm instanceof HTMLFormElement)) {
    showMessage('Edit form is not ready yet.', 'error')
    return
  }

  hideMessage()
  saveCustomerButton.disabled = true
  if (cancelEditCustomerButton) {
    cancelEditCustomerButton.disabled = true
  }
  if (editCustomerButton) {
    editCustomerButton.disabled = true
  }

  try {
    const payload = await requestJson(`/api/admin/customers/${selectedCustomerDetail.customer.id}`, {
      method: 'PATCH',
      body: JSON.stringify(readForm(editForm)),
    })

    syncDashboardCustomerSummary(payload.detail.customer)
    selectedCustomerId = payload.detail.customer.id
    customerDetailMode = 'view'
    renderCustomerTable()
    renderCustomerDetail(payload.detail)
    showMessage(payload.message, 'success')
  } catch (error) {
    showMessage(error.message, 'error')
    saveCustomerButton.disabled = false
    if (cancelEditCustomerButton) {
      cancelEditCustomerButton.disabled = false
    }
    if (editCustomerButton) {
      editCustomerButton.disabled = false
    }
  }
}

function openDeleteCustomerModal(customerId, customerEmail) {
  if (!deleteCustomerModal || !deleteCustomerModalEmail || !confirmDeleteCustomerButton) {
    showMessage('Delete confirmation is not available.', 'error')
    return
  }

  pendingDeleteCustomer = {
    customerId,
    customerEmail,
  }

  deleteCustomerModalEmail.textContent = customerEmail
  confirmDeleteCustomerButton.disabled = false
  if (cancelDeleteCustomerButton) {
    cancelDeleteCustomerButton.disabled = false
  }
  deleteCustomerModal.classList.remove('hidden')
  deleteCustomerModal.setAttribute('aria-hidden', 'false')
}

function closeDeleteCustomerModal(force = false) {
  if (!deleteCustomerModal) {
    return
  }

  if (!force && confirmDeleteCustomerButton?.disabled) {
    return
  }

  deleteCustomerModal.classList.add('hidden')
  deleteCustomerModal.setAttribute('aria-hidden', 'true')
  pendingDeleteCustomer = null
}

async function confirmDeleteCustomer() {
  if (!pendingDeleteCustomer || !confirmDeleteCustomerButton) {
    return
  }

  const { customerId } = pendingDeleteCustomer

  hideMessage()
  confirmDeleteCustomerButton.disabled = true
  if (cancelDeleteCustomerButton) {
    cancelDeleteCustomerButton.disabled = true
  }

  if (deleteCustomerButton && selectedCustomerId === customerId) {
    deleteCustomerButton.disabled = true
  }

  try {
    const payload = await requestJson(`/api/admin/customers/${customerId}`, {
      method: 'DELETE',
    })

    closeDeleteCustomerModal(true)

    if (selectedCustomerId === customerId) {
      resetCustomerDetail()
    }

    showMessage(payload.message, 'success')
    await loadDashboard()
  } catch (error) {
    showMessage(error.message, 'error')

    if (deleteCustomerButton && selectedCustomerId === customerId) {
      deleteCustomerButton.disabled = false
    }

    confirmDeleteCustomerButton.disabled = false
    if (cancelDeleteCustomerButton) {
      cancelDeleteCustomerButton.disabled = false
    }
  }
}

async function loadDashboard() {
  hideMessage()

  try {
    const me = await requestJson('/api/admin/me')

    if (!me.authenticated) {
      window.location.href = '/admin/login'
      return
    }

    if (adminIdentity) {
      adminIdentity.textContent = me.admin?.email || '-'
    }

    const payload = await requestJson('/api/admin/dashboard')
    dashboardCustomers = payload.customers || []
    renderSummary(payload.summary)

    if (!dashboardCustomers.some((customer) => customer.id === selectedCustomerId)) {
      resetCustomerDetail()
    }

    renderCustomerTable()

    if (selectedCustomerId) {
      await loadCustomerDetail(selectedCustomerId, customerDetailMode)
    } else {
      resetCustomerDetail()
    }
  } catch (error) {
    if (error.status === 401) {
      window.location.href = '/admin/login'
      return
    }

    showMessage(error.message, 'error')
  }
}

if (adminLoginForm) {
  requestJson('/api/admin/me')
    .then((payload) => {
      if (payload.authenticated) {
        window.location.href = '/admin'
      }
    })
    .catch(() => undefined)

  adminLoginForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    hideMessage()

    try {
      await requestJson('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify(readForm(adminLoginForm)),
      })

      adminLoginForm.reset()
      window.location.href = '/admin'
    } catch (error) {
      showMessage(error.message, 'error')
    }
  })
}

if (customerSearchInput) {
  customerSearchInput.addEventListener('input', () => {
    renderCustomerTable()
  })
}

if (customerTableBody) {
  customerTableBody.addEventListener('click', async (event) => {
    if (!(event.target instanceof Element)) {
      return
    }

    const viewButton = event.target.closest('[data-view-customer-id]')

    if (viewButton instanceof HTMLElement) {
      const customerId = Number.parseInt(viewButton.dataset.viewCustomerId || '', 10)

      if (!Number.isFinite(customerId)) {
        showMessage('Customer details could not be opened.', 'error')
        return
      }

      loadCustomerDetail(customerId, 'view')
      return
    }

    const editButton = event.target.closest('[data-edit-customer-id]')

    if (editButton instanceof HTMLElement) {
      const customerId = Number.parseInt(editButton.dataset.editCustomerId || '', 10)

      if (!Number.isFinite(customerId)) {
        showMessage('Customer edit form could not be opened.', 'error')
        return
      }

      loadCustomerDetail(customerId, 'edit')
      return
    }

    const deleteButton = event.target.closest('[data-delete-customer-id]')

    if (deleteButton instanceof HTMLElement) {
      event.stopPropagation()

      const customerId = Number.parseInt(deleteButton.dataset.deleteCustomerId || '', 10)
      const customerEmail = deleteButton.dataset.deleteCustomerEmail || 'this customer'

      if (!Number.isFinite(customerId)) {
        showMessage('Customer could not be deleted.', 'error')
        return
      }

      openDeleteCustomerModal(customerId, customerEmail)
      return
    }
  })
}

if (adminRefreshButton) {
  adminRefreshButton.addEventListener('click', () => {
    loadDashboard()
  })
}

if (adminLogoutButton) {
  adminLogoutButton.addEventListener('click', async () => {
    hideMessage()

    try {
      await requestJson('/api/admin/logout', {
        method: 'POST',
      })

      window.location.href = '/admin/login'
    } catch (error) {
      showMessage(error.message, 'error')
    }
  })
}

document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) {
    return
  }

  const closeButton = event.target.closest('[data-close-delete-customer-modal]')

  if (closeButton) {
    closeDeleteCustomerModal()
  }
})

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeDeleteCustomerModal()
  }
})

if (deleteCustomerButton) {
  deleteCustomerButton.addEventListener('click', async () => {
    const customerId = Number.parseInt(deleteCustomerButton.dataset.customerId || '', 10)
    const customerEmail = deleteCustomerButton.dataset.customerEmail || 'this customer'

    if (!Number.isFinite(customerId)) {
      showMessage('Select a customer before deleting.', 'error')
      return
    }

    openDeleteCustomerModal(customerId, customerEmail)
  })
}

if (editCustomerButton) {
  editCustomerButton.addEventListener('click', () => {
    setCustomerDetailMode('edit')
  })
}

if (cancelEditCustomerButton) {
  cancelEditCustomerButton.addEventListener('click', () => {
    setCustomerDetailMode('view')
  })
}

if (saveCustomerButton) {
  saveCustomerButton.addEventListener('click', () => {
    saveCustomerChanges().catch(() => {
      showMessage('Customer could not be updated.', 'error')
    })
  })
}

if (confirmDeleteCustomerButton) {
  confirmDeleteCustomerButton.addEventListener('click', () => {
    confirmDeleteCustomer().catch(() => {
      showMessage('Customer could not be deleted.', 'error')
    })
  })
}

if (adminIdentity) {
  resetCustomerDetail()
  loadDashboard()
}

// Backend version in footer
const adminAppVersionEl = document.getElementById('appVersion')
if (adminAppVersionEl) {
  fetch('/api/version', { credentials: 'same-origin' })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data?.version) adminAppVersionEl.textContent = data.version
    })
    .catch(() => {})
}
