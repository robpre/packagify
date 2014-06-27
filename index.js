'use strict';

//
var fs          = require('fs');
var trumpet     = require('trumpet');
var path        = require('path');
var Stream      = require('readable-stream');
var CleanCSS    = require('clean-css');

function styles( dir ) {
    var tr = trumpet();

    tr.selectAll('link', function( link ) {

        var href = link.getAttribute('href');
        var type = link.getAttribute('type');
        var rel = link.getAttribute('rel');

        if( href && ( rel === 'stylesheet' || type === 'text/css') ) {
            var file = fs.createReadStream( path.resolve( dir, href ) );

            var ws = link.createWriteStream({
                outer: true
            });
            ws.write('<style>');

            file
                .on('end', function() {
                    ws.end('</style>');
                })
                .pipe( ws, {end: false});
        }

    });

    return tr;
}

function scripts( dir ) {
    var tr = trumpet();

    tr.selectAll('script', function( script ) {

        var type = script.getAttribute('type');
        var src = script.getAttribute('src');
        if( type === 'text/javascript' && src ) {
            script.removeAttribute( 'src' );

            fs
                .createReadStream( path.resolve( dir, src ) )
                .pipe( script.createWriteStream() );
        }

    });

    return tr;
}

// return a transform stream that will minify the piped content
function mini( type, opts ) {

}

// discern if file is on disk or on a server, and return a stream
// representation in either case
function resolveFile( URI ) {

}

function pipeline() {
    var _line = arguments[0].length ? arguments[0] : Array.prototype.slice.call( arguments );

    var start = new Stream.Duplex();

    var end = _line.reduce(function( src, dest ) {
        var 
        src.
    }, start);
}

module.exports = {

    pkg: function( file ) {
        var folder = path.dirname( file );

        var d = new Stream.Duplex();

        var process = [ scripts( folder ), styles( folder ) ];

        var start = process[0];

        d._read = function() {
            this.push();
        };

        d._write = function( chunk, enc, next ) {
            s.write( chunk );
        };

        return start.pipe( end );
    },

    pkgFile: function( file ) {

        var con = fs.createReadStream( file );

        con.on('error', function( err ) {
            console.error(err);
            process.exit( 1 );
        });

        return con.pipe( this.pkg( file ) );

    },

    // this will save the file
    pkgWrite: function() {},

    // this will take a src and pipe it to stdout 
    pkgSync: function() {}
};
