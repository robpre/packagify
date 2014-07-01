'use strict';

//
var fs          = require('fs');
var trumpet     = require('trumpet');
var path        = require('path');
var Stream      = require('readable-stream');
var CleanCSS    = require('clean-css');
var UglifyJS    = require('uglify-js');

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
            ws.write('<style type="text/css">');

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
    var types = {
        script: function( chunk, enc, next ) {
            var o = opts || {};
            o.fromString = true;
            this.push( UglifyJS.minify( chunk.toString(), o ).code );
            next();
        },
        style: function( chunk, enc, next ) {
            this.push( new CleanCSS( opts ).minify( chunk.toString() ) );
            next();
        }
    };

    var tr = trumpet();
    var transform = new Stream.Transform();

    transform._transform = types[ type ];

    tr.selectAll( type, function( style ) {
        style.createReadStream()
            .pipe( transform )
            .pipe( style.createWriteStream() );
    });

    return tr;
}

// discern if file is on disk or on a server, and return a stream
// representation in either case
function resolveFile( URI ) {

}

// skinny through constructor
function through() {
    var t = new Stream.PassThrough();
    // t.____ = ++number;
    // t._transform = function noop( chunk, enc, cb ) {
    //     this.____ === number && console.log( 'my chunk: ' + chunk.toString() );
    //     this.push( chunk );
    //     cb();
    // };
    return t;
}

function pipeline( line ) {
    var _line = line && line.length ? line : Array.prototype.slice.call( arguments );

    var start = _line.splice(0, 1)[0] || through();

    var end = _line.reduce(function( src, dest ) {
        return dest ? src.pipe( dest ) : src;//.pipe( through() );
    }, start);

    var wrapper = new Stream.Duplex();

    wrapper._read = function() {
        var cur,
            reads = 0,
            cont = true;
        while( cont && (cur = end.read()) !== null ) {
            cont = this.push( cur );
            reads++;
        }
        if( reads === 0 ) this.push('');
    };

    end.on('readable', function() {
        wrapper.read(0);
    });

    wrapper._write = function( data, enc, next ) {
        //console.log( 'ive been written to' + data.toString() );
        start.write( data );
        next();
    };

    return wrapper;
}

module.exports = {

    pkg: function( filePath ) {
        var folder = path.dirname( filePath );

        /////////////////////////////////////////////////////////////////////////
        // I think the mini streams should move to where the files are grabbed //
        // we can get source maps and file paths working.                      //
        /////////////////////////////////////////////////////////////////////////
        var process = [ scripts( folder ), styles( folder ), mini( 'style' ), mini( 'script' ) ];

        return pipeline( process );
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
