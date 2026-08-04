import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import type { LoadingFileProps, ReaderProps } from '../../types';

import { styles } from './styles';

export function LoadingFile({
  downloadProgress,
  downloadError,
  width,
  height,
}: LoadingFileProps & Pick<ReaderProps, 'width' | 'height'>) {
  return (
    <View style={[styles.container, { width, height }]}>
      {!downloadError && <ActivityIndicator size="large" />}

      <Text style={styles.text}>
        {downloadError
          ? `Unable to open book: ${downloadError}`
          : `Loading ${downloadProgress}%`}
      </Text>
    </View>
  );
}
