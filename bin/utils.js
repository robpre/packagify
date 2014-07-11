var fs = require('fs');

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
	return a._[0] || a.i || a.infile || a.e || a.external;
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

module.exports = {
	strip_: strip_,
	bool: bool,
	inFile: inFile,
	outFile: outFile,
	input: input,
	output: output
};
