/**
 * NOVEL PARSER & IMAGE ORGANIZER - PHÙ THỦY GIẢ
 * Tự động đọc contents/combine/Phu Thuy Gia.txt
 * Tạo cấu trúc thư mục Images/Vol-<X>/Life-<YY>/
 * Quản lý ảnh theo thứ tự hiển thị từ trên xuống:
 *   - Vị trí 1 (Top Hero Cover): image-01
 *   - Vị trí 2 (Ảnh minh họa 1): image-02
 *   - Vị trí 3 (Ảnh minh họa 2): image-03 ...
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const textFilePath = path.join(__dirname, 'contents', 'combine', 'Phu Thuy Gia.txt');
const imagesBaseDir = path.join(__dirname, 'Images');

if (!fs.existsSync(textFilePath)) {
  console.error('Không tìm thấy file truyện:', textFilePath);
  process.exit(1);
}

// 4 ảnh nền nghệ thuật mặc định cho 4 tập
const VOLUME_THEME_URLS = {
  1: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1800&q=85',
  2: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?auto=format&fit=crop&w=1800&q=85',
  3: 'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?auto=format&fit=crop&w=1800&q=85',
  4: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=1800&q=85'
};

function downloadToBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadToBuffer(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function main() {
  console.log('--- Bắt đầu xử lý dữ liệu và cấu trúc thư mục Images ---');

  if (!fs.existsSync(imagesBaseDir)) {
    fs.mkdirSync(imagesBaseDir, { recursive: true });
  }

  // Tải trước buffer ảnh mẫu nếu các tập chưa có bất kỳ ảnh nào
  const themeBuffers = {};
  for (const volNum of [1, 2, 3, 4]) {
    const volDir = path.join(imagesBaseDir, `Vol-${volNum}`);
    // Tìm thử 1 ảnh image-01 có sẵn trong tập để làm mẫu
    let existingSample = null;
    if (fs.existsSync(volDir)) {
      const lifeDirs = fs.readdirSync(volDir);
      for (const ld of lifeDirs) {
        const p = path.join(volDir, ld, 'image-01.jpg');
        if (fs.existsSync(p)) {
          existingSample = p;
          break;
        }
      }
    }

    if (existingSample) {
      themeBuffers[volNum] = fs.readFileSync(existingSample);
    } else if (VOLUME_THEME_URLS[volNum]) {
      try {
        themeBuffers[volNum] = await downloadToBuffer(VOLUME_THEME_URLS[volNum]);
        console.log(`✓ Đã tải ảnh nền cho Tập ${volNum}`);
      } catch (err) {
        console.warn(`! Không thể tải trước ảnh cho tập ${volNum}:`, err.message);
      }
    }
  }

  const rawText = fs.readFileSync(textFilePath, 'utf8');
  const lines = rawText.split(/\r?\n/);

  let currentVol = null;
  let currentCh = null;
  const volumes = [];
  let globalId = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Khớp tên Tập: e.g. "TẬP 1: KHẾ ƯỚC IRIS"
    const volMatch = line.match(/^TẬP\s+(\d+)\s*[:–—\-]\s*(.+)$/i);
    if (volMatch) {
      const volNum = parseInt(volMatch[1], 10);
      const volTitle = `Tập ${volNum}: ${volMatch[2].trim()}`;
      currentVol = {
        volumeIndex: volNum,
        volumeTitle: volTitle,
        chapters: []
      };
      volumes.push(currentVol);
      continue;
    }

    // Khớp tên Chương: e.g. "Life 00 - Tiểu thư đài các và thiếu niên dưới gốc sồi."
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
      const chId = globalId++;

      currentCh = {
        id: chId,
        volumeIndex: currentVol.volumeIndex,
        lifeNumStr: lifeNumStr,
        number: `Chương ${lifeNumStr}`,
        title: chTitle,
        quote: '',
        heroImage: '',
        paragraphs: [],
        illustrations: []
      };

      currentVol.chapters.push(currentCh);
      continue;
    }

    // 1. Tự động loại bỏ hoàn toàn các dòng phân cách dạng "====", "----", "____"
    if (/^[=\-—_]{3,}$/.test(line) || line === '---') {
      continue;
    }

    // Nếu dòng có chứa chuỗi dấu = liên tiếp, lọc bỏ
    let cleanLine = line;
    if (/={3,}/.test(cleanLine)) {
      cleanLine = cleanLine.replace(/={3,}/g, '').trim();
      if (!cleanLine) continue;
    }

    if (currentCh && cleanLine.length > 0) {
      currentCh.paragraphs.push(cleanLine);
    }
  }

  // Đọc danh sách từ khóa cần highlight (in nghiêng & màu cam sậm)
  let highlights = [];
  const txtHighlightPath = path.join(__dirname, 'contents', 'text-highlight.txt');
  const jsonHighlightPath = path.join(__dirname, 'contents', 'text-highlight.json');

  if (fs.existsSync(jsonHighlightPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(jsonHighlightPath, 'utf8'));
      if (Array.isArray(data)) {
        highlights = data.map(w => w.trim()).filter(Boolean);
        console.log(`✓ Đã nạp ${highlights.length} từ highlight từ text-highlight.json`);
      }
    } catch (e) {
      console.warn('Lỗi đọc text-highlight.json:', e.message);
    }
  }
  
  if (highlights.length === 0 && fs.existsSync(txtHighlightPath)) {
    const rawLines = fs.readFileSync(txtHighlightPath, 'utf8').split(/\r?\n/);
    highlights = rawLines
      .map(l => l.trim())
      .filter(l => l.length > 0 && !l.startsWith('#'));
    console.log(`✓ Đã nạp ${highlights.length} từ highlight từ text-highlight.txt`);
  }

  // Quản lý thư mục ảnh và phân loại ảnh từ trên xuống dưới
  console.log('Đang thiết lập thư mục Images theo cấu trúc Vol-X/Life-YY...');
  volumes.forEach(vol => {
    // Quét ảnh bìa riêng của tập nếu có: Images/Vol-X/cover.(jpg|png|webp)
    const volDir = path.join(imagesBaseDir, `Vol-${vol.volumeIndex}`);
    const coverExts = ['cover.jpg', 'cover.png', 'cover.webp', 'cover.jpeg', 'cover.avif'];
    let volCover = null;
    if (fs.existsSync(volDir)) {
      for (const cf of coverExts) {
        if (fs.existsSync(path.join(volDir, cf))) {
          volCover = `Images/Vol-${vol.volumeIndex}/${cf}`;
          break;
        }
      }
    }
    vol.coverImage = volCover || (vol.chapters[0] ? vol.chapters[0].heroImage : `Images/Vol-${vol.volumeIndex}/Life-00/image-01.jpg`);

    vol.chapters.forEach(ch => {
      // 1. Trích dẫn câu đầu tiên
      if (ch.paragraphs.length > 0) {
        const p1 = ch.paragraphs[0];
        const sentenceMatch = p1.match(/^([^.!?]+[.!?])/);
        if (sentenceMatch) {
          ch.quote = `«${sentenceMatch[1].trim()}»`;
        } else {
          ch.quote = `«${p1.substring(0, 120)}...»`;
        }
      }

      // 2. Thư mục chương: Images/Vol-<X>/Life-<YY>
      const chapterDir = path.join(imagesBaseDir, `Vol-${vol.volumeIndex}`, `Life-${ch.lifeNumStr}`);
      if (!fs.existsSync(chapterDir)) {
        fs.mkdirSync(chapterDir, { recursive: true });
      }

      // 3. Quét các ảnh có sẵn trong thư mục
      const files = fs.readdirSync(chapterDir);
      let imageFiles = files
        .filter(f => /^image-(\d+)\.(jpg|jpeg|png|webp|avif|gif)$/i.test(f))
        .map(f => {
          const match = f.match(/^image-(\d+)\.(jpg|jpeg|png|webp|avif|gif)$/i);
          return {
            filename: f,
            index: parseInt(match[1], 10),
            relPath: `Images/Vol-${vol.volumeIndex}/Life-${ch.lifeNumStr}/${f}`
          };
        })
        .sort((a, b) => a.index - b.index);

      // Nếu chưa có image-01, khởi tạo bằng ảnh mẫu của tập
      const hasHeroImage = imageFiles.some(img => img.index === 1);
      if (!hasHeroImage && themeBuffers[vol.volumeIndex]) {
        const defaultHeroFile = 'image-01.jpg';
        const defaultHeroPath = path.join(chapterDir, defaultHeroFile);
        fs.writeFileSync(defaultHeroPath, themeBuffers[vol.volumeIndex]);
        imageFiles.unshift({
          filename: defaultHeroFile,
          index: 1,
          relPath: `Images/Vol-${vol.volumeIndex}/Life-${ch.lifeNumStr}/${defaultHeroFile}`
        });
      }

      // 4. Gán ảnh theo thứ tự từ trên xuống dưới:
      // - Vị trí 1 (trên cùng): Hero Cover Image
      const hero = imageFiles.find(img => img.index === 1);
      ch.heroImage = hero ? hero.relPath : `Images/Vol-${vol.volumeIndex}/Life-${ch.lifeNumStr}/image-01.jpg`;

      // - Vị trí 2 trở đi: Các ảnh minh họa hiển thị trong nội dung bài viết
      const inlineIllustrations = imageFiles.filter(img => img.index > 1);
      ch.illustrations = inlineIllustrations.map(img => ({
        index: img.index,
        url: img.relPath
      }));
      ch.hasIllustration = ch.illustrations.length > 0;
    });
  });

  const NOVEL_DATA = {
    title: 'Phù Thủy Giả',
    author: 'Andy Hoàng Hiếu',
    highlights: highlights,
    volumes: volumes.map(v => ({
      volumeTitle: v.volumeTitle,
      coverImage: v.coverImage,
      chapters: v.chapters
    }))
  };

  const outputJs = `/**
 * NOVEL DATA - PHÙ THỦY GIẢ
 * Tự động tạo bởi parse-novel.js từ contents/combine/Phu Thuy Gia.txt
 * Cấu trúc ảnh: Images/Vol-<X>/Life-<YY>/image-01 (Vị trí 1 trên cùng), image-02, ...
 */
const NOVEL_DATA = ${JSON.stringify(NOVEL_DATA, null, 2)};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = NOVEL_DATA;
}
`;

  const outputPath = path.join(__dirname, 'data.js');
  fs.writeFileSync(outputPath, outputJs, 'utf8');

  console.log(`\n🎉 HOÀN THÀNH:`);
  console.log(`- Đã khởi tạo cấu trúc thư mục Images cho 4 tập và 70 chương.`);
  console.log(`- Đã lưu dữ liệu web vào data.js.`);
}

main().catch(err => {
  console.error('Lỗi khi thực thi parse-novel.js:', err);
  process.exit(1);
});
