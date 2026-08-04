import React, { useContext, useEffect, useState } from 'react';
import { LoadingFile } from './utils/LoadingFile';
import type { ReaderProps } from './types';
import { View } from './View';
import { useInjectWebViewVariables } from './hooks/useInjectWebviewVariables';
import { ReaderContext, defaultTheme as initialTheme } from './context';
import { isURL } from './utils/isURL';
import { getSourceType } from './utils/getSourceType';
import { getSourceName } from './utils/getPathname';
import { SourceType } from './utils/enums/source-type.enum';
import { isFsUri } from './utils/isFsUri';
import { getReadAccessUrl } from './utils/getReadAccessUrl';
import jszip from './jszip';
import epubjs from './epubjs';

export function Reader({
  src,
  width = '100%',
  height = '100%',
  defaultTheme = initialTheme,
  initialLocations,
  allowScriptedContent = false,
  onDisplayError,
  onPressExternalLink,
  renderLoadingFileComponent = (props) => (
    <LoadingFile {...props} width={width} height={height} />
  ),
  fileSystem: useFileSystem,
  menuItems,
  manager = 'default',
  flow = 'auto',
  snap,
  spread,
  fullsize,
  charactersPerLocation,
  ...rest
}: ReaderProps) {
  const {
    downloadFile,
    size: fileSize,
    progress: downloadProgress,
    success: downloadSuccess,
    error: downloadError,
    documentDirectory,
    writeAsStringAsync,
  } = useFileSystem();
  const enableSelection = menuItems ? true : rest.enableSelection || false;
  const allowPopups = onPressExternalLink ? true : rest.allowPopups || false;

  const { setIsLoading, isLoading } = useContext(ReaderContext);
  const { injectWebViewVariables } = useInjectWebViewVariables();
  const [template, setTemplate] = useState<string | null>(null);
  const [templateUrl, setTemplateUrl] = useState<string | null>(null);
  const [readAccessUrl, setReadAccessUrl] = useState<string | null>(null);
  const [initializationError, setInitializationError] = useState<string | null>(
    null
  );

  useEffect(() => {
    let isActive = true;

    (async () => {
      try {
        setInitializationError(null);
        setIsLoading(true);

        const jszipFileUri = `${documentDirectory}/jszip.min.js`;
        const epubjsFileUri = `${documentDirectory}/epub.min.js`;
        await writeAsStringAsync(jszipFileUri, jszip);
        await writeAsStringAsync(epubjsFileUri, epubjs);
        if (!isActive) return;

        setReadAccessUrl(
          getReadAccessUrl(
            [jszipFileUri, epubjsFileUri],
            documentDirectory || jszipFileUri
          )
        );

        if (src) {
          const sourceType = getSourceType(src);
          const isExternalSource = isURL(src);
          const isSrcInFs = isFsUri(src);

          if (!sourceType) {
            throw new Error(`Invalid source type: ${src}`);
          }

          if (!isExternalSource) {
            if (isSrcInFs) {
              setReadAccessUrl(
                getReadAccessUrl(
                  [src, jszipFileUri, epubjsFileUri],
                  documentDirectory || jszipFileUri
                )
              );
            }
            setTemplate(
              injectWebViewVariables({
                jszip: jszipFileUri,
                epubjs: epubjsFileUri,
                type:
                  sourceType === SourceType.BASE64
                    ? SourceType.BASE64
                    : SourceType.BINARY,
                book: src,
                theme: defaultTheme,
                locations: initialLocations,
                enableSelection,
                allowScriptedContent,
                allowPopups,
                manager,
                flow,
                snap,
                spread,
                fullsize,
                charactersPerLocation,
              })
            );
            setIsLoading(false);
          }

          if (isExternalSource) {
            const sourceName = getSourceName(src);

            if (!sourceName) {
              throw new Error(`Invalid source name: ${src}`);
            }

            let book = src;
            if (
              sourceType !== SourceType.OPF &&
              sourceType !== SourceType.EPUB
            ) {
              const download = await downloadFile(src, sourceName);
              if (!download.uri) throw new Error("Couldn't download book");
              book = download.uri;

              setReadAccessUrl(
                getReadAccessUrl(
                  [book, jszipFileUri, epubjsFileUri],
                  documentDirectory || jszipFileUri
                )
              );
            }

            if (!isActive) return;
            setTemplate(
              injectWebViewVariables({
                jszip: jszipFileUri,
                epubjs: epubjsFileUri,
                type: sourceType,
                book,
                theme: defaultTheme,
                locations: initialLocations,
                enableSelection,
                allowScriptedContent,
                allowPopups,
                manager,
                flow,
                snap,
                spread,
                fullsize,
                charactersPerLocation,
              })
            );
            setIsLoading(false);
          }
        }
      } catch (error) {
        if (!isActive) return;
        const reason = `Failed to initialize the EPUB reader: ${
          error instanceof Error ? error.message : String(error)
        }`;
        setInitializationError(reason);
        setIsLoading(false);
        onDisplayError?.(reason);
      }
    })();

    return () => {
      isActive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    allowPopups,
    allowScriptedContent,
    defaultTheme,
    documentDirectory,
    downloadFile,
    enableSelection,
    initialLocations,
    injectWebViewVariables,
    onDisplayError,
    setIsLoading,
    src,
    // ! Causing unknown loop
    // writeAsStringAsync,
  ]);

  useEffect(() => {
    let isActive = true;

    const saveTemplateFileToDoc = async () => {
      try {
        if (template) {
          const content = template;

          const fileUri = `${documentDirectory}/index.html`;
          await writeAsStringAsync(fileUri, content);
          if (isActive) setTemplateUrl(fileUri);
        }
      } catch (error) {
        if (!isActive) return;
        const reason = `Failed to save the EPUB reader template: ${
          error instanceof Error ? error.message : String(error)
        }`;
        setInitializationError(reason);
        setIsLoading(false);
        onDisplayError?.(reason);
      }
    };
    if (template) {
      saveTemplateFileToDoc();
    }
    return () => {
      isActive = false;
    };
  }, [
    documentDirectory,
    onDisplayError,
    setIsLoading,
    template,
    writeAsStringAsync,
  ]);

  const readerError = initializationError ?? downloadError;

  if (isLoading) {
    return renderLoadingFileComponent({
      fileSize,
      downloadProgress,
      downloadSuccess,
      downloadError: readerError,
    });
  }

  if (!templateUrl || !readAccessUrl) {
    return renderLoadingFileComponent({
      fileSize,
      downloadProgress,
      downloadSuccess,
      downloadError: readerError,
    });
  }
  return (
    <View
      templateUri={templateUrl}
      readAccessUrl={readAccessUrl}
      width={width}
      height={height}
      defaultTheme={defaultTheme || initialTheme}
      onDisplayError={onDisplayError}
      onPressExternalLink={onPressExternalLink}
      enableSelection={enableSelection}
      menuItems={menuItems}
      manager={manager}
      flow={flow}
      snap={snap}
      {...rest}
    />
  );
}
