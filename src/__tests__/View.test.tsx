import React, { useContext } from 'react';
import { act, render } from '@testing-library/react-native';
import { ReaderContext, ReaderProvider } from '../context';
import { View } from '../View';
import {
  lastWebViewProps,
  mockInjectJavaScript,
  resetWebViewMockState,
} from '../mocks/react-native-webview';

jest.mock('../utils/GestureHandler', () => ({
  GestureHandler: ({ children }: { children: React.ReactNode }) => children,
}));

describe('View WebView configuration', () => {
  beforeEach(() => {
    resetWebViewMockState();
  });

  it('narrows WebView defaults and preserves external-link callbacks', () => {
    const onPressExternalLink = jest.fn();
    render(
      <ReaderProvider>
        <View
          templateUri="file:///tmp/index.html"
          readAccessUrl="file:///tmp/"
          width="100%"
          height="100%"
          defaultTheme={{ body: { background: '#ffffff' } }}
          onPressExternalLink={onPressExternalLink}
        />
      </ReaderProvider>
    );

    expect(lastWebViewProps).toMatchObject({
      originWhitelist: ['file://*', 'https://*'],
      allowUniversalAccessFromFileURLs: false,
      javaScriptCanOpenWindowsAutomatically: true,
    });
    expect(lastWebViewProps?.originWhitelist).not.toEqual(['*']);

    act(() => {
      lastWebViewProps?.onOpenWindow?.({
        nativeEvent: { targetUrl: 'https://example.com' },
        preventDefault: jest.fn(),
      });
      expect(
        lastWebViewProps?.onShouldStartLoadWithRequest?.({
          url: 'mailto:reader@example.com',
          mainDocumentURL: 'file:///tmp/index.html',
        })
      ).toBe(false);
    });

    expect(onPressExternalLink).toHaveBeenCalledWith('https://example.com');
    expect(onPressExternalLink).toHaveBeenCalledWith(
      'mailto:reader@example.com'
    );
  });

  it('blocks external navigation and internal links after dispatching them', () => {
    const onPressExternalLink = jest.fn();
    render(
      <ReaderProvider>
        <View
          templateUri="file:///tmp/index.html"
          readAccessUrl="file:///tmp/"
          width="100%"
          height="100%"
          defaultTheme={{ body: { background: '#ffffff' } }}
          onPressExternalLink={onPressExternalLink}
        />
      </ReaderProvider>
    );

    expect(
      lastWebViewProps?.onShouldStartLoadWithRequest?.({
        url: 'file:///tmp/index.html',
        mainDocumentURL: 'file:///tmp/index.html',
      })
    ).toBe(true);
    expect(
      lastWebViewProps?.onShouldStartLoadWithRequest?.({
        url: 'https://example.com/chapter',
        mainDocumentURL: 'file:///tmp/index.html',
      })
    ).toBe(false);
    expect(
      lastWebViewProps?.onShouldStartLoadWithRequest?.({
        url: 'file:///tmp/index.html#epubcfi(/6/2)',
        mainDocumentURL: 'file:///tmp/index.html',
      })
    ).toBe(false);
    expect(onPressExternalLink).toHaveBeenCalledWith(
      'https://example.com/chapter'
    );
  });

  it('clears stale opposite location boundaries', () => {
    let context: React.ContextType<typeof ReaderContext>;
    const Probe = () => {
      context = useContext(ReaderContext);
      return null;
    };

    render(
      <ReaderProvider>
        <Probe />
        <View
          templateUri="file:///tmp/index.html"
          readAccessUrl="file:///tmp/"
          width="100%"
          height="100%"
          defaultTheme={{ body: { background: '#ffffff' } }}
        />
      </ReaderProvider>
    );

    const sendLocation = (atStart: boolean, atEnd: boolean) =>
      lastWebViewProps?.onMessage?.({
        nativeEvent: {
          data: JSON.stringify({
            type: 'onLocationChange',
            totalLocations: 2,
            progress: atEnd ? 100 : 0,
            currentSection: { href: 'chapter.xhtml' },
            currentLocation: {
              atStart,
              atEnd,
              start: { cfi: 'epubcfi(/6/2)', displayed: { page: 1, total: 2 } },
              end: { cfi: 'epubcfi(/6/4)', displayed: { page: 1, total: 2 } },
            },
          }),
        },
      } as never);

    act(() => sendLocation(true, false));
    expect(context!.atStart).toBe(true);
    expect(context!.atEnd).toBe(false);

    act(() => sendLocation(false, true));
    expect(context!.atStart).toBe(false);
    expect(context!.atEnd).toBe(true);
    expect(lastWebViewProps?.javaScriptCanOpenWindowsAutomatically).toBe(false);
  });

  it('ignores malformed WebView messages instead of crashing the React tree', () => {
    render(
      <ReaderProvider>
        <View
          templateUri="file:///tmp/index.html"
          readAccessUrl="file:///tmp/"
          width="100%"
          height="100%"
          defaultTheme={{ body: { background: '#ffffff' } }}
        />
      </ReaderProvider>
    );

    expect(() =>
      lastWebViewProps?.onMessage?.({
        nativeEvent: { data: 'not-json' },
      } as never)
    ).not.toThrow();
  });

  it('updates bookmarks without mutating the initial bookmark objects', () => {
    const initialBookmark = {
      id: 7,
      chapter: { href: 'chapter.xhtml', id: 'chapter', label: 'Chapter' },
      location: {
        atStart: false,
        atEnd: false,
        start: { cfi: 'epubcfi(/6/2)' },
        end: { cfi: 'epubcfi(/6/4)' },
      },
      text: 'Before',
      data: { color: 'yellow' },
    };
    const initialBookmarks = [initialBookmark];
    const onChangeBookmarks = jest.fn();

    render(
      <ReaderProvider>
        <View
          templateUri="file:///tmp/index.html"
          readAccessUrl="file:///tmp/"
          width="100%"
          height="100%"
          defaultTheme={{ body: { background: '#ffffff' } }}
          initialBookmarks={initialBookmarks as never}
          onChangeBookmarks={onChangeBookmarks}
        />
      </ReaderProvider>
    );

    act(() => {
      lastWebViewProps?.onMessage?.({
        nativeEvent: {
          data: JSON.stringify({
            type: 'onUpdateBookmark',
            bookmark: { ...initialBookmark, text: 'After' },
          }),
        },
      } as never);
    });

    expect(initialBookmark.text).toBe('Before');
    expect(initialBookmarks[0]?.text).toBe('Before');
    expect(onChangeBookmarks).toHaveBeenCalledWith([
      expect.objectContaining({ id: 7, text: 'After' }),
    ]);
  });

  it('does not publish the default location before restoring an initial CFI', () => {
    const initialLocation = 'epubcfi(/6/8!/4/2)';
    const onLocationChange = jest.fn();
    render(
      <ReaderProvider>
        <View
          templateUri="file:///tmp/index.html"
          readAccessUrl="file:///tmp/"
          width="100%"
          height="100%"
          defaultTheme={{ body: { background: '#ffffff' } }}
          initialLocation={initialLocation}
          onLocationChange={onLocationChange}
        />
      </ReaderProvider>
    );

    const send = (type: string, cfi: string) =>
      lastWebViewProps?.onMessage?.({
        nativeEvent: {
          data: JSON.stringify({
            type,
            totalLocations: 10,
            progress: cfi === initialLocation ? 50 : 0,
            currentSection: { href: 'chapter.xhtml' },
            currentLocation: {
              atStart: false,
              atEnd: false,
              start: { cfi, href: 'chapter.xhtml' },
              end: { cfi },
            },
          }),
        },
      } as never);

    act(() => send('onLocationChange', 'epubcfi(/6/2!/4/2)'));
    expect(onLocationChange).not.toHaveBeenCalled();

    act(() => send('onReady', 'epubcfi(/6/2!/4/2)'));
    expect(mockInjectJavaScript).toHaveBeenCalledWith(
      expect.stringContaining(
        `rendition.display(${JSON.stringify(initialLocation)})`
      )
    );

    const resolvedLocation = 'epubcfi(/6/8!/4/2/1:0)';
    act(() => send('onLocationChange', resolvedLocation));
    expect(onLocationChange).toHaveBeenCalledTimes(1);
    expect(onLocationChange).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        start: expect.objectContaining({ cfi: resolvedLocation }),
      }),
      0,
      expect.anything()
    );
  });

  it('stops suppressing locations when initial restoration fails', () => {
    const onDisplayError = jest.fn();
    const onLocationChange = jest.fn();
    render(
      <ReaderProvider>
        <View
          templateUri="file:///tmp/index.html"
          readAccessUrl="file:///tmp/"
          width="100%"
          height="100%"
          defaultTheme={{ body: { background: '#ffffff' } }}
          initialLocation="epubcfi(/invalid)"
          onDisplayError={onDisplayError}
          onLocationChange={onLocationChange}
        />
      </ReaderProvider>
    );

    act(() => {
      lastWebViewProps?.onMessage?.({
        nativeEvent: {
          data: JSON.stringify({
            type: 'onDisplayError',
            reason: 'Invalid CFI',
          }),
        },
      } as never);
    });
    act(() => {
      lastWebViewProps?.onMessage?.({
        nativeEvent: {
          data: JSON.stringify({
            type: 'onLocationChange',
            totalLocations: 10,
            progress: 0,
            currentSection: { href: 'chapter.xhtml' },
            currentLocation: {
              atStart: true,
              atEnd: false,
              start: { cfi: 'epubcfi(/6/2!/4/2)', href: 'chapter.xhtml' },
              end: { cfi: 'epubcfi(/6/2!/4/4)' },
            },
          }),
        },
      } as never);
    });

    expect(onDisplayError).toHaveBeenCalledWith('Invalid CFI');
    expect(onLocationChange).toHaveBeenCalledTimes(1);
  });
});
