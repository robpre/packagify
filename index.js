'use strict';

//
var fs          = require('fs');
var trumpet     = require('trumpet');
var path        = require('path');
var Stream      = require('readable-stream');
var CleanCSS    = require('clean-css');
var UglifyJS    = require('uglify-js');
var util        = require('util');

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
                .pipe( ws, {end: false} );
        }

    });

    return tr;
}

function scripts( dir ) {
    var tr = trumpet();

    tr.selectAll('script[type="text/javascript"][src]', function( script ) {
        var src = script.getAttribute('src');
            script.removeAttribute( 'src' );

        fs
            .createReadStream( path.resolve( dir, src ) )
            .pipe( script.createWriteStream() );
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

    tr.selectAll( type, function( element ) {
        element.createReadStream()
            .pipe( transform )
            .pipe( element.createWriteStream() );
    });

    return tr;
}

function stripWhiteSpace() {
    var t = new Stream.Transform();

    t._transform = function( chunk, enc, next ) {
        var i = 0;
        for (; i < chunk.length; i++) {
            // remove newlines
            if( chunk[i] === 10 ) {
                chunk[i] = 0;
            }
        }
        this.push( chunk );
        next();
    };

    return t;
}

// discern if file is on disk or on a server, and return a stream
// representation in either case
function resolveFile( URI ) {

}

// skinny through constructor
function through( i ) {
    return new Stream.PassThrough();
    // var t = new Stream.Transform();
    // t._transform = function noop( chunk, enc, cb ) {
    //     console.log( 'my chunk ' + i + ' : ' + chunk.toString() );
    //     this.push( chunk );
    //     cb();
    // };
    // return t;
}

function ThroughPlex( opts ) {
    if( !(this instanceof ThroughPlex) ) {
        return new ThroughPlex( opts );
    }

    Stream.Duplex.call( this, opts );

    this.inStream = through( 'read' );
    this.outStream = through( 'write' );
}
util.inherits( ThroughPlex, Stream.Duplex );

ThroughPlex.prototype._write = function( chunk, enc, next ) {
    this.inStream.write( chunk, enc, next );
};

ThroughPlex.prototype._read = function() {

    var os = this.outStream;

    var self = this;

    function readable( size ) {
        var curChunk;

        while( (curChunk = os.read(size)) !== null ) {
            if( !self.push( curChunk ) ) {
                break;
            }
        }

        os.removeListener( 'end', end );
    }

    function end() {
        self.push( null );
        console.log('pushjed null');
        os.removeListener( 'readable', end );
    }

    os.once('readable', readable);

    os.once('end', end);
};

function pipeline( line ) {
    var _line = line && line.length ? line : Array.prototype.slice.call( arguments );

    var start = _line.splice(0, 1)[0] || through();

    var end = _line.reduce(function( src, dest ) {
        return src.pipe( dest );
    }, start);

    var wrapper = new ThroughPlex();

    start.on('finish', function() {console.log('\n===start finished===');});
    start.on('end', function() {console.log('\n===start end===');});
    wrapper.on('finish', function() {console.log('\n===wrapper finished===');});
    wrapper.on('end', function() {console.log('\n===wrapper end===');});
    end.on('end', function() {console.log('\n===end ended===');});
    end.on('finish', function() {console.log('\n===end finish===');});

    wrapper.inStream.pipe( start );

    end.pipe( wrapper.outStream );

    return wrapper;
}

module.exports = {

    pkg: function( filePath ) {
        var folder = path.dirname( filePath );

        /////////////////////////////////////////////////////////////////////////
        // I think the mini streams should move to where the files are grabbed //
        // we can get source maps and file paths working.                      //
        /////////////////////////////////////////////////////////////////////////
        var process = [ scripts( folder ), styles( folder )/*, mini( 'style' ), mini( 'script' )*/ ];

        return pipeline( process );
    },

    test: function( c, f) {
        return c.pipe( scripts(path.dirname( f )) ).pipe( styles(path.dirname( f )));
    },

    pkgFile: function( file ) {

        var con = fs.createReadStream( file );

        var out = through();

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
