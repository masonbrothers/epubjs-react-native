# Third-party notices

The wrapper writes the generated modules below into the reader WebView at
runtime. Their source and output hashes are recorded in
`generated-artifacts.json`.

## EPUB.js

- Source: `https://github.com/masonbrothers/epub.js`
- Commit: `a26aa79de5dfd2f890c9f28aae858e4653cc78d5`
- Upstream: `https://github.com/futurepress/epub.js`
- License: BSD-2-Clause (`licenses/EPUBJS-BSD-2-Clause.txt`)
- Copyright: FuturePress, 2013

The generated EPUB.js browser artifact also embeds its build-time runtime
dependencies. The complete MIT attribution set is retained in
`licenses/EPUBJS-BUNDLED-MIT-NOTICES.txt`:

| Package          | Version | License |
| ---------------- | ------- | ------- |
| `@xmldom/xmldom` | 0.7.5   | MIT     |
| `core-js`        | 3.18.3  | MIT     |
| `event-emitter`  | 0.3.5   | MIT     |
| `d`              | 1.0.0   | MIT     |
| `es5-ext`        | 0.10.24 | MIT     |
| `es6-iterator`   | 2.0.1   | MIT     |
| `es6-symbol`     | 3.1.1   | MIT     |
| `lodash`         | 4.17.21 | MIT     |
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
