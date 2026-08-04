import { SourceType } from '../utils/enums/source-type.enum';
import { getSourceType } from '../utils/getSourceType';
import { isURL } from '../utils/isURL';

describe('reader source detection', () => {
  it('recognizes case-insensitive EPUB and OPF paths with URL suffixes', () => {
    expect(
      getSourceType('https://example.com/BOOK.EPUB?token=1#download')
    ).toBe(SourceType.EPUB);
    expect(getSourceType('file:///books/package.OPF#manifest')).toBe(
      SourceType.OPF
    );
  });

  it('does not classify a long file path as base64 solely because of length', () => {
    const longPath = `file:///books/${'nested/'.repeat(180)}book.epub`;

    expect(longPath.length).toBeGreaterThan(1000);
    expect(getSourceType(longPath)).toBe(SourceType.EPUB);
  });

  it('accepts data URLs and long raw base64 while rejecting lookalike URLs', () => {
    expect(getSourceType('data:application/epub+zip;base64,UEsDBA==')).toBe(
      SourceType.BASE64
    );
    expect(getSourceType('UEsDBA'.repeat(200))).toBe(SourceType.BASE64);
    expect(isURL('http-not-a-url.epub')).toBe(false);
    expect(isURL('HTTPS://example.com/book.epub')).toBe(true);
  });
});
