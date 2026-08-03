import 'react-native-gesture-handler/jestSetup';

jest.setTimeout(20000);

jest.mock('react-native-webview', () => {
  const WebView = require('./src/mocks/react-native-webview');

  return WebView;
});
