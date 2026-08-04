import { SourceType } from './enums/source-type.enum';

export function getSourceType(source: string): SourceType | undefined {
  const normalized = source.trim();
  const path = normalized.split(/[?#]/u, 1)[0]?.toLowerCase() ?? '';
  const isDataUrl = /^data:[^,]*;base64,/iu.test(normalized);
  const isRawBase64 =
    normalized.length > 1000 &&
    normalized.length % 4 === 0 &&
    /^[a-z0-9+/]+={0,2}$/iu.test(normalized);

  if (isDataUrl || isRawBase64) {
    return SourceType.BASE64;
  }

  if (path.endsWith('.epub')) {
    return SourceType.EPUB;
  }

  if (path.endsWith('.opf')) {
    return SourceType.OPF;
  }
  return undefined;
}
