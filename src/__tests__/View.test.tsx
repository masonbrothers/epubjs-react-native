import React from 'react';
import { act, render } from '@testing-library/react-native';
import { ReaderProvider } from '../context';
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
      originWhitelist: ['file://*', 'http://*', 'https://*'],
      allowUniversalAccessFromFileURLs: false,
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
      ).toBe(true);
    });

    expect(onPressExternalLink).toHaveBeenCalledWith('https://example.com');
    expect(onPressExternalLink).toHaveBeenCalledWith(
      'mailto:reader@example.com'
    );
  });
});
