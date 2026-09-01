import { ClassRoom, UserProfile } from '../types';

export interface GoogleSheetConfig {
  sheetUrl: string;
  sheetGid?: string;
  autoSync: boolean;
  lastSyncedAt?: string;
  classCount?: number;
  studentCount?: number;
  syncMode?: 'classes_and_students' | 'classes_only' | 'students_only';
}

export interface SheetParseResult {
  success: boolean;
  message: string;
  classes: ClassRoom[];
  students: UserProfile[];
  rawRowCount: number;
  detectedColumns: string[];
  errors?: string[];
}

export const DEFAULT_SAMPLE_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0';

const STORAGE_KEY_SHEET_CONFIG = 'toan12_google_sheet_config';

/**
 * Extracts spreadsheet ID and GID from various Google Sheets URL formats.
 */
export function parseGoogleSheetUrl(url: string): { sheetId: string | null; gid: string | null } {
  if (!url || typeof url !== 'string') return { sheetId: null, gid: null };

  const trimmed = url.trim();

  // Pattern 1: /spreadsheets/d/{ID}/...
  const idMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const sheetId = idMatch ? idMatch[1] : null;

  // GID match: gid=12345 or #gid=12345
  const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : '0';

  return { sheetId, gid };
}

/**
 * Converts a Google Sheet URL into direct CSV export URLs.
 */
export function getCsvExportUrls(sheetUrl: string, explicitGid?: string): string[] {
  const { sheetId, gid } = parseGoogleSheetUrl(sheetUrl);
  const targetGid = explicitGid || gid || '0';

  if (!sheetId) {
    // If the user pasted a direct CSV export link or other URL, return it directly
    return [sheetUrl];
  }

  return [
    `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${targetGid}`,
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${targetGid}`,
    `https://docs.google.com/spreadsheets/d/e/${sheetId}/pub?output=csv&gid=${targetGid}`,
  ];
}

/**
 * Robust CSV parser that handles quotes, commas inside quotes, and Unicode.
 */
export function parseCsvContent(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        currentCell += '"';
        i++;
      } else {
        // Toggle quote mode
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Normalizes header string for fuzzy matching (removes accents, lowercase, removes spaces/underscores).
 */
function normalizeHeader(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Identifies column mapping for classes and students.
 */
export function detectColumns(headers: string[]) {
  const normHeaders = headers.map(normalizeHeader);

  const findIdx = (keywords: string[]) => {
    return normHeaders.findIndex((h) =>
      keywords.some((k) => h.includes(normalizeHeader(k)) || normalizeHeader(k).includes(h))
    );
  };

  return {
    // Class fields
    classId: findIdx(['malop', 'id', 'classid', 'code', 'ma']),
    className: findIdx(['tenlop', 'classname', 'lop', 'lopmonhoc', 'name']),
    grade: findIdx(['khoi', 'grade', 'khoilop']),
    teacherName: findIdx(['giaovien', 'gv', 'teacher', 'gvcn', 'giaovienphutrach']),
    studentCount: findIdx(['siso', 'soluong', 'count', 'sohocsinh']),
    schoolYear: findIdx(['namhoc', 'nienkhoa', 'year', 'schoolyear']),

    // Student fields
    stt: findIdx(['stt', 'no', 'num']),
    studentId: findIdx(['mahs', 'mahocsinh', 'studentid', 'idhs', 'mssv']),
    fullName: findIdx(['hovaten', 'hoten', 'fullname', 'tenhocsinh', 'ten']),
    email: findIdx(['email', 'mail', 'diachiemail']),
    role: findIdx(['vaitro', 'role', 'chucdanh']),
    xp: findIdx(['xp', 'diemxp', 'diemtichluy', 'points']),
    level: findIdx(['level', 'capdo', 'cap']),
    status: findIdx(['trangthai', 'status', 'tinhtrang']),
  };
}

/**
 * Parses raw CSV rows into ClassRoom[] and UserProfile[] structures.
 */
export function parseSheetData(rows: string[][]): SheetParseResult {
  if (!rows || rows.length < 2) {
    return {
      success: false,
      message: 'File Google Sheet trống hoặc không có dòng tiêu đề hợp lệ.',
      classes: [],
      students: [],
      rawRowCount: rows.length,
      detectedColumns: [],
    };
  }

  const headers = rows[0];
  const dataRows = rows.slice(1);
  const col = detectColumns(headers);

  const classesMap = new Map<string, ClassRoom>();
  const students: UserProfile[] = [];
  const errors: string[] = [];

  // Determine if this sheet is primarily a Student List or Class List
  const hasStudentName = col.fullName !== -1;
  const hasClassName = col.className !== -1 || col.classId !== -1;

  if (hasStudentName) {
    // Mode: Student Roster (with Class Column)
    dataRows.forEach((row, idx) => {
      const rowNum = idx + 2;
      const fullName = col.fullName !== -1 ? row[col.fullName]?.trim() : '';
      if (!fullName) return;

      const rawClass = col.className !== -1 ? row[col.className]?.trim() : (col.classId !== -1 ? row[col.classId]?.trim() : '12TN1');
      const className = rawClass || '12TN1';
      const classId = className.toLowerCase().replace(/[^a-z0-9]/g, '') || `c_${idx + 1}`;

      const rawEmail = col.email !== -1 ? row[col.email]?.trim() : '';
      const email = rawEmail || `student.${classId}.${idx + 1}@toan12.edu.vn`;

      const id = col.studentId !== -1 && row[col.studentId]?.trim() ? row[col.studentId].trim() : `u_st_${classId}_${idx + 1}`;
      const xp = col.xp !== -1 && !isNaN(parseInt(row[col.xp])) ? parseInt(row[col.xp]) : 200;
      const level = col.level !== -1 && !isNaN(parseInt(row[col.level])) ? parseInt(row[col.level]) : Math.max(1, Math.floor(xp / 300) + 1);

      // Create or update class
      if (!classesMap.has(classId)) {
        classesMap.set(classId, {
          id: classId,
          name: className,
          grade: 12,
          teacherId: 't1',
          teacherName: col.teacherName !== -1 && row[col.teacherName]?.trim() ? row[col.teacherName].trim() : 'Thầy Phan Quốc Cường',
          schoolYear: col.schoolYear !== -1 && row[col.schoolYear]?.trim() ? row[col.schoolYear].trim() : '2025-2026',
          studentCount: 0,
        });
      }

      const cls = classesMap.get(classId)!;
      cls.studentCount += 1;

      students.push({
        id,
        email,
        fullName,
        role: 'student',
        classId,
        className,
        schoolYear: cls.schoolYear,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
        xp,
        level,
        streakDays: Math.min(14, Math.max(1, (idx % 7) + 1)),
        lastActiveAt: new Date(Date.now() - (idx % 5) * 3600000).toISOString(),
        badges: ['google_sheet_synced', 'new_scholar'],
      });
    });
  } else if (hasClassName) {
    // Mode: Class Room Master List
    dataRows.forEach((row, idx) => {
      const rawName = col.className !== -1 ? row[col.className]?.trim() : '';
      const rawId = col.classId !== -1 ? row[col.classId]?.trim() : '';
      const name = rawName || rawId || `Lớp 12.${idx + 1}`;
      const id = rawId || name.toLowerCase().replace(/[^a-z0-9]/g, '') || `c_${idx + 1}`;

      const grade = col.grade !== -1 && !isNaN(parseInt(row[col.grade])) ? parseInt(row[col.grade]) : 12;
      const teacherName = col.teacherName !== -1 && row[col.teacherName]?.trim() ? row[col.teacherName].trim() : 'Thầy Phan Quốc Cường';
      const studentCount = col.studentCount !== -1 && !isNaN(parseInt(row[col.studentCount])) ? parseInt(row[col.studentCount]) : 40;
      const schoolYear = col.schoolYear !== -1 && row[col.schoolYear]?.trim() ? row[col.schoolYear].trim() : '2025-2026';

      classesMap.set(id, {
        id,
        name,
        grade,
        teacherId: 't1',
        teacherName,
        schoolYear,
        studentCount,
      });

      // Generate demo students for this class if no explicit student list
      for (let s = 1; s <= Math.min(studentCount, 15); s++) {
        students.push({
          id: `u_${id}_${s}`,
          fullName: `Học sinh ${name} #${s}`,
          email: `hs.${id}.${s}@toan12.edu.vn`,
          role: 'student',
          classId: id,
          className: name,
          schoolYear,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'active',
          xp: 200 + (s * 50),
          level: Math.max(1, Math.floor(s / 3)),
          streakDays: (s % 7) + 1,
          lastActiveAt: new Date().toISOString(),
          badges: ['google_sheet_synced'],
        });
      }
    });
  } else {
    return {
      success: false,
      message: 'Không nhận diện được cột "Tên lớp", "Mã lớp" hoặc "Họ và tên" trong Google Sheet.',
      classes: [],
      students: [],
      rawRowCount: rows.length,
      detectedColumns: headers,
      errors: ['Cần có ít nhất cột chứa Tên lớp hoặc Họ tên học sinh'],
    };
  }

  const classes = Array.from(classesMap.values());

  return {
    success: true,
    message: `Đã xử lý thành công ${classes.length} lớp học và ${students.length} học sinh.`,
    classes,
    students,
    rawRowCount: rows.length,
    detectedColumns: headers,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Fetches Google Sheet content with proxy and direct client-side fallback.
 */
export async function fetchGoogleSheetLive(sheetUrl: string, gid?: string): Promise<SheetParseResult> {
  const { sheetId } = parseGoogleSheetUrl(sheetUrl);

  if (!sheetId && !sheetUrl.includes('http')) {
    throw new Error('URL Google Sheet không hợp lệ. Vui lòng kiểm tra lại liên kết.');
  }

  // 1. Try fetching via Backend Proxy endpoint first
  try {
    const res = await fetch('/api/sheets/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetUrl, gid }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.classes) {
        return data;
      }
    }
  } catch (backendErr) {
    console.warn('Backend proxy fetch failed, attempting direct browser fetch:', backendErr);
  }

  // 2. Fallback to direct client-side fetch from Google Sheets CSV Export
  const candidateUrls = getCsvExportUrls(sheetUrl, gid);
  let lastError: any = null;

  for (const exportUrl of candidateUrls) {
    try {
      const response = await fetch(exportUrl, {
        method: 'GET',
        headers: {
          Accept: 'text/csv, text/plain, */*',
        },
      });

      if (response.ok) {
        const text = await response.text();
        if (text && !text.includes('<!DOCTYPE html>') && text.length > 10) {
          const rows = parseCsvContent(text);
          const parsed = parseSheetData(rows);
          if (parsed.success) {
            return parsed;
          }
        }
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(
    lastError?.message ||
      'Không thể đọc dữ liệu từ Google Sheet. Vui lòng đảm bảo bảng tính đã được bật quyền: "Bất kỳ ai có liên kết đều có thể xem" (Anyone with the link can view).'
  );
}

/**
 * LocalStorage helpers for sheet connection persistence.
 */
export function getSavedSheetConfig(): GoogleSheetConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SHEET_CONFIG);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading saved sheet config:', e);
  }

  return {
    sheetUrl: DEFAULT_SAMPLE_SHEET_URL,
    sheetGid: '0',
    autoSync: true,
    syncMode: 'classes_and_students',
  };
}

export function saveSheetConfig(config: GoogleSheetConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_SHEET_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving sheet config:', e);
  }
}

/**
 * Generates sample CSV text that teachers can download or copy to create their own Google Sheet.
 */
export function generateSampleSheetCsv(): string {
  return `STT,Mã Lớp,Tên Lớp,Khối,Họ và tên,Email,Giáo viên,Sĩ số,XP,Cấp độ,Ghi chú
1,12TN1,Lớp 12TN1,12,Nguyễn Hoài Nam,nam.nguyen@toan12.edu.vn,Thầy Phan Quốc Cường,42,1280,4,Chuyên Toán Tự nhiên
2,12TN1,Lớp 12TN1,12,Trần Thị Mai Anh,mai.anh@toan12.edu.vn,Thầy Phan Quốc Cường,42,1450,5,Khối Tự nhiên
3,12TN1,Lớp 12TN1,12,Lê Minh Quân,quan.le@toan12.edu.vn,Thầy Phan Quốc Cường,42,950,3,Khối Tự nhiên
4,12TN2,Lớp 12TN2,12,Phạm Hoàng Bách,bach.pham@toan12.edu.vn,Thầy Phan Quốc Cường,40,1120,4,Khối Tự nhiên
5,12TN2,Lớp 12TN2,12,Đỗ Quỳnh Chi,chi.do@toan12.edu.vn,Thầy Phan Quốc Cường,40,1380,5,Khối Tự nhiên
6,12A1,Lớp 12A1,12,Vũ Đức Trọng,trong.vu@toan12.edu.vn,Thầy Phan Quốc Cường,43,1560,5,Lớp chọn Toán 12
7,12A1,Lớp 12A1,12,Hoàng Khánh Linh,linh.hoang@toan12.edu.vn,Thầy Phan Quốc Cường,43,1200,4,Lớp chọn Toán 12
8,12XH1,Lớp 12XH1,12,Ngô Bảo Châu,chau.ngo@toan12.edu.vn,Thầy Phan Quốc Cường,42,880,3,Khối Xã hội ôn ĐGNL
9,12XH2,Lớp 12XH2,12,Dương Tuấn Anh,anh.duong@toan12.edu.vn,Thầy Phan Quốc Cường,41,920,3,Khối Xã hội ôn ĐGNL
10,12TX,Lớp 12TX,12,Trịnh Gia Huy,huy.trinh@toan12.edu.vn,Thầy Phan Quốc Cường,35,750,2,Lớp Tự chọn nâng cao
`;
}
