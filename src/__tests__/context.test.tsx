import React, { useContext, useEffect } from 'react';
import { act, render, waitFor } from '@testing-library/react-native';
import { ReaderContext, ReaderProvider } from '../context';
import { useReader } from '../hooks/useReader';
import type { Location, SearchResult } from '../types';

describe('ReaderProvider bridge contract', () => {
  const mockBook = {
    injectJavaScript: jest.fn(),
  };

  let readerApi: ReturnType<typeof useReader>;
  let readerContext: React.ContextType<typeof ReaderContext>;

  function Harness() {
    readerApi = useReader();
    readerContext = useContext(ReaderContext);

    useEffect(() => {
      readerContext.registerBook(mockBook as never);
    }, []);

    return null;
  }

  beforeEach(async () => {
    mockBook.injectJavaScript.mockReset();
    render(
      <ReaderProvider>
        <Harness />
      </ReaderProvider>
    );

    await waitFor(() => {
      expect(readerApi).toBeDefined();
      expect(readerContext).toBeDefined();
    });
  });

  it('updates theme and font state while emitting the expected bridge scripts', () => {
    act(() => {
      readerApi.changeTheme({ body: { background: '#111111' } });
      readerApi.changeFontFamily('Georgia');
      readerApi.changeFontSize('120%');
      readerApi.changeFlow('scrolled-doc');
    });

    expect(readerApi.theme).toEqual({ body: { background: '#111111' } });
    expect(readerApi.flow).toBe('scrolled-doc');
    expect(mockBook.injectJavaScript).toHaveBeenCalledWith(
      expect.stringContaining('rendition.themes.register')
    );
    expect(mockBook.injectJavaScript).toHaveBeenCalledWith(
      expect.stringContaining('rendition.themes.font("Georgia")')
    );
    expect(mockBook.injectJavaScript).toHaveBeenCalledWith(
      expect.stringContaining("rendition.themes.fontSize('120%')")
    );
    expect(mockBook.injectJavaScript).toHaveBeenCalledWith(
      expect.stringContaining('rendition.flow("scrolled-doc")')
    );
  });

  it('preserves app-used navigation, search, and injected JavaScript hooks', () => {
    const searchResult: SearchResult = {
      cfi: 'epubcfi(/6/2!/4/2/2)',
      excerpt: 'needle',
      section: {
        href: 'chapter-1.xhtml',
        id: 'chapter-1',
        label: 'Chapter 1',
        subitems: [],
      },
    };
    const location: Location = {
      atStart: false,
      atEnd: false,
      start: {
        cfi: 'epubcfi(/6/2!/4/2/2)',
        displayed: { page: 1, total: 10 },
        href: 'chapter-1.xhtml',
        index: 0,
        location: 0,
        percentage: 0,
      },
      end: {
        cfi: 'epubcfi(/6/2!/4/2/4)',
        displayed: { page: 1, total: 10 },
        href: 'chapter-1.xhtml',
        index: 0,
        location: 1,
        percentage: 0.1,
      },
    };

    act(() => {
      readerApi.changeFlow('scrolled-doc');
    });

    mockBook.injectJavaScript.mockClear();

    act(() => {
      readerApi.goToLocation(location.start.cfi);
      readerApi.goPrevious();
      readerApi.goNext();
      readerApi.search('needle', 2, 5, { sectionId: 'chapter-1' });
      readerContext.setSearchResults({
        results: [searchResult],
        totalResults: 1,
      });
      readerApi.injectJavascript('window.test = true;');
      readerApi.clearSearchResults();
    });

    expect(readerApi.isSearching).toBe(true);
    expect(readerApi.searchResults).toEqual({ results: [], totalResults: 0 });
    expect(mockBook.injectJavaScript).toHaveBeenCalledWith(
      expect.stringContaining(
        `rendition.display(${JSON.stringify(location.start.cfi)})`
      )
    );
    expect(mockBook.injectJavaScript).toHaveBeenCalledWith(
      expect.stringContaining(
        "rendition.off('relocated', rendition.__resetScrollOffsetAfterNavigation);"
      )
    );
    expect(mockBook.injectJavaScript).toHaveBeenCalledWith(
      expect.stringContaining(
        "rendition.once('relocated', rendition.__resetScrollOffsetAfterNavigation);"
      )
    );
    expect(mockBook.injectJavaScript).toHaveBeenCalledWith(
      expect.stringContaining('const page = 2;')
    );
    expect(mockBook.injectJavaScript).toHaveBeenCalledWith(
      expect.stringContaining('const limit = 5;')
    );
    expect(mockBook.injectJavaScript).toHaveBeenCalledWith(
      expect.stringContaining('const term = "needle";')
    );
    expect(mockBook.injectJavaScript).toHaveBeenCalledWith(
      expect.stringContaining('const chapterId = "chapter-1";')
    );
    const searchScript = mockBook.injectJavaScript.mock.calls.find(
      ([script]) =>
        typeof script === 'string' && script.includes('const term = "needle";')
    )?.[0];

    expect(searchScript).toContain('const wasLoaded = !!item.document;');
    expect(
      searchScript!.indexOf('const wasLoaded = !!item.document;')
    ).toBeLessThan(searchScript!.indexOf('item.load(book.load.bind(book))'));
    expect(searchScript).toContain('if (!wasLoaded) {');
    expect(searchScript).toContain('item.unload();');
    expect(searchScript).toContain(
      'const flattenedToc = flatten(book.navigation.toc);'
    );
    expect(searchScript).toContain('flattenedToc.findIndex(');
    expect(searchScript).toContain(
      "JSON.stringify({ type: 'onSearch', results: [], totalResults: 0 })"
    );
    expect(searchScript).toContain(
      "console.error('[epubjs-react-native] search failed', err);"
    );
    expect(searchScript).not.toContain('alert(err?.message);');
    expect(mockBook.injectJavaScript).toHaveBeenCalledWith(
      'window.test = true;'
    );
  });

  it('serializes string bridge inputs instead of interpolating raw JavaScript', () => {
    const fontFamily = `Apostrophe's $& Font`;
    const cfiRange = `epubcfi(/6/2[chap'ter]!/4/2/2)`;

    act(() => {
      readerApi.changeFontFamily(fontFamily);
      readerApi.goToLocation(cfiRange);
      readerApi.removeAnnotationByCfi(cfiRange);
      readerContext.removeAnnotations('highlight');
    });

    const fontScript = mockBook.injectJavaScript.mock.calls.find(
      ([script]) =>
        typeof script === 'string' && script.includes('rendition.themes.font(')
    )?.[0];
    const locationScript = mockBook.injectJavaScript.mock.calls.find(
      ([script]) =>
        typeof script === 'string' && script.includes('rendition.display(')
    )?.[0];
    const removeByCfiScript = mockBook.injectJavaScript.mock.calls.find(
      ([script]) =>
        typeof script === 'string' &&
        script.includes("['highlight', 'underline', 'mark'].forEach(type =>") &&
        script.includes(JSON.stringify(cfiRange))
    )?.[0];
    const removeByTypeScript = mockBook.injectJavaScript.mock.calls.find(
      ([script]) =>
        typeof script === 'string' &&
        script.includes('const annotationType = "highlight";')
    )?.[0];

    expect(fontScript).toContain(
      `rendition.themes.font(${JSON.stringify(fontFamily)});`
    );
    expect(locationScript).toContain(
      `rendition.display(${JSON.stringify(cfiRange)});`
    );
    expect(removeByCfiScript).toContain(
      `rendition.annotations.remove(${JSON.stringify(cfiRange)}, type);`
    );
    expect(removeByTypeScript).toContain('annotation.type === annotationType');
  });
});
