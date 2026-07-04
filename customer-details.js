const urlParams = new URLSearchParams(window.location.search);
const clientCode = urlParams.get('code');
let clientName = '';

const STORAGE_KEY = 'asgate_customers_final_v2';
const VISITS_KEY = 'asgate_visits_final_v21';

const contentBody = document.getElementById('contentBody');
const managerTableBody = document.getElementById('managerTableBody');
const toastEl = document.getElementById('toast');
const loaderEl = document.getElementById('loader');

// Escape & safe
function escapeHTML(str) {
  return String(str).replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag]));
}
function safe(v, fallback = '-') {
  const val = v && String(v).trim() ? String(v).trim() : fallback;
  return escapeHTML(val);
}

// Toast
function showToast(msg) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 2500);
}

// Loader
function showLoader() {
  if (loaderEl) loaderEl.style.display = 'block';
}
function hideLoader() {
  if (loaderEl) loaderEl.style.display = 'none';
}

// Back
function goBackAndFocus() {
  if (clientCode) sessionStorage.setItem('last_viewed_client_code', clientCode);
  window.location.href = 'customers.html';
}

// Date
function getTodayDateFormatted() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

// Load client
function loadClientData() {
  if (!clientCode) return;
  showLoader();

  const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const client = data.find(c => c.code === clientCode);
  hideLoader();
  if (!client) return;

  clientName = client.comp || '';
  document.title = `${safe(client.comp, 'تفاصيل العميل')} | ASGate`;

  document.getElementById('c-name').innerText = safe(client.comp, 'غير محدد');
  document.getElementById('c-cr1').innerText = safe(client.cr1 || client.cr || client.record, '0000000');
  document.getElementById('c-cr2').innerText = safe(client.cr2, 'غير محدد');
  document.getElementById('c-city').innerText = safe(client.city || client.address, 'غير محدد');
  document.getElementById('c-district').innerText = safe(client.district, 'غير محدد');
  document.getElementById('c-source').innerText = safe(client.classification || client.source, 'غير محدد');
  document.getElementById('c-owner').innerText = safe(client.owner, 'غير محدد');
}

// Tabs
function renderEmptyMessage(message) {
  contentBody.innerHTML = `
    <tr>
      <td colspan="4" style="text-align:center;padding:32px;color:#94a3b8;font-size:14px;">
        ${message}
      </td>
    </tr>`;
}

function openTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

  if (tab === 'o-history') {
    document.getElementById('btn-o').classList.add('active');
    renderEmptyMessage('لا توجد طلبات سابقة مسجلة لهذا العميل حتى الآن.');
  } else if (tab === 'attachments') {
    document.getElementById('btn-a').classList.add('active');
    renderEmptyMessage('لا توجد ملفات مرفقة. يمكنك رفع الملفات بصيغ PDF أو Excel لاحقاً.');
  } else if (tab === 'v-history') {
    document.getElementById('btn-v').classList.add('active');
    loadVisits();
  }
}
// Visits
function loadVisits() {
  showLoader();

  const visits = JSON.parse(localStorage.getItem(VISITS_KEY) || '[]')
    .filter(v => v.comp === clientName)
    .sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));

  hideLoader();

  if (!visits.length) {
    renderEmptyMessage('لا توجد سجلات زيارات مسجلة لهذا العميل حالياً.');
    return;
  }

  contentBody.innerHTML = visits.map(v => `
    <tr>
      <td>${safe(v.visitDate)}</td>
      <td>${safe(v.address || v.location || 'غير محدد')}</td>
      <td>
        <span style="background:#e0f2fe;color:#0369a1;padding:4px 8px;border-radius:4px;font-size:12px;">
          ${safe(v.status || 'مكتملة')}
        </span>
      </td>
      <td>${safe(v.notes || '-')}</td>
    </tr>
  `).join('');
}

// Managers
function getManagersKey() {
  return `asgate_customer_managers_${clientCode}`;
}

function loadManagersData() {
  if (!managerTableBody) return;

  const managers = JSON.parse(localStorage.getItem(getManagersKey()) || '[]');

  if (!managers.length) {
    managerTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;padding:32px;color:#94a3b8;font-size:14px;">
          لا توجد بيانات متابعة. اضغط على إضافة مسؤول للبدء.
        </td>
      </tr>`;
    return;
  }

  managerTableBody.innerHTML = managers.map((m, index) => `
    <tr>
      <td><input type="text" class="edit-input" placeholder="الاسم" value="${safe(m.name, '')}" data-index="${index}" data-field="name"></td>
      <td><input type="text" class="edit-input" placeholder="05XXXXXXXX" value="${safe(m.mob, '')}" data-index="${index}" data-field="mob"></td>
      <td><input type="email" class="edit-input" placeholder="email@example.com" value="${safe(m.email, '')}" data-index="${index}" data-field="email"></td>

      <td style="text-align:center;">
        <input type="radio" name="main_contact" ${m.main ? 'checked' : ''} 
               data-index="${index}" class="main-radio"
               style="cursor:pointer; width:16px; height:16px; accent-color:var(--primary);">
      </td>

      <td style="color:#64748b;">${safe(m.date || getTodayDateFormatted())}</td>

      <td>
        <button class="btn btn-danger" data-remove="${index}">حذف</button>
      </td>
    </tr>
  `).join('');
}

function updateManager(index, field, value) {
  const managers = JSON.parse(localStorage.getItem(getManagersKey()) || '[]');
  if (managers[index]) {
    managers[index][field] = value;
    localStorage.setItem(getManagersKey(), JSON.stringify(managers));
  }
}

function setMainManager(index) {
  const managers = JSON.parse(localStorage.getItem(getManagersKey()) || '[]');
  managers.forEach((m, i) => m.main = (i === Number(index)));
  localStorage.setItem(getManagersKey(), JSON.stringify(managers));
}

function addNewManagerRow() {
  const managers = JSON.parse(localStorage.getItem(getManagersKey()) || '[]');

  managers.push({
    name: '',
    mob: '',
    email: '',
    main: managers.length === 0,
    date: getTodayDateFormatted()
  });

  localStorage.setItem(getManagersKey(), JSON.stringify(managers));
  loadManagersData();
  showToast('تم إضافة مسؤول جديد');
}

function removeManagerRow(index) {
  if (!confirm('هل أنت متأكد من حذف هذا المسؤول؟')) return;

  const managers = JSON.parse(localStorage.getItem(getManagersKey()) || '[]');
  managers.splice(index, 1);

  localStorage.setItem(getManagersKey(), JSON.stringify(managers));
  loadManagersData();
  showToast('تم حذف المسؤول');
}
// Events
document.addEventListener('DOMContentLoaded', () => {
  // تحميل بيانات العميل
  loadClientData();

  // تحميل فريق المتابعة
  loadManagersData();

  // فتح التبويب الافتراضي
  openTab('o-history');

  // زر الرجوع
  const backBtn = document.getElementById('btn-back');
  if (backBtn) backBtn.addEventListener('click', goBackAndFocus);

  // أزرار التبويبات
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => openTab(btn.dataset.tab));
  });

  // زر إضافة مسؤول
  const addManagerBtn = document.getElementById('btn-add-manager');
  if (addManagerBtn) addManagerBtn.addEventListener('click', addNewManagerRow);
});

// حفظ التعديلات مباشرة أثناء الكتابة
document.addEventListener('input', e => {
  if (e.target.classList.contains('edit-input')) {
    const index = e.target.dataset.index;
    const field = e.target.dataset.field;
    updateManager(index, field, e.target.value);
    showToast('تم حفظ التعديل');
  }
});

// تغيير المسؤول الرئيسي
document.addEventListener('change', e => {
  if (e.target.classList.contains('main-radio')) {
    const index = e.target.dataset.index;
    setMainManager(index);
    showToast('تم تعيين المسؤول الرئيسي');
  }
});

// حذف مسؤول
document.addEventListener('click', e => {
  if (e.target.dataset.remove) {
    removeManagerRow(Number(e.target.dataset.remove));
  }
});
