export function parseVietnameseDate(dateString: string): Date | null {
  if (!dateString) return null;
  const str = String(dateString).trim();
  
  // Handle MM/YYYY
  if (/^\d{1,2}\/\d{4}$/.test(str)) {
    const [month, year] = str.split('/');
    return new Date(parseInt(year), parseInt(month) - 1, 1);
  }
  
  // Handle DD/MM/YYYY or similar variations
  const parts = str.split(/[-/]/);
  if (parts.length >= 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const yearStr = parts[2].split(/\s+/)[0]; // Ignore time if present
      const year = parseInt(yearStr);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          const fullYear = year < 100 ? year + 2000 : year;
          return new Date(fullYear, month, day);
      }
  }
  
  // Try fallback to JS native date parser natively (often MM/DD/YYYY, so be careful).
  // If it's something like "2026", etc.
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d;
  return null;
}

export function isExpiringSoonOrOverdue(dateString: string): boolean {
  if (!dateString) return false;
  const date = parseVietnameseDate(dateString);
  if (!date) return false;
  
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
  return diffDays <= 30;
}
