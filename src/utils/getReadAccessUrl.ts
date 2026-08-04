function getFileDirectory(uri: string): string | null {
  if (!uri.startsWith('file://')) {
    return null;
  }

  try {
    const url = new URL(uri);
    const path = url.pathname;
    const lastSlashIndex = path.lastIndexOf('/');

    if (lastSlashIndex < 0) {
      return null;
    }

    return path.slice(0, lastSlashIndex + 1);
  } catch {
    return null;
  }
}

function commonDirectoryPath(paths: string[]): string | null {
  if (!paths.length) {
    return null;
  }

  const segmentLists = paths.map((path) =>
    path.split('/').filter((segment) => segment.length > 0)
  );
  const [first, ...rest] = segmentLists;
  let commonLength = first.length;

  for (const segments of rest) {
    let index = 0;

    while (
      index < commonLength &&
      index < segments.length &&
      first[index] === segments[index]
    ) {
      index += 1;
    }

    commonLength = index;
  }

  if (commonLength === 0) {
    return null;
  }

  return `/${first.slice(0, commonLength).join('/')}/`;
}

export function getReadAccessUrl(uris: string[], fallbackUri: string): string {
  const directories = uris
    .map((uri) => getFileDirectory(uri))
    .filter((directory): directory is string => Boolean(directory));

  const commonPath = commonDirectoryPath(directories);

  if (commonPath) {
    return `file://${commonPath}`;
  }

  return fallbackUri;
}
