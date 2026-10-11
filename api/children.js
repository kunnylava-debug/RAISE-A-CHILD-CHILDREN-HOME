const { getCloudData, setCloudData } = require('./cloudDb');

function sortChildrenAscending(list) {
  return [...list].sort((a, b) => {
    const numA = parseInt(String(a.serial_no || '').replace(/\D/g, ''), 10) || (Number(a.id) || 0);
    const numB = parseInt(String(b.serial_no || '').replace(/\D/g, ''), 10) || (Number(b.id) || 0);
    return numA - numB;
  });
}

function isAuthorized(req) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  return Boolean(token && token.length > 10);
}

// --------------------------------------------------------------------------
// AUTOMATIC CLASS PROMOTION & BIRTHDAY AGE ADVANCEMENT ENGINE
// --------------------------------------------------------------------------

// India school academic promotion progression:
// Nursery -> LKG -> UKG -> Class 1 (1st) -> ... -> Class 10 (10th) -> Inter 1st Year -> Inter 2nd Year -> College / Degree
function advanceGradeString(gradeStr, years = 1) {
  if (!gradeStr) return 'Class 1';
  let str = String(gradeStr).trim();
  for (let y = 0; y < years; y++) {
    const lower = str.toLowerCase();
    if (lower === 'nursery') {
      str = 'LKG';
    } else if (lower === 'lkg') {
      str = 'UKG';
    } else if (lower === 'ukg') {
      str = 'Class 1';
    } else if (lower.includes('inter 2nd') || lower.includes('12th') || lower === 'class 12') {
      str = 'College / Degree';
    } else if (lower.includes('inter 1st') || lower.includes('11th') || lower === 'class 11') {
      str = 'Inter 2nd Year';
    } else if (lower === '10th' || lower === 'class 10' || lower === 'class 10th' || lower === 'ssc') {
      str = 'Inter 1st Year';
    } else if (lower.includes('college') || lower.includes('degree') || lower.includes('alumni')) {
      str = 'College / Degree';
    } else {
      const match = str.match(/(\d+)/);
      if (match) {
        const currentNum = parseInt(match[1], 10);
        const nextNum = currentNum + 1;
        if (nextNum >= 13) {
          str = 'College / Degree';
        } else if (nextNum === 12) {
          str = 'Inter 2nd Year';
        } else if (nextNum === 11) {
          str = 'Inter 1st Year';
        } else if (/^\d+(st|nd|rd|th)$/i.test(str)) {
          const suffixes = ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th'];
          const suffix = (nextNum % 100 >= 11 && nextNum % 100 <= 13) ? 'th' : (suffixes[nextNum % 10] || 'th');
          str = `${nextNum}${suffix}`;
        } else if (/class\s*\d+/i.test(str)) {
          str = `Class ${nextNum}`;
        } else {
          str = `Class ${nextNum}`;
        }
      }
    }
  }
  return str;
}

function computeAgeFromDob(dobStr) {
  if (!dobStr) return null;
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

function hasBirthdayPassedThisYear(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  const currentYear = today.getFullYear();
  const thisYearAnniversary = new Date(currentYear, d.getMonth(), d.getDate());
  return today >= thisYearAnniversary;
}

function applyAutomaticChildAdvancements(childrenList) {
  const today = new Date();
  const currentYear = today.getFullYear();
  // Academic session in India begins in April (month index 3)
  const currentAcademicYear = today.getMonth() >= 3 ? currentYear : currentYear - 1;
  let hasModifications = false;
  let birthdayAdvancements = 0;
  let academicPromotions = 0;

  const updatedChildren = childrenList.map(child => {
    let modified = false;
    let newAge = (child.age !== undefined && child.age !== null) ? parseInt(child.age, 10) : 10;
    let newClass = child.class || 'Class 5';
    let lastAcademicYear = child.last_academic_year_promoted ? parseInt(child.last_academic_year_promoted, 10) : null;
    let lastBirthdayYear = child.last_birthday_increment_year ? parseInt(child.last_birthday_increment_year, 10) : null;

    // 1. Birthday Age Auto-Increment:
    if (child.dob) {
      const calculatedAge = computeAgeFromDob(child.dob);
      if (calculatedAge !== null && calculatedAge !== newAge) {
        newAge = calculatedAge;
        lastBirthdayYear = currentYear;
        modified = true;
        birthdayAdvancements++;
      } else if (!lastBirthdayYear) {
        lastBirthdayYear = currentYear;
        modified = true;
      }
    } else {
      // Fallback for legacy records without DOB: use admission anniversary
      const refDate = child.admission_date;
      if (refDate && hasBirthdayPassedThisYear(refDate)) {
        if (!lastBirthdayYear) {
          lastBirthdayYear = currentYear;
          modified = true;
        } else if (lastBirthdayYear < currentYear) {
          const years = currentYear - lastBirthdayYear;
          newAge += years;
          lastBirthdayYear = currentYear;
          modified = true;
          birthdayAdvancements++;
        }
      } else if (!lastBirthdayYear) {
        lastBirthdayYear = currentYear - 1;
        modified = true;
      }
    }

    // 2. Academic Class Promotion (Automatically every April 1st):
    if (!lastAcademicYear) {
      // Initialize to current academic year so future Aprils promote correctly
      lastAcademicYear = currentAcademicYear;
      modified = true;
    } else if (lastAcademicYear < currentAcademicYear) {
      const yearsToAdvance = currentAcademicYear - lastAcademicYear;
      newClass = advanceGradeString(newClass, yearsToAdvance);
      lastAcademicYear = currentAcademicYear;
      modified = true;
      academicPromotions++;
    }

    if (modified) {
      hasModifications = true;
      return {
        ...child,
        age: newAge,
        class: newClass,
        last_academic_year_promoted: lastAcademicYear,
        last_birthday_increment_year: lastBirthdayYear || currentYear
      };
    }
    return child;
  });

  return {
    updatedChildren,
    hasModifications,
    currentAcademicYear,
    academicPromotions,
    birthdayAdvancements
  };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const url = req.url || '';
  const method = req.method;
  const authorized = isAuthorized(req);

  try {
    let rawChildren = await getCloudData('children', []);
    
    // Run automatic April promotion & birthday check on load
    const advancementResult = applyAutomaticChildAdvancements(rawChildren);
    let children = sortChildrenAscending(advancementResult.updatedChildren);
    
    if (advancementResult.hasModifications) {
      await setCloudData(
        'children', 
        children, 
        `Auto-promoted ${advancementResult.academicPromotions} academic classes & updated ${advancementResult.birthdayAdvancements} birthday ages`
      ).catch(() => {});
    }

    // 1. GET /api/children (Public directory with Privacy Shield, full details for admin)
    if (method === 'GET') {
      const urlObj = new URL(url, 'http://localhost');

      // Direct CSV export handler for Vercel
      if (url.includes('/export/csv')) {
        const sorted = sortChildrenAscending(children);
        const headers = [
          'S.No', 'Serial ID', 'Full Name', 'Age', 'Date of Birth', 'Gender', 'Class',
          'Admission Date', 'Guardian Name', 'Guardian Phone', 'Address',
          'Medical Notes', 'Hobbies', 'Status'
        ];
        const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
        const rows = sorted.map((c, idx) => [
          idx + 1,
          c.serial_no || `SN-CH-${String(idx + 1).padStart(3, '0')}`,
          c.name || '',
          c.age || '',
          c.dob || '',
          c.gender || '',
          c.class || '',
          c.admission_date || '',
          authorized ? (c.guardian_name || '') : 'Protected (Staff Only)',
          authorized ? (c.guardian_phone || '') : '••••••••••',
          authorized ? (c.guardian_address || '') : 'Protected',
          authorized ? (c.medical_notes || '') : 'Confidential',
          c.hobbies || '',
          c.is_active === 0 ? 'Inactive' : 'Active in Hostel'
        ].map(escapeCsv).join(','));

        const csvData = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="RISE_A_CHILD_Children_Records.csv"');
        return res.end(csvData);
      }

      const page = parseInt(urlObj.searchParams.get('page')) || 1;
      const limit = parseInt(urlObj.searchParams.get('limit')) || 12;
      const search = (urlObj.searchParams.get('search') || '').toLowerCase().trim();
      const classFilter = urlObj.searchParams.get('class');
      const genderFilter = urlObj.searchParams.get('gender');

      let filtered = children;
      if (search) {
        filtered = filtered.filter(c =>
          (c.name || '').toLowerCase().includes(search) ||
          (c.serial_no || '').toLowerCase().includes(search)
        );
      }
      if (classFilter && classFilter !== 'all') {
        filtered = filtered.filter(c => c.class === classFilter);
      }
      if (genderFilter && genderFilter !== 'all') {
        filtered = filtered.filter(c => c.gender === genderFilter);
      }

      const startIndex = (page - 1) * limit;
      const pagedChildren = filtered.slice(startIndex, startIndex + limit);

      const sanitizedChildren = (limit >= 1000 ? filtered : pagedChildren).map(child => {
        if (authorized) return child;
        return {
          id: child.id,
          serial_no: child.serial_no,
          name: child.name,
          age: child.age,
          dob: child.dob || '',
          class: child.class,
          gender: child.gender,
          admission_date: child.admission_date,
          photo: child.photo,
          hobbies: child.hobbies,
          is_private_protected: true,
          last_academic_year_promoted: child.last_academic_year_promoted,
          last_birthday_increment_year: child.last_birthday_increment_year,
          guardian_name: 'Protected (Authorized Staff Only)',
          guardian_phone: '••••••••••',
          guardian_address: 'Protected for Child Privacy',
          medical_notes: 'Encrypted & Confidential'
        };
      });

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        total_children: children.length,
        boys_count: children.filter(c => c.gender === 'Male').length,
        girls_count: children.filter(c => c.gender === 'Female').length,
        filtered_count: filtered.length,
        page,
        limit,
        total_pages: Math.max(1, Math.ceil(filtered.length / limit)),
        is_authorized: authorized,
        academic_year: `${advancementResult.currentAcademicYear}-${advancementResult.currentAcademicYear + 1}`,
        next_promotion_date: `${advancementResult.currentAcademicYear + 1}-04-01`,
        recent_promotions_count: advancementResult.academicPromotions,
        recent_birthdays_count: advancementResult.birthdayAdvancements,
        children: sanitizedChildren
      }));
    }

    // 2. POST /api/children (Add new child or Batch Import to persistent cloud store)
    if (method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      body = body || {};

      // On-demand promotion check trigger
      if (body.action === 'run_promotions' || url.includes('/run-promotions')) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
          success: true,
          academic_year: `${advancementResult.currentAcademicYear}-${advancementResult.currentAcademicYear + 1}`,
          next_promotion_date: `${advancementResult.currentAcademicYear + 1}-04-01`,
          promoted_count: advancementResult.academicPromotions,
          birthday_count: advancementResult.birthdayAdvancements,
          message: `Engine evaluated: Academic Year ${advancementResult.currentAcademicYear}-${advancementResult.currentAcademicYear + 1} active. Next class increment scheduled for April 1, ${advancementResult.currentAcademicYear + 1}.`
        }));
      }

      // Batch import from CSV / Excel
      if (url.includes('/import-csv') || (Array.isArray(body.records) && body.records.length > 0)) {
        const records = Array.isArray(body.records) ? body.records : [];
        if (records.length === 0) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: 'No valid student records provided.' }));
        }

        const highestSerialNum = children.reduce((max, c) => {
          const match = String(c.serial_no || '').match(/SN-CH-(\d+)/i);
          return match ? Math.max(max, parseInt(match[1], 10)) : max;
        }, 0);
        let nextSerialCounter = highestSerialNum + 1;
        const currentYear = new Date().getFullYear();
        const currentAcademicYear = new Date().getMonth() >= 3 ? currentYear : currentYear - 1;

        const imported = records.map((r, idx) => {
          const dob = (r.dob || r.date_of_birth || '').trim();
          let calculatedAge = parseInt(r.age, 10);
          if (dob) {
            const ageFromDob = computeAgeFromDob(dob);
            if (ageFromDob !== null) calculatedAge = ageFromDob;
          }
          if (isNaN(calculatedAge) || calculatedAge <= 0) calculatedAge = 10;

          return {
            id: Date.now() + idx,
            serial_no: r.serial_no && r.serial_no.startsWith('SN-CH-') ? r.serial_no : `SN-CH-${String(nextSerialCounter++).padStart(3, '0')}`,
            name: r.name || 'Student',
            dob: dob,
            age: calculatedAge,
            class: r.class || 'Class 5',
            gender: r.gender || 'Male',
            admission_date: r.admission_date || new Date().toISOString().split('T')[0],
            photo: (r.photo || '').trim(),
            guardian_name: (r.guardian_name || '').trim(),
            guardian_phone: (r.guardian_phone || '').trim(),
            guardian_address: (r.guardian_address || '').trim(),
            medical_notes: r.medical_notes || 'Normal routine checks.',
            hobbies: r.hobbies || 'Sports, Art, Reading',
            last_academic_year_promoted: currentAcademicYear,
            last_birthday_increment_year: currentYear,
            is_active: 1
          };
        });

        children.push(...imported);
        children = sortChildrenAscending(children);
        await setCloudData('children', children, `Imported ${imported.length} student records`);

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
          success: true,
          imported_count: imported.length,
          message: `Successfully imported ${imported.length} student records!`
        }));
      }

      const nextId = Date.now();
      const highestSerialNum = children.reduce((max, c) => {
        const match = String(c.serial_no || '').match(/SN-CH-(\d+)/i);
        return match ? Math.max(max, parseInt(match[1], 10)) : max;
      }, 0);

      const nextSerial = body.serial_no || `SN-CH-${String(highestSerialNum + 1).padStart(3, '0')}`;
      const dob = (body.dob || '').trim();
      let calculatedAge = parseInt(body.age, 10);
      if (dob) {
        const ageFromDob = computeAgeFromDob(dob);
        if (ageFromDob !== null) calculatedAge = ageFromDob;
      }
      if (isNaN(calculatedAge) || calculatedAge <= 0) calculatedAge = 10;

      const currentYear = new Date().getFullYear();
      const currentAcademicYear = new Date().getMonth() >= 3 ? currentYear : currentYear - 1;

      const newChild = {
        id: nextId,
        serial_no: nextSerial,
        name: body.name || 'Student',
        dob: dob,
        age: calculatedAge,
        class: body.class || 'Class 5',
        gender: body.gender || 'Male',
        admission_date: body.admission_date || new Date().toISOString().split('T')[0],
        photo: body.photo ? body.photo.trim() : '',
        guardian_name: body.guardian_name || '',
        guardian_phone: body.guardian_phone || '',
        guardian_address: body.guardian_address || '',
        medical_notes: body.medical_notes || 'Normal routine checks.',
        hobbies: body.hobbies || 'Sports, Art, Reading',
        last_academic_year_promoted: currentAcademicYear,
        last_birthday_increment_year: currentYear,
        is_active: 1
      };

      children.push(newChild);
      children = sortChildrenAscending(children);
      await setCloudData('children', children, `Add child ${newChild.name} (${newChild.serial_no})`);

      res.statusCode = 201;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(newChild));
    }

    // 3. PUT /api/children/:id (Update child in cloud store)
    if (method === 'PUT') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      body = body || {};

      const parts = url.split('?')[0].split('/');
      const childId = parts[parts.length - 1];

      children = children.map(c => {
        if (String(c.id) === String(childId)) {
          const updated = { ...c, ...body, id: c.id };
          if (body.dob) {
            const ageFromDob = computeAgeFromDob(body.dob);
            if (ageFromDob !== null && !body.age) {
              updated.age = ageFromDob;
            }
          }
          return updated;
        }
        return c;
      });
      children = sortChildrenAscending(children);
      await setCloudData('children', children, `Update child ${childId}`);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ ...body, id: childId }));
    }

    // 4. DELETE /api/children/:id (Remove child from cloud store)
    if (method === 'DELETE') {
      const parts = url.split('?')[0].split('/');
      const childId = parts[parts.length - 1];

      children = children.filter(c => String(c.id) !== String(childId));
      await setCloudData('children', children, `Delete child ${childId}`);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ message: 'Child record deleted successfully.' }));
    }

    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message }));
  }
};
