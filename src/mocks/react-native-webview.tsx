import React, { forwardRef, useImperativeHandle } from 'react';

export const mockInjectJavaScript = jest.fn();
export let lastWebViewProps: Record<string, unknown> | null = null;

export function resetWebViewMockState() {
  mockInjectJavaScript.mockReset();
  lastWebViewProps = null;
}

export const WebView = forwardRef((props: Record<string, unknown>, ref) => {
  lastWebViewProps = props;

  useImperativeHandle(ref, () => ({
    injectJavaScript: mockInjectJavaScript,
  }));

  return null;
});

WebView.displayName = 'MockWebView';

export default { WebView, mockInjectJavaScript, resetWebViewMockState };
