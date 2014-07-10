#!/usr/bin/env node

var subarg 	= require('subarg');
var fs		= require('fs');

var args = subarg( process.argv.slice( 2 ) );

if( args._[0] === 'help' ||  args._[0] === 'h' || args.h || args.help ) {
	fs.createReadStream( __dirname + '/usage.txt' ).pipe( process.stdout );
}

console.log( args );

console.log( require('../package.json').version );
