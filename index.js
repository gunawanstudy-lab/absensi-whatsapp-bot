// install: npm install whatsapp-web.js qrcode-terminal google-spreadsheet express

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const express = require('express');

const SHEET_ID = process.env.SHEET_ID;
const API_KEY = process.env.API_KEY;
const ADMIN_NUMBER = process.env.ADMIN_NUMBER + "@c.us";

const app = express();
const PORT = process.env.PORT || 3000;

const client = new Client({
  authStrategy: new LocalAuth()
});

app.get("/", (req, res) => {
  res.send("WhatsApp Absensi Bot is running 🚀");
});

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
  console.log("🔗 Scan QR di terminal Render untuk login WhatsApp Web.");
});

client.on('ready', async () => {
  console.log('✅ Bot WhatsApp aktif.');

  const doc = new GoogleSpreadsheet(SHEET_ID);
  await doc.useApiKey(API_KEY);
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];
  let lastRowCount = 0;

  setInterval(async () => {
    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();

    if (rows.length > lastRowCount) {
      const newRow = rows[rows.length - 1];
      const nama = newRow['Nama Tentor'] || newRow['Nama'] || 'Tidak diketahui';
      const waktu = newRow['Timestamp'] || new Date().toLocaleString();
      const foto = newRow['Foto Bukti Kehadiran'] || '';

      const pesan = `📋 *Absensi Baru!*\n👤 Nama: ${nama}\n🕒 Waktu: ${waktu}`;
      await client.sendMessage(ADMIN_NUMBER, pesan);

      if (foto && foto.startsWith("http")) {
        await client.sendMessage(ADMIN_NUMBER, foto);
      }

      console.log(`📨 Absensi dari ${nama} terkirim ke admin.`);
      lastRowCount = rows.length;
    }
  }, 60000); // cek tiap 1 menit
});

client.initialize();
app.listen(PORT, () => console.log(`🌐 Server berjalan di port ${PORT}`));
