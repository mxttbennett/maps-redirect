const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const { version } = require('../package.json');

const header = `// ==UserScript==
// @name         Google Maps to Apple Maps
// @namespace    https://github.com/mxttbennett/maps-redirect
// @version      ${version}
// @description  Opens Google Maps links in Apple Maps
// @downloadURL  https://raw.githubusercontent.com/mxttbennett/maps-redirect/main/dist/maps-redirect.user.js
// @updateURL    https://raw.githubusercontent.com/mxttbennett/maps-redirect/main/dist/maps-redirect.user.js
// @match        *://*/*
// @noframes
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @connect      maps.app.goo.gl
// @connect      goo.gl
// @connect      google.com
// @connect      www.google.com
// ==/UserScript==
`;

const read = (file) => fs.readFileSync(path.join(root, 'src', file), 'utf8');
const output = `${header}\n(function () {\n'use strict';\n${read('mapper.js')}\n${read('main.js')}\n})();\n`;

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'maps-redirect.user.js'), output);
