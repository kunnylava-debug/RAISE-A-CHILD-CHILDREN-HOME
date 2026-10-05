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
/**
 * Reads any uploaded spreadsheet file (Excel .xlsx, .xls or CSV .csv)
 * and reliably converts it into standard CSV text.
 */
export async function parseSpreadsheetFileToCsv(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No file was selected.'));
    }

    const isExcel = /\.(xlsx|xls)$/i.test(file.name) || 
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel';

    const reader = new FileReader();

    if (isExcel) {
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error('Excel workbook contains no sheets.');
          }
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const csvText = XLSX.utils.sheet_to_csv(worksheet, { blankrows: false });
          resolve(csvText);
        } catch (err) {
          reject(new Error(`Failed to read Excel spreadsheet: ${err.message}`));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read Excel spreadsheet file.'));
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (e) => {
        const text = e.target.result || '';
        // If file contains binary null bytes (corrupted or misnamed binary file)
        if (text.includes('\u0000') || text.startsWith('PK\x03\x04')) {
          try {
            const data = new TextEncoder().encode(text);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            return resolve(XLSX.utils.sheet_to_csv(worksheet, { blankrows: false }));
          } catch {
            // continue with plain text
          }
        }
        resolve(text);
      };
      reader.onerror = () => reject(new Error('Failed to read CSV text file.'));
      reader.readAsText(file);
    }
  });
}

/**
 * Normalizes header string to standard property key
 */
export function normalizeCsvHeader(h) {
  const clean = (h || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (['fullname', 'name', 'childname', 'studentname', 'student', 'child', 'studentfullname', 'beneficiaryname', 'beneficiary', 'nameofthechild'].includes(clean)) return 'name';
  if (['age', 'years', 'ageyears', 'ageinyears', 'yearsold'].includes(clean)) return 'age';
  if (['gender', 'sex', 'gendersex', 'morf', 'mf'].includes(clean)) return 'gender';
  if (['class', 'grade', 'classgrade', 'standard', 'std', 'studyclass', 'currentclass', 'education', 'studying', 'course'].includes(clean)) return 'class';
  if (['admissiondate', 'admitteddate', 'dateofadmission', 'doadm', 'joiningdate', 'admission', 'date'].includes(clean)) return 'admission_date';
  if (['guardianname', 'guardianparentname', 'parentname', 'fathername', 'guardian', 'mothername', 'parent', 'caregiver'].includes(clean)) return 'guardian_name';
  if (['guardianphone', 'phone', 'contactnumber', 'mobilenumber', 'mobile', 'parentphone', 'phonenumber', 'phoneno', 'mobileno', 'contact'].includes(clean)) return 'guardian_phone';
  if (['guardianaddress', 'address', 'nativeplace', 'addressnativeplace', 'residence', 'location', 'place', 'city', 'town'].includes(clean)) return 'guardian_address';
  if (['medicalnotes', 'healthnotes', 'medicalhealthnotes', 'health', 'medical', 'bloodgroup', 'medicalcondition', 'notes'].includes(clean)) return 'medical_notes';
  if (['hobbies', 'talents', 'hobbiestalents', 'interest', 'interests', 'skills'].includes(clean)) return 'hobbies';
  if (['serialid', 'serialno', 'serialnumber', 'id', 'sno', 'slno', 'serial', 'index', 'no', 'sn'].includes(clean)) return 'serial_no';
  if (['status', 'activestatus', 'state'].includes(clean)) return 'status';
  if (['photo', 'image', 'photourl', 'pic', 'picture'].includes(clean)) return 'photo';
  return clean;
}

/**
 * Pre-import Spreadsheet/CSV Validator for Children records
 * Dynamically locates the header row, normalizes column names,
 * and validates data rows with smart fallbacks.
 */
export function parseAndValidateChildrenCsv(csvText, existingChildren = []) {
  const rows = parseRawCsvText(csvText);
  const errors = [];
  const warnings = [];
  const validRecords = [];

  if (rows.length < 2) {
    return {
      valid: false,
      errors: ['The selected spreadsheet is empty or does not contain any student data rows.'],
      warnings: [],
      records: [],
      totalRows: 0
    };
  }

  // Dynamically find the header row (search first 5 rows)
  let headerRowIndex = -1;
  let normalizedHeaders = [];
  let rawHeaders = [];

  for (let r = 0; r < Math.min(rows.length, 5); r++) {
    const candidateRow = rows[r];
    const candidateNormalized = candidateRow.map(normalizeCsvHeader);
    const hasName = candidateNormalized.includes('name');
    const hasAge = candidateNormalized.includes('age');
    const hasGender = candidateNormalized.includes('gender');
    const hasClass = candidateNormalized.includes('class');

    // Found header row if name and at least one other student field are present
    if (hasName && (hasAge || hasGender || hasClass || candidateNormalized.includes('serial_no') || candidateNormalized.includes('admission_date'))) {
      headerRowIndex = r;
      normalizedHeaders = candidateNormalized;
      rawHeaders = candidateRow;
      break;
    }
  }

  // Fallback: if not found, use first row or row with 'name'
  if (headerRowIndex === -1) {
    for (let r = 0; r < Math.min(rows.length, 5); r++) {
      const candidateRow = rows[r];
      const candidateNormalized = candidateRow.map(normalizeCsvHeader);
      if (candidateNormalized.includes('name')) {
        headerRowIndex = r;
        normalizedHeaders = candidateNormalized;
        rawHeaders = candidateRow;
        break;
      }
    }
  }

  if (headerRowIndex === -1) {
    headerRowIndex = 0;
    rawHeaders = rows[0];
    normalizedHeaders = rawHeaders.map(normalizeCsvHeader);
  }

  // Student Full Name is the only required key identifier
  const hasName = normalizedHeaders.includes('name');
  if (!hasName) {
    return {
      valid: false,
      errors: [
        `Spreadsheet validation failed. Could not locate a column for student names (e.g. "Full Name", "Name", "Student Name"). Found columns: [${rawHeaders.filter(Boolean).join(', ')}]`
      ],
      warnings: [],
      records: [],
      totalRows: Math.max(0, rows.length - (headerRowIndex + 1))
    };
  }

  // Inform user if non-critical columns will receive smart defaults
  if (!normalizedHeaders.includes('age')) {
    warnings.push('Column "Age" was not detected. Records without age will default to 10.');
  }
  if (!normalizedHeaders.includes('class')) {
    warnings.push('Column "Class" was not detected. Records without class will default to "Class 5".');
  }
  if (!normalizedHeaders.includes('gender')) {
    warnings.push('Column "Gender" was not detected. Records without gender will default to "Male".');
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
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
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

    // Check completely empty row
    if (!name && !ageRaw && !childClass) {
      continue;
    }

    // Validate Name
    if (!name || name.length < 2) {
      errors.push(`Row ${lineNum}: Child Full Name is required and must be at least 2 characters.`);
      continue;
    }

    if (existingNamesSet.has(name.toLowerCase())) {
      warnings.push(`Row ${lineNum}: A child named "${name}" already exists in hostel records. It will be added as a new entry.`);
    }

    // Smart age fallback
    let age = parseInt(ageRaw, 10);
    if (isNaN(age) || age < 1 || age > 30) {
      age = 10;
    }

    // Smart class fallback
    const finalClass = childClass || 'Class 5';

    // Normalize Gender
    let gender = 'Male';
    if (/^f/i.test(genderRaw)) gender = 'Female';
    else if (/^o/i.test(genderRaw)) gender = 'Other';
    else if (/^m/i.test(genderRaw)) gender = 'Male';
    else gender = genderRaw || 'Male';

    const serial_no = rowObj.serial_no && rowObj.serial_no.startsWith('SN-CH-')
      ? rowObj.serial_no
      : `SN-CH-${String(nextSerialNum++).padStart(3, '0')}`;

    validRecords.push({
      _rowNumber: lineNum,
      serial_no,
      name,
      age,
      class: finalClass,
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

  return {
    valid: errors.length === 0,
    headers: rawHeaders,
    records: validRecords,
    errors,
    warnings,
    totalRows: rows.length - 1
  };
}

