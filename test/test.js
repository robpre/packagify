'use strict';

var packageHtml = require('../');
var fs = require('fs');

packageHtml.pkgFile(__dirname + '/test.html', true).pipe( process.stdout );
