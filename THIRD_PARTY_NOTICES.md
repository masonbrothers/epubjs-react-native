# Third-party notices

The wrapper writes the generated modules below into the reader WebView at
runtime. Their source and output hashes are recorded in
`generated-artifacts.json`.

## EPUB.js

- Source: `https://github.com/masonbrothers/epub.js`
- Commit: `5c731a0591848d785c291a55c959f456381b4da2`
- Upstream: `https://github.com/futurepress/epub.js`
- License: BSD-2-Clause (`licenses/EPUBJS-BSD-2-Clause.txt`)
- Copyright: FuturePress, 2013

The generated EPUB.js browser artifact also embeds its build-time runtime
dependencies. The complete MIT and ISC attribution sets are retained in
`licenses/EPUBJS-BUNDLED-MIT-NOTICES.txt` and
`licenses/EPUBJS-BUNDLED-ISC-NOTICES.txt`:

| Package          | Version | License |
| ---------------- | ------- | ------- |
| `@xmldom/xmldom` | 0.9.10  | MIT     |
| `core-js`        | 3.49.0  | MIT     |
| `event-emitter`  | 0.3.5   | MIT     |
| `d`              | 1.0.2   | ISC     |
| `es5-ext`        | 0.10.64 | ISC     |
| `es6-iterator`   | 2.0.3   | MIT     |
| `es6-symbol`     | 3.1.4   | ISC     |
| `esniff`         | 2.0.1   | ISC     |
| `ext`            | 1.7.0   | ISC     |
| `next-tick`      | 1.1.0   | ISC     |
| `type`           | 2.7.3   | ISC     |
| `lodash`         | 4.18.1  | MIT     |
| `marks-pane`     | 1.0.9   | MIT     |
| `path-webpack`   | 0.0.3   | MIT     |

The artifact also embeds `localforage@1.10.0` under Apache-2.0 and its
`lie@3.1.1` / `immediate@3.0.6` helpers under MIT. The exact Apache terms and
upstream application notice are retained in
`licenses/LOCALFORAGE-APACHE-2.0.txt`; the helper attributions are in the
consolidated MIT notice.

## JSZip and bundled dependencies

The embedded JSZip artifact comes from the exact npm package
`jszip@3.10.1`, integrity
`sha512-xXDvecyTpGLrqFrvkrUSoxxfJI5AH7U8zxxtVclpsUtMCq4JQ290LY8AW5c7Ggnr/Y/oK+bQMbqK2qmtk3pN4g==`.
JSZip is used under its MIT option; see `licenses/JSZIP-MIT.txt`.

JSZip's browser distribution includes Pako. Pako is MIT licensed; see
`licenses/PAKO-MIT.txt`.

The JSZip package dependency graph also carries the following permissively
licensed modules. Their copyright notices remain in their npm distributions:

| Package                | Version | License / copyright                                               |
| ---------------------- | ------- | ----------------------------------------------------------------- |
| `lie`                  | 3.3.0   | MIT; Calvin Metcalf and Jordan Harband, 2014-2018                 |
| `pako`                 | 1.0.11  | MIT; Vitaly Puzrin and Andrei Tuputcyn, 2014-2017                 |
| `readable-stream`      | 2.3.8   | MIT; Node.js, Joyent, and other contributors                      |
| `setimmediate`         | 1.0.5   | MIT; Barnesandnoble.com, Donavon West, and Domenic Denicola, 2012 |
| `core-util-is`         | 1.0.3   | MIT; Node.js contributors                                         |
| `inherits`             | 2.0.4   | ISC; Isaac Z. Schlueter                                           |
| `isarray`              | 2.0.5   | MIT; Julian Gruber, 2013                                          |
| `process-nextick-args` | 2.0.1   | MIT; Calvin Metcalf, 2015                                         |
| `safe-buffer`          | 5.1.2   | MIT; Feross Aboukhadijeh                                          |
| `string_decoder`       | 1.1.1   | MIT; Node.js, Joyent, and other contributors                      |
| `util-deprecate`       | 1.0.2   | MIT; Nathan Rajlich, 2014                                         |

The wrapper repository itself remains under its existing MIT `LICENSE`.
