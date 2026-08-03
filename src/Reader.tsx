import React, { useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
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
  allowScriptedContent = Platform.OS === 'ios',
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

  useEffect(() => {
    (async () => {
      setIsLoading(true);

      const jszipFileUri = `${documentDirectory}/jszip.min.js`;
      const epubjsFileUri = `${documentDirectory}/epub.min.js`;
      try {
        await writeAsStringAsync(jszipFileUri, jszip);
      } catch {
        throw new Error('failed to write jszip js file');
      }

      try {
        await writeAsStringAsync(epubjsFileUri, epubjs);
      } catch {
        throw new Error('failed to write epubjs js file');
      }

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
          if (sourceType === SourceType.BASE64) {
            setTemplate(
              injectWebViewVariables({
                jszip: jszipFileUri,
                epubjs: epubjsFileUri,
                type: SourceType.BASE64,
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
          } else {
            setTemplate(
              injectWebViewVariables({
                jszip: jszipFileUri,
                epubjs: epubjsFileUri,
                type: SourceType.BINARY,
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
        }

        if (isExternalSource) {
          const sourceName = getSourceName(src);

          if (!sourceName) {
            throw new Error(`Invalid source name: ${src}`);
          }

          if (sourceType === SourceType.OPF || sourceType === SourceType.EPUB) {
            setTemplate(
              injectWebViewVariables({
                jszip: jszipFileUri,
                epubjs: epubjsFileUri,
                type: sourceType,
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
          } else {
            const { uri: bookFileUri } = await downloadFile(src, sourceName);

            if (!bookFileUri) throw new Error("Couldn't download book");

            setReadAccessUrl(
              getReadAccessUrl(
                [bookFileUri, jszipFileUri, epubjsFileUri],
                documentDirectory || jszipFileUri
              )
            );

            setTemplate(
              injectWebViewVariables({
                jszip: jszipFileUri,
                epubjs: epubjsFileUri,
                type: sourceType,
                book: bookFileUri,
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
      }
    })();
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
    setIsLoading,
    src,
    // ! Causing unknown loop
    // writeAsStringAsync,
  ]);

  useEffect(() => {
    const saveTemplateFileToDoc = async () => {
      try {
        if (template) {
          const content = template;

          const fileUri = `${documentDirectory}/index.html`;
          await writeAsStringAsync(fileUri, content);
          setTemplateUrl(fileUri);
        }
      } catch {
        throw new Error('Error saving index.html file:');
      }
    };
    if (template) {
      saveTemplateFileToDoc();
    }
  }, [documentDirectory, template, writeAsStringAsync]);

  if (isLoading) {
    return renderLoadingFileComponent({
      fileSize,
      downloadProgress,
      downloadSuccess,
      downloadError,
    });
  }

  if (!templateUrl || !readAccessUrl) {
    return renderLoadingFileComponent({
      fileSize,
      downloadProgress,
      downloadSuccess,
      downloadError,
    });
  }
  return (
    <View
      templateUri={templateUrl}
      readAccessUrl={readAccessUrl}
      width={width}
      height={height}
      defaultTheme={defaultTheme || initialTheme}
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
