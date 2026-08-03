import { getReadAccessUrl } from '../utils/getReadAccessUrl';

describe('getReadAccessUrl', () => {
  it('keeps generated reader assets inside the document directory', () => {
    expect(
      getReadAccessUrl(
        [
          'file:///var/mobile/Containers/Data/Application/reader/Documents/index.html',
          'file:///var/mobile/Containers/Data/Application/reader/Documents/jszip.min.js',
          'file:///var/mobile/Containers/Data/Application/reader/Documents/epub.min.js',
        ],
        'file:///var/mobile/Containers/Data/Application/reader/Documents/'
      )
    ).toBe('file:///var/mobile/Containers/Data/Application/reader/Documents/');
  });

  it('falls back to the narrowest shared file root for mixed local files', () => {
    expect(
      getReadAccessUrl(
        [
          'file:///var/mobile/Containers/Data/Application/reader/Documents/index.html',
          'file:///var/mobile/Containers/Data/Application/reader/Library/book.epub',
          'file:///var/mobile/Containers/Data/Application/reader/Documents/epub.min.js',
        ],
        'file:///var/mobile/Containers/Data/Application/reader/Documents/'
      )
    ).toBe('file:///var/mobile/Containers/Data/Application/reader/');
  });

  it('falls back when the inputs are not valid file URLs', () => {
    expect(
      getReadAccessUrl(
        ['https://example.com/book.epub'],
        'file:///var/mobile/Containers/Data/Application/reader/Documents/'
      )
    ).toBe('file:///var/mobile/Containers/Data/Application/reader/Documents/');
  });
});
