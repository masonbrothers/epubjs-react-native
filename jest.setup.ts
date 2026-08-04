import 'react-native-gesture-handler/jestSetup';

jest.setTimeout(20000);
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('react-native-webview', () => {
  const mockModule = require('./src/mocks/react-native-webview');

  return {
    __esModule: true,
    default: mockModule.WebView,
    ...mockModule,
  };
});
