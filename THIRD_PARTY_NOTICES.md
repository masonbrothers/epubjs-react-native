# Third-party notices

The wrapper writes the generated modules below into the reader WebView at
runtime. Their source and output hashes are recorded in
`generated-artifacts.json`.

## EPUB.js

- Source: `https://github.com/masonbrothers/epub.js`
- Commit: `0af7496052fb140aae07c7ce9d0e3828229a19d5`
- Upstream: `https://github.com/futurepress/epub.js`
- License: BSD-2-Clause (`licenses/EPUBJS-BSD-2-Clause.txt`)
- Copyright: FuturePress, 2013

## JSZip and bundled dependencies

The embedded JSZip artifact comes from the exact npm package
`jszip@3.10.1`, integrity
`sha512-xXDvecyTpGLrqFrvkrUSoxxfJI5AH7U8zxxtVclpsUtMCq4JQ290LY8AW5c7Ggnr/Y/oK+bQMbqK2qmtk3pN4g==`.
JSZip is used under its MIT option; see `licenses/JSZIP-MIT.txt`.

JSZip's browser distribution includes Pako. Pako is MIT licensed; see
`licenses/PAKO-MIT.txt`.

The JSZip package dependency graph also carries the following permissively
licensed modules. Their copyright notices remain in their npm distributions:

| Package | Version | License / copyright |
| --- | --- | --- |
| `lie` | 3.3.0 | MIT; Calvin Metcalf and Jordan Harband, 2014-2018 |
| `pako` | 1.0.11 | MIT; Vitaly Puzrin and Andrei Tuputcyn, 2014-2017 |
| `readable-stream` | 2.3.8 | MIT; Node.js, Joyent, and other contributors |
| `setimmediate` | 1.0.5 | MIT; Barnesandnoble.com, Donavon West, and Domenic Denicola, 2012 |
| `core-util-is` | 1.0.3 | MIT; Node.js contributors |
| `inherits` | 2.0.4 | ISC; Isaac Z. Schlueter |
| `isarray` | 2.0.5 | MIT; Julian Gruber, 2013 |
| `process-nextick-args` | 2.0.1 | MIT; Calvin Metcalf, 2015 |
| `safe-buffer` | 5.1.2 | MIT; Feross Aboukhadijeh |
| `string_decoder` | 1.1.1 | MIT; Node.js, Joyent, and other contributors |
| `util-deprecate` | 1.0.2 | MIT; Nathan Rajlich, 2014 |

The wrapper repository itself remains under its existing MIT `LICENSE`.
