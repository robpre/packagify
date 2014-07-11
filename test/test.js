'use strict';

var packageHtml = require('../');

packageHtml.pkgFile(__dirname + '/index.html').pipe( process.stdout );
