import React, { useContext } from 'react';
import { act, render } from '@testing-library/react-native';
import { ReaderContext, ReaderProvider } from '../context';
import { View } from '../View';
import {
  lastWebViewProps,
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
});
