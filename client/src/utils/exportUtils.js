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
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    try {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
      window.URL.revokeObjectURL(url);
    } catch (e) {}
  }, 10000);
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
    const oA = Number(a.order_num) || 9999;
    const oB = Number(b.order_num) || 9999;
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

/**
 * Parses RFC 4180 CSV string into 2D array of cells
 */
export function parseRawCsvText(csvText) {
  const lines = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;
  const text = (csvText || '').replace(/^\uFEFF/, '');

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        if (nextChar === '\n') i++;
        currentRow.push(currentField.trim());
        if (currentRow.some(c => c.length > 0)) lines.push(currentRow);
        currentRow = [];
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some(c => c.length > 0)) lines.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(c => c.length > 0)) lines.push(currentRow);
  }

  return lines;
}

/**
 * Normalizes header string to standard property key
 */
export function normalizeCsvHeader(h) {
  const clean = (h || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (['fullname', 'name', 'childname', 'studentname', 'student'].includes(clean)) return 'name';
  if (['age', 'years'].includes(clean)) return 'age';
  if (['gender', 'sex'].includes(clean)) return 'gender';
  if (['class', 'grade', 'classgrade', 'standard'].includes(clean)) return 'class';
  if (['admissiondate', 'admitteddate', 'dateofadmission', 'doadm'].includes(clean)) return 'admission_date';
  if (['guardianname', 'guardianparentname', 'parentname', 'fathername', 'guardian'].includes(clean)) return 'guardian_name';
  if (['guardianphone', 'phone', 'contactnumber', 'mobilenumber', 'mobile', 'parentphone'].includes(clean)) return 'guardian_phone';
  if (['guardianaddress', 'address', 'nativeplace', 'addressnativeplace', 'residence'].includes(clean)) return 'guardian_address';
  if (['medicalnotes', 'healthnotes', 'medicalhealthnotes', 'health', 'medical'].includes(clean)) return 'medical_notes';
  if (['hobbies', 'talents', 'hobbiestalents', 'interest'].includes(clean)) return 'hobbies';
  if (['serialid', 'serialno', 'serialnumber', 'id', 'sno'].includes(clean)) return 'serial_no';
  return clean;
}

/**
 * Pre-import CSV Validator for Children records
 * Checks headers, data types, value boundaries, and duplicate entries.
 */
export function parseAndValidateChildrenCsv(csvText, existingChildren = []) {
  const rows = parseRawCsvText(csvText);
  const errors = [];
  const warnings = [];
  const validRecords = [];

  if (rows.length < 2) {
    return {
      valid: false,
      errors: ['The selected CSV file is empty or does not contain any student data rows.'],
      warnings: [],
      records: [],
      totalRows: 0
    };
  }

  const rawHeaders = rows[0];
  const normalizedHeaders = rawHeaders.map(normalizeCsvHeader);

  // Validate presence of required headers
  const requiredFields = [
    { key: 'name', label: 'Full Name' },
    { key: 'age', label: 'Age' },
    { key: 'gender', label: 'Gender' },
    { key: 'class', label: 'Class' }
  ];

  const missingHeaders = requiredFields.filter(f => !normalizedHeaders.includes(f.key));
  if (missingHeaders.length > 0) {
    return {
      valid: false,
      errors: [
        `CSV column validation failed. Missing required column(s): ${missingHeaders.map(m => `"${m.label}"`).join(', ')}. Found headers: [${rawHeaders.join(', ')}]`
      ],
      warnings: [],
      records: [],
      totalRows: rows.length - 1
    };
  }

  // Determine starting serial number
  let nextSerialNum = 1;
  if (Array.isArray(existingChildren) && existingChildren.length > 0) {
    const highestNum = existingChildren.reduce((max, c) => {
      const match = String(c.serial_no || '').match(/\d+/);
      return match ? Math.max(max, parseInt(match[0], 10)) : max;
    }, 0);
    nextSerialNum = highestNum + 1;
  }

  const existingNamesSet = new Set(
    (existingChildren || []).map(c => String(c.name || '').trim().toLowerCase())
  );

  // Row-by-row validation
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const lineNum = i + 1; // 1-indexed Excel row
    const rowObj = {};

    normalizedHeaders.forEach((h, colIdx) => {
      rowObj[h] = row[colIdx] ? row[colIdx].trim() : '';
    });

    const name = rowObj.name || '';
    const ageRaw = rowObj.age || '';
    const childClass = rowObj.class || '';
    const genderRaw = rowObj.gender || '';

    // Check empty row
    if (!name && !ageRaw && !childClass) {
      continue;
    }

    let hasRowError = false;

    // Validate Name
    if (!name || name.length < 2) {
      errors.push(`Row ${lineNum}: Child Full Name is required and must be at least 2 characters.`);
      hasRowError = true;
    } else if (existingNamesSet.has(name.toLowerCase())) {
      warnings.push(`Row ${lineNum}: A child named "${name}" already exists in hostel records. It will be added as a new sequential entry.`);
    }

    // Validate Age
    const age = parseInt(ageRaw, 10);
    if (isNaN(age) || age < 1 || age > 30) {
      errors.push(`Row ${lineNum} (${name || 'Unnamed'}): Age "${ageRaw}" must be a valid number between 1 and 30.`);
      hasRowError = true;
    }

    // Validate Class
    if (!childClass) {
      errors.push(`Row ${lineNum} (${name || 'Unnamed'}): Class / Grade is required.`);
      hasRowError = true;
    }

    // Normalize Gender
    let gender = 'Male';
    if (/^f/i.test(genderRaw)) gender = 'Female';
    else if (/^o/i.test(genderRaw)) gender = 'Other';
    else if (/^m/i.test(genderRaw)) gender = 'Male';
    else gender = genderRaw || 'Male';

    // Validate Phone if present
    if (rowObj.guardian_phone && !/^[0-9+ -]{7,15}$/.test(rowObj.guardian_phone)) {
      warnings.push(`Row ${lineNum} (${name}): Guardian phone "${rowObj.guardian_phone}" may have non-standard formatting.`);
    }

    if (!hasRowError) {
      const serial_no = rowObj.serial_no && rowObj.serial_no.startsWith('SN-CH-')
        ? rowObj.serial_no
        : `SN-CH-${String(nextSerialNum++).padStart(3, '0')}`;

      validRecords.push({
        _rowNumber: lineNum,
        serial_no,
        name,
        age,
        class: childClass,
        gender,
        admission_date: rowObj.admission_date || new Date().toISOString().split('T')[0],
        photo: rowObj.photo || '',
        guardian_name: rowObj.guardian_name || '',
        guardian_phone: rowObj.guardian_phone || '',
        guardian_address: rowObj.guardian_address || '',
        medical_notes: rowObj.medical_notes || 'Normal routine checks.',
        hobbies: rowObj.hobbies || 'Sports, Art, Reading'
      });
    }
  }

  return {
    valid: errors.length === 0,
    headers: rawHeaders,
    records: validRecords,
    errors,
    warnings,
    totalRows: rows.length - 1
  };
}

