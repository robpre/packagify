#!/usr/bin/env node

var subarg 	= require('subarg');
var fs		= require('fs');
var path 	= require('path');
var utils	= require('./utils.js');//strip_, bool, inFile, outFile, input, output

var packagify = require('packagify-html');

function usage() {
	fs.createReadStream( __dirname + '/usage.txt' )
		.on('end', function() {process.exit(1);})
		.pipe( process.stdout );
}

var args = subarg( process.argv.slice( 2 ) );

console.log(  args );

if( args._[0] === 'help' ||  args._[0] === 'h' || args.h || args.help ) {
	return usage();
}

if( args.v || args.version ) {
	return console.log( require('../package.json').version );
}

var inputFile = utils.inFile( args );
var outputFile = utils.outFile( args );

if( !inputFile ) {
	return usage();
}

var options = {
    scripts: true,
    styles: true,
    uglify: true,
    minifyCss: true,
    images: true
};

console.log( options );

// utils.input( process.stdin, inputFile )
// 	.pipe( packagify.pkg( inputFile ) )
// 	.pipe( process.stdout );
