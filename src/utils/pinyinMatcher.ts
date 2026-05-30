import { pinyin } from "pinyin-pro";

export interface LinkItem {
  name: string;
  url: string;
  cat: string;
}

export interface PinyinMeta {
  pinyinArray: string[];
  pinyinJoined: string;
  initials: string;
  normalizedJoined: string;
  normalizedInitials: string;
}

// Map cache for high performance
const pinyinCache = new Map<string, PinyinMeta>();

// Helper to normalize phonetic equivalents for soft consonants and nasal vowels
export function phoneticNormalize(str: string): string {
  return str.toLowerCase()
    .replace(/zh/g, "z")
    .replace(/ch/g, "c")
    .replace(/sh/g, "s")
    .replace(/ang/g, "an")
    .replace(/eng/g, "en")
    .replace(/ing/g, "in")
    .replace(/ong/g, "on")
    .replace(/ian/g, "ian")
    .replace(/iang/g, "ian")
    .replace(/uang/g, "uan")
    .replace(/uan/g, "uan")
    .replace(/v/g, "u");
}

// Convert string to Pinyin representations
export function getPinyinMeta(text: string): PinyinMeta {
  const cached = pinyinCache.get(text);
  if (cached) return cached;

  const originalLower = text.toLowerCase();
  
  // Extract Chinese characters and convert to pinyin array
  const pinyinArray: string[] = [];
  let initials = "";

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (/[\u4e00-\u9fa5]/.test(char)) {
      const p = pinyin(char, { toneType: "none" });
      pinyinArray.push(p);
      initials += p[0] || "";
    } else if (/[a-zA-Z0-9]/.test(char)) {
      pinyinArray.push(char.toLowerCase());
      initials += char.toLowerCase();
    }
  }

  const pinyinJoined = pinyinArray.join("");
  const normalizedJoined = phoneticNormalize(pinyinJoined);
  const normalizedInitials = phoneticNormalize(initials);

  const res: PinyinMeta = {
    pinyinArray,
    pinyinJoined,
    initials,
    normalizedJoined,
    normalizedInitials
  };

  pinyinCache.set(text, res);
  return res;
}

// Levenshtein Distance for typo tolerance
export function getLevenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Subsequence check
export function isSubsequence(sub: string, sequence: string): boolean {
  if (!sub || !sequence) return false;
  let subIdx = 0;
  for (let i = 0; i < sequence.length; i++) {
    if (sequence[i] === sub[subIdx]) {
      subIdx++;
      if (subIdx === sub.length) return true;
    }
  }
  return false;
}

// Deep, comprehensive score engine with robust Fuzzy Pinyin / Typo support!
export function findFuzzyScore(link: LinkItem, query: string): number {
  if (!query) return 0;
  const qClean = query.trim().toLowerCase();
  if (!qClean) return 0;

  const linkNameLower = link.name.toLowerCase();
  const linkCatLower = link.cat.toLowerCase();
  const linkUrlLower = link.url.toLowerCase();

  let score = 0;

  // 1. Exact or Substring Matches in original languages (Highest priority)
  if (linkNameLower === qClean) {
    score += 500;
  } else if (linkNameLower.includes(qClean)) {
    score += 250;
    // Boost score if match is at start of word
    if (linkNameLower.startsWith(qClean)) {
      score += 100;
    }
  }

  if (linkCatLower.includes(qClean)) {
    score += 20;
  }
  if (linkUrlLower.includes(qClean)) {
    score += 30;
  }

  // 2. Perform Pinyin conversions and match
  const meta = getPinyinMeta(link.name);
  const qMeta = getPinyinMeta(qClean);

  const qPinyinJoined = qMeta.pinyinJoined;
  const qInitials = qMeta.initials;
  const normQJoined = phoneticNormalize(qPinyinJoined);
  const normQInitials = phoneticNormalize(qInitials);

  // Exact pinyin joined match (e.g. user typed "zhongguozhiwang" or "zhiwang")
  if (meta.pinyinJoined === qClean || meta.pinyinJoined === qPinyinJoined) {
    score += 300;
  } else if (meta.pinyinJoined.includes(qClean) || meta.pinyinJoined.includes(qPinyinJoined)) {
    score += 150;
  }

  // Initials match (e.g. user typed "zgzw" or "zw")
  if (meta.initials === qClean || meta.initials === qInitials) {
    score += 200;
  } else if (meta.initials.includes(qClean) || meta.initials.includes(qInitials)) {
    score += 100;
  }

  // 3. Phonetic / Fuzzy Matches (Soft consonants & nasal vowels, e.g. "ziwang" vs "zhiwang")
  if (meta.normalizedJoined === normQJoined) {
    score += 260;
  } else if (meta.normalizedJoined.includes(normQJoined)) {
    score += 120;
  }

  if (meta.normalizedInitials === normQInitials) {
    score += 180;
  } else if (meta.normalizedInitials.includes(normQInitials)) {
    score += 80;
  }

  // 4. Subsequence matches (e.g. user typed initials with slight deviations/gaps)
  if (isSubsequence(normQInitials, meta.normalizedInitials)) {
    score += 60;
  }
  if (isSubsequence(normQJoined, meta.normalizedJoined)) {
    score += 40;
  }

  // 5. Typing error tolerance (Levenshtein edit distance)
  // Only apply when query holds reasonable length
  if (qClean.length >= 3) {
    // Check edit distance on English or full Pinyin
    const dist = getLevenshteinDistance(qPinyinJoined, meta.pinyinJoined);
    const maxLen = Math.max(qPinyinJoined.length, meta.pinyinJoined.length);
    if (maxLen > 0) {
      const matchDegree = 1 - dist / maxLen;
      if (matchDegree >= 0.7) {
        score += Math.floor(matchDegree * 140);
      }
    }

    // Check individual English/Pinyin word segment level distance to catch targeted mistakes
    // e.g. "depseek" vs "deepseek"
    const targetSegments = link.name
      .split(/[^a-zA-Z0-9\u4e00-\u9fa5]/)
      .map(seg => getPinyinMeta(seg).pinyinJoined)
      .filter(seg => seg.length >= 2);

    for (const segment of targetSegments) {
      const segDist = getLevenshteinDistance(qPinyinJoined, segment);
      const segMaxLen = Math.max(qPinyinJoined.length, segment.length);
      if (segMaxLen > 0) {
        const segMatchDegree = 1 - segDist / segMaxLen;
        if (segMatchDegree >= 0.75) {
          score += Math.floor(segMatchDegree * 110);
        }
      }
    }
  }

  return score;
}
