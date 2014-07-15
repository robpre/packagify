'use strict';

var packageHtml = require('../');

var args = require('subarg')( process.argv.slice( 2 ) );

packageHtml.pkgFile(__dirname + ( args.bad ? '/bad.html' : '/index.html')).pipe( process.stdout );
