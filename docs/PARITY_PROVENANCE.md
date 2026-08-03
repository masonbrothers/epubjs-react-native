# Wrapper Parity Provenance

Date: 2026-08-03
Branch: `integration/parity-9522941`
Baseline tag: `upstream-baseline-9522941`

## Repository Lineage

| Role | URL | Commit / Ref | License |
| --- | --- | --- | --- |
| Maintained fork (`origin`) | `git@github.com:masonbrothers/epubjs-react-native.git` | integration branch from `master` | MIT |
| Upstream source (`upstream`) | `git@github.com:victorsoares96/epubjs-react-native.git` | `95229411e63934f6aa781c58392260149a1d3583` | MIT |

## Toolchain Pin

| Tool | Version |
| --- | --- |
| Node.js | `v24.13.0` |
| npm | `11.6.2` |
| packageManager | `npm@11.6.2` |

`.nvmrc` is pinned to `24.13.0`.

## Baseline Package Evidence

| Artifact | Value |
| --- | --- |
| npm tarball integrity (`@epubjs-react-native/core@1.4.7`) | `sha512-bDzL0DU13IyfRZRydz36bh7HqDyUV3VKIFYOAYPBejMUAK4LYZclUb+NdgiwyynhhkUZQNdaWgSdtAGzGmsxEw==` |
| Aggregate SHA-256 over sorted installed `core/lib` file hashes | `d22001d5afbd8ae0e83eb64e359b9b2b3c9d6a4c8955b38e5d2d850bc3d7731b` |
| Embedded EPUB.js source hash (`src/epubjs.ts`) | `bf4dc57d0d4fe81b5c070947f774749f9b894f2a8e56c11eaaac59c0d9abaccc` |
| Embedded JSZip source hash (`src/jszip.ts`) | `5845e1af5417e570c733bcbe61d38b64ca684b10fd992aa4de7587cbcfee35b3` |
| Repository `LICENSE` hash | `7d242dbb3b77db8071f57a3d4bfeeb4755e12ddae6fd13655e3a97e6df6a4d31` |
| Repository `package.json` hash at baseline | `fa42e2db0f2ec2f0aa95f8dbe5aaf14feda093ce2438a867a81b0f5ed2700d19` |
| Repository `README.md` hash at baseline | `a50479024f7b27f03033d6151a703679768dadd5b1ffae5b3e46aa4c0c4863fe` |

## Integration Branch Intent

- Preserve the MIT license and original upstream authorship.
- Make the package source-first so React Native and TypeScript consumers do not depend on generated `lib/` output during install.
- Remove install-time hook/bootstrap fragility from the integration branch while keeping explicit `build`, `type-check`, and `test` scripts.
- Align runtime-facing development dependencies with `apps/mobile/package.json` in the parent workspace to avoid duplicate React / React Native copies during local workspace consumption.
