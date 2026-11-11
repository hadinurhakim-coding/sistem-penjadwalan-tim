import assert from 'node:assert';
import {
  isValidDateString,
  isValidTimeString,
  calculateAndValidateDuration,
  validateAssignedMembers,
  validateTaskCategory,
  validateEventStatus,
  validateTitle,
  validatePdfMetadata,
} from '../src/lib/overtime-service.js';

console.log('--- Memulai Pengujian Unit Validasi Keamanan (F-03 & F-04) ---');

// 1. Validasi Tanggal
assert.strictEqual(isValidDateString('2026-11-10'), true);
assert.strictEqual(isValidDateString('invalid-date'), false);
assert.strictEqual(isValidDateString('2026-02-31'), false); // Tanggal 31 di Februari tidak ada
assert.strictEqual(isValidDateString(''), false);
console.log('✓ Validasi tanggal (YYYY-MM-DD & kalender valid) lulus.');

// 2. Validasi Jam
assert.strictEqual(isValidTimeString('17:00'), true);
assert.strictEqual(isValidTimeString('23:59'), true);
assert.strictEqual(isValidTimeString('24:00'), false); // Jam > 23 tidak valid
assert.strictEqual(isValidTimeString('17:60'), false); // Menit > 59 tidak valid
assert.strictEqual(isValidTimeString('not-a-time'), false);
console.log('✓ Validasi format waktu (HH:mm) lulus.');

// 3. Validasi & Kalkulasi Durasi
assert.strictEqual(calculateAndValidateDuration('17:00', '21:00'), 4);
assert.strictEqual(calculateAndValidateDuration('08:00', '17:00'), 9);
assert.throws(() => calculateAndValidateDuration('21:00', '17:00'), /Jam selesai harus lebih akhir/);
console.log('✓ Kalkulasi & pembatasan durasi lembur lulus.');

// 4. Deduplikasi dan Validasi ID Personil
const mockMembers = [
  { id: 'mem-1', name: 'User A', role: 'Staff', totalHours: 0, totalSessions: 0, lastOvertimeDate: null, createdAt: '' },
  { id: 'mem-2', name: 'User B', role: 'Staff', totalHours: 0, totalSessions: 0, lastOvertimeDate: null, createdAt: '' },
];
// Duplicate IDs harus dideduplikasi dan hanya yang terdaftar di mockMembers yang lolos
const filtered = validateAssignedMembers(['mem-1', 'mem-1', 'mem-2', 'hacker-id'], mockMembers, true);
assert.deepStrictEqual(filtered, ['mem-1', 'mem-2']);
assert.throws(() => validateAssignedMembers(['ghost-id'], mockMembers, true), /tidak valid atau belum terdaftar/);
console.log('✓ Deduplikasi dan verifikasi eksistensi teknisi lulus.');

// 5. Validasi Enum Kategori & Status
assert.strictEqual(validateTaskCategory('Tugas Pokok'), 'Tugas Pokok');
assert.strictEqual(validateTaskCategory('Tugas Support'), 'Tugas Support');
assert.strictEqual(validateTaskCategory('Unknown'), 'Tugas Pokok'); // fallback aman

assert.strictEqual(validateEventStatus('Terjadwal'), 'Terjadwal');
assert.strictEqual(validateEventStatus('HackedStatus'), 'Terjadwal'); // fallback aman
console.log('✓ Validasi enum TaskCategory & EventStatus lulus.');

// 6. Validasi Judul
assert.strictEqual(validateTitle('Agenda Resmi'), 'Agenda Resmi');
assert.throws(() => validateTitle('   '), /Nama kegiatan\/judul agenda wajib diisi/);
assert.throws(() => validateTitle('a'), /Nama kegiatan minimal 2 karakter/);
console.log('✓ Validasi judul agenda lulus.');

// 7. Validasi Metadata PDF
assert.throws(() => validatePdfMetadata('../secrets.txt', 100), /Kunci file PDF/);
assert.throws(() => validatePdfMetadata('valid.pdf', -5), /Ukuran file PDF/);
assert.throws(() => validatePdfMetadata('valid.pdf', 20 * 1024 * 1024), /melebihi batas maksimal 15 MB/);
console.log('✓ Validasi metadata file PDF & anti-path traversal lulus.');

console.log('\nSEMUA PENGUJIAN UNIT VALIDASI INPUT LULUS DENGAN SUKSES! 🎉');
