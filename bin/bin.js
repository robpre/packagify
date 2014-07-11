#!/usr/bin/env node

var subarg 	= require('subarg');
var fs		= require('fs');
var path 	= require('path');

var args = subarg( process.argv.slice( 2 ) );

function usage() {
	fs.createReadStream( __dirname + '/usage.txt' )
		.pipe( process.stdout )
		.on('end', function() {process.exit(1);});
}

function input( stdin, filename ) {
	if( !stdin.isTTY ) {
		return process.stdin;
	} else {
		return fs.createReadStream( filename );
	}
}

function output( tty, filename ) {

}

if( args._[0] === 'help' ||  args._[0] === 'h' || args.h || args.help ) {
	return usage();
}

if( args.v || args.version ) {
	return console.log( require('../package.json').version );
}

if( !args._[0] && !args.i && !args.infile && !args.e && !args.external ) {
	return usage();
}

var inputFile = args.i || args.infile || args._[0];

var options = {
    scripts: true,
    styles: true,
    uglify: true,
    minifyCss: true,
    images: true
};

var output;

if( process.stdout.isTTY && ( args._.length > 1 || args.o || args.outfile ) ) {

	output = fs.createWriteStream( args._)

}

console.log( args );
