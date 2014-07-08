'use strict';

var packageHtml = require('../');

packageHtml.pkgFile(__dirname + '/test.html').pipe( process.stdout );
