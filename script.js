/**
 * PHÙ THỦY GIÀ - MODERN EDITORIAL FANTASY NOVEL LOGIC
 * Powered by GSAP & ScrollTrigger
 * Implements: Fullscreen Chapter Cover Hero, Parallax Scrollytelling,
 * Clean Typography, Auto-bookmarking, and Reading Preferences.
 */

// Register GSAP plugins
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// NOVEL_DATA is loaded from data.js
if (typeof NOVEL_DATA === 'undefined') {
  console.warn("NOVEL_DATA chưa được tải từ data.js");
}

// Application State
const STATE = {
  currentChapterId: 1,
  theme: 'dark',
  font: 'bookerly',
  fontSize: 24,
  contentWidth: 760,
  bgOpacity: 0
};

// Storage Keys
const STORAGE_KEY_CHAPTER = 'phuthuygia_last_chapter_v2';
const STORAGE_KEY_SCROLL = 'phuthuygia_last_scroll_v2';
const STORAGE_KEY_PREFS = 'phuthuygia_reader_prefs_v4';

// DOM Elements
const docEl = document.documentElement;
const progressBar = document.getElementById('progress-bar');
const readerHeader = document.getElementById('reader-header');
const navChapterTitle = document.getElementById('nav-chapter-title');
const navSep = document.getElementById('nav-sep');
const navBookBrand = document.getElementById('nav-book-brand');
const btnHome = document.getElementById('btn-home');
const homeStage = document.getElementById('home-stage');
const chapterStage = document.getElementById('chapter-stage');

// Volume Synopses for Home 3D Book Cards
const VOLUME_SYNOPSES = {
  1: "London thập niên sương mù và những bí mật gia tộc. Sau biến cố người quản gia phản bội, tiểu thư Shani Iris khép kín trái tim mình cho đến ngày gặp gỡ thiếu niên bí ẩn Trần Nam dưới bóng cây sồi già, mở đầu cho bản khế ước định mệnh.",
  2: "Chuyến tàu tốc hành bí mật rẽ sương mù đưa người được chọn tới Sân ga Số 0 và Đại Học Viện Ma Thuật Aethelgard. Giữa những âm mưu quyền lực gia tộc, Trần Nam bước chân vào Nhà Rắn Vespera với những bí ẩn kinh hoàng.",
  3: "Những vệt máu bạc dưới tán lá sồi ngàn năm và những mảnh ghép về nhà giả kim huyền thoại Nicolas Flamel. Ranh giới giữa ánh sáng và bóng tối bắt đầu rạn nứt khi các cổ vật ngàn năm lần lượt thức tỉnh.",
  4: "Bí mật chết người về loại hàn độc cực hiếm phát tán từ nhà kính số một. Cạm bẫy trùng trùng tại phế tích cổ Devon đưa hai số phận vào thử thách sống còn khốc liệt nhất."
};

// Drawers
const tocDrawer = document.getElementById('toc-drawer');
const settingsDrawer = document.getElementById('settings-drawer');
const drawerBackdrop = document.getElementById('drawer-backdrop');
const btnToc = document.getElementById('btn-toc');
const btnSettings = document.getElementById('btn-settings');
const btnCloseToc = document.getElementById('btn-close-toc');
const btnCloseSettings = document.getElementById('btn-close-settings');
const tocList = document.getElementById('toc-list');
const tocSearch = document.getElementById('toc-search');

// Settings Controls
const fontSizeSlider = document.getElementById('font-size-slider');
const fontSizeInput = document.getElementById('font-size-input');
const btnFontDec = document.getElementById('btn-font-dec');
const btnFontInc = document.getElementById('btn-font-inc');
const contentWidthSlider = document.getElementById('content-width-slider');
const contentWidthInput = document.getElementById('content-width-input');
const presetWidthBtns = document.querySelectorAll('.pill-btn[data-preset-width]');
const bgOpacitySlider = document.getElementById('bg-opacity-slider');
const bgOpacityVal = document.getElementById('bg-opacity-val');

// Toast
const bookmarkToast = document.getElementById('bookmark-toast');
const toastDesc = document.getElementById('toast-desc');
const btnResumeReading = document.getElementById('btn-resume-reading');
const btnDismissToast = document.getElementById('btn-dismiss-toast');

// Lightbox
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightbox-image');
const lightboxCaption = document.getElementById('lightbox-caption');
const lightboxCloseBtn = document.getElementById('lightbox-close-btn');

// Client-side text parser: Cho phép trang web tự đọc thẳng Phu Thuy Gia.txt khi người dùng up từ điện thoại
function parseNovelText(rawText) {
  const lines = rawText.split(/\r?\n/);
  let currentVol = null;
  let currentCh = null;
  const volumes = [];
  let globalId = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const volMatch = line.match(/^TẬP\s+(\d+)\s*[:–—\-]\s*(.+)$/i);
    if (volMatch) {
      const volNum = parseInt(volMatch[1], 10);
      currentVol = {
        volumeIndex: volNum,
        volumeTitle: `Tập ${volNum}: ${volMatch[2].trim()}`,
        chapters: []
      };
      volumes.push(currentVol);
      continue;
    }

    const lifeMatch = line.match(/^Life\s+(\d+)\s*[-–—]\s*(.+)$/i);
    if (lifeMatch) {
      if (!currentVol) {
        currentVol = {
          volumeIndex: 1,
          volumeTitle: 'Tập 1: Khế Ước Iris',
          chapters: []
        };
        volumes.push(currentVol);
      }

      const lifeNumStr = lifeMatch[1].padStart(2, '0');
      const chTitle = lifeMatch[2].trim().replace(/\.$/, '');
      currentCh = {
        id: globalId++,
        volumeIndex: currentVol.volumeIndex,
        lifeNumStr: lifeNumStr,
        number: `Chương ${lifeNumStr}`,
        title: chTitle,
        quote: '',
        heroImage: `Images/Vol-${currentVol.volumeIndex}/Life-${lifeNumStr}/image-01.jpg`,
        paragraphs: [],
        illustrations: []
      };
      currentVol.chapters.push(currentCh);
      continue;
    }

    if (/^[=\-—_]{3,}$/.test(line) || line === '---') continue;
    let cleanLine = line;
    if (/={3,}/.test(cleanLine)) {
      cleanLine = cleanLine.replace(/={3,}/g, '').trim();
      if (!cleanLine) continue;
    }

    if (currentCh && cleanLine.length > 0) {
      if (currentCh.paragraphs.length === 0) {
        const sentenceMatch = cleanLine.match(/^([^.!?]+[.!?])/);
        currentCh.quote = sentenceMatch ? `«${sentenceMatch[1].trim()}»` : `«${cleanLine.substring(0, 120)}...»`;
      }
      currentCh.paragraphs.push(cleanLine);
    }
  }

  // Giữ lại cấu trúc illustrations nếu đã có trong NOVEL_DATA
  if (typeof NOVEL_DATA !== 'undefined' && NOVEL_DATA && NOVEL_DATA.volumes) {
    const existingIllustrations = {};
    NOVEL_DATA.volumes.forEach(v => {
      v.chapters.forEach(c => {
        if (c.illustrations && c.illustrations.length > 0) {
          existingIllustrations[`${v.volumeIndex}-${c.lifeNumStr}`] = c.illustrations;
        }
      });
    });
    volumes.forEach(v => {
      v.chapters.forEach(c => {
        const key = `${v.volumeIndex}-${c.lifeNumStr}`;
        if (existingIllustrations[key]) {
          c.illustrations = existingIllustrations[key];
          c.hasIllustration = true;
        }
      });
    });
  }

  return {
    title: 'Phù Thủy Giả',
    author: 'Andy Hoàng Hiếu',
    highlights: (typeof NOVEL_DATA !== 'undefined' && NOVEL_DATA && NOVEL_DATA.highlights) ? NOVEL_DATA.highlights : [],
    volumes: volumes
  };
}

// Tự động kiểm tra file Phu Thuy Gia.txt mới nhất chạy ngầm (bỏ qua cache)
async function syncLatestContent() {
  try {
    const res = await fetch(`contents/combine/Phu Thuy Gia.txt?t=${Date.now()}`);
    if (!res.ok) return;
    const text = await res.text();
    if (!text || text.length < 1000) return;

    const parsedData = parseNovelText(text);
    if (!parsedData || !parsedData.volumes || parsedData.volumes.length === 0) return;

    // Tự động tải Text Highlights mới nhất nếu có thay đổi từ file json/txt
    try {
      const hRes = await fetch(`contents/text-highlight.json?t=${Date.now()}`);
      if (hRes.ok) {
        const hJson = await hRes.json();
        if (Array.isArray(hJson)) {
          parsedData.highlights = hJson.map(w => w.trim()).filter(Boolean);
        }
      } else {
        const tRes = await fetch(`contents/text-highlight.txt?t=${Date.now()}`);
        if (tRes.ok) {
          const tText = await tRes.text();
          parsedData.highlights = tText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('#'));
        }
      }
    } catch (_) {}

    // So sánh xem nội dung hoặc highlights có mới hơn không
    const newChapters = [];
    parsedData.volumes.forEach(v => v.chapters.forEach(c => newChapters.push(c)));
    const oldChapters = (typeof NOVEL_DATA !== 'undefined' && NOVEL_DATA && NOVEL_DATA.volumes) ? getAllChapters() : [];

    const oldHighlights = (typeof NOVEL_DATA !== 'undefined' && NOVEL_DATA && NOVEL_DATA.highlights) ? NOVEL_DATA.highlights : [];
    const highlightsChanged = JSON.stringify(parsedData.highlights || []) !== JSON.stringify(oldHighlights);

    const isDifferent = highlightsChanged || (newChapters.length !== oldChapters.length) ||
      (newChapters.length > 0 && oldChapters.length > 0 && (
        newChapters[newChapters.length - 1].paragraphs.length !== oldChapters[oldChapters.length - 1].paragraphs.length ||
        newChapters[newChapters.length - 1].title !== oldChapters[oldChapters.length - 1].title
      ));

    if (isDifferent || typeof NOVEL_DATA === 'undefined') {
      if (typeof NOVEL_DATA !== 'undefined' && NOVEL_DATA) {
        Object.assign(NOVEL_DATA, parsedData);
      } else {
        window.NOVEL_DATA = parsedData;
      }
      console.log(`✓ [Auto-Sync] Đã cập nhật ${newChapters.length} chương mới nhất từ Phu Thuy Gia.txt`);

      buildTableOfContents();
      if (STATE.currentView === 'home') {
        showHome();
      } else if (STATE.currentChapterId) {
        const currentCh = getChapterById(STATE.currentChapterId);
        if (currentCh) renderChapter(STATE.currentChapterId, false);
      }
    }
  } catch (err) {
    console.warn('[Auto-Sync] Không thể fetch trực tiếp file text, sử dụng data.js:', err);
  }
}

// Flatten chapters for easy lookup
function getAllChapters() {
  const list = [];
  NOVEL_DATA.volumes.forEach(vol => {
    vol.chapters.forEach(ch => {
      list.push({ ...ch, volumeTitle: vol.volumeTitle });
    });
  });
  return list;
}

function getChapterById(id) {
  return getAllChapters().find(ch => ch.id === id);
}

// Initialize Application
function initApp() {
  loadPreferences();
  buildTableOfContents();
  setupEventListeners();

  // Check URL hash for direct chapter linking
  const hash = window.location.hash;
  const hashMatch = hash.match(/#chapter-(\d+)/);

  if (hashMatch) {
    const chId = parseInt(hashMatch[1]);
    if (getChapterById(chId)) {
      renderChapter(chId, false);
      return;
    }
  }

  // Default: Open Home View
  showHome();

  // Show reading bookmark notification if user has a saved progress
  const savedChapter = parseInt(localStorage.getItem(STORAGE_KEY_CHAPTER));
  if (savedChapter && getChapterById(savedChapter)) {
    const ch = getChapterById(savedChapter);
    toastDesc.textContent = `Bạn đang đọc dở ${ch.number}: "${ch.title}".`;
    bookmarkToast.classList.add('show');
    setTimeout(() => bookmarkToast.classList.remove('show'), 8000);
  }

  // Tự động kiểm tra đồng bộ nội dung mới từ Phu Thuy Gia.txt (bỏ qua cache)
  syncLatestContent();
}

// Show Home Landing Page
function showHome() {
  STATE.currentView = 'home';
  window.location.hash = '';

  // Kill chapter ScrollTriggers
  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.getAll().forEach(t => t.kill());
  }

  homeStage.style.display = 'flex';
  chapterStage.style.display = 'none';

  // Header display for Home view
  progressBar.style.width = '0%';
  if (navSep) navSep.style.display = 'none';
  if (navChapterTitle) navChapterTitle.style.display = 'none';
  readerHeader.classList.remove('scrolled');

  document.title = `${NOVEL_DATA.title} - Trang Chủ Tiểu Thuyết Kỳ Ảo`;

  renderHomeView();
  updateAmbientBg('Images/Vol-1/Life-00/image-01.jpg');
  window.scrollTo({ top: 0, behavior: 'instant' });
}

// Render Home View HTML
function renderHomeView() {
  const savedChapter = parseInt(localStorage.getItem(STORAGE_KEY_CHAPTER));
  const savedChObj = savedChapter ? getChapterById(savedChapter) : null;

  let heroActionsHtml = '';
  if (savedChObj) {
    heroActionsHtml = `
      <button class="btn-hero-primary" id="btn-home-resume">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        <span>Đọc tiếp: ${savedChObj.number}</span>
      </button>
      <button class="btn-hero-secondary" id="btn-home-start">
        Bắt đầu đọc (Chương 00)
      </button>
      <button class="btn-hero-secondary" id="btn-home-vols">
        Danh sách 4 Tập ↓
      </button>
    `;
  } else {
    heroActionsHtml = `
      <button class="btn-hero-primary" id="btn-home-start">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        <span>Bắt đầu đọc tác phẩm</span>
      </button>
      <button class="btn-hero-secondary" id="btn-home-vols">
        Khám phá các Tập sách ↓
      </button>
    `;
  }

  // Generate 3D Book Cards for Volumes
  let booksGridHtml = '';
  const romanNums = ['I', 'II', 'III', 'IV'];

  NOVEL_DATA.volumes.forEach((vol, vIdx) => {
    const volNum = vIdx + 1;
    const roman = romanNums[vIdx] || volNum;
    const chCount = vol.chapters.length;
    const firstCh = vol.chapters[0];
    const firstChId = firstCh ? firstCh.id : 1;
    const coverImg = vol.coverImage || ((firstCh && firstCh.heroImage) ? firstCh.heroImage : `Images/Vol-${volNum}/Life-00/image-01.jpg`);
    const synopsis = VOLUME_SYNOPSES[volNum] || 'Khám phá thế giới ma thuật ngầm cổ xưa cùng tiểu thư Shani và cận vệ Trần Nam.';
    const cleanTitle = vol.volumeTitle.replace(/^Tập\s+\d+:\s*/i, '');

    booksGridHtml += `
      <article class="book-volume-card" data-vol-index="${volNum}">
        <div class="book-3d-wrap" data-start-id="${firstChId}" title="Đọc ngay ${vol.volumeTitle}">
          <div class="book-3d" style="background-image: url('${coverImg}');">
            <div class="book-cover-inner"></div>
            <div class="book-cover-top">
              <span class="book-cover-badge">TẬP ${roman}</span>
              <span class="book-cover-novel-name">PHÙ THỦY GIẢ</span>
            </div>
            <div class="book-cover-bottom">
              <h3 class="book-cover-vol-title">${cleanTitle}</h3>
              <span class="book-cover-author">ANDY HOÀNG HIẾU</span>
            </div>
          </div>
        </div>

        <div class="book-card-body">
          <div class="book-card-meta">
            <span class="book-card-vol-tag">TẬP ${roman}</span>
            <span class="book-card-dot"></span>
            <span class="book-card-count">${chCount} Chương</span>
          </div>

          <h3 class="book-card-title">${cleanTitle}</h3>
          <p class="book-card-synopsis">${synopsis}</p>

          <div class="book-card-actions">
            <button class="btn-card-read" data-start-id="${firstChId}">
              Đọc Tập Này &rarr;
            </button>
            <button class="btn-card-toc" data-vol-name="${vol.volumeTitle}">
              Mục lục
            </button>
          </div>
        </div>
      </article>
    `;
  });

  homeStage.innerHTML = `
    <!-- Home Hero Banner -->
    <section class="home-hero">
      <div class="home-hero-bg"></div>
      <div class="home-hero-overlay"></div>
      
      <div class="home-hero-content">
        <span class="home-hero-badge">✦ Tiểu Thuyết Kỳ Ảo Hiện Đại ✦</span>
        <h1 class="home-hero-title">PHÙ THỦY GIẢ</h1>
        <div class="home-hero-meta">Tác Giả: Andy Hoàng Hiếu • 4 Tập • 70 Chương Hoàn Chỉnh</div>
        <p class="home-hero-synopsis">
          Giữa sương mù London và những âm mưu gia tộc quý tộc, một thiếu niên mang thân phận đặc biệt dưới gốc sồi già và nàng tiểu thư đài các bước vào bản khế ước định mệnh dẫn tới thế giới ma thuật ngầm cổ xưa...
        </p>
        <div class="home-hero-actions">
          ${heroActionsHtml}
        </div>
      </div>
    </section>

    <!-- Volumes Grid Section -->
    <section class="home-vols-section" id="volumes-grid-section">
      <div class="home-vols-header">
        <span class="home-vols-badge">DANH TÁC</span>
        <h2 class="home-vols-title">CÁC TẬP TÁC PHẨM</h2>
      </div>

      <div class="volume-books-grid">
        ${booksGridHtml}
      </div>
    </section>
  `;

  // Attach Home event listeners
  const btnResume = document.getElementById('btn-home-resume');
  if (btnResume && savedChObj) {
    btnResume.addEventListener('click', () => {
      renderChapter(savedChapter);
      const savedScroll = parseInt(localStorage.getItem(STORAGE_KEY_SCROLL));
      if (savedScroll) {
        setTimeout(() => window.scrollTo({ top: savedScroll, behavior: 'smooth' }), 300);
      }
    });
  }

  const btnStart = document.getElementById('btn-home-start');
  if (btnStart) {
    btnStart.addEventListener('click', () => renderChapter(1));
  }

  const btnVols = document.getElementById('btn-home-vols');
  if (btnVols) {
    btnVols.addEventListener('click', () => {
      document.getElementById('volumes-grid-section').scrollIntoView({ behavior: 'smooth' });
    });
  }

  // 3D Book Cover Clicks & Read buttons
  homeStage.querySelectorAll('.book-3d-wrap, .btn-card-read').forEach(el => {
    el.addEventListener('click', () => {
      const startId = parseInt(el.dataset.startId) || 1;
      renderChapter(startId);
    });
  });

  // TOC drawer buttons for each volume
  homeStage.querySelectorAll('.btn-card-toc').forEach(btn => {
    btn.addEventListener('click', () => {
      openDrawer(tocDrawer);
    });
  });

  // Tự động kiểm tra ảnh bìa tập nếu vừa tải lên từ điện thoại
  homeStage.querySelectorAll('.book-volume-card').forEach(card => {
    const volNum = parseInt(card.dataset.volIndex);
    if (volNum) resolveVolumeCover(volNum, card);
  });
}

// Tự động kiểm tra và nâng cấp ảnh bìa chương (thử jpg, png, webp, jpeg nếu tải từ điện thoại)
function resolveHeroImage(chapter) {
  const heroBg = document.getElementById('hero-bg');
  if (!heroBg) return;

  const exts = ['jpg', 'png', 'webp', 'jpeg'];
  let extIdx = 0;
  function tryHero() {
    if (extIdx >= exts.length) return;
    const ext = exts[extIdx];
    const url = `Images/Vol-${chapter.volumeIndex}/Life-${chapter.lifeNumStr}/image-01.${ext}`;
    const img = new Image();
    img.onload = () => {
      chapter.heroImage = url;
      heroBg.style.backgroundImage = `url('${url}')`;
      updateAmbientBg(url);
    };
    img.onerror = () => {
      extIdx++;
      tryHero();
    };
    img.src = `${url}?t=${Date.now()}`;
  }
  tryHero();
}

// Tự động kiểm tra và chèn thêm ảnh minh họa nếu tác giả vừa up ảnh lên từ điện thoại (image-02, image-03, ...)
function probeAndInjectIllustrations(chapter) {
  const proseEl = document.querySelector('.reading-article .prose');
  if (!proseEl) return;

  const pNodes = proseEl.querySelectorAll('p');
  if (pNodes.length === 0) return;

  const exts = ['jpg', 'png', 'webp', 'jpeg'];
  const maxImages = 5; // Quét từ image-02 đến image-06

  for (let idx = 2; idx <= maxImages; idx++) {
    // Nếu trong DOM đã có ảnh này rồi thì bỏ qua
    if (document.querySelector(`.illustration-card[data-img*="image-0${idx}."]`)) {
      continue;
    }

    let extIdx = 0;
    function tryExt() {
      if (extIdx >= exts.length) return;
      const ext = exts[extIdx];
      const url = `Images/Vol-${chapter.volumeIndex}/Life-${chapter.lifeNumStr}/image-0${idx}.${ext}`;
      const img = new Image();
      img.onload = () => {
        if (document.querySelector(`.illustration-card[data-img*="image-0${idx}."]`)) return;
        if (!chapter.illustrations) chapter.illustrations = [];
        if (!chapter.illustrations.some(ill => ill.index === idx)) {
          chapter.illustrations.push({ index: idx, url: url });
          chapter.illustrations.sort((a, b) => a.index - b.index);
          chapter.hasIllustration = true;
        }

        const step = Math.max(1, Math.floor(pNodes.length / (idx + 1)));
        const targetP = pNodes[Math.min(pNodes.length - 1, (idx - 1) * step)];
        if (targetP) {
          const figure = document.createElement('figure');
          figure.className = 'illustration-card';
          figure.dataset.img = url;
          figure.innerHTML = `
            <div class="illustration-card-img-wrap">
              <img src="${url}" alt="" loading="lazy">
            </div>
          `;
          figure.addEventListener('click', () => {
            openLightbox(url, `Minh họa ${chapter.number}`);
          });
          targetP.parentNode.insertBefore(figure, targetP.nextSibling);
        }
      };
      img.onerror = () => {
        extIdx++;
        tryExt();
      };
      img.src = `${url}?t=${Date.now()}`;
    }
    tryExt();
  }
}

// Tự động kiểm tra ảnh bìa tập nếu vừa tải lên từ điện thoại (cover.jpg/png/webp)
function resolveVolumeCover(volNum, cardEl) {
  const exts = ['cover.jpg', 'cover.png', 'cover.webp', 'cover.jpeg', 'image-01.jpg', 'image-01.png'];
  let extIdx = 0;
  function tryVol() {
    if (extIdx >= exts.length) return;
    const ext = exts[extIdx];
    const url = `Images/Vol-${volNum}/${ext}`;
    const img = new Image();
    img.onload = () => {
      const book3d = cardEl.querySelector('.book-3d');
      if (book3d) book3d.style.backgroundImage = `url('${url}')`;
    };
    img.onerror = () => {
      extIdx++;
      tryVol();
    };
    img.src = `${url}?t=${Date.now()}`;
  }
  tryVol();
}

// Format Thoughts: Suy nghĩ nằm trong ngoặc kép “ ” (tự động in nghiêng)
function formatThoughts(text) {
  if (!text) return text;
  return text.replace(/[“\u201C]([^”\u201D\n]+)[”\u201D]|"([^"\n<>]+)"/g, (m, p1, p2) => {
    return '<span class="thought-text">“' + (p1 || p2) + '”</span>';
  });
}

// Text Highlighting Helper: in nghiêng và màu cam sậm theo contents/text-highlight
function applyTextHighlights(text) {
  if (!text) return text;
  if (!NOVEL_DATA.highlights || NOVEL_DATA.highlights.length === 0) return text;

  if (!window._highlightRegex) {
    const escaped = NOVEL_DATA.highlights
      .filter(w => w && w.trim().length > 0)
      .sort((a, b) => b.length - a.length)
      .map(w => w.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    if (escaped.length === 0) return text;
    // Lookahead (?![^<]*>) ensures we do NOT replace keywords inside HTML tag attributes
    window._highlightRegex = new RegExp(`(?![^<]*>)(${escaped.join('|')})`, 'gi');
  }

  return text.replace(window._highlightRegex, '<span class="text-highlight">$1</span>');
}

// Render Chapter with Fullscreen Cover Banner & GSAP Animations
function renderChapter(chapterId, scrollIntoView = true) {
  const chapter = getChapterById(chapterId);
  if (!chapter) return;

  STATE.currentView = 'reader';
  STATE.currentChapterId = chapterId;
  localStorage.setItem(STORAGE_KEY_CHAPTER, chapterId);
  window.location.hash = 'chapter-' + chapterId;

  // Toggle view containers
  homeStage.style.display = 'none';
  chapterStage.style.display = 'block';
  if (chapter && chapter.heroImage) {
    updateAmbientBg(chapter.heroImage);
  }

  // Update header text
  if (navSep) navSep.style.display = 'inline';
  if (navChapterTitle) {
    navChapterTitle.style.display = 'inline';
    navChapterTitle.textContent = `${chapter.number}: ${chapter.title}`;
  }
  document.title = `${chapter.number}: ${chapter.title} - ${NOVEL_DATA.title}`;

  // Kill existing ScrollTriggers to prevent leaks
  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.getAll().forEach(t => t.kill());
  }

  // Build HTML: 1. Fullscreen Hero Banner + 2. Reading Stage
  let html = `
    <!-- FULLSCREEN COVER HERO BANNER (GSAP Scrollytelling Stage) -->
    <section class="chapter-hero-cover" id="hero-cover">
      <div class="hero-bg-layer" id="hero-bg" style="background-image: url('${chapter.heroImage}');"></div>
      <div class="hero-gradient-overlay"></div>

      <div class="hero-content" id="hero-content">
        <span class="hero-eyebrow">${chapter.volumeTitle}</span>
        <span class="hero-chapter-num">${chapter.number}</span>
        <h1 class="hero-chapter-title">${chapter.title}</h1>
        <p class="hero-quote">${chapter.quote}</p>
      </div>

      <div class="hero-scroll-indicator" id="hero-scroll-btn">
        <span>Cuộn xuống để đọc</span>
        <svg class="scroll-arrow-anim" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M7 13l5 5 5-5M7 6l5 5 5-5"/>
        </svg>
      </div>
    </section>

    <!-- MAIN READING STAGE -->
    <section class="reading-stage" id="reading-content">
      <article class="reading-article">
        <div class="prose">
  `;

  // Calculate inline illustration positions (image-02, image-03, ...)
  const inlineIllustrations = chapter.illustrations || (chapter.illustration ? [chapter.illustration] : []);
  const totalParagraphs = chapter.paragraphs.length;
  const insertMap = {};

  if (inlineIllustrations.length > 0) {
    const step = Math.max(1, Math.floor(totalParagraphs / (inlineIllustrations.length + 1)));
    inlineIllustrations.forEach((ill, i) => {
      const targetIdx = Math.min(totalParagraphs - 1, (i + 1) * step);
      if (!insertMap[targetIdx]) insertMap[targetIdx] = [];
      insertMap[targetIdx].push(ill);
    });
  }

  // Render paragraphs with Editorial Drop Cap and Inline Illustrations
  chapter.paragraphs.forEach((p, idx) => {
    // Tự động bỏ qua bất kỳ dòng phân cách dạng "====", "----", "____"
    const trimmed = p.trim();
    if (/^[=\-—_]{3,}$/.test(trimmed)) return;

    // Nhận diện câu thoại: bắt đầu bằng ký tự – , — hoặc -
    const isDialogue = /^[–—\-]\s*/.test(trimmed);

    if (idx === 0) {
      let formattedP = p;
      const match = p.match(/^(\S+)/);
      if (match) {
        const firstWord = match[1];
        const titleCased = firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
        formattedP = titleCased + p.slice(firstWord.length);
      }
      const firstLetter = formattedP.charAt(0);
      const rest = formattedP.slice(1);

      // Định dạng suy nghĩ trong ngoặc kép rồi áp dụng highlight
      let processedRest = formatThoughts(rest);
      processedRest = applyTextHighlights(processedRest);

      html += `
        <p class="intro-paragraph ${isDialogue ? 'is-dialogue' : ''}">
          <span class="drop-cap">${firstLetter}</span>${processedRest}
        </p>
      `;
    } else {
      // Định dạng suy nghĩ trong ngoặc kép rồi áp dụng highlight
      let processedP = formatThoughts(p);
      processedP = applyTextHighlights(processedP);

      html += `<p class="${isDialogue ? 'is-dialogue' : ''}">${processedP}</p>`;
    }

    // Insert inline illustration(s) (image-02, image-03, ...)
    if (insertMap[idx]) {
      insertMap[idx].forEach(ill => {
        const imgUrl = typeof ill === 'string' ? ill : (ill.url || ill);
        html += `
          <figure class="illustration-card" data-img="${imgUrl}">
            <div class="illustration-card-img-wrap">
              <img src="${imgUrl}" alt="" loading="lazy">
            </div>
          </figure>
        `;
      });
    }
  });

  // Render remaining paragraphs if any
  if (chapter.paragraphsCont && chapter.paragraphsCont.length > 0) {
    chapter.paragraphsCont.forEach(p => {
      html += `<p>${p}</p>`;
    });
  }

  html += `
        </div> <!-- End prose -->

        <!-- Bottom Chapter Navigation -->
        <nav class="chapter-bottom-nav">
          <button id="btn-prev-ch" class="nav-ch-card">
            <span class="nav-ch-arrow">&larr;</span>
            <div class="nav-ch-meta">
              <span class="nav-ch-label">Chương trước</span>
              <span class="nav-ch-title" id="prev-ch-title">--</span>
            </div>
          </button>

          <button id="btn-center-toc" class="nav-toc-center-btn">
            Mục lục tác phẩm
          </button>

          <button id="btn-next-ch" class="nav-ch-card next">
            <div class="nav-ch-meta">
              <span class="nav-ch-label">Chương kế tiếp</span>
              <span class="nav-ch-title" id="next-ch-title">--</span>
            </div>
            <span class="nav-ch-arrow">&rarr;</span>
          </button>
        </nav>
      </article>
    </section>
  `;

  chapterStage.innerHTML = html;

  // Scroll to top
  if (scrollIntoView) {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // Wire up Bottom Navigation
  setupBottomNav(chapterId);

  // Wire up Scroll indicator click
  document.getElementById('hero-scroll-btn').addEventListener('click', () => {
    document.getElementById('reading-content').scrollIntoView({ behavior: 'smooth' });
  });

  // Wire up Center TOC button
  document.getElementById('btn-center-toc').addEventListener('click', () => {
    openDrawer(tocDrawer);
  });

  // Wire up Illustration Lightbox
  document.querySelectorAll('.illustration-card').forEach(card => {
    card.addEventListener('click', () => {
      openLightbox(card.dataset.img, card.dataset.cap);
    });
  });

  // Highlight active TOC item
  document.querySelectorAll('.toc-ch-row').forEach(row => {
    row.classList.toggle('active', parseInt(row.dataset.id) === chapterId);
  });

  // Init GSAP Scrollytelling on Hero Banner
  initGsapAnimations();

  // Tự động giải quyết ảnh bìa chương và ảnh minh họa (dành cho tải ảnh từ điện thoại)
  resolveHeroImage(chapter);
  probeAndInjectIllustrations(chapter);
}

// Setup GSAP Parallax & Scrollytelling
function initGsapAnimations() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  // Kill existing ScrollTriggers to avoid duplicate triggers
  ScrollTrigger.getAll().forEach(t => t.kill());

  // Parallax on Hero Background Image
  gsap.fromTo("#hero-bg", 
    { y: "0%" },
    {
      y: "28%",
      ease: "none",
      scrollTrigger: {
        trigger: "#hero-cover",
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    }
  );

  // Fade out Hero Text when scrolling down, and RESTORE when scrolling back up
  gsap.fromTo("#hero-content", 
    { opacity: 1, y: 0 },
    {
      opacity: 0,
      y: -40,
      ease: "none",
      scrollTrigger: {
        trigger: "#hero-cover",
        start: "top top",
        end: "65% top",
        scrub: true
      }
    }
  );

  // Fade out Scroll button when scrolling down, and RESTORE when scrolling back up
  gsap.fromTo("#hero-scroll-btn", 
    { opacity: 1 },
    {
      opacity: 0,
      ease: "none",
      scrollTrigger: {
        trigger: "#hero-cover",
        start: "top top",
        end: "25% top",
        scrub: true
      }
    }
  );

  // Header State: Switch from transparent to Glassmorphism when scrolled past hero
  ScrollTrigger.create({
    trigger: "#reading-content",
    start: "top 80px",
    onEnter: () => readerHeader.classList.add('scrolled'),
    onLeaveBack: () => readerHeader.classList.remove('scrolled')
  });

  ScrollTrigger.refresh();
}

// Bottom Nav Controls
function setupBottomNav(currentId) {
  const chapters = getAllChapters();
  const currentIndex = chapters.findIndex(ch => ch.id === currentId);

  const btnPrev = document.getElementById('btn-prev-ch');
  const btnNext = document.getElementById('btn-next-ch');
  const prevTitle = document.getElementById('prev-ch-title');
  const nextTitle = document.getElementById('next-ch-title');

  if (currentIndex > 0) {
    const prevCh = chapters[currentIndex - 1];
    btnPrev.disabled = false;
    prevTitle.textContent = `${prevCh.number}: ${prevCh.title}`;
    btnPrev.onclick = () => renderChapter(prevCh.id);
  } else {
    btnPrev.disabled = true;
    prevTitle.textContent = "Hết phần trước";
  }

  if (currentIndex < chapters.length - 1) {
    const nextCh = chapters[currentIndex + 1];
    btnNext.disabled = false;
    nextTitle.textContent = `${nextCh.number}: ${nextCh.title}`;
    btnNext.onclick = () => renderChapter(nextCh.id);
  } else {
    btnNext.disabled = true;
    nextTitle.textContent = "Chờ chương tiếp theo...";
  }
}

// Table of Contents Builder
function buildTableOfContents(searchFilter = '') {
  tocList.innerHTML = '';
  const searchLower = searchFilter.toLowerCase().trim();

  NOVEL_DATA.volumes.forEach(vol => {
    const filtered = vol.chapters.filter(ch => 
      ch.title.toLowerCase().includes(searchLower) || ch.number.toLowerCase().includes(searchLower)
    );

    if (filtered.length === 0) return;

    const volHeader = document.createElement('div');
    volHeader.className = 'toc-vol-name';
    volHeader.textContent = vol.volumeTitle;
    tocList.appendChild(volHeader);

    filtered.forEach(ch => {
      const row = document.createElement('a');
      row.className = `toc-ch-row ${ch.id === STATE.currentChapterId ? 'active' : ''}`;
      row.dataset.id = ch.id;
      row.innerHTML = `
        <span><span class="toc-num-tag">${ch.number}</span> ${ch.title}</span>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
      `;
      row.addEventListener('click', (e) => {
        e.preventDefault();
        renderChapter(ch.id);
        closeAllDrawers();
      });
      tocList.appendChild(row);
    });
  });
}

// Global Event Listeners
function setupEventListeners() {
  // Home Navigation
  if (btnHome) btnHome.addEventListener('click', showHome);
  if (navBookBrand) navBookBrand.addEventListener('click', showHome);

  // Drawer Toggles
  btnToc.addEventListener('click', () => openDrawer(tocDrawer));
  btnSettings.addEventListener('click', () => openDrawer(settingsDrawer));

  btnCloseToc.addEventListener('click', closeAllDrawers);
  btnCloseSettings.addEventListener('click', closeAllDrawers);
  drawerBackdrop.addEventListener('click', closeAllDrawers);

  // Search in TOC
  tocSearch.addEventListener('input', (e) => {
    buildTableOfContents(e.target.value);
  });

  // Theme Switches
  document.querySelectorAll('.theme-card').forEach(btn => {
    btn.addEventListener('click', () => {
      setTheme(btn.dataset.theme);
    });
  });

  // Font Switches
  document.querySelectorAll('.pill-btn[data-font]').forEach(btn => {
    btn.addEventListener('click', () => {
      setFont(btn.dataset.font);
    });
  });

  // Font Size Controls
  if (fontSizeSlider) {
    fontSizeSlider.min = '16';
    fontSizeSlider.max = '100';
    fontSizeSlider.addEventListener('input', (e) => setFontSize(parseInt(e.target.value)));
  }
  if (fontSizeInput) {
    fontSizeInput.addEventListener('change', (e) => setFontSize(parseInt(e.target.value)));
    fontSizeInput.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      if (!isNaN(val) && val >= 16 && val <= 100) setFontSize(val);
    });
  }
  if (btnFontDec) btnFontDec.addEventListener('click', () => setFontSize(STATE.fontSize - 1));
  if (btnFontInc) btnFontInc.addEventListener('click', () => setFontSize(STATE.fontSize + 1));

  // Content Width Controls (Slider, Input & 3 Presets)
  if (contentWidthSlider) {
    contentWidthSlider.addEventListener('input', (e) => setContentWidth(parseInt(e.target.value)));
  }
  if (contentWidthInput) {
    contentWidthInput.addEventListener('change', (e) => setContentWidth(parseInt(e.target.value)));
    contentWidthInput.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      if (!isNaN(val) && val >= 480 && val <= 1600) setContentWidth(val);
    });
  }
  presetWidthBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      setContentWidth(parseInt(btn.dataset.presetWidth));
    });
  });

  // Background Opacity Control
  if (bgOpacitySlider) {
    bgOpacitySlider.addEventListener('input', (e) => setBgOpacity(parseInt(e.target.value)));
  }

  // Progress Bar & Scroll Memory
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = `${percent}%`;

    clearTimeout(window._scrollDebounce);
    window._scrollDebounce = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY_SCROLL, Math.round(scrollTop));
    }, 500);
  });

  // Toast actions
  btnResumeReading.addEventListener('click', () => {
    bookmarkToast.classList.remove('show');
    const saved = parseInt(localStorage.getItem(STORAGE_KEY_CHAPTER));
    if (saved && saved !== STATE.currentChapterId) renderChapter(saved);
    const scroll = parseInt(localStorage.getItem(STORAGE_KEY_SCROLL));
    if (scroll) window.scrollTo({ top: scroll, behavior: 'smooth' });
  });

  btnDismissToast.addEventListener('click', () => bookmarkToast.classList.remove('show'));

  // Lightbox Close
  lightboxCloseBtn.addEventListener('click', closeLightbox);
  lightbox.querySelector('.lightbox-overlay').addEventListener('click', closeLightbox);

  // Fullscreen
  document.getElementById('btn-fullscreen').addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  });

  // Keyboard Shortcuts: ESC, M, ArrowLeft, ArrowRight
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 'Escape') {
      closeAllDrawers();
      closeLightbox();
    } else if (e.key === 'h' || e.key === 'H') {
      showHome();
    } else if (e.key === 'm' || e.key === 'M') {
      tocDrawer.classList.contains('open') ? closeAllDrawers() : openDrawer(tocDrawer);
    } else if (e.key === 'ArrowLeft') {
      const btn = document.getElementById('btn-prev-ch');
      if (btn && !btn.disabled) btn.click();
    } else if (e.key === 'ArrowRight') {
      const btn = document.getElementById('btn-next-ch');
      if (btn && !btn.disabled) btn.click();
    }
  });

  // Handle Browser Back / Forward via Hash
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash;
    const match = hash.match(/#chapter-(\d+)/);
    if (match) {
      const chId = parseInt(match[1]);
      if (chId !== STATE.currentChapterId && getChapterById(chId)) {
        renderChapter(chId);
      }
    } else if (!hash || hash === '#home') {
      if (STATE.currentView !== 'home') {
        showHome();
      }
    }
  });
}

// Drawer helpers
function openDrawer(drawer) {
  closeAllDrawers();
  drawer.classList.add('open');
  drawerBackdrop.classList.add('active');
}

function closeAllDrawers() {
  tocDrawer.classList.remove('open');
  settingsDrawer.classList.remove('open');
  drawerBackdrop.classList.remove('active');
}

// Preferences
function setTheme(theme) {
  STATE.theme = theme;
  docEl.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-card').forEach(c => {
    c.classList.toggle('active', c.dataset.theme === theme);
  });
  savePreferences();
}

function setFont(font) {
  STATE.font = font;
  docEl.setAttribute('data-font', font);
  document.querySelectorAll('.pill-btn[data-font]').forEach(b => {
    b.classList.toggle('active', b.dataset.font === font);
  });
  savePreferences();
}

function setFontSize(size) {
  const bounded = Math.max(16, Math.min(100, parseInt(size) || 24));
  STATE.fontSize = bounded;
  docEl.style.setProperty('--font-size-base', `${bounded}px`);
  docEl.setAttribute('data-size', bounded);
  if (fontSizeSlider) {
    fontSizeSlider.min = '16';
    fontSizeSlider.max = '100';
    fontSizeSlider.value = bounded;
  }
  if (fontSizeInput) fontSizeInput.value = bounded;
  savePreferences();
}

function setContentWidth(widthPx) {
  let val = parseInt(widthPx);
  if (isNaN(val)) val = 760;
  val = Math.max(480, Math.min(1600, val));
  
  STATE.contentWidth = val;
  docEl.style.setProperty('--max-content-width', `${val}px`);
  
  if (contentWidthSlider) contentWidthSlider.value = val;
  if (contentWidthInput) contentWidthInput.value = val;
  
  presetWidthBtns.forEach(btn => {
    const pVal = parseInt(btn.dataset.presetWidth);
    btn.classList.toggle('active', pVal === val);
  });
  
  savePreferences();
}

function setBgOpacity(val) {
  let pct = parseInt(val);
  if (isNaN(pct)) pct = 0;
  pct = Math.max(0, Math.min(100, pct));
  
  STATE.bgOpacity = pct;
  const dec = (pct / 100).toFixed(2);
  docEl.style.setProperty('--bg-ambient-opacity', dec);
  
  if (bgOpacitySlider) bgOpacitySlider.value = pct;
  if (bgOpacityVal) bgOpacityVal.textContent = `${pct}%`;
  
  savePreferences();
}

function updateAmbientBg(imgUrl) {
  const ambient = document.getElementById('ambient-bg-layer');
  if (ambient && imgUrl) {
    ambient.style.backgroundImage = `url('${imgUrl}')`;
  }
}

function savePreferences() {
  localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(STATE));
}

function loadPreferences() {
  try {
    let saved = JSON.parse(localStorage.getItem(STORAGE_KEY_PREFS));
    if (!saved) {
      const old = JSON.parse(localStorage.getItem('phuthuygia_reader_prefs_v3') || localStorage.getItem('phuthuygia_reader_prefs_v2'));
      if (old) {
        saved = {
          theme: old.theme || 'dark',
          font: old.font || 'bookerly',
          fontSize: old.fontSize || 24,
          contentWidth: old.width === 'narrow' ? 660 : (old.width === 'wide' ? 860 : 760),
          bgOpacity: 0
        };
      }
    }
    if (saved) {
      if (saved.theme) setTheme(saved.theme);
      setFont(saved.font || 'bookerly');
      setFontSize(saved.fontSize || 24);
      setContentWidth(saved.contentWidth || 760);
      setBgOpacity(typeof saved.bgOpacity !== 'undefined' ? saved.bgOpacity : 0);
    } else {
      setFont('bookerly');
      setFontSize(24);
      setContentWidth(760);
      setBgOpacity(0);
    }
  } catch (e) {
    console.error(e);
  }
}

// Lightbox
function openLightbox(url, caption) {
  lightboxImage.src = url;
  lightboxCaption.textContent = caption || '';
  lightbox.classList.add('active');
}

function closeLightbox() {
  lightbox.classList.remove('active');
}

// Start
document.addEventListener('DOMContentLoaded', initApp);
