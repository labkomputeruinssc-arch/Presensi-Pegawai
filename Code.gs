/** * APLIKASI PRESENSI PEGAWAI - BACKEND CORE (LENGKAP)
 * Menangani Database Google Sheets, GPS Validation, Auth, CRUD, dan Google Drive.
 */

// Gunakan function agar selalu dapat spreadsheet yang benar
function getSS() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    // Fallback: pakai ID spreadsheet (ganti dengan ID spreadsheet Anda)
    // ss = SpreadsheetApp.openById('YOUR_SPREADSHEET_ID');
    throw new Error('Spreadsheet tidak ditemukan. Pastikan script terhubung ke spreadsheet.');
  }
  return ss;
}

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Presensi Mobile Pro v3')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** * SISTEM LOGIN
 * Kolom Users: [0]ID, [1]Nama, [2]Jabatan, [3]Phone, [4]Role, [5]Password
 */
function checkLogin(phone, password) {
  try {
    const sheet = getSS().getSheetByName('Users');
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][3].toString() == phone && data[i][5].toString() == password) {
        return {
          success: true,
          user: {
            id: data[i][0],
            nama: data[i][1],
            jabatan: data[i][2],
            phone: data[i][3],
            role: data[i][4]
          }
        };
      }
    }
    return { success: false, message: "Nomor HP atau Password salah!" };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

/** * PROSES ABSENSI (MASUK & KELUAR) 
 * Wajib Selfie dan Validasi GPS
 */
function submitAttendance(type, lat, lng, userId, selfieData) {
  try {
    const settings = getSettings();
    const dist = calculateDistance(lat, lng, settings.office_lat, settings.office_lng);
    
    if (dist > settings.radius) {
      return { success: false, message: "Gagal! Anda berada di luar radius kantor (" + Math.round(dist) + "m)." };
    }
    
    if (!selfieData) return { success: false, message: "Wajib mengambil foto selfie!" };

    // Simpan Selfie ke Drive
    const photoUrl = saveFileToDrive(selfieData, `Selfie_${userId}_${Date.now()}.jpg`);

    const sheet = getSS().getSheetByName('Attendance');
    const data = sheet.getDataRange().getValues();
    const today = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
    const now = Utilities.formatDate(new Date(), "GMT+7", "HH:mm:ss");

    if (type === 'IN') {
      // Cek double absen masuk
      for (let i = 1; i < data.length; i++) {
        let recordDate = data[i][2];
        if (recordDate instanceof Date) {
          recordDate = Utilities.formatDate(recordDate, "GMT+7", "yyyy-MM-dd");
        }
        if (data[i][1] == userId && recordDate == today) {
          return { success: false, message: "Anda sudah absen masuk hari ini!" };
        }
      }
      // [0]id, [1]userId, [2]tgl, [3]jamIn, [4]jamOut, [5]lat, [6]lng, [7]latOut, [8]lngOut, [9]status, [10]photo
      sheet.appendRow([Utilities.getUuid(), userId, today, now, "", lat, lng, "", "", "Hadir", photoUrl]);
      return { success: true, message: "Absen Masuk Berhasil!" };
    } else {
      // Cari data masuk hari ini untuk diupdate
      for (let i = data.length - 1; i >= 1; i--) {
        let recordDate = data[i][2];
        if (recordDate instanceof Date) {
          recordDate = Utilities.formatDate(recordDate, "GMT+7", "yyyy-MM-dd");
        }
        if (data[i][1] == userId && recordDate == today) {
          if (data[i][4] !== "") return { success: false, message: "Anda sudah absen keluar hari ini!" };
          
          sheet.getRange(i + 1, 5).setValue(now); // Jam Keluar
          sheet.getRange(i + 1, 8).setValue(lat); // Lat Out
          sheet.getRange(i + 1, 9).setValue(lng); // Lng Out
          sheet.getRange(i + 1, 11).setValue(photoUrl); // Foto Keluar
          return { success: true, message: "Absen Keluar Berhasil!" };
        }
      }
      return { success: false, message: "Anda belum melakukan absen masuk!" };
    }
  } catch (e) { 
    return { success: false, message: e.toString() }; 
  }
}

/** * PENGAJUAN IZIN & UPLOAD LAMPIRAN
 */
function submitPermit(permitData) {
  try {
    let fileUrl = "";
    if (permitData.fileData && permitData.fileName) {
      fileUrl = saveFileToDrive(permitData.fileData, permitData.fileName);
    }
    
    const sheet = getSS().getSheetByName('Permits');
    sheet.appendRow([
      Utilities.getUuid(),
      permitData.userId,
      permitData.date,
      permitData.type,
      permitData.reason,
      "Menunggu",
      fileUrl
    ]);
    return { success: true, message: "Izin berhasil diajukan!" };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function updatePermitStatus(id, status) {
  try {
    const sheet = getSS().getSheetByName('Permits');
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == id) {
        sheet.getRange(i + 1, 6).setValue(status);
        return { success: true };
      }
    }
    return { success: false, message: "ID Izin tidak ditemukan." };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

/** * MANAJEMEN PEGAWAI (CRUD)
 */
function addUser(userData) {
  try {
    const sheet = getSS().getSheetByName('Users');
    sheet.appendRow([
      Utilities.getUuid(),
      userData.nama,
      userData.jabatan,
      userData.phone,
      userData.role,
      userData.password
    ]);
    return { success: true, message: "Pegawai berhasil ditambahkan!" };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function editUser(userData) {
  try {
    const sheet = getSS().getSheetByName('Users');
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == userData.id) {
        sheet.getRange(i + 1, 2, 1, 5).setValues([[
          userData.nama,
          userData.jabatan,
          userData.phone,
          userData.role,
          userData.password
        ]]);
        return { success: true, message: "Data pegawai diperbarui!" };
      }
    }
    return { success: false };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function deleteUser(id) {
  try {
    const sheet = getSS().getSheetByName('Users');
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == id) {
        sheet.deleteRow(i + 1);
        return { success: true, message: "Pegawai dihapus!" };
      }
    }
    return { success: false };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

/** * DATA AGGREGATION & ADMIN DASHBOARD
 */
function getDashboardData(userId, role) {
  try {
    const att = getSheetData('Attendance');
    const permits = getSheetData('Permits');
    const users = getSheetData('Users');
    const settings = getSettings();
    const today = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");

    const res = {
      stats: {
        totalPegawai: users.length - 1,
        absenHariIni: att.filter(r => r[2] == today).length,
        izinPending: permits.filter(r => r[5] == "Menunggu").length
      },
      history: att.filter(r => r[1] == userId).slice(-10).reverse(),
      userPermits: permits.filter(r => r[1] == userId).slice(-10).reverse(),
      allPermits: permits.slice(1).reverse(),
      allAttendance: att.slice(1).reverse().map(r => {
        var found = users.find(u => u[0] == r[1]);
        var userName = found ? found[1] : "Anonim";
        var mapsUrl = 'https://www.google.com/maps?q=' + r[5] + ',' + r[6];
        return r.concat([mapsUrl, userName]);
      }),
      allUsers: users.slice(1),
      settings: settings
    };
    return res;
  } catch (e) {
    return { error: e.toString() };
  }
}

/** * PENGATURAN SISTEM
 */
function updateOfficeSettings(lat, lng, radius) {
  try {
    const s = getSS().getSheetByName('Settings');
    const data = s.getDataRange().getValues();
    
    // Cari baris berdasarkan key name
    for (var i = 0; i < data.length; i++) {
      var key = String(data[i][0]).trim().toLowerCase();
      if (key === 'office_lat') s.getRange(i + 1, 2).setValue(lat);
      if (key === 'office_lng') s.getRange(i + 1, 2).setValue(lng);
      if (key === 'radius') s.getRange(i + 1, 2).setValue(radius);
    }
    
    return { success: true, message: "Lokasi kantor diperbarui!" };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

/** * HELPER FUNCTIONS
 */
function saveFileToDrive(base64Data, fileName) {
  const folderName = "Presensi_App_Data";
  let folders = DriveApp.getFoldersByName(folderName);
  let folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
  
  const contentType = base64Data.substring(5, base64Data.indexOf(';'));
  const bytes = Utilities.base64Decode(base64Data.split(',')[1]);
  const blob = Utilities.newBlob(bytes, contentType, fileName);
  const file = folder.createFile(blob);
  
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

function getSettings() {
  const d = getSS().getSheetByName('Settings').getDataRange().getValues();
  const s = {}; 
  d.forEach(r => s[r[0]] = r[1]); 
  return s;
}

/** Fungsi terpisah untuk ambil koordinat kantor - dipanggil langsung dari frontend */
function getOfficeLocation() {
  try {
    var s = getSettings();
    return {
      lat: parseFloat(s.office_lat) || 0,
      lng: parseFloat(s.office_lng) || 0,
      rad: parseInt(s.radius) || 100
    };
  } catch(e) {
    return { lat: 0, lng: 0, rad: 100, error: e.toString() };
  }
}

/** Ambil semua data pegawai */
function getUsers() {
  try {
    var data = getSheetData('Users');
    return data.slice(1); // Tanpa header
  } catch(e) {
    return [];
  }
}

/** Ambil log absensi */
function getAttendanceLog() {
  try {
    var att = getSheetData('Attendance');
    var users = getSheetData('Users');
    return att.slice(1).reverse().map(function(r) {
      var found = users.find(function(u) { return u[0] == r[1]; });
      var userName = found ? found[1] : 'Anonim';
      var mapsUrl = 'https://www.google.com/maps?q=' + r[5] + ',' + r[6];
      return r.concat([mapsUrl, userName]);
    });
  } catch(e) {
    return [];
  }
}

function getSheetData(n) { 
  const sheet = getSS().getSheetByName(n);
  if (!sheet) return [];
  
  var data = sheet.getDataRange().getValues();
  // Automatically convert ALL dates to strings globally
  // This prevents google.script.run from silently crashing!
  return data.map(function(row) {
    return row.map(function(cell) {
      if (cell instanceof Date) {
        if (cell.getFullYear() === 1899) {
          return Utilities.formatDate(cell, "GMT+7", "HH:mm:ss");
        }
        return Utilities.formatDate(cell, "GMT+7", "yyyy-MM-dd");
      }
      return cell;
    });
  });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Meter
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}