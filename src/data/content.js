/*
 * All personal copy, photos and configuration for Aya's birthday website.
 * The structure follows the original site: home (photo ring + book) →
 * puzzle → cake → galaxy.
 *
 * Text marked "verbatim" was carried over word-for-word from the original
 * static site (now in /legacy). The only intentional edits: pink heart emoji
 * (💕 💝) became blue hearts (💙) to match the new blue identity, and steps
 * that described the removed microphone/voice flow were adapted.
 *
 * To customise: edit the strings here. Components read everything from this
 * file, so nothing else needs to change.
 */

import aya01 from '../assets/photos/aya-01.jpg'
import aya01Sm from '../assets/photos/aya-01-sm.webp'
import aya02 from '../assets/photos/aya-02.jpg'
import aya02Sm from '../assets/photos/aya-02-sm.webp'
import aya03 from '../assets/photos/aya-03.jpg'
import aya03Sm from '../assets/photos/aya-03-sm.webp'
import aya04 from '../assets/photos/aya-04.jpg'
import aya04Sm from '../assets/photos/aya-04-sm.webp'
import aya05 from '../assets/photos/aya-05.jpg'
import aya05Sm from '../assets/photos/aya-05-sm.webp'
import aya06 from '../assets/photos/aya-06.jpg'
import aya06Sm from '../assets/photos/aya-06-sm.webp'
import aya07 from '../assets/photos/aya-07.jpg'
import aya07Sm from '../assets/photos/aya-07-sm.webp'
import aya08 from '../assets/photos/aya-08.jpg'
import aya08Sm from '../assets/photos/aya-08-sm.webp'
import aya09 from '../assets/photos/aya-09.jpg'
import aya09Sm from '../assets/photos/aya-09-sm.webp'
import aya10 from '../assets/photos/aya-10.jpg'
import aya10Sm from '../assets/photos/aya-10-sm.webp'
import puzzlePhoto from '../assets/photos/puzzle-ayil-aya.webp'
import bookCover from '../assets/illustrations/book-cover.webp'
import songM4a from '../assets/audio/backsound.m4a'
import songMp3 from '../assets/audio/backsound.mp3'

/* ── People & date ─────────────────────────────────────────── */
export const people = {
  recipient: 'Aya',
  recipientAffectionate: 'Ayaaa',
  sender: 'Ayil',
  couple: 'Aya & Ayil', // verbatim (legacy galaxy page)
}

export const birthday = {
  age: 18,
  isoDate: '2026-05-18',
  ringDate: '18/05/2026', // verbatim (legacy galaxy ring)
  displayDate: '18 Mei 2026',
}

/* ── Document meta ─────────────────────────────────────────── */
export const meta = {
  legacyTitle: 'Selamat Ulang Tahun, Aya!', // verbatim (legacy <title>)
}

/* ── Pages (same order as the original site) ───────────────── */
export const routes = ['beranda', 'puzzle', 'kue', 'galaksi']

export const pageTitles = {
  beranda: 'Selamat Ulang Tahun, Aya!', // verbatim (legacy index.html <title>)
  puzzle: 'Susun Puzzle-nya!', // verbatim (legacy puzzle <title>)
  kue: 'Tiup Lilinnya!', // verbatim (legacy cake <title>)
  galaksi: 'Kejutan Terakhir!', // verbatim (legacy galaxy <title>)
}

/* ── Welcome card (was the microphone permission modal) ────── */
export const welcome = {
  title: 'Selamat Datang!', // verbatim
  // The original asked for microphone + audio access; music needs neither.
  description: 'Untuk pengalaman terbaik, nyalakan musiknya ya.',
  start: 'Mulai',
  startWithoutMusic: 'Mulai tanpa musik',
}

/* ── Home: photo ring + book ──────────────────────────────── */
export const home = {
  ringLabel: 'Foto-foto Aya',
  bookHint: 'Ketuk bukunya ✨',
}

/**
 * Photos in their original carousel order (legacy img1–5, img7–11; there
 * was never an img6). `src` is the untouched original, `thumb` a 600 px
 * WebP for the ring, `focus` the CSS object-position for 3:4 cropping.
 */
export const photos = [
  { id: 'aya-01', src: aya01, thumb: aya01Sm, width: 720, height: 1280, focus: '50% 42%', legacy: 'Galaxy-love-main/images/img1.jpg', alt: 'Swafoto Aya berkerudung ungu muda, menatap kamera dengan tenang.' },
  { id: 'aya-02', src: aya02, thumb: aya02Sm, width: 720, height: 1280, focus: '50% 45%', legacy: 'Galaxy-love-main/images/img2.jpg', alt: 'Aya mengedipkan sebelah mata sambil tersenyum di bawah langit biru.' },
  { id: 'aya-03', src: aya03, thumb: aya03Sm, width: 1080, height: 1440, focus: '50% 50%', legacy: 'Galaxy-love-main/images/img3.jpg', alt: 'Swafoto Aya berkerudung abu-abu dari sudut miring, tersenyum tipis.' },
  { id: 'aya-04', src: aya04, thumb: aya04Sm, width: 720, height: 1280, focus: '32% 50%', legacy: 'Galaxy-love-main/images/img4.jpg', alt: 'Aya bersandar di dalam mobil dengan kerudung bermotif bunga.' },
  { id: 'aya-05', src: aya05, thumb: aya05Sm, width: 1080, height: 1440, focus: '50% 50%', legacy: 'Galaxy-love-main/images/img5.jpg', alt: 'Aya tersenyum sambil menopang dagu, memakai cincin dan jam tangan.' },
  { id: 'aya-06', src: aya06, thumb: aya06Sm, width: 720, height: 1280, focus: '50% 40%', legacy: 'Galaxy-love-main/images/img7.jpg', alt: 'Aya mengedipkan mata dan tersenyum dengan kerudung bermotif bunga, dihiasi stiker topi tidur.' },
  { id: 'aya-07', src: aya07, thumb: aya07Sm, width: 720, height: 1280, focus: '45% 42%', legacy: 'Galaxy-love-main/images/img8.jpg', alt: 'Aya memakai filter telinga kucing di kamarnya, dengan boneka beruang di belakang.' },
  { id: 'aya-08', src: aya08, thumb: aya08Sm, width: 720, height: 1280, focus: '40% 48%', legacy: 'Galaxy-love-main/images/img9.jpg', alt: 'Swafoto Aya berkerudung hitam di luar rumah, dengan coretan lucu di foto.' },
  { id: 'aya-09', src: aya09, thumb: aya09Sm, width: 720, height: 1280, focus: '50% 40%', legacy: 'Galaxy-love-main/images/img10.jpg', alt: 'Swafoto Aya berkerudung biru keabu-abuan, menatap kamera.' },
  { id: 'aya-10', src: aya10, thumb: aya10Sm, width: 720, height: 1280, focus: '36% 30%', legacy: 'Galaxy-love-main/images/img11.jpg', alt: 'Aya memakai kacamata hijau mint dan cemberut lucu di halaman berumput.' },
]

/* ── Letter (book) ─────────────────────────────────────────── */
export const letter = {
  cover: {
    src: bookCover,
    width: 720,
    height: 1080,
    alt: 'Sampul buku bergambar ilustrasi pasangan di taman bunga dengan tulisan "Ciptaan Tuhan Untukku".',
    legacy: 'card-animation/images/cover-book.jpg',
  },
  openLabel: 'Buka buku',
  closeLabel: 'Tutup buku',
  title: 'Selamat Ulang Tahun ke-18, Ayaaa Tersayang!', // verbatim
  // Verbatim. NOTE for the owner: the original greeting reads "Ayil" (the
  // sender's own name). Kept as written — change it here if you meant "Aya".
  greeting: 'Hai Sayaang Ayil,',
  paragraphs: [
    'Selamat ulang tahun yaa. Semoga di umur yang baru ini, ayaaa selalu diberikan kebahagiaan, kesehatan, dan semua yang ayaaa cita-citakan bisa tercapai.', // verbatim
    'Ayill punya sesuatu buat ayaa-nya. Klik tombol di bawah yaa!', // verbatim
  ],
  cta: 'Buka!', // verbatim — leads to the puzzle page
  signOff: 'Dari Ayil', // verbatim
}

/* ── Puzzle ────────────────────────────────────────────────── */
export const puzzle = {
  title: 'Susun Puzzle-nya!', // verbatim (legacy page title)
  image: {
    src: puzzlePhoto,
    width: 828,
    height: 1104,
    alt: 'Ayil dan Aya berseragam sekolah, memegang kue, buket bunga, trofi, dan sertifikat juara 1 kelas XII RPL.',
    legacy: 'puzzle-together-photos/images/img12.jpg (cropped to the photo inside its white instant-film frame)',
  },
  intro: {
    heading: 'Sebelum Mulai, Aya... 💙', // verbatim (💕 → 💙)
    message: 'Pertama-tama selesaikan puzzlenya dulu yah sayang, karena hubungan itu pasti ada rintangan.', // verbatim
    quote: 'Setiap tantangan yang kita hadapi bersama, membuat hubungan kita semakin kuat. Yuk Sayaang selesaikan puzzlenya dengan perasaan dan kesabaran.', // verbatim
    start: 'Siap! Mari Mulai', // verbatim
  },
  success: {
    badge: '🎉 Selamat Yah Cayaang!', // verbatim (was hidden by a CSS bug in the original)
    envelopeNote: 'Selamat cayaang berhasil selesaikan puzzlenya yah, ini aril punya hadiah buat ayaa.', // verbatim (orphaned envelope-modal page)
    title: 'Tuhkan Cayang Pasti Bisa!', // verbatim
    description: 'Dengan komunikasi dan sabar pasti masalah bisa teratasi. Terimakasih telah berjuang sejauh ini, di bawah ini hadiah aya. Silahkan klik tombol di bawah untuk melihat hadiahnya! 💙', // verbatim (💝 → 💙)
    cta: 'Buka Hadiah Aya', // verbatim — leads to the cake page
  },
  // The original generated ~12 irregular pieces; 3 × 4 keeps that count.
  cols: 3,
  rows: 4,
}

/* ── Cake ──────────────────────────────────────────────────── */
export const cake = {
  title: 'Tiup Lilinnya!', // verbatim (legacy page title)
  instructions: {
    heading: 'Hai Cayaang! 🎂', // verbatim
    steps: [
      'Silakan berada di ruangan hening.', // verbatim
      'Ketuk kue untuk meletakkan lilin.', // verbatim
      'Tiup kue tersebut (gunakan mikrofon).', // verbatim
    ],
    secretStep: { before: 'Ucapkan ', phrase: '"ayil sayang aya"', after: ' untuk kejutan.' }, // verbatim
    start: 'Siap, Mulai', // verbatim
  },
  guidance: {
    place: 'Klik di atas kue untuk menaruh lilin', // verbatim
    blow: 'Tiup lilinnya dengan meniup ke mikrofon', // verbatim
    secret: 'Ucapkan kata rahasia untuk kejutan!', // verbatim
  },
  counterLabel: 'Lilin di atas kue:', // verbatim
  maxCandles: 18,
  help: {
    title: 'Bantuan', // verbatim
    text: 'Tidak bisa beralih halaman? Tekan tombol di bawah ini.', // verbatim
    cta: 'Buka Halaman Selanjutnya', // verbatim
  },
}

/* ── Galaxy (final surprise) ─────────────────────────────── */
export const finale = {
  title: 'Kejutan Terakhir!', // verbatim (legacy page title)
  secret: {
    hint: 'ayil sayang aya', // verbatim phrase from the cake instructions
    // Legacy rule: any phrase containing "sayang" unlocks the surprise.
    keyword: 'sayang',
  },
  planetGreeting: 'Happy Birthday Ayaa!', // verbatim
  rings: ['♡Happy Birthday Sayang♡', 'I love you', 'Always & Forever', '18/05/2026'], // verbatim
  couple: people.couple, // verbatim "Aya & Ayil"
  tapHint: 'Sentuh planetnya',
  signOff: 'Dari Ayil', // verbatim (letter sign-off)
}

/* ── Music ─────────────────────────────────────────────────── */
export const music = {
  // The original backsound.mp3 was actually AAC audio in a DASH/MP4
  // container. It was repackaged losslessly to .m4a, plus a real MP3
  // fallback for browsers without AAC support. No title metadata exists,
  // so the song is not named in the UI.
  label: 'Lagu latar',
  sources: [
    { src: songM4a, type: 'audio/mp4' },
    { src: songMp3, type: 'audio/mpeg' },
  ],
  volume: 0.65,
}
