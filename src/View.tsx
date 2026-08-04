import React, { useContext, useEffect, useRef, useState } from 'react';
import { Dimensions, Platform, View as RNView } from 'react-native';
import WebView, { type WebViewProps as NativeWebViewProps } from 'react-native-webview';
import type {
  ShouldStartLoadRequest,
  WebViewMessageEvent,
  WebViewOpenWindowEvent,
} from 'react-native-webview/lib/WebViewTypes';
import { defaultTheme as initialTheme, ReaderContext } from './context';
import type { Bookmark, ReaderProps } from './types';
import { OpeningBook } from './utils/OpeningBook';
import INTERNAL_EVENTS from './utils/internalEvents.util';
import { GestureHandler } from './utils/GestureHandler';

export type ViewProps = Omit<ReaderProps, 'src' | 'fileSystem'> & {
  templateUri: string;
  readAccessUrl: string;
};

const WebViewComponent = WebView as unknown as React.ComponentType<
  NativeWebViewProps & React.RefAttributes<WebView>
>;

export function View({
  templateUri,
  readAccessUrl,
  onStarted = () => {},
  onReady = () => {},
  onDisplayError = () => {},
  onResized = () => {},
  onLocationChange = () => {},
  onRendered = () => {},
  onSearch = () => {},
  onLocationsReady = () => {},
  onSelected = () => {},
  onPressAnnotation = () => {},
  onOrientationChange = () => {},
  onLayout = () => {},
  onNavigationLoaded = () => {},
  onBeginning = () => {},
  onFinish = () => {},
  onPress = () => {},
  onSingleTap = () => {},
  onDoublePress = () => {},
  onDoubleTap = () => {},
  onLongPress = () => {},
  width,
  height,
  initialLocation,
  enableSwipe = true,
  onSwipeLeft = () => {},
  onSwipeRight = () => {},
  onSwipeUp = () => {},
  onSwipeDown = () => {},
  defaultTheme = initialTheme,
  renderOpeningBookComponent = () => (
    <OpeningBook
      width={width}
      height={height}
      backgroundColor={defaultTheme.body.background}
    />
  ),
  openingBookComponentContainerStyle = {
    width: width || Dimensions.get('screen').width,
    height: height || Dimensions.get('screen').height,
  },
  onPressExternalLink,
  menuItems,
  onAddAnnotation = () => {},
  onChangeAnnotations = () => {},
  initialAnnotations,
  onAddBookmark = () => {},
  onRemoveBookmark = () => {},
  onUpdateBookmark = () => {},
  onChangeBookmarks = () => {},
  onIsBookmarked = () => {},
  initialBookmarks,
  injectedJavascript,
  getInjectionJavascriptFn,
  onWebViewMessage,
  waitForLocationsReady = false,
  keepScrollOffsetOnLocationChange,
  flow,
  onChangeSection = () => {},
}: ViewProps) {
  const {
    registerBook,
    setTotalLocations,
    setCurrentLocation,
    setMeta,
    setProgress,
    setLocations,
    setAtStart,
    setAtEnd,
    goNext,
    goPrevious,
    isRendering,
    setIsRendering,
    goToLocation,
    changeTheme,
    setKey,
    setSearchResults,
    theme,
    removeSelection,
    setAnnotations,
    setInitialAnnotations,
    section,
    setSection,
    setToc,
    setLandmarks,
    setBookmarks,
    bookmarks,
    setIsBookmarked,
    currentLocation: currLoc,
    setIsSearching,
    setFlow,
  } = useContext(ReaderContext);
  const book = useRef<WebView>(null);
  const pendingInitialLocation = useRef(initialLocation);
  const initialLocationRestoreStarted = useRef(false);
  const [selectedText, setSelectedText] = useState<{
    cfiRange: string;
    cfiRangeText: string;
  }>({ cfiRange: '', cfiRangeText: '' });

  useEffect(() => {
    setFlow(flow || 'auto');
  }, [flow, setFlow]);

  useEffect(() => {
    pendingInitialLocation.current = initialLocation;
    initialLocationRestoreStarted.current = false;
  }, [initialLocation]);

  useEffect(() => {
    if (getInjectionJavascriptFn && book.current) {
      getInjectionJavascriptFn(book.current.injectJavaScript);
    }
  }, [getInjectionJavascriptFn]);

  const handleChangeIsBookmarked = (
    items: Bookmark[],
    currentLoc = currLoc
  ) => {
    const isBookmarked = items.some(
      (bookmark) =>
        bookmark.location.start.cfi === currentLoc?.start.cfi &&
        bookmark.location.end.cfi === currentLoc?.end.cfi
    );

    setIsBookmarked(isBookmarked);
    onIsBookmarked(isBookmarked);
  };

  const onMessage = (event: WebViewMessageEvent) => {
    let parsedEvent;
    try {
      parsedEvent = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }

    if (!parsedEvent || typeof parsedEvent !== 'object') return;

    const { type } = parsedEvent;

    if (!INTERNAL_EVENTS.includes(type) && onWebViewMessage) {
      return onWebViewMessage(parsedEvent);
    }

    delete parsedEvent.type;

    if (type === 'meta') {
      const { metadata } = parsedEvent;
      setMeta(metadata);
    }

    if (type === 'onStarted') {
      setIsRendering(true);

      changeTheme(defaultTheme);

      return onStarted();
    }

    if (type === 'onReady') {
      const { totalLocations, currentLocation, progress } = parsedEvent;
      if (!waitForLocationsReady) {
        setIsRendering(false);
      }

      if (initialAnnotations) {
        setInitialAnnotations(initialAnnotations);
      }

      if (initialLocation) {
        initialLocationRestoreStarted.current = true;
        goToLocation(initialLocation);
      }

      if (injectedJavascript) {
        book.current?.injectJavaScript(injectedJavascript);
      }

      return onReady(totalLocations, currentLocation, progress);
    }

    if (type === 'onDisplayError') {
      const { reason } = parsedEvent;
      pendingInitialLocation.current = undefined;
      initialLocationRestoreStarted.current = false;
      setIsRendering(false);

      return onDisplayError(reason);
    }

    if (type === 'onResized') {
      const { layout } = parsedEvent;

      return onResized(layout);
    }

    if (type === 'onLocationChange') {
      const { totalLocations, currentLocation, progress, currentSection } =
        parsedEvent;
      const pendingLocation = pendingInitialLocation.current;
      if (pendingLocation) {
        if (!initialLocationRestoreStarted.current) return;
        pendingInitialLocation.current = undefined;
        initialLocationRestoreStarted.current = false;
      }

      setTotalLocations(totalLocations);
      setCurrentLocation(currentLocation);
      setProgress(progress);
      setSection(currentSection);

      if (section?.href !== currentSection?.href) {
        onChangeSection(currentSection);
      }

      handleChangeIsBookmarked(bookmarks, currentLocation);

      setAtStart(Boolean(currentLocation.atStart));
      setAtEnd(Boolean(currentLocation.atEnd));
      return onLocationChange(
        totalLocations,
        currentLocation,
        progress,
        currentSection
      );
    }

    if (type === 'onSearch') {
      const { results, totalResults } = parsedEvent;
      setSearchResults({ results, totalResults });
      setIsSearching(false);

      return onSearch(results, totalResults);
    }

    if (type === 'onLocationsReady') {
      const { epubKey, totalLocations, currentLocation, progress } =
        parsedEvent;
      setLocations(parsedEvent.locations);
      setKey(epubKey);
      setTotalLocations(totalLocations);
      setCurrentLocation(currentLocation);
      setProgress(progress);

      if (waitForLocationsReady) {
        setIsRendering(false);
      }

      return onLocationsReady(epubKey, parsedEvent.locations);
    }

    if (type === 'onSelected') {
      const { cfiRange, text } = parsedEvent;

      setSelectedText({ cfiRange, cfiRangeText: text });
      return onSelected(text, cfiRange);
    }

    if (type === 'onOrientationChange') {
      const { orientation } = parsedEvent;

      return onOrientationChange(orientation);
    }

    if (type === 'onBeginning') {
      setAtStart(true);

      return onBeginning();
    }

    if (type === 'onFinish') {
      setAtEnd(true);

      return onFinish();
    }

    if (type === 'onRendered') {
      const { currentSection } = parsedEvent;

      return onRendered(parsedEvent.section, currentSection);
    }

    if (type === 'onLayout') {
      const { layout } = parsedEvent;

      return onLayout(layout);
    }

    if (type === 'onNavigationLoaded') {
      const { toc, landmarks } = parsedEvent;

      setToc(toc);
      setLandmarks(landmarks);

      return onNavigationLoaded({ toc, landmarks });
    }

    if (type === 'onAddAnnotation') {
      const { annotation } = parsedEvent;

      return onAddAnnotation(annotation);
    }

    if (type === 'onChangeAnnotations') {
      const { annotations } = parsedEvent;
      setAnnotations(annotations);
      return onChangeAnnotations(annotations);
    }

    if (type === 'onSetInitialAnnotations') {
      const { annotations } = parsedEvent;
      setAnnotations(annotations);
      return () => {};
    }

    if (type === 'onPressAnnotation') {
      const { annotation } = parsedEvent;

      return onPressAnnotation(annotation);
    }

    if (type === 'onAddBookmark') {
      const { bookmark } = parsedEvent;

      setBookmarks([...bookmarks, bookmark]);
      onAddBookmark(bookmark);
      handleChangeIsBookmarked([...bookmarks, bookmark]);
      return onChangeBookmarks([...bookmarks, bookmark]);
    }

    if (type === 'onRemoveBookmark') {
      const { bookmark } = parsedEvent;

      onRemoveBookmark(bookmark);
      handleChangeIsBookmarked(
        bookmarks.filter(({ id }) => id !== bookmark.id)
      );
      return onChangeBookmarks(
        bookmarks.filter(({ id }) => id !== bookmark.id)
      );
    }

    if (type === 'onRemoveBookmarks') {
      handleChangeIsBookmarked([]);
      return onChangeBookmarks([]);
    }

    if (type === 'onUpdateBookmark') {
      const { bookmark } = parsedEvent;
      const updatedBookmarks = bookmarks.map((item) =>
        item.id === bookmark.id ? bookmark : item
      );

      onUpdateBookmark(bookmark);
      setBookmarks(updatedBookmarks);
      handleChangeIsBookmarked(updatedBookmarks);
      return onChangeBookmarks(updatedBookmarks);
    }

    return () => {};
  };

  const handleOnCustomMenuSelection = (event: {
    nativeEvent: {
      label: string;
      key: string;
      selectedText: string;
    };
  }) => {
    menuItems?.forEach((item) => {
      if (event.nativeEvent.label === item.label) {
        const removeSelectionMenu = item.action(
          selectedText.cfiRange,
          selectedText.cfiRangeText
        );

        if (removeSelectionMenu) {
          removeSelection();
        }
      }
    });
  };

  const handleOnShouldStartLoadWithRequest = (
    request: ShouldStartLoadRequest
  ) => {
    if (/^(https?:|mailto:|tel:)/i.test(request.url)) {
      onPressExternalLink?.(request.url);
      return false;
    }

    if (request.mainDocumentURL && request.url !== request.mainDocumentURL) {
      goToLocation(request.url.replace(request.mainDocumentURL, ''));
      return false;
    }

    return true;
  };

  useEffect(() => {
    if (initialBookmarks) {
      setBookmarks(initialBookmarks);
    }
  }, [initialBookmarks, setBookmarks]);

  useEffect(() => {
    if (book.current) registerBook(book.current);
  }, [registerBook]);

  const webViewOriginWhitelist = ['file://*', 'https://*'];

  return (
    <GestureHandler
      width={width}
      height={height}
      onSingleTap={() => {
        onPress();
        onSingleTap();
      }}
      onDoubleTap={() => {
        onDoublePress();
        onDoubleTap();
      }}
      onLongPress={onLongPress}
      onSwipeLeft={() => {
        if (enableSwipe) {
          goNext({
            keepScrollOffset: keepScrollOffsetOnLocationChange,
          });
          onSwipeLeft();
        }
      }}
      onSwipeRight={() => {
        if (enableSwipe) {
          goPrevious({
            keepScrollOffset: keepScrollOffsetOnLocationChange,
          });
          onSwipeRight();
        }
      }}
      onSwipeUp={() => {
        if (enableSwipe) {
          onSwipeUp();
        }
      }}
      onSwipeDown={() => {
        if (enableSwipe) {
          onSwipeDown();
        }
      }}
    >
      {isRendering && (
        <RNView
          style={{
            ...openingBookComponentContainerStyle,
            position: 'absolute',
            zIndex: 2,
          }}
        >
          {renderOpeningBookComponent()}
        </RNView>
      )}

      <WebViewComponent
        ref={book}
        source={{ uri: templateUri }}
        showsVerticalScrollIndicator={false}
        javaScriptEnabled
        originWhitelist={webViewOriginWhitelist}
        scrollEnabled={false}
        mixedContentMode={Platform.OS === 'android' ? 'never' : undefined}
        onMessage={onMessage}
        menuItems={menuItems?.map((item, key) => ({
          label: item.label,
          key: key.toString(),
        }))}
        onCustomMenuSelection={handleOnCustomMenuSelection}
        allowingReadAccessToURL={readAccessUrl}
        allowUniversalAccessFromFileURLs={false}
        allowFileAccessFromFileURLs={Platform.OS === 'android'}
        allowFileAccess={Platform.OS === 'android'}
        javaScriptCanOpenWindowsAutomatically={Boolean(onPressExternalLink)}
        onOpenWindow={(event: WebViewOpenWindowEvent) => {
          event.preventDefault();

          if (onPressExternalLink) {
            onPressExternalLink(event.nativeEvent.targetUrl);
          }
        }}
        onShouldStartLoadWithRequest={handleOnShouldStartLoadWithRequest}
        style={{
          width,
          backgroundColor: theme.body.background,
          height,
        }}
      />
    </GestureHandler>
  );
}
