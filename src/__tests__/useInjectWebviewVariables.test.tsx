import { renderHook } from '@testing-library/react-native';
import {
  serializeForInlineScript,
  useInjectWebViewVariables,
} from '../hooks/useInjectWebviewVariables';
import { SourceType } from '../utils/enums/source-type.enum';
import template from '../template';

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
    expect(html).toContain(
      '<script src="file:///tmp/jszip&quot;unsafe.js"></script>'
    );
    expect(html).toContain(
      '<script src="file:///tmp/epub&lt;unsafe&gt;.js"></script>'
    );
    expect(html).not.toContain(`const file = '${base64Book}';`);
  });

  it('does not let replacement tokens corrupt inline substitutions', () => {
    const { result } = renderHook(() => useInjectWebViewVariables());
    const html = result.current.injectWebViewVariables({
      jszip: 'file:///tmp/jszip$&.js',
      epubjs: 'file:///tmp/epub$1.js',
      type: SourceType.BINARY,
      book: `file:///tmp/book$'.epub`,
      theme: {
        body: {
          fontFamily: '$` serif',
        },
      },
      enableSelection: false,
      allowScriptedContent: false,
      allowPopups: false,
      manager: 'default',
      flow: 'auto',
      snap: undefined,
      spread: undefined,
      fullsize: undefined,
      charactersPerLocation: 1600,
    });

    expect(html).toContain(
      '<script src="file:///tmp/jszip$&amp;.js"></script>'
    );
    expect(html).toContain('<script src="file:///tmp/epub$1.js"></script>');
    expect(html).toContain(
      `const file = ${serializeForInlineScript(`file:///tmp/book$'.epub`)};`
    );
    expect(html).toContain(
      `const theme = ${serializeForInlineScript({
        body: {
          fontFamily: '$` serif',
        },
      })};`
    );
  });
});

describe('template bridge contract', () => {
  it('reports display errors with the caught error message', () => {
    expect(template).toContain('.catch(function (err) {');
    expect(template).toContain('reason: err?.message ?? String(err)');
  });

  it('waits for locations and the first display before reporting readiness', () => {
    const generation = template.indexOf(
      'return book.locations.generate(1600);'
    );
    const display = template.indexOf('return rendition.display();');
    const currentLocation = template.indexOf(
      'var currentLocation = rendition.currentLocation();'
    );
    const locationsReady = template.indexOf('type: "onLocationsReady"');

    expect(generation).toBeGreaterThan(-1);
    expect(display).toBeGreaterThan(generation);
    expect(currentLocation).toBeGreaterThan(display);
    expect(locationsReady).toBeGreaterThan(currentLocation);
    expect(template).toContain('var currentCfi = currentLocation?.start?.cfi;');
    expect(template).toContain(
      'Math.floor(book.locations.percentageFromCfi(currentCfi) * 100)'
    );
  });
});
