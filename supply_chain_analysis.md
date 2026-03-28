# Software Supply Chain Analysis Report

**Generated**: 2026-03-28 04:15 UTC

## Executive Summary

| Metric | Count |
|--------|-------|
| Total components | 290 |
| Direct dependencies | 13 |
| Transitive dependencies | 277 |
| Vulnerable components | 11 |
| Critical severity | 2 |
| High severity | 8 |
| Deprecated packages | 7 |
| Stale packages (>1 yr) | 143 |

## All Components

| Component | Version | Severity | Type | Maintenance | Source |
|-----------|---------|----------|------|-------------|--------|
| ejs | 4.0.1 | critical | Direct | Active (22d) | Official npm |
| minimist | 0.0.8 | critical | Transitive | Active (21d) | Official npm |
| express-rate-limit | 8.2.1 | high | Direct | Active (9d) | Official npm |
| multer | 2.0.2 | high | Direct | Active (23d) | Official npm |
| immutable | 3.8.2 | high | Transitive | Active (21d) | Official npm |
| minimatch | 3.0.4 | high | Transitive | Active (29d) | Official npm |
| tar | 6.2.1 | high | Transitive | Active (4d) | Official npm |
| picomatch | 2.3.1 | high | Transitive | Active (3d) | Official npm |
| socket.io-parser | 4.2.5 | high | Transitive | Active (10d) | Official npm |
| path-to-regexp | 8.3.0 | high | Transitive | Active (1d) | Official npm |
| brace-expansion | 1.1.12 | moderate | Transitive | Active (0d) | Official npm |
| bcrypt | 6.0.0 | none | Direct | Active (0d) | Official npm |
| browser-sync | 3.0.4 | none | Direct | Moderate (359d) | Official npm |
| cookie-parser | 1.4.7 | none | Direct | Stale (535d) | Official npm |
| express-generator | 4.16.1 | none | Direct | Stale (666d) | Official npm |
| express-session | 1.19.0 | none | Direct | Active (64d) | Official npm |
| express | 5.2.1 | none | Direct | Active (0d) | Official npm |
| morgan | 1.10.1 | none | Direct | Moderate (253d) | Official npm |
| nodemon | 3.1.11 | none | Direct | Active (21d) | Official npm |
| prettier | 3.8.1 | none | Direct | Active (65d) | Official npm |
| sqlite3 | 5.1.7 | none | Direct | Active (15d) | Official npm |
| node-addon-api | 8.5.0 | none | Transitive | Active (2d) | Official npm |
| node-gyp-build | 4.8.4 | none | Transitive | Stale (493d) | Official npm |
| browser-sync-client | 3.0.4 | none | Transitive | Moderate (359d) | Official npm |
| browser-sync-ui | 3.0.4 | none | Transitive | Moderate (359d) | Official npm |
| bs-recipes | 1.3.4 | none | Transitive | Stale (1383d) | Official npm |
| chalk | 4.1.2 | none | Transitive | Active (149d) | Official npm |
| chokidar | 3.6.0 | none | Transitive | Active (122d) | Official npm |
| connect-history-api-fallback | 1.6.0 | none | Transitive | Stale (1369d) | Official npm |
| connect | 3.6.6 | none | Transitive | Stale (871d) | Official npm |
| dev-ip | 1.0.1 | none | Transitive | Stale (1382d) | Official npm |
| easy-extender | 2.3.4 | none | Transitive | Stale (1381d) | Official npm |
| eazy-logger | 4.1.0 | none | Transitive | Moderate (359d) | Official npm |
| etag | 1.8.1 | none | Transitive | Moderate (317d) | Official npm |
| fresh | 0.5.2 | none | Transitive | Moderate (317d) | Official npm |
| fs-extra | 3.0.1 | none | Transitive | Active (24d) | Official npm |
| http-proxy | 1.18.1 | none | Transitive | Stale (469d) | Official npm |
| micromatch | 4.0.8 | none | Transitive | Stale (555d) | Official npm |
| opn | 5.3.0 | none | Transitive | Stale (1374d) [DEPRECATED… | Official npm |
| portscanner | 2.2.0 | none | Transitive | Stale (1372d) | Official npm |
| raw-body | 2.5.3 | none | Transitive | Active (52d) | Official npm |
| resp-modifier | 6.0.2 | none | Transitive | Stale (1370d) | Official npm |
| rx | 4.1.0 | none | Transitive | Stale (871d) | Official npm |
| send | 0.19.2 | none | Transitive | Active (102d) | Official npm |
| serve-index | 1.9.2 | none | Transitive | Active (64d) | Official npm |
| serve-static | 1.16.3 | none | Transitive | Active (102d) | Official npm |
| server-destroy | 1.0.1 | none | Transitive | Stale (1370d) | Official npm |
| socket.io | 4.8.3 | none | Transitive | Active (94d) | Official npm |
| ua-parser-js | 1.0.41 | none | Transitive | Active (52d) | Official npm |
| yargs | 17.7.2 | none | Transitive | Moderate (304d) | Official npm |
| cookie-signature | 1.0.6 | none | Transitive | Stale (514d) | Official npm |
| cookie | 0.7.2 | none | Transitive | Active (121d) | Official npm |
| jake | 10.9.4 | none | Transitive | Active (30d) | Official npm |
| commander | 2.15.1 | none | Transitive | Active (34d) | Official npm |
| mkdirp | 0.5.1 | none | Transitive | Stale (871d) | Official npm |
| sorted-object | 2.0.1 | none | Transitive | Stale (1370d) | Official npm |
| ip-address | 10.0.1 | none | Transitive | Active (139d) | Official npm |
| debug | 2.6.9 | none | Transitive | Moderate (195d) | Official npm |
| depd | 2.0.0 | none | Transitive | Stale (1382d) | Official npm |
| on-headers | 1.1.0 | none | Transitive | Moderate (253d) | Official npm |
| parseurl | 1.3.3 | none | Transitive | Moderate (317d) | Official npm |
| safe-buffer | 5.2.1 | none | Transitive | Stale (991d) | Official npm |
| uid-safe | 2.1.5 | none | Transitive | Active (52d) | Official npm |
| accepts | 2.0.0 | none | Transitive | Moderate (317d) | Official npm |
| body-parser | 2.2.2 | none | Transitive | Active (79d) | Official npm |
| content-disposition | 1.0.1 | none | Transitive | Active (129d) | Official npm |
| content-type | 1.0.5 | none | Transitive | Moderate (317d) | Official npm |
| encodeurl | 2.0.0 | none | Transitive | Stale (666d) | Official npm |
| escape-html | 1.0.3 | none | Transitive | Stale (862d) | Official npm |
| http-errors | 2.0.1 | none | Transitive | Active (127d) | Official npm |
| merge-descriptors | 2.0.0 | none | Transitive | Stale (861d) | Official npm |
| mime-types | 3.0.2 | none | Transitive | Active (127d) | Official npm |
| on-finished | 2.4.1 | none | Transitive | Moderate (317d) | Official npm |
| once | 1.4.0 | none | Transitive | Active (26d) | Official npm |
| proxy-addr | 2.0.7 | none | Transitive | Moderate (317d) | Official npm |
| qs | 6.14.2 | none | Transitive | Active (40d) | Official npm |
| range-parser | 1.2.1 | none | Transitive | Moderate (317d) | Official npm |
| router | 2.2.0 | none | Transitive | Stale (366d) | Official npm |
| statuses | 2.0.2 | none | Transitive | Moderate (294d) | Official npm |
| type-is | 2.0.1 | none | Transitive | Stale (366d) | Official npm |
| vary | 1.1.2 | none | Transitive | Moderate (317d) | Official npm |
| basic-auth | 2.0.1 | none | Transitive | Moderate (317d) | Official npm |
| append-field | 1.0.0 | none | Transitive | Stale (1384d) | Official npm |
| busboy | 1.6.0 | none | Transitive | Stale (1378d) | Official npm |
| concat-stream | 2.0.0 | none | Transitive | Stale (989d) | Official npm |
| object-assign | 4.1.1 | none | Transitive | Stale (404d) | Official npm |
| xtend | 4.0.2 | none | Transitive | Stale (991d) | Official npm |
| ignore-by-default | 1.0.1 | none | Transitive | Stale (1378d) | Official npm |
| pstree.remy | 1.1.8 | none | Transitive | Stale (1414d) | Official npm |
| semver | 7.7.4 | none | Transitive | Active (8d) | Official npm |
| simple-update-notifier | 2.0.0 | none | Transitive | Stale (929d) | Official npm |
| touch | 3.1.1 | none | Transitive | Stale (682d) | Official npm |
| undefsafe | 2.0.5 | none | Transitive | Stale (1369d) | Official npm |
| bindings | 1.5.0 | none | Transitive | Stale (991d) | Official npm |
| node-gyp | 8.4.1 | none | Transitive | Active (59d) | Official npm |
| prebuild-install | 7.1.3 | none | Transitive | Active (36d) [DEPRECATED] | Official npm |
| mitt | 1.2.0 | none | Transitive | Active (165d) | Official npm |
| async-each-series | 0.1.1 | none | Transitive | Stale (1384d) | Official npm |
| socket.io-client | 4.8.3 | none | Transitive | Active (94d) | Official npm |
| stream-throttle | 0.1.3 | none | Transitive | Stale (1370d) | Official npm |
| ansi-styles | 4.3.0 | none | Transitive | Moderate (200d) | Official npm |
| supports-color | 7.2.0 | none | Transitive | Moderate (200d) | Official npm |
| anymatch | 3.1.3 | none | Transitive | Stale (555d) | Official npm |
| braces | 3.0.3 | none | Transitive | Stale (555d) | Official npm |
| glob-parent | 5.1.2 | none | Transitive | Stale (1009d) | Official npm |
| is-binary-path | 2.1.0 | none | Transitive | Stale (696d) | Official npm |
| is-glob | 4.0.3 | none | Transitive | Stale (1009d) | Official npm |
| normalize-path | 3.0.0 | none | Transitive | Stale (1120d) | Official npm |
| readdirp | 3.6.0 | none | Transitive | Active (122d) | Official npm |
| finalhandler | 1.1.0 | none | Transitive | Active (116d) | Official npm |
| utils-merge | 1.0.1 | none | Transitive | Stale (1368d) | Official npm |
| lodash | 4.17.23 | none | Transitive | Active (0d) | Official npm |
| graceful-fs | 4.2.11 | none | Transitive | Stale (1022d) | Official npm |
| jsonfile | 3.0.1 | none | Transitive | Active (165d) | Official npm |
| universalify | 0.1.2 | none | Transitive | Stale (877d) | Official npm |
| eventemitter3 | 4.0.7 | none | Transitive | Active (67d) | Official npm |
| follow-redirects | 1.15.11 | none | Transitive | Moderate (239d) | Official npm |
| requires-port | 1.0.0 | none | Transitive | Stale (1370d) | Official npm |
| is-wsl | 1.1.0 | none | Transitive | Active (40d) | Official npm |
| is-number-like | 1.0.8 | none | Transitive | Stale (1378d) | Official npm |
| bytes | 3.1.2 | none | Transitive | Stale (989d) | Official npm |
| unpipe | 1.0.0 | none | Transitive | Active (53d) | Official npm |
| destroy | 1.2.0 | none | Transitive | Active (53d) | Official npm |
| mime | 1.6.0 | none | Transitive | Moderate (196d) | Official npm |
| batch | 0.6.1 | none | Transitive | Stale (1383d) | Official npm |
| base64id | 2.0.0 | none | Transitive | Stale (1383d) | Official npm |
| cors | 2.8.6 | none | Transitive | Active (64d) | Official npm |
| engine.io | 6.6.5 | none | Transitive | Active (17d) | Official npm |
| socket.io-adapter | 2.5.6 | none | Transitive | Active (94d) | Official npm |
| cliui | 8.0.1 | none | Transitive | Stale (376d) | Official npm |
| escalade | 3.2.0 | none | Transitive | Stale (575d) | Official npm |
| get-caller-file | 2.0.5 | none | Transitive | Stale (930d) | Official npm |
| require-directory | 2.1.1 | none | Transitive | Stale (1370d) | Official npm |
| string-width | 4.2.3 | none | Transitive | Active (37d) | Official npm |
| y18n | 5.0.8 | none | Transitive | Stale (991d) | Official npm |
| yargs-parser | 21.1.1 | none | Transitive | Moderate (305d) | Official npm |
| async | 3.2.6 | none | Transitive | Stale (507d) | Official npm |
| filelist | 1.0.4 | none | Transitive | Active (30d) | Official npm |
| picocolors | 1.1.1 | none | Transitive | Stale (527d) | Official npm |
| ms | 2.0.0 | none | Transitive | Moderate (200d) | Official npm |
| random-bytes | 1.0.0 | none | Transitive | Active (53d) | Official npm |
| negotiator | 1.0.0 | none | Transitive | Moderate (317d) | Official npm |
| iconv-lite | 0.7.2 | none | Transitive | Active (78d) | Official npm |
| inherits | 2.0.4 | none | Transitive | Stale (1022d) | Official npm |
| setprototypeof | 1.2.0 | none | Transitive | Stale (1370d) | Official npm |
| toidentifier | 1.0.1 | none | Transitive | Stale (1406d) | Official npm |
| mime-db | 1.54.0 | none | Transitive | Moderate (317d) | Official npm |
| ee-first | 1.1.1 | none | Transitive | Stale (1380d) | Official npm |
| wrappy | 1.0.2 | none | Transitive | Stale (1009d) | Official npm |
| forwarded | 0.2.0 | none | Transitive | Moderate (317d) | Official npm |
| ipaddr.js | 1.9.1 | none | Transitive | Active (119d) | Official npm |
| side-channel | 1.1.0 | none | Transitive | Stale (471d) | Official npm |
| is-promise | 4.0.0 | none | Transitive | Stale (1022d) | Official npm |
| media-typer | 1.1.0 | none | Transitive | Moderate (317d) | Official npm |
| streamsearch | 1.1.0 | none | Transitive | Stale (1370d) | Official npm |
| buffer-from | 1.1.2 | none | Transitive | Stale (1383d) | Official npm |
| readable-stream | 3.6.2 | none | Transitive | Stale (444d) | Official npm |
| typedarray | 0.0.6 | none | Transitive | Stale (989d) | Official npm |
| file-uri-to-path | 1.0.0 | none | Transitive | Stale (991d) | Official npm |
| env-paths | 2.2.1 | none | Transitive | Active (62d) | Official npm |
| glob | 7.2.3 | none | Transitive | Active (36d) | Official npm |
| make-fetch-happen | 9.1.0 | none | Transitive | Active (8d) | Official npm |
| nopt | 5.0.0 | none | Transitive | Active (8d) | Official npm |
| npmlog | 6.0.2 | none | Transitive | Active (8d) [DEPRECATED] | Official npm |
| rimraf | 3.0.2 | none | Transitive | Active (40d) | Official npm |
| which | 2.0.2 | none | Transitive | Active (8d) | Official npm |
| detect-libc | 2.1.2 | none | Transitive | Active (173d) | Official npm |
| expand-template | 2.0.3 | none | Transitive | Stale (1379d) | Official npm |
| github-from-package | 0.0.0 | none | Transitive | Stale (1232d) | Official npm |
| mkdirp-classic | 0.5.3 | none | Transitive | Stale (1418d) | Official npm |
| napi-build-utils | 2.0.0 | none | Transitive | Stale (435d) | Official npm |
| node-abi | 3.87.0 | none | Transitive | Active (12d) | Official npm |
| pump | 3.0.3 | none | Transitive | Active (27d) | Official npm |
| rc | 1.2.8 | none | Transitive | Stale (399d) | Official npm |
| simple-get | 4.0.1 | none | Transitive | Stale (988d) | Official npm |
| tar-fs | 2.1.4 | none | Transitive | Active (23d) | Official npm |
| tunnel-agent | 0.6.0 | none | Transitive | Stale (1369d) | Official npm |
| chownr | 2.0.0 | none | Transitive | Stale (720d) | Official npm |
| fs-minipass | 2.1.0 | none | Transitive | Stale (706d) | Official npm |
| minizlib | 2.1.2 | none | Transitive | Moderate (187d) | Official npm |
| yallist | 4.0.0 | none | Transitive | Stale (717d) | Official npm |
| component-emitter | 3.1.2 | none | Transitive | Stale (861d) | Official npm |
| engine.io-client | 6.6.4 | none | Transitive | Active (94d) | Official npm |
| limiter | 1.1.5 | none | Transitive | Stale (427d) | Official npm |
| color-convert | 2.0.1 | none | Transitive | Active (133d) | Official npm |
| has-flag | 4.0.0 | none | Transitive | Stale (1075d) | Official npm |
| fill-range | 7.1.1 | none | Transitive | Stale (675d) | Official npm |
| binary-extensions | 2.3.0 | none | Transitive | Moderate (327d) | Official npm |
| is-extglob | 2.1.1 | none | Transitive | Stale (1009d) | Official npm |
| lodash.isfinite | 3.3.2 | none | Transitive | Stale (1377d) | Official npm |
| safer-buffer | 2.1.2 | none | Transitive | Stale (1411d) | Official npm |
| cors | 2.8.19 | none | Transitive | Active (64d) | Official npm |
| node | 25.2.3 | none | Transitive | Active (3d) | Official npm |
| engine.io-parser | 5.2.3 | none | Transitive | Stale (624d) | Official npm |
| ws | 8.18.3 | none | Transitive | Active (6d) | Official npm |
| strip-ansi | 6.0.1 | none | Transitive | Active (29d) | Official npm |
| wrap-ansi | 7.0.0 | none | Transitive | Active (35d) | Official npm |
| emoji-regex | 8.0.0 | none | Transitive | Active (165d) | Official npm |
| is-fullwidth-code-point | 3.0.0 | none | Transitive | Moderate (208d) | Official npm |
| balanced-match | 1.0.2 | none | Transitive | Active (33d) | Official npm |
| concat-map | 0.0.1 | none | Transitive | Stale (1009d) | Official npm |
| es-errors | 1.3.0 | none | Transitive | Stale (781d) | Official npm |
| object-inspect | 1.13.4 | none | Transitive | Stale (416d) | Official npm |
| side-channel-list | 1.0.0 | none | Transitive | Stale (472d) | Official npm |
| side-channel-map | 1.0.1 | none | Transitive | Stale (471d) | Official npm |
| side-channel-weakmap | 1.0.2 | none | Transitive | Stale (471d) | Official npm |
| string_decoder | 1.3.0 | none | Transitive | Stale (989d) | Official npm |
| util-deprecate | 1.0.2 | none | Transitive | Stale (1368d) | Official npm |
| fs.realpath | 1.0.0 | none | Transitive | Stale (1009d) | Official npm |
| inflight | 1.0.6 | none | Transitive | Stale (674d) [DEPRECATED] | Official npm |
| path-is-absolute | 1.0.1 | none | Transitive | Stale (980d) [DEPRECATED] | Official npm |
| agentkeepalive | 4.6.0 | none | Transitive | Stale (454d) | Official npm |
| cacache | 15.3.0 | none | Transitive | Active (8d) | Official npm |
| http-cache-semantics | 4.2.0 | none | Transitive | Moderate (322d) | Official npm |
| http-proxy-agent | 4.0.1 | none | Transitive | Active (16d) | Official npm |
| https-proxy-agent | 5.0.1 | none | Transitive | Active (16d) | Official npm |
| is-lambda | 1.0.1 | none | Transitive | Stale (1378d) | Official npm |
| lru-cache | 6.0.0 | none | Transitive | Active (14d) | Official npm |
| minipass-collect | 1.0.2 | none | Transitive | Stale (950d) | Official npm |
| minipass-fetch | 1.4.1 | none | Transitive | Active (8d) | Official npm |
| minipass-flush | 1.0.5 | none | Transitive | Active (1d) | Official npm |
| minipass-pipeline | 1.2.4 | none | Transitive | Active (2d) | Official npm |
| minipass | 3.3.6 | none | Transitive | Active (37d) | Official npm |
| promise-retry | 2.0.1 | none | Transitive | Stale (1372d) | Official npm |
| socks-proxy-agent | 6.2.1 | none | Transitive | Active (16d) | Official npm |
| ssri | 8.0.1 | none | Transitive | Active (8d) | Official npm |
| abbrev | 1.1.1 | none | Transitive | Active (8d) | Official npm |
| are-we-there-yet | 3.0.1 | none | Transitive | Active (8d) [DEPRECATED] | Official npm |
| console-control-strings | 1.1.0 | none | Transitive | Stale (1383d) | Official npm |
| gauge | 4.0.4 | none | Transitive | Active (8d) [DEPRECATED] | Official npm |
| set-blocking | 2.0.0 | none | Transitive | Stale (1370d) | Official npm |
| isexe | 2.0.0 | none | Transitive | Active (46d) | Official npm |
| end-of-stream | 1.4.5 | none | Transitive | Moderate (284d) | Official npm |
| deep-extend | 0.6.0 | none | Transitive | Stale (991d) | Official npm |
| ini | 1.3.8 | none | Transitive | Active (8d) | Official npm |
| strip-json-comments | 2.0.1 | none | Transitive | Moderate (231d) | Official npm |
| decompress-response | 6.0.0 | none | Transitive | Active (165d) | Official npm |
| simple-concat | 1.0.1 | none | Transitive | Stale (1370d) | Official npm |
| tar-stream | 2.2.0 | none | Transitive | Active (27d) | Official npm |
| xmlhttprequest-ssl | 2.1.2 | none | Transitive | Moderate (314d) | Official npm |
| color-name | 1.1.4 | none | Transitive | Active (135d) | Official npm |
| to-regex-range | 5.0.1 | none | Transitive | Stale (1369d) | Official npm |
| undici-types | 7.16.0 | none | Transitive | Active (2d) | Official npm |
| ansi-regex | 5.0.1 | none | Transitive | Moderate (200d) | Official npm |
| call-bound | 1.0.4 | none | Transitive | Stale (389d) | Official npm |
| get-intrinsic | 1.3.0 | none | Transitive | Active (178d) | Official npm |
| humanize-ms | 1.2.1 | none | Transitive | Stale (470d) | Official npm |
| fs | 1.1.1 | none | Transitive | Stale (991d) | Official npm |
| move-file | 1.1.2 | none | Transitive | Active (61d) | Official npm |
| infer-owner | 1.0.4 | none | Transitive | Stale (706d) | Official npm |
| p-map | 4.0.0 | none | Transitive | Active (136d) | Official npm |
| promise-inflight | 1.0.1 | none | Transitive | Stale (1372d) | Official npm |
| unique-filename | 1.1.1 | none | Transitive | Active (8d) | Official npm |
| once | 1.1.2 | none | Transitive | Active (26d) | Official npm |
| agent-base | 6.0.2 | none | Transitive | Active (16d) | Official npm |
| encoding | 0.1.13 | none | Transitive | Stale (1034d) | Official npm |
| minipass-sized | 1.0.3 | none | Transitive | Active (79d) | Official npm |
| err-code | 2.0.3 | none | Transitive | Stale (1379d) | Official npm |
| retry | 0.12.0 | none | Transitive | Stale (1370d) | Official npm |
| socks | 2.8.7 | none | Transitive | Moderate (227d) | Official npm |
| delegates | 1.0.0 | none | Transitive | Stale (1382d) | Official npm |
| aproba | 2.1.0 | none | Transitive | Moderate (258d) | Official npm |
| color-support | 1.1.3 | none | Transitive | Stale (1081d) | Official npm |
| has-unicode | 2.0.1 | none | Transitive | Stale (1081d) | Official npm |
| signal-exit | 3.0.7 | none | Transitive | Stale (972d) | Official npm |
| wide-align | 1.1.5 | none | Transitive | Stale (1368d) | Official npm |
| mimic-response | 3.1.0 | none | Transitive | Stale (1377d) | Official npm |
| bl | 4.1.0 | none | Transitive | Active (113d) | Official npm |
| fs-constants | 1.0.0 | none | Transitive | Stale (1425d) | Official npm |
| is-number | 7.0.0 | none | Transitive | Stale (1036d) | Official npm |
| call-bind-apply-helpers | 1.0.2 | none | Transitive | Stale (408d) | Official npm |
| es-define-property | 1.0.1 | none | Transitive | Stale (476d) | Official npm |
| es-object-atoms | 1.1.1 | none | Transitive | Stale (437d) | Official npm |
| function-bind | 1.1.2 | none | Transitive | Stale (897d) | Official npm |
| get-proto | 1.0.1 | none | Transitive | Stale (449d) | Official npm |
| gopd | 1.2.0 | none | Transitive | Stale (478d) | Official npm |
| has-symbols | 1.1.0 | none | Transitive | Stale (480d) | Official npm |
| hasown | 2.0.2 | none | Transitive | Stale (747d) | Official npm |
| math-intrinsics | 1.1.0 | none | Transitive | Stale (463d) | Official npm |
| promisify | 1.1.3 | none | Transitive | Stale (1372d) | Official npm |
| aggregate-error | 3.1.0 | none | Transitive | Stale (925d) | Official npm |
| unique-slug | 2.0.2 | none | Transitive | Active (8d) | Official npm |
| smart-buffer | 4.2.0 | none | Transitive | Stale (1370d) | Official npm |
| buffer | 5.7.1 | none | Transitive | Stale (979d) | Official npm |
| dunder-proto | 1.0.1 | none | Transitive | Stale (466d) | Official npm |
| clean-stack | 2.2.0 | none | Transitive | Active (143d) | Official npm |
| indent-string | 4.0.0 | none | Transitive | Stale (1015d) | Official npm |
| imurmurhash | 0.1.4 | none | Transitive | Stale (1009d) | Official npm |
| base64-js | 1.5.1 | none | Transitive | Stale (979d) | Official npm |
| ieee754 | 1.2.1 | none | Transitive | Stale (979d) | Official npm |

## Vulnerability Details

### ejs@4.0.1

- **Type**: Direct
- **Maintenance**: Active (22d)

- **CRITICAL**: ejs template injection vulnerability
  - Advisory: https://github.com/advisories/GHSA-phwq-j96m-2c2q
  - Fix available: Yes
- **MODERATE**: ejs lacks certain pollution protection
  - Advisory: https://github.com/advisories/GHSA-ghr5-ch3p-vcr6
  - Fix available: Yes

### minimist@0.0.8

- **Type**: Transitive
- **Maintenance**: Active (21d)

- **MODERATE**: Prototype Pollution in minimist
  - Advisory: https://github.com/advisories/GHSA-vh95-rmgr-6w4m
  - Fix available: Yes
- **CRITICAL**: Prototype Pollution in minimist
  - Advisory: https://github.com/advisories/GHSA-xvch-5gv4-984h
  - Fix available: Yes

### express-rate-limit@8.2.1

- **Type**: Direct
- **Maintenance**: Active (9d)

- **HIGH**: express-rate-limit: IPv4-mapped IPv6 addresses bypass per-client rate limiting on servers with dual-stack network
  - Advisory: https://github.com/advisories/GHSA-46wh-pxpv-q5gq
  - Fix available: Yes

### multer@2.0.2

- **Type**: Direct
- **Maintenance**: Active (23d)

- **HIGH**: Multer vulnerable to Denial of Service via incomplete cleanup
  - Advisory: https://github.com/advisories/GHSA-xf7r-hgr6-v32p
  - Fix available: Yes
- **HIGH**: Multer vulnerable to Denial of Service via resource exhaustion
  - Advisory: https://github.com/advisories/GHSA-v52c-386h-88mc
  - Fix available: Yes
- **HIGH**: Multer Vulnerable to Denial of Service via Uncontrolled Recursion
  - Advisory: https://github.com/advisories/GHSA-5528-5vmv-3xc2
  - Fix available: Yes

### immutable@3.8.2

- **Type**: Transitive
- **Maintenance**: Active (21d)

- **HIGH**: Immutable is vulnerable to Prototype Pollution
  - Advisory: https://github.com/advisories/GHSA-wf6x-7x77-mvgw
  - Fix available: Yes

### minimatch@3.0.4

- **Type**: Transitive
- **Maintenance**: Active (29d)

- **HIGH**: minimatch ReDoS vulnerability
  - Advisory: https://github.com/advisories/GHSA-f8q6-p94x-37v3
  - Fix available: Yes
- **HIGH**: minimatch has a ReDoS via repeated wildcards with non-matching literal in pattern
  - Advisory: https://github.com/advisories/GHSA-3ppc-4f35-3m26
  - Fix available: Yes
- **HIGH**: minimatch has a ReDoS via repeated wildcards with non-matching literal in pattern
  - Advisory: https://github.com/advisories/GHSA-3ppc-4f35-3m26
  - Fix available: Yes
- **HIGH**: minimatch has ReDoS: matchOne() combinatorial backtracking via multiple non-adjacent GLOBSTAR segments
  - Advisory: https://github.com/advisories/GHSA-7r86-cg39-jmmj
  - Fix available: Yes
- **HIGH**: minimatch has ReDoS: matchOne() combinatorial backtracking via multiple non-adjacent GLOBSTAR segments
  - Advisory: https://github.com/advisories/GHSA-7r86-cg39-jmmj
  - Fix available: Yes
- **HIGH**: minimatch ReDoS: nested *() extglobs generate catastrophically backtracking regular expressions
  - Advisory: https://github.com/advisories/GHSA-23c5-xmqv-rm74
  - Fix available: Yes
- **HIGH**: minimatch ReDoS: nested *() extglobs generate catastrophically backtracking regular expressions
  - Advisory: https://github.com/advisories/GHSA-23c5-xmqv-rm74
  - Fix available: Yes

### tar@6.2.1

- **Type**: Transitive
- **Maintenance**: Active (4d)

- **HIGH**: node-tar Vulnerable to Arbitrary File Creation/Overwrite via Hardlink Path Traversal
  - Advisory: https://github.com/advisories/GHSA-34x7-hfp2-rc4v
  - Fix available: Yes
- **HIGH**: node-tar is Vulnerable to Arbitrary File Overwrite and Symlink Poisoning via Insufficient Path Sanitization
  - Advisory: https://github.com/advisories/GHSA-8qq5-rm4j-mr97
  - Fix available: Yes
- **HIGH**: Arbitrary File Read/Write via Hardlink Target Escape Through Symlink Chain in node-tar Extraction
  - Advisory: https://github.com/advisories/GHSA-83g3-92jg-28cx
  - Fix available: Yes
- **HIGH**: tar has Hardlink Path Traversal via Drive-Relative Linkpath
  - Advisory: https://github.com/advisories/GHSA-qffp-2rhf-9h96
  - Fix available: Yes
- **HIGH**: node-tar Symlink Path Traversal via Drive-Relative Linkpath
  - Advisory: https://github.com/advisories/GHSA-9ppj-qmqm-q256
  - Fix available: Yes
- **HIGH**: Race Condition in node-tar Path Reservations via Unicode Ligature Collisions on macOS APFS
  - Advisory: https://github.com/advisories/GHSA-r6q2-hw4h-h46w
  - Fix available: Yes

### picomatch@2.3.1

- **Type**: Transitive
- **Maintenance**: Active (3d)

- **MODERATE**: Picomatch: Method Injection in POSIX Character Classes causes incorrect Glob Matching
  - Advisory: https://github.com/advisories/GHSA-3v7f-55p6-f55p
  - Fix available: Yes
- **HIGH**: Picomatch has a ReDoS vulnerability via extglob quantifiers
  - Advisory: https://github.com/advisories/GHSA-c2c7-rcm5-vvqj
  - Fix available: Yes

### socket.io-parser@4.2.5

- **Type**: Transitive
- **Maintenance**: Active (10d)

- **HIGH**: socket.io allows an unbounded number of binary attachments
  - Advisory: https://github.com/advisories/GHSA-677m-j7p3-52f9
  - Fix available: Yes

### path-to-regexp@8.3.0

- **Type**: Transitive
- **Maintenance**: Active (1d)

- **HIGH**: path-to-regexp vulnerable to Denial of Service via sequential optional groups
  - Advisory: https://github.com/advisories/GHSA-j3q9-mxjg-w52f
  - Fix available: Yes
- **MODERATE**: path-to-regexp vulnerable to Regular Expression Denial of Service via multiple wildcards
  - Advisory: https://github.com/advisories/GHSA-27v5-c462-wpq7
  - Fix available: Yes

### brace-expansion@1.1.12

- **Type**: Transitive
- **Maintenance**: Active (0d)

- **MODERATE**: brace-expansion: Zero-step sequence causes process hang and memory exhaustion
  - Advisory: https://github.com/advisories/GHSA-f886-m6hf-6m8v
  - Fix available: Yes
- **MODERATE**: brace-expansion: Zero-step sequence causes process hang and memory exhaustion
  - Advisory: https://github.com/advisories/GHSA-f886-m6hf-6m8v
  - Fix available: Yes

## Maintenance Concerns

| Package | Version | Issue |
|---------|---------|-------|
| cookie-parser | 1.4.7 | Stale |
| express-generator | 4.16.1 | Stale |
| node-gyp-build | 4.8.4 | Stale |
| bs-recipes | 1.3.4 | Stale |
| connect-history-api-fallback | 1.6.0 | Stale |
| connect | 3.6.6 | Stale |
| dev-ip | 1.0.1 | Stale |
| easy-extender | 2.3.4 | Stale |
| http-proxy | 1.18.1 | Stale |
| micromatch | 4.0.8 | Stale |
| opn | 5.3.0 | Deprecated |
| portscanner | 2.2.0 | Stale |
| resp-modifier | 6.0.2 | Stale |
| rx | 4.1.0 | Stale |
| server-destroy | 1.0.1 | Stale |
| cookie-signature | 1.0.6 | Stale |
| mkdirp | 0.5.1 | Stale |
| sorted-object | 2.0.1 | Stale |
| depd | 2.0.0 | Stale |
| safe-buffer | 5.2.1 | Stale |
| encodeurl | 2.0.0 | Stale |
| escape-html | 1.0.3 | Stale |
| merge-descriptors | 2.0.0 | Stale |
| router | 2.2.0 | Stale |
| type-is | 2.0.1 | Stale |
| append-field | 1.0.0 | Stale |
| busboy | 1.6.0 | Stale |
| concat-stream | 2.0.0 | Stale |
| object-assign | 4.1.1 | Stale |
| xtend | 4.0.2 | Stale |
| ignore-by-default | 1.0.1 | Stale |
| pstree.remy | 1.1.8 | Stale |
| simple-update-notifier | 2.0.0 | Stale |
| touch | 3.1.1 | Stale |
| undefsafe | 2.0.5 | Stale |
| bindings | 1.5.0 | Stale |
| prebuild-install | 7.1.3 | Deprecated |
| async-each-series | 0.1.1 | Stale |
| stream-throttle | 0.1.3 | Stale |
| anymatch | 3.1.3 | Stale |
| braces | 3.0.3 | Stale |
| glob-parent | 5.1.2 | Stale |
| is-binary-path | 2.1.0 | Stale |
| is-glob | 4.0.3 | Stale |
| normalize-path | 3.0.0 | Stale |
| utils-merge | 1.0.1 | Stale |
| graceful-fs | 4.2.11 | Stale |
| universalify | 0.1.2 | Stale |
| requires-port | 1.0.0 | Stale |
| is-number-like | 1.0.8 | Stale |
| bytes | 3.1.2 | Stale |
| batch | 0.6.1 | Stale |
| base64id | 2.0.0 | Stale |
| cliui | 8.0.1 | Stale |
| escalade | 3.2.0 | Stale |
| get-caller-file | 2.0.5 | Stale |
| require-directory | 2.1.1 | Stale |
| y18n | 5.0.8 | Stale |
| async | 3.2.6 | Stale |
| picocolors | 1.1.1 | Stale |
| inherits | 2.0.4 | Stale |
| setprototypeof | 1.2.0 | Stale |
| toidentifier | 1.0.1 | Stale |
| ee-first | 1.1.1 | Stale |
| wrappy | 1.0.2 | Stale |
| side-channel | 1.1.0 | Stale |
| is-promise | 4.0.0 | Stale |
| streamsearch | 1.1.0 | Stale |
| buffer-from | 1.1.2 | Stale |
| readable-stream | 3.6.2 | Stale |
| typedarray | 0.0.6 | Stale |
| file-uri-to-path | 1.0.0 | Stale |
| npmlog | 6.0.2 | Deprecated |
| expand-template | 2.0.3 | Stale |
| github-from-package | 0.0.0 | Stale |
| mkdirp-classic | 0.5.3 | Stale |
| napi-build-utils | 2.0.0 | Stale |
| rc | 1.2.8 | Stale |
| simple-get | 4.0.1 | Stale |
| tunnel-agent | 0.6.0 | Stale |
| chownr | 2.0.0 | Stale |
| fs-minipass | 2.1.0 | Stale |
| yallist | 4.0.0 | Stale |
| component-emitter | 3.1.2 | Stale |
| limiter | 1.1.5 | Stale |
| has-flag | 4.0.0 | Stale |
| fill-range | 7.1.1 | Stale |
| is-extglob | 2.1.1 | Stale |
| lodash.isfinite | 3.3.2 | Stale |
| safer-buffer | 2.1.2 | Stale |
| engine.io-parser | 5.2.3 | Stale |
| concat-map | 0.0.1 | Stale |
| es-errors | 1.3.0 | Stale |
| object-inspect | 1.13.4 | Stale |
| side-channel-list | 1.0.0 | Stale |
| side-channel-map | 1.0.1 | Stale |
| side-channel-weakmap | 1.0.2 | Stale |
| string_decoder | 1.3.0 | Stale |
| util-deprecate | 1.0.2 | Stale |
| fs.realpath | 1.0.0 | Stale |
| inflight | 1.0.6 | Deprecated |
| path-is-absolute | 1.0.1 | Deprecated |
| agentkeepalive | 4.6.0 | Stale |
| is-lambda | 1.0.1 | Stale |
| minipass-collect | 1.0.2 | Stale |
| promise-retry | 2.0.1 | Stale |
| are-we-there-yet | 3.0.1 | Deprecated |
| console-control-strings | 1.1.0 | Stale |
| gauge | 4.0.4 | Deprecated |
| set-blocking | 2.0.0 | Stale |
| deep-extend | 0.6.0 | Stale |
| simple-concat | 1.0.1 | Stale |
| to-regex-range | 5.0.1 | Stale |
| call-bound | 1.0.4 | Stale |
| humanize-ms | 1.2.1 | Stale |
| fs | 1.1.1 | Stale |
| infer-owner | 1.0.4 | Stale |
| promise-inflight | 1.0.1 | Stale |
| encoding | 0.1.13 | Stale |
| err-code | 2.0.3 | Stale |
| retry | 0.12.0 | Stale |
| delegates | 1.0.0 | Stale |
| color-support | 1.1.3 | Stale |
| has-unicode | 2.0.1 | Stale |
| signal-exit | 3.0.7 | Stale |
| wide-align | 1.1.5 | Stale |
| mimic-response | 3.1.0 | Stale |
| fs-constants | 1.0.0 | Stale |
| is-number | 7.0.0 | Stale |
| call-bind-apply-helpers | 1.0.2 | Stale |
| es-define-property | 1.0.1 | Stale |
| es-object-atoms | 1.1.1 | Stale |
| function-bind | 1.1.2 | Stale |
| get-proto | 1.0.1 | Stale |
| gopd | 1.2.0 | Stale |
| has-symbols | 1.1.0 | Stale |
| hasown | 2.0.2 | Stale |
| math-intrinsics | 1.1.0 | Stale |
| promisify | 1.1.3 | Stale |
| aggregate-error | 3.1.0 | Stale |
| smart-buffer | 4.2.0 | Stale |
| buffer | 5.7.1 | Stale |
| dunder-proto | 1.0.1 | Stale |
| indent-string | 4.0.0 | Stale |
| imurmurhash | 0.1.4 | Stale |
| base64-js | 1.5.1 | Stale |
| ieee754 | 1.2.1 | Stale |

## Recommendations

**Immediate**: Run `npm audit fix` (or `--force` for breaking changes).

**Deprecated packages**: Find and migrate to maintained alternatives.

**Ongoing**: Integrate `npm audit` into CI/CD and monitor with Dependabot or Snyk.

