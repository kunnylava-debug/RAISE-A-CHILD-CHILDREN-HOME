import * as XLSX from 'xlsx';

/**
 * Helper to trigger a browser file download from a Blob
 */
function triggerDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Converts headers and row data into a UTF-8 BOM CSV string
 */
function arrayToCsv(headers, rows) {
  const escapeCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvRows = [
    headers.map(escapeCell).join(','),
    ...rows.map(row => row.map(escapeCell).join(','))
  ];

  return '\uFEFF' + csvRows.join('\r\n');
}

/**
 * Sorts children array naturally by serial number (SN-CH-001, SN-CH-002, etc.)
 * or by ID ascending so newly incoming children always appear sequentially at the LAST.
 */
export function sortChildrenAscending(children = []) {
  if (!Array.isArray(children)) return [];
  return [...children].sort((a, b) => {
    const matchA = String(a.serial_no || '').match(/\d+/);
    const matchB = String(b.serial_no || '').match(/\d+/);
    const numA = matchA ? parseInt(matchA[0], 10) : (Number(a.id) || 0);
    const numB = matchB ? parseInt(matchB[0], 10) : (Number(b.id) || 0);
    if (numA !== numB) return numA - numB;
    return (Number(a.id) || 0) - (Number(b.id) || 0);
  });
}

/**
 * Sorts staff array naturally by display order (order_num) or ID ascending
 * so newly incoming staff members always appear sequentially at the LAST.
 */
export function sortStaffAscending(staff = []) {
  if (!Array.isArray(staff)) return [];
  return [...staff].sort((a, b) => {
    const oA = Number(a.order_num) || 0;
    const oB = Number(b.order_num) || 0;
    if (oA !== oB) return oA - oB;
    return (Number(a.id) || 0) - (Number(b.id) || 0);
  });
}

/**
 * Downloads live Children Records as Excel (.xlsx) with clean 1..N order
 */
export function exportChildrenToExcel(children = [], isAuthorized = true) {
  const sortedChildren = sortChildrenAscending(children);

  const headers = [
    'S.No',
    'Serial ID',
    'Full Name',
    'Age',
    'Gender',
    'Class / Grade',
    'Admission Date',
    'Guardian / Parent Name',
    'Guardian Phone',
    'Address / Native Place',
    'Medical & Health Notes',
    'Hobbies & Talents',
    'Status'
  ];

  const dataRows = sortedChildren.map((c, idx) => [
    idx + 1,
    c.serial_no || `SN-CH-${String(idx + 1).padStart(3, '0')}`,
    c.name || '',
    c.age || '',
    c.gender || '',
    c.class || '',
    c.admission_date || '',
    isAuthorized ? (c.guardian_name || '') : 'Protected (Staff Only)',
    isAuthorized ? (c.guardian_phone || '') : '••••••••••',
    isAuthorized ? (c.guardian_address || '') : 'Protected',
    isAuthorized ? (c.medical_notes || '') : 'Confidential',
    c.hobbies || '',
    c.is_active === 0 ? 'Inactive' : 'Active in Hostel'
  ]);

  const aoa = [headers, ...dataRows];
  const worksheet = XLSX.utils.aoa_to_sheet(aoa);

  worksheet['!cols'] = [
    { wch: 6 },   // S.No
    { wch: 14 },  // Serial ID
    { wch: 25 },  // Full Name
    { wch: 8 },   // Age
    { wch: 10 },  // Gender
    { wch: 16 },  // Class
    { wch: 16 },  // Admission Date
    { wch: 26 },  // Guardian Name
    { wch: 18 },  // Guardian Phone
    { wch: 32 },  // Address
    { wch: 28 },  // Medical Notes
    { wch: 28 },  // Hobbies
    { wch: 18 }   // Status
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Children Directory');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `RISE_A_CHILD_Children_Records_${dateStr}.xlsx`;
  triggerDownload(blob, filename);

  return { success: true, count: dataRows.length, filename };
}

/**
 * Downloads live Children Records as CSV (.csv) with clean 1..N order
 */
export function exportChildrenToCsv(children = [], isAuthorized = true) {
  const sortedChildren = sortChildrenAscending(children);

  const headers = [
    'S.No',
    'Serial ID',
    'Full Name',
    'Age',
    'Gender',
    'Class / Grade',
    'Admission Date',
    'Guardian / Parent Name',
    'Guardian Phone',
    'Address / Native Place',
    'Medical & Health Notes',
    'Hobbies & Talents',
    'Status'
  ];

  const dataRows = sortedChildren.map((c, idx) => [
    idx + 1,
    c.serial_no || `SN-CH-${String(idx + 1).padStart(3, '0')}`,
    c.name || '',
    c.age || '',
    c.gender || '',
    c.class || '',
    c.admission_date || '',
    isAuthorized ? (c.guardian_name || '') : 'Protected (Staff Only)',
    isAuthorized ? (c.guardian_phone || '') : '••••••••••',
    isAuthorized ? (c.guardian_address || '') : 'Protected',
    isAuthorized ? (c.medical_notes || '') : 'Confidential',
    c.hobbies || '',
    c.is_active === 0 ? 'Inactive' : 'Active in Hostel'
  ]);

  const csvContent = arrayToCsv(headers, dataRows);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `RISE_A_CHILD_Children_Records_${dateStr}.csv`;
  triggerDownload(blob, filename);

  return { success: true, count: dataRows.length, filename };
}

/**
 * Downloads live Staff Directory as Excel (.xlsx) with clean 1..N order
 */
export function exportStaffToExcel(staff = []) {
  const sortedStaff = sortStaffAscending(staff);

  const headers = [
    'S.No',
    'Full Name',
    'Role / Designation',
    'Mobile Number',
    'Email Address',
    'Qualification',
    'Experience',
    'Responsibilities / Description',
    'Display Order'
  ];

  const dataRows = sortedStaff.map((s, idx) => [
    idx + 1,
    s.name || '',
    s.role || '',
    s.mobile || '',
    s.email || '',
    s.qualification || '',
    s.experience || '',
    s.description || '',
    s.order_num || (idx + 1)
  ]);

  const aoa = [headers, ...dataRows];
  const worksheet = XLSX.utils.aoa_to_sheet(aoa);

  worksheet['!cols'] = [
    { wch: 6 },   // S.No
    { wch: 25 },  // Full Name
    { wch: 22 },  // Role
    { wch: 18 },  // Mobile
    { wch: 28 },  // Email
    { wch: 24 },  // Qualification
    { wch: 20 },  // Experience
    { wch: 40 },  // Description
    { wch: 14 }   // Order
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Staff Directory');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `RISE_A_CHILD_Staff_Directory_${dateStr}.xlsx`;
  triggerDownload(blob, filename);

  return { success: true, count: dataRows.length, filename };
}

/**
 * Downloads live Staff Directory as CSV (.csv) with clean 1..N order
 */
export function exportStaffToCsv(staff = []) {
  const sortedStaff = sortStaffAscending(staff);

  const headers = [
    'S.No',
    'Full Name',
    'Role / Designation',
    'Mobile Number',
    'Email Address',
    'Qualification',
    'Experience',
    'Responsibilities / Description',
    'Display Order'
  ];

  const dataRows = sortedStaff.map((s, idx) => [
    idx + 1,
    s.name || '',
    s.role || '',
    s.mobile || '',
    s.email || '',
    s.qualification || '',
    s.experience || '',
    s.description || '',
    s.order_num || (idx + 1)
  ]);

  const csvContent = arrayToCsv(headers, dataRows);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `RISE_A_CHILD_Staff_Directory_${dateStr}.csv`;
  triggerDownload(blob, filename);

  return { success: true, count: dataRows.length, filename };
}
