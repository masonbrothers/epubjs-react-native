import React from 'react';
import { Platform } from 'react-native';
import { act, render, waitFor } from '@testing-library/react-native';
import { Reader } from '../Reader';
import { ReaderProvider } from '../context';

const mockInjectWebViewVariables = jest.fn(
  () => '<html><body>reader</body></html>'
);
const capturedViewProps: Record<string, unknown>[] = [];

jest.mock('../hooks/useInjectWebviewVariables', () => ({
  useInjectWebViewVariables: () => ({
    injectWebViewVariables: mockInjectWebViewVariables,
  }),
}));

jest.mock('../View', () => ({
  View: (props: Record<string, unknown>) => {
    capturedViewProps.push(props);
    return null;
  },
}));

describe('Reader defaults', () => {
  const originalPlatform = Platform.OS;
  const writeAsStringAsync = jest.fn().mockResolvedValue(undefined);
  const downloadFile = jest.fn();

  const useFileSystem = () => ({
    downloadFile,
    size: 0,
    progress: 0,
    success: true,
    error: undefined,
    documentDirectory: 'file:///documents',
    writeAsStringAsync,
  });

  beforeEach(() => {
    mockInjectWebViewVariables.mockClear();
    capturedViewProps.length = 0;
    writeAsStringAsync.mockClear();
    downloadFile.mockReset();
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'ios',
    });
  });

  afterAll(() => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: originalPlatform,
    });
  });

  it('keeps scripted EPUB content disabled by default on iOS', async () => {
    render(
      <ReaderProvider>
        <Reader
          src="file:///books/pride-and-prejudice.epub"
          fileSystem={useFileSystem}
        />
      </ReaderProvider>
    );

    await waitFor(() => expect(mockInjectWebViewVariables).toHaveBeenCalled());

    expect(mockInjectWebViewVariables.mock.calls[0][0]).toMatchObject({
      allowScriptedContent: false,
    });
    expect(writeAsStringAsync).toHaveBeenCalledWith(
      'file:///documents/index.html',
      '<html><body>reader</body></html>'
    );
    await waitFor(() => expect(capturedViewProps).toHaveLength(1));
  });

  it('reports initialization failures instead of leaving the loading spinner active', async () => {
    const onDisplayError = jest.fn();
    writeAsStringAsync.mockRejectedValueOnce(new Error('disk full'));

    const screen = render(
      <ReaderProvider>
        <Reader
          src="file:///books/pride-and-prejudice.epub"
          fileSystem={useFileSystem}
          onDisplayError={onDisplayError}
        />
      </ReaderProvider>
    );

    await waitFor(() =>
      expect(onDisplayError).toHaveBeenCalledWith(
        'Failed to initialize the EPUB reader: disk full'
      )
    );
    expect(
      screen.getByText(
        'Unable to open book: Failed to initialize the EPUB reader: disk full'
      )
    ).toBeTruthy();
    expect(screen.queryByText(/Loading/)).toBeNull();
  });

  it('reports template write failures instead of rejecting an unobserved promise', async () => {
    const onDisplayError = jest.fn();
    writeAsStringAsync
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('read-only directory'));

    const screen = render(
      <ReaderProvider>
        <Reader
          src="file:///books/pride-and-prejudice.epub"
          fileSystem={useFileSystem}
          onDisplayError={onDisplayError}
        />
      </ReaderProvider>
    );

    await waitFor(() =>
      expect(onDisplayError).toHaveBeenCalledWith(
        'Failed to save the EPUB reader template: read-only directory'
      )
    );
    expect(
      screen.getByText(
        'Unable to open book: Failed to save the EPUB reader template: read-only directory'
      )
    ).toBeTruthy();
  });

  it('does not reinitialize when the display error callback changes', async () => {
    const firstOnDisplayError = jest.fn();
    const secondOnDisplayError = jest.fn();
    const screen = render(
      <ReaderProvider>
        <Reader
          src="file:///books/pride-and-prejudice.epub"
          fileSystem={useFileSystem}
          onDisplayError={firstOnDisplayError}
        />
      </ReaderProvider>
    );

    await waitFor(() => expect(capturedViewProps).toHaveLength(1));

    await act(async () => {
      screen.rerender(
        <ReaderProvider>
          <Reader
            src="file:///books/pride-and-prejudice.epub"
            fileSystem={useFileSystem}
            onDisplayError={secondOnDisplayError}
          />
        </ReaderProvider>
      );
    });

    expect(mockInjectWebViewVariables).toHaveBeenCalledTimes(1);
    expect(writeAsStringAsync).toHaveBeenCalledTimes(3);
  });
});
