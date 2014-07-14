var fs = require('fs');
var Transform = require('readable-stream/transform');

function strip_( o ) {
	var i, cur;
	var out = {};
	for( i in o ) {
		if( o.hasOwnProperty( i ) && i !== '_' && ( cur = o[i] ) != null ) {
			out[i] = typeof cur === 'object' ? strip_( cur ) : cur;
		}
	}
	return out;
}

function bool( i ) {
	return !!(typeof i === 'string' ? i = i.toLowerCase() && i === 't' || i === 'true' : i);
}

function inFile( a ) {
	return a._[0] || a.i || a.infile;
}

function outFile( a ) {
	return a.o || a.outfile;
}

function input( stdin, filename ) {
	if( !stdin.isTTY ) {
		return stdin;
	} else {
		return fs.createReadStream( filename );
	}
}

function output( stdout, filename ) {
	if( filename ) {
		return fs.createWriteStream( filename );
	}

	return stdout;
}

function help( a ) {
	return a._[0] || a.h || a.help;
}

function lines( n ) {
	var t = new Transform();
	var count = 0;
	n = n || 1;

	t._transform = function( chunk, enc, next ) {
		var len = chunk.length;
		var i = 0;
		for (; i < len; i++) {
			if( chunk[i] === 10 && ++count === n ) break;
		}
		if( i > 0 ) {
			this.push( chunk.slice(0, i + 1) );
			this.push(null);
			next();
		} else {
			next();
		}
	};

	return t;
}

module.exports = {
	strip_: strip_,
	bool: bool,
	inFile: inFile,
	outFile: outFile,
	input: input,
	output: output,
	help: help,
	lines: lines
};
