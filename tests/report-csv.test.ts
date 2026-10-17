import { describe, expect, it } from 'vitest';
import { csvCell, toCsv } from '@/lib/reports/csv';

describe('CSV report serialization', () => {
  it('quotes commas and escapes embedded quotes', () => {
    expect(csvCell('A, "B"')).toBe('"A, ""B"""');
  });

  it('normalizes embedded line breaks to a single cell', () => {
    expect(csvCell('line one\nline two')).toBe('"line one line two"');
  });

  it('neutralizes spreadsheet formula prefixes', () => {
    expect(csvCell('=SUM(A1:A2)')).toBe('"\'=SUM(A1:A2)"');
    expect(csvCell('  +1+1')).toBe('"\'  +1+1"');
    expect(csvCell('@import')).toBe('"\'@import"');
  });

  it('serializes dates and null values predictably', () => {
    expect(csvCell(new Date('2026-01-02T03:04:05.000Z'))).toBe('"2026-01-02T03:04:05.000Z"');
    expect(csvCell(null)).toBe('""');
  });

  it('adds a UTF-8 BOM and CRLF row endings for spreadsheet compatibility', () => {
    expect(toCsv([['URL', 'Finding'], ['https://example.com', 'Missing delivery detail']]))
      .toBe('\uFEFF"URL","Finding"\r\n"https://example.com","Missing delivery detail"\r\n');
  });
});
