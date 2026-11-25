/**
 * NOVEL PARSER & IMAGE ORGANIZER - PHÙ THỦY GIẢ
 * Cơ chế ưu tiên:
 *   1. Đọc từng file chương từ thư mục contents/odd/ (Ưu tiên số 1)
 *   2. Nếu thiếu chương hoặc thiếu tập ở odd, tự động fallback sang contents/combine/Phu Thuy Gia.txt
 * Tự động đồng bộ cấu trúc:
 *   - Tạo cấu trúc thư mục Images/Vol-<X>/Life-<YY>/
 *   - Quản lý ảnh: Top Hero Cover (image-01), Ảnh minh họa nội dung (image-02, image-03...)
 *   - Nạp từ khóa highlight từ text-highlight.json / text-highlight.txt
 *   - Xuất dữ liệu web data.js và đồng bộ contents/combine/Phu Thuy Gia.txt
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const oddBaseDir = path.join(__dirname, 'contents', 'odd');
const combineFilePath = path.join(__dirname, 'contents', 'combine', 'Phu Thuy Gia.txt');
const imagesBaseDir = path.join(__dirname, 'Images');

// Tiêu đề hiển thị mặc định của các tập
const DEFAULT_VOLUME_TITLES = {
  1: 'Tập 1: Khế Ước Iris',
  2: 'Tập 2: Nghịch Tử Vespera',
  3: 'Tập 3: Manh Mối Flamel',
  4: 'Tập 4: Hàn Độc Nơi Nhà Kính'
};

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

/**
 * Đọc và phân tích file gộp: contents/combine/Phu Thuy Gia.txt
 * Trả về Map: { [volIndex]: { volumeIndex, volumeTitle, chapters: { [lifeNumStr]: chapterObj } } }
 */
function parseCombineFile(filePath) {
  const result = {};
  if (!fs.existsSync(filePath)) {
    return result;
  }

  const rawText = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const lines = rawText.split(/\r?\n/);

  let currentVol = null;
  let currentCh = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Khớp tên Tập: e.g. "TẬP 1: KHẾ ƯỚC IRIS"
    const volMatch = line.match(/^TẬP\s+(\d+)\s*[:–—\-]\s*(.+)$/i);
    if (volMatch) {
      const volNum = parseInt(volMatch[1], 10);
      const volTitle = `Tập ${volNum}: ${volMatch[2].trim()}`;
      if (!result[volNum]) {
        result[volNum] = {
          volumeIndex: volNum,
          volumeTitle: volTitle,
          chapters: {}
        };
      }
      currentVol = result[volNum];
      continue;
    }

    // Khớp tên Chương: e.g. "Life 00 - Tiểu thư đài các và thiếu niên dưới gốc sồi."
    const lifeMatch = line.match(/^Life\s+(\d+)\s*[-–—]\s*(.+)$/i);
    if (lifeMatch) {
      if (!currentVol) {
        if (!result[1]) {
          result[1] = {
            volumeIndex: 1,
            volumeTitle: DEFAULT_VOLUME_TITLES[1] || 'Tập 1: Khế Ước Iris',
            chapters: {}
          };
        }
        currentVol = result[1];
      }

      const lifeNumStr = lifeMatch[1].padStart(2, '0');
      const chTitle = lifeMatch[2].trim().replace(/\.$/, '');

      currentCh = {
        volumeIndex: currentVol.volumeIndex,
        lifeNumStr: lifeNumStr,
        number: `Chương ${lifeNumStr}`,
        title: chTitle,
        paragraphs: []
      };

      currentVol.chapters[lifeNumStr] = currentCh;
      continue;
    }

    // Lọc dòng phân cách
    if (/^[=\-—_*]{3,}$/.test(line) || line === '---') {
      continue;
    }

    let cleanLine = line;
    if (/={3,}/.test(cleanLine)) {
      cleanLine = cleanLine.replace(/={3,}/g, '').trim();
      if (!cleanLine) continue;
    }

    if (currentCh && cleanLine.length > 0) {
      currentCh.paragraphs.push(cleanLine);
    }
  }

  return result;
}

/**
 * Đọc và phân tích thư mục lẻ: contents/odd/
 * Trả về Map: { [volIndex]: { volumeIndex, volumeTitle, chapters: { [lifeNumStr]: chapterObj } } }
 */
function parseOddDirectory(baseDir) {
  const result = {};
  if (!fs.existsSync(baseDir)) {
    return result;
  }

  const entries = fs.readdirSync(baseDir);
  for (const entry of entries) {
    const fullDirPath = path.join(baseDir, entry);
    if (!fs.statSync(fullDirPath).isDirectory()) continue;

    // Khớp tên thư mục tập: Vol_01_Khe_Uoc_Iris hoặc Vol-1...
    const volMatch = entry.match(/^Vol[_\-\s]*0*(\d+)(?:[_\-\s]+(.*))?$/i);
    if (!volMatch) continue;

    const volNum = parseInt(volMatch[1], 10);
    const suffix = volMatch[2] ? volMatch[2].replace(/[_\-]+/g, ' ').trim() : '';
    const volTitle = DEFAULT_VOLUME_TITLES[volNum] || `Tập ${volNum}${suffix ? ': ' + suffix : ''}`;

    if (!result[volNum]) {
      result[volNum] = {
        volumeIndex: volNum,
        volumeTitle: volTitle,
        chapters: {}
      };
    }

    // Quét các file chương .txt trong thư mục tập
    const files = fs.readdirSync(fullDirPath);
    for (const f of files) {
      if (!f.toLowerCase().endsWith('.txt')) continue;

      const fileMatch = f.match(/^Life\s*(\d+)(?:\s*[-–—]\s*(.*?))?(?:\.txt)?$/i);
      if (!fileMatch) continue;

      const lifeNumStr = fileMatch[1].padStart(2, '0');
      const filenameTitle = fileMatch[2] ? fileMatch[2].trim() : '';

      const content = fs.readFileSync(path.join(fullDirPath, f), 'utf8').replace(/^\uFEFF/, '');
      const lines = content.split(/\r?\n/);

      let chTitle = filenameTitle;
      const paragraphs = [];
      let titleFoundInHeader = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Dòng đầu tiên hoặc tiêu đề chương dạng "# Life 01 - Tiêu đề" hoặc "Life 01 - Tiêu đề"
        if (!titleFoundInHeader) {
          const titleMatch = line.match(/^#*\s*Life\s+\d+\s*[-–—]\s*(.+)$/i);
          if (titleMatch) {
            chTitle = titleMatch[1].trim().replace(/\.$/, '');
            titleFoundInHeader = true;
            continue;
          }
          const hashMatch = line.match(/^#+\s*(.+)$/i);
          if (hashMatch) {
            chTitle = hashMatch[1].trim().replace(/\.$/, '');
            titleFoundInHeader = true;
            continue;
          }
        }

        // Lọc dòng phân cách
        if (/^[=\-—_*]{3,}$/.test(line) || line === '---') {
          continue;
        }

        let cleanLine = line;
        if (/={3,}/.test(cleanLine)) {
          cleanLine = cleanLine.replace(/={3,}/g, '').trim();
          if (!cleanLine) continue;
        }

        paragraphs.push(cleanLine);
      }

      result[volNum].chapters[lifeNumStr] = {
        volumeIndex: volNum,
        lifeNumStr: lifeNumStr,
        number: `Chương ${lifeNumStr}`,
        title: chTitle || `Chương ${lifeNumStr}`,
        paragraphs: paragraphs,
        sourceFile: path.join('contents', 'odd', entry, f)
      };
    }
  }

  return result;
}

async function main() {
  console.log('=== KHỞI ĐỘNG NOVEL PARSER (ƯU TIÊN: ODD -> COMBINE) ===\n');

  if (!fs.existsSync(oddBaseDir) && !fs.existsSync(combineFilePath)) {
    console.error('LỖI: Không tìm thấy cả thư mục contents/odd lẫn file contents/combine/Phu Thuy Gia.txt');
    process.exit(1);
  }

  // 1. Phân tích cả 2 nguồn: odd và combine
  console.log('1. Đang quét nguồn dữ liệu:');
  const oddData = parseOddDirectory(oddBaseDir);
  const combineData = parseCombineFile(combineFilePath);

  const oddVolCount = Object.keys(oddData).length;
  let oddChCount = 0;
  Object.values(oddData).forEach(v => oddChCount += Object.keys(v.chapters).length);

  const comVolCount = Object.keys(combineData).length;
  let comChCount = 0;
  Object.values(combineData).forEach(v => comChCount += Object.keys(v.chapters).length);

  console.log(`   - contents/odd:     ${oddVolCount} tập, ${oddChCount} chương`);
  console.log(`   - contents/combine: ${comVolCount} tập, ${comChCount} chương`);

  // 2. Hợp nhất dữ liệu theo mức ưu tiên: odd > combine
  const allVolIndices = Array.from(new Set([
    ...Object.keys(oddData).map(n => parseInt(n, 10)),
    ...Object.keys(combineData).map(n => parseInt(n, 10))
  ])).sort((a, b) => a - b);

  let totalFromOdd = 0;
  let totalFromCombine = 0;
  const mergedVolumes = [];
  let globalId = 1;

  for (const volNum of allVolIndices) {
    const oddVol = oddData[volNum];
    const comVol = combineData[volNum];

    // Ưu tiên tiêu đề tập từ combine hoặc DEFAULT_VOLUME_TITLES nếu có dấu chuẩn
    const volTitle = (comVol && comVol.volumeTitle) ||
                     DEFAULT_VOLUME_TITLES[volNum] ||
                     (oddVol && oddVol.volumeTitle) ||
                     `Tập ${volNum}`;

    const volumeObj = {
      volumeIndex: volNum,
      volumeTitle: volTitle,
      chapters: []
    };

    // Tập hợp danh sách tất cả mã chương của tập
    const allLifeStrs = Array.from(new Set([
      ...(oddVol ? Object.keys(oddVol.chapters) : []),
      ...(comVol ? Object.keys(comVol.chapters) : [])
    ])).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

    for (const lifeStr of allLifeStrs) {
      let chosenCh = null;
      let sourceName = '';

      if (oddVol && oddVol.chapters[lifeStr]) {
        chosenCh = oddVol.chapters[lifeStr];
        sourceName = 'odd';
        totalFromOdd++;
      } else if (comVol && comVol.chapters[lifeStr]) {
        chosenCh = comVol.chapters[lifeStr];
        sourceName = 'combine';
        totalFromCombine++;
      }

      if (!chosenCh) continue;

      const chId = globalId++;
      let quote = '';
      if (chosenCh.paragraphs.length > 0) {
        const p1 = chosenCh.paragraphs[0];
        const sentenceMatch = p1.match(/^([^.!?]+[.!?])/);
        if (sentenceMatch) {
          quote = `«${sentenceMatch[1].trim()}»`;
        } else {
          quote = `«${p1.substring(0, 120)}...»`;
        }
      }

      volumeObj.chapters.push({
        id: chId,
        volumeIndex: volNum,
        lifeNumStr: lifeStr,
        number: `Chương ${lifeStr}`,
        title: chosenCh.title,
        quote: quote,
        heroImage: '',
        paragraphs: chosenCh.paragraphs,
        illustrations: [],
        _source: sourceName
      });
    }

    mergedVolumes.push(volumeObj);
  }

  console.log(`\n2. Hợp nhất hoàn tất:`);
  console.log(`   - Tổng số tập:     ${mergedVolumes.length}`);
  console.log(`   - Tổng số chương:  ${globalId - 1}`);
  console.log(`   - Nạp từ ODD:      ${totalFromOdd} chương (ưu tiên)`);
  console.log(`   - Nạp từ COMBINE:  ${totalFromCombine} chương (fallback)`);

  // 3. Chuẩn bị thư mục Images
  if (!fs.existsSync(imagesBaseDir)) {
    fs.mkdirSync(imagesBaseDir, { recursive: true });
  }

  const themeBuffers = {};
  for (const volNum of [1, 2, 3, 4]) {
    const volDir = path.join(imagesBaseDir, `Vol-${volNum}`);
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

  // 4. Quản lý thư mục ảnh và phân loại ảnh từ trên xuống dưới
  mergedVolumes.forEach(vol => {
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
      const chapterDir = path.join(imagesBaseDir, `Vol-${vol.volumeIndex}`, `Life-${ch.lifeNumStr}`);
      if (!fs.existsSync(chapterDir)) {
        fs.mkdirSync(chapterDir, { recursive: true });
      }

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

      // Gán ảnh theo thứ tự từ trên xuống dưới
      const hero = imageFiles.find(img => img.index === 1);
      ch.heroImage = hero ? hero.relPath : `Images/Vol-${vol.volumeIndex}/Life-${ch.lifeNumStr}/image-01.jpg`;

      const inlineIllustrations = imageFiles.filter(img => img.index > 1);
      ch.illustrations = inlineIllustrations.map(img => ({
        index: img.index,
        url: img.relPath
      }));
      ch.hasIllustration = ch.illustrations.length > 0;

      // Xóa biến tạm _source trước khi lưu ra data.js
      delete ch._source;
    });
  });

  // 5. Đọc danh sách từ khóa cần highlight
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

  // 6. Ghi dữ liệu ra data.js
  const NOVEL_DATA = {
    title: 'Phù Thủy Giả',
    author: 'Andy Hoàng Hiếu',
    highlights: highlights,
    volumes: mergedVolumes.map(v => ({
      volumeTitle: v.volumeTitle,
      coverImage: v.coverImage,
      chapters: v.chapters
    }))
  };

  const outputJs = `/**
 * NOVEL DATA - PHÙ THỦY GIẢ
 * Tự động tạo bởi parse-novel.js (Ưu tiên contents/odd -> contents/combine)
 * Cấu trúc ảnh: Images/Vol-<X>/Life-<YY>/image-01 (Vị trí 1 trên cùng), image-02, ...
 */
const NOVEL_DATA = ${JSON.stringify(NOVEL_DATA, null, 2)};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = NOVEL_DATA;
}
`;

  const outputPath = path.join(__dirname, 'data.js');
  fs.writeFileSync(outputPath, outputJs, 'utf8');

  // 7. Đồng bộ ngược ra contents/combine/Phu Thuy Gia.txt để các hệ thống khác luôn có dữ liệu mới nhất
  try {
    const combineDir = path.dirname(combineFilePath);
    if (!fs.existsSync(combineDir)) {
      fs.mkdirSync(combineDir, { recursive: true });
    }

    let combineOutput = `PHÙ THỦY GIẢ\nAndy Hoàng Hiếu\n\n`;
    mergedVolumes.forEach(vol => {
      combineOutput += `========================================\n`;
      combineOutput += `${vol.volumeTitle.toUpperCase()}\n`;
      combineOutput += `========================================\n\n`;
      vol.chapters.forEach(ch => {
        combineOutput += `Life ${ch.lifeNumStr} - ${ch.title}\n\n`;
        ch.paragraphs.forEach(p => {
          combineOutput += `${p}\n\n`;
        });
        combineOutput += `========================================\n\n`;
      });
    });

    // Tạo bản backup nếu combineFilePath đã tồn tại
    if (fs.existsSync(combineFilePath)) {
      fs.copyFileSync(combineFilePath, combineFilePath + '.bak');
    }
    fs.writeFileSync(combineFilePath, combineOutput, 'utf8');
    console.log(`✓ Đã đồng bộ dữ liệu chuẩn vào contents/combine/Phu Thuy Gia.txt (đã sao lưu .bak)`);
  } catch (err) {
    console.warn('! Không thể đồng bộ ngược sang contents/combine/Phu Thuy Gia.txt:', err.message);
  }

  console.log(`\n🎉 HOÀN THÀNH:`);
  console.log(`- Đã khởi tạo cấu trúc thư mục Images cho ${mergedVolumes.length} tập và ${globalId - 1} chương.`);
  console.log(`- Đã lưu dữ liệu web vào data.js.`);
}

main().catch(err => {
  console.error('Lỗi khi thực thi parse-novel.js:', err);
  process.exit(1);
});
