'use strict';

//
var fs          = require('fs');
var trumpet     = require('trumpet');
var path        = require('path');
var Stream      = require('readable-stream');
var CleanCSS    = require('clean-css');
var UglifyJS    = require('uglify-js');
var ThroughPlex = require('./lib/throughplex/throughplex.js');
var request     = require('request');

var external    = /^(\/\/|http:|https:)/;
var ArrProto    = Array.prototype;
var slice       = ArrProto.slice;
var concat      = ArrProto.concat;

// discern if file is on disk or on a server, and return a stream
// representation in either case
function resolveFile( uri, folder ) {
    if( uri.match( external ) ) {
        uri = uri.replace(/^\/\//, 'http://');
        return request( uri );
    } else {
        return fs.createReadStream( path.resolve( folder, uri ) );
    }
}

// TODO: get sourcemaps working
// return a transform stream that will minify the piped content
function mini( type, opts ) {

    if( opts && typeof opts !== 'object' ) opts = {};

    var data = '';
    var types = {
        script: function( next ) {
            var o = opts || {};
            o.fromString = true;
            this.push( UglifyJS.minify( data, o ).code );
            next();
        },
        style: function( next ) {
            this.push( new CleanCSS( opts ).minify( data ) );
            next();
        }
    };

    // some resources can get data in multiple chunks
    var transform = new Stream.Transform();

    transform._transform = function( chunk, enc, next ) {
        data += chunk.toString();
        next();
    };

    transform._flush = types[ type ];

    return transform;
}

function styles( dir, opts ) {
    var tr = trumpet();

    tr.selectAll('link[href]', function( link ) {

        var href = link.getAttribute('href');
        var type = link.getAttribute('type');
        var rel = link.getAttribute('rel');

        if( rel === 'stylesheet' || type === 'text/css' ) {
            var file = resolveFile( href, dir );

            var ws = link.createWriteStream({
                outer: true
            });
            ws.write('<style type="text/css">');

            // if opts is truthy, pipe the file through the minfication
            ( opts ? file.pipe( mini('style', opts ) ) : file )
                .on('end', function() {
                    ws.end('</style>');
                })
                .pipe( ws, {end: false} );
        }

    });

    return tr;
}

function scripts( dir, opts ) {
    var tr = trumpet();

    tr.selectAll('script[type="text/javascript"][src]', function( script ) {
        var src = script.getAttribute('src');
            
            script.removeAttribute( 'src' );

        var file = resolveFile( src, dir );
        // if opts is truthy, pipe the file through the uglifier
        ( opts ? file.pipe( mini( 'script', opts ) ) :file )
            .pipe( script.createWriteStream() );
    });

    return tr;
}

function images( dir ) {
    var tr = trumpet();

    tr.selectAll('img[src]', function( img ) {
        var imgSrc = img.getAttribute('src');

        var file = resolveFile( imgSrc, dir );

        var ws = img.createWriteStream({outer: true});

        ws.write('<img src="data:image/png;base64,');
        // this doesn't work.
        file
            .pipe( base64() )
            .on('end', function() {ws.end('">');})
            .pipe( ws, {end: false} );

    });

    return tr;
}

function base64() {
    var t = new Stream.Transform();

    t._transform = function( buffer, enc, next ) {
        this.push( buffer.toString('base64') );
        next();
    };

    return t;
}

// TODO:
// maybe..
function stripWhiteSpace() {

}

// skinny through constructor
function through() {
    return new Stream.PassThrough();
    // var t = new Stream.Transform();
    // t._transform = function noop( chunk, enc, cb ) {
    //     console.log( 'my chunk ' + i + ' : ' + chunk.toString() );
    //     this.push( chunk );
    //     cb();
    // };
    // return t;
}

/**
 * Extract this into new module
 * @param  {Array OR Stream} line... accepts either an array representing the stream, or Stream1, Strean2.. Stream n
 * @return {ThroughPlex}      Wrapping Duplex which will be the single entry and exit way for the data
 */
function pipeline( /* streams.. */ ) {
    var _line = concat.apply( ArrProto, slice.call( arguments ) );

    var start = _line.splice(0, 1)[0] || through();

    var end = _line.reduce(function( src, dest ) {
        return src.pipe( dest );
    }, start);

    var wrapper = new ThroughPlex();

    // pipe that incoming data off to the start of the pipeline
    wrapper.inStream.pipe( start );

    // pipe the contents from the end of the pipeline through to the output
    end.pipe( wrapper.outStream );

    // when the wrapper thinks we're finished, start pushing the end event through the stack
    wrapper.on('finish', function() {
        start.end();
    });

    // return the wrapper
    return wrapper;
}

// skinny shallow extend function
function extend( src ) {
    if( !src ) src = {};
    var obs = slice.call( arguments, 1 );
    var i = 0;
    var len = obs.length;
    var cur, key;

    for (; i < len; i++) {
        cur = obs[i];

        if( !cur ) break;
        for( key in cur ) {
            if( cur.hasOwnProperty( key ) && typeof cur[key] !== undefined ) {
                src[ key ] = cur[ key ];
            }
        }
    }
    return src;
}

var defaultOptions = {
    scripts: true,
    styles: true,
    uglify: true,
    minifyCss: true,
    images: true
};

module.exports = {

    pkg: function( filePath, options ) {
        var folder = path.dirname( filePath );

        var opts = extend( {}, defaultOptions, options );

        var parse = [];

        if( opts.scripts ) {
            parse.push( scripts( folder, opts.uglify ) );
        }
        
        if( opts.styles ) {
            parse.push( styles( folder, opts.minifyCss ) );
        }

        parse.push( images( folder ) );

        return pipeline( parse );
    },

    pkgFile: function( file, opts ) {
        var con = fs.createReadStream( file );

        con.on('error', function( err ) {
            console.error(err);
            process.exit( 1 );
        });

        return con.pipe( this.pkg( file, opts ) );
    },

    // this will save the file
    pkgWrite: function( src, opts, dest ) {
        if( !dest ) {
            dest = opts;
        }
    },

    // this will take a src and pipe it to stdout 
    pkgSync: function( src, opts ) {
        return this.pkg( src, opts ).pipe( process.stdout );
    }
};
