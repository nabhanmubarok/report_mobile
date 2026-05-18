# LaporKita Mobile – Expo React Native

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Ganti IP Backend
Edit **dua file** berikut dan ganti `192.168.1.x` dengan IP komputer yang menjalankan backend:

- `lib/api.ts` → `const API_URL = "http://192.168.1.x:3000/api"`
- `lib/auth.ts` → `` const base = "http://192.168.1.x:3000" ``

> Cara cek IP: `ipconfig` (Windows) atau `ifconfig` (Mac/Linux)  
> HP dan komputer harus berada di **WiFi yang sama**

### 3. Jalankan
```bash
npx expo start
```

Scan QR code dengan aplikasi **Expo Go** di HP.

## Struktur

```
app/
├── (auth)/
│   ├── login.tsx       # Halaman login
│   └── register.tsx    # Halaman register
├── (tabs)/
│   ├── dashboard.tsx   # List semua laporan
│   ├── buat-laporan.tsx # Form buat laporan
│   └── profil.tsx      # Profil & ganti password
└── laporan/
    └── [id].tsx        # Detail laporan + komentar
```

## Fitur

- Login & Register
- List laporan dengan filter status & pencarian
- Pull-to-refresh & infinite scroll
- Buat laporan (foto dari kamera/galeri, alamat, kategori)
- Detail laporan + komentar (tambah, edit, hapus)
- Admin: approve/reject/pending laporan
- Profil & ganti password
- Logout
