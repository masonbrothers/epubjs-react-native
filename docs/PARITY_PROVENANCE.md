# Wrapper Parity Provenance

Date: 2026-08-04
Branch: `integration/parity-9522941`
Baseline tag: `upstream-baseline-9522941`

## Repository Lineage

| Role                         | URL                                                     | Commit / Ref                               | License |
| ---------------------------- | ------------------------------------------------------- | ------------------------------------------ | ------- |
| Maintained fork (`origin`)   | `git@github.com:masonbrothers/epubjs-react-native.git`  | integration branch from `master`           | MIT     |
| Upstream source (`upstream`) | `git@github.com:victorsoares96/epubjs-react-native.git` | `95229411e63934f6aa781c58392260149a1d3583` | MIT     |

## Toolchain Pin

| Tool           | Version      |
| -------------- | ------------ |
| Node.js        | `v24.18.0`   |
| npm            | `12.0.2`     |
| packageManager | `npm@12.0.2` |

`.nvmrc` is pinned to `24.18.0`.

## Baseline Package Evidence

| Artifact                                                       | Value                                                                                             |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| npm tarball integrity (`@epubjs-react-native/core@1.4.7`)      | `sha512-bDzL0DU13IyfRZRydz36bh7HqDyUV3VKIFYOAYPBejMUAK4LYZclUb+NdgiwyynhhkUZQNdaWgSdtAGzGmsxEw==` |
| Aggregate SHA-256 over sorted installed `core/lib` file hashes | `d22001d5afbd8ae0e83eb64e359b9b2b3c9d6a4c8955b38e5d2d850bc3d7731b`                                |
| Embedded EPUB.js source hash (`src/epubjs.ts`)                 | `bf4dc57d0d4fe81b5c070947f774749f9b894f2a8e56c11eaaac59c0d9abaccc`                                |
| Embedded JSZip source hash (`src/jszip.ts`)                    | `5845e1af5417e570c733bcbe61d38b64ca684b10fd992aa4de7587cbcfee35b3`                                |
| Repository `LICENSE` hash                                      | `7d242dbb3b77db8071f57a3d4bfeeb4755e12ddae6fd13655e3a97e6df6a4d31`                                |
| Repository `package.json` hash at baseline                     | `fa42e2db0f2ec2f0aa95f8dbe5aaf14feda093ce2438a867a81b0f5ed2700d19`                                |
| Repository `README.md` hash at baseline                        | `a50479024f7b27f03033d6151a703679768dadd5b1ffae5b3e46aa4c0c4863fe`                                |

## Integration Branch Intent

- Preserve the MIT license and original upstream authorship.
- Make the package source-first so React Native and TypeScript consumers do not depend on generated `lib/` output during install.
- Remove install-time hook/bootstrap fragility from the integration branch while keeping explicit `build`, `type-check`, and `test` scripts.
- Align runtime-facing development dependencies with `apps/mobile/package.json` in the parent workspace to avoid duplicate React / React Native copies during local workspace consumption.

## Post-baseline Maintenance

Date: 2026-08-04

- Disabled `allowScriptedContent` by default on both iOS and Android in
  `src/Reader.tsx`.
  Rationale:
  [EPUB.js documents scripted content as disabled by default for security reasons](https://github.com/futurepress/epub.js/blob/master/README.md#scripted-content),
  and the upstream wrapper's previous iOS-only enablement widened trust to
  untrusted EPUB input.
- Search now preserves already-loaded spine sections in `src/context.tsx`
  instead of unloading the current document after `find()`.
  Related upstream report:
  [victorsoares96/epubjs-react-native PR #399](https://github.com/victorsoares96/epubjs-react-native/pull/399).
- Search-specific bridge failures now log to the WebView console and still
  post an empty `onSearch` result set, instead of surfacing a raw `alert()`
  from the search promise rejection path.
- Reader bridge methods now serialize user-controlled string inputs before
  injecting JavaScript into the WebView, covering `goToLocation`,
  `changeFontFamily`, `removeAnnotationByCfi`, and `removeAnnotations`.
- `getReadAccessUrl` now falls back to the caller-provided directory instead
  of widening access to `file:///` when local files have no shared directory.
- `useInjectWebviewVariables` now uses replacement callbacks so `$&`, `$1`,
  `$'`, and related replacement tokens in EPUB paths or themes are preserved
  literally.
- `src/template.ts` now reports `onDisplayError.reason` from the caught
  exception instead of referencing an undefined `reason` variable.
- Location generation is now awaited before the first display, and readiness
  is reported only after a defensively checked current location exists.
- Nested TOC search results calculate their index from the same flattened TOC
  used to find the matching section.
- Reader and template-file initialization failures are caught, reported
  through `onDisplayError`, and rendered as terminal errors rather than
  leaving an indefinite loading spinner or unobserved promise rejection.
- WebView messages are parsed defensively, and bookmark updates replace state
  immutably rather than modifying the caller's initial bookmark array.
- Scrolled-document navigation removes a pending relocation callback before
  installing the next one, preventing a boundary navigation from resetting a
  later page unexpectedly.
- An initial saved CFI now suppresses the transient default-location event
  until the requested display produces its first relocation. The resolved CFI
  may legitimately differ from the requested point, and a display error clears
  the suppression so a legacy or malformed saved CFI cannot silence later
  location updates. Readiness and relocation progress callbacks now
  consistently use the documented `0`-`100` scale.
- Source detection now validates HTTP(S) schemes and base64 syntax while
  handling uppercase EPUB/OPF extensions, query strings, and fragments.

These wrapper fixes were derived from local failing regressions and an
independent static review, not by executing or applying untrusted issue or PR
content. The search lifecycle behavior is the only item above with a directly
related upstream wrapper report, PR #399.

## Maintained Engine Promotion

The nested engine commit `5c731a0591848d785c291a55c959f456381b4da2` independently addresses and
tests the behavior reported in:

- [futurepress/epub.js issue #1408](https://github.com/futurepress/epub.js/issues/1408)
  and [issue #1416](https://github.com/futurepress/epub.js/issues/1416)
  (continuous/scrolled browser anchoring);
- [futurepress/epub.js PR #1410](https://github.com/futurepress/epub.js/pull/1410)
  (`Navigation.get("#id")`);
- [futurepress/epub.js PR #1407](https://github.com/futurepress/epub.js/pull/1407)
  (location generation for empty or image-only sections); and
- [futurepress/epub.js PR #1385](https://github.com/futurepress/epub.js/pull/1385)
  (resize before first render).

The generated EPUB.js module must be reproduced from that exact gitlink and
verified against `generated-artifacts.json`; it is never edited by hand.

That engine release also updates the production XML parser to
`@xmldom/xmldom@0.9.10`, moves the browser toolchain from Webpack 4/Karma 5 to
Webpack 5/Karma 6, and records a zero-vulnerability production npm audit. The
wrapper's development native-module versions remain aligned with Expo SDK 57
rather than forcing unsupported npm-latest majors.

## Distribution licensing

The wrapper remains MIT licensed, while the generated WebView artifacts keep
the licenses of their own components rather than being relicensed as MIT.
EPUB.js remains BSD-2-Clause; localForage remains Apache-2.0; JSZip is
distributed under its MIT option; and the remaining embedded runtime
dependencies are MIT, ISC, or other permissive licenses recorded in
`THIRD_PARTY_NOTICES.md` and `generated-artifacts.json`. The parent app exposes
these terms from Settings so binary recipients receive the notices as well as
the source repository.
