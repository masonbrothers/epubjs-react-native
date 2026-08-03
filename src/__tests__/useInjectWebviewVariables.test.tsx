import { renderHook } from '@testing-library/react-native';
import {
  serializeForInlineScript,
  useInjectWebViewVariables,
} from '../hooks/useInjectWebviewVariables';
import { SourceType } from '../utils/enums/source-type.enum';

describe('useInjectWebViewVariables', () => {
  it('serializes inline values without leaving a raw closing script payload', () => {
    const payload = '</script><script>alert("xss")</script>';

    expect(serializeForInlineScript(payload)).toBe(
      '"\\u003C/script\\u003E\\u003Cscript\\u003Ealert(\\"xss\\")\\u003C/script\\u003E"'
    );
    expect(serializeForInlineScript(payload)).not.toContain('</script>');
  });

  it('preserves base64 book payloads while escaping unsafe template injections', () => {
    const { result } = renderHook(() => useInjectWebViewVariables());
    const base64Book =
      'data:application/epub+zip;base64,ZmFrZQ==\'"</script><script>alert("xss")</script>';
    const html = result.current.injectWebViewVariables({
      jszip: 'file:///tmp/jszip"unsafe.js',
      epubjs: 'file:///tmp/epub<unsafe>.js',
      type: SourceType.BASE64,
      book: base64Book,
      theme: {
        body: {
          background: '#ffffff',
        },
        a: {
          color: '</script>',
        },
      },
      enableSelection: true,
      locations: ['epubcfi(/6/2!/4/2/2)'],
      allowScriptedContent: true,
      allowPopups: false,
      manager: 'default',
      flow: 'paginated',
      snap: false,
      spread: 'auto',
      fullsize: true,
      charactersPerLocation: 2048,
    });

    expect(html).toContain(
      `const file = ${serializeForInlineScript(base64Book)};`
    );
    expect(html).toContain(
      `const theme = ${serializeForInlineScript({
        body: {
          background: '#ffffff',
        },
        a: {
          color: '</script>',
        },
      })};`
    );
    expect(html).toContain(
      'const initialLocations = ["epubcfi(/6/2!/4/2/2)"];'
    );
    expect(html).toContain('book = ePub(file, { encoding: "base64" });');
    expect(html).toContain('<script src="file:///tmp/jszip&quot;unsafe.js"></script>');
    expect(html).toContain('<script src="file:///tmp/epub&lt;unsafe&gt;.js"></script>');
    expect(html).not.toContain(`const file = '${base64Book}';`);
  });
});
