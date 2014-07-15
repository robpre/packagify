#!/usr/bin/env node

var subarg 	= require('subarg');
var fs		= require('fs');
var path 	= require('path');
var utils	= require('./utils.js');//strip_, bool, inFile, outFile, input, help, lines

var packagify = require('packagify-html');

function usage( full ) {
	var file = fs.createReadStream( __dirname + '/usage.txt' );
	(full ? file : file.pipe( utils.lines(2) ) )
		.on('end', function() {process.exit(1);})
		.pipe( process.stdout );
}

var args = subarg( process.argv.slice( 2 ) );

if( utils.help( args ) ) {
	return usage( args.help || utils.help( args ) === 'help' );
}

if( args.v || args.version ) {
	return console.log( require('../package.json').version );
}

var inputFile = utils.inFile( args );
var outputFile = utils.outFile( args ) && path.resolve( process.cwd(), utils.outFile( args ) );

if( !inputFile && !(args.e || args.external) ) {
	return usage( true );
}

if( args.d || args.default ) {
	args.s = args.c = args.g = args.u = args.m = true;
}

var options = {
    scripts: 	utils.bool( args.s || args.scripts ),
    styles: 	utils.bool( args.c || args.styles ),
    images: 	utils.bool( args.g || args.images ),
    uglify: 	utils.bool( args.u || args.uglify ) && utils.strip_(args.u || args.uglify),
    minifyCss: 	utils.bool( args.m || args.minify ) && utils.strip_(args.m || args.minify),
    external: 	utils.bool( args.e || args.external )
};

if( outputFile && process.stdout.isTTY && process.stdin.isTTY ) {
	packagify.pkgWrite( inputFile, options, outputFile );
	return console.log( 'Writing file to: ' + outputFile );
}

if( !process.stdout.isTTY || !outputFile ) {
	if( !process.stdin.isTTY ) {
		return process.stdin.pipe( packagify.pkg( inputFile, options ) ).pipe( process.stdout );
	}

	if( !outputFile ) {
		return packagify.pkgFile( inputFile, options ).pipe( process.stdout );
	} else {
		packagify.pkgFile( inputFile, options ).pipe( fs.createWriteStream( outputFile ) );
		return console.log( 'Writing file to: ' + outputFile );
	}
}
