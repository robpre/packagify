'use strict';

//
var fs          = require('fs');
var trumpet     = require('trumpet');
var path        = require('path');
var Transform   = require('readable-stream/transform');
var PassThrough = require('readable-stream/passthrough');
var CleanCSS    = require('clean-css');
var UglifyJS    = require('uglify-js');
var pipeline    = require('./lib/pipeline/pipeline.js');
var request     = require('request');

var externalReg = /^(\/\/|http:|https:)/;
var ArrProto    = Array.prototype;
var slice       = ArrProto.slice;
var concat      = ArrProto.concat;

// discern if file is on disk or on a server, and return a stream
// representation in either case
function resolveFile( uri, folder ) {
    var p = new PassThrough();

    var resource;

    if( uri.match( externalReg ) ) {
        uri = uri.replace(/^\/\//, 'http://');
        resource = request({ 
            uri: uri,
            gzip: true
        });
    } else {
        // we don't know the host! so urls starting with / are meaningless!
        if( uri.match(/^\//) ) {
            // TODO: add debug tools to dump this data.
            // as a warning.
        }
        // replace the first slash to the path can be correctly found
        uri = uri.replace(/^\//, '');
        resource = fs.createReadStream( path.resolve( process.cwd(), folder, uri ) );
    }

    resource
    .on('error', function() {
        // TODO: add debug tools to dump this data.
        p.end('/*RESOURCE NOT FOUND : ' + uri + ' */');
    })
    .on('end', p.end.bind(p));

    return resource.pipe(p, {end: false});
}

function base64() {
    var t = new Transform();
    var buf = new Buffer(0);

    t._transform = function( buffer, enc, next ) {
        buf = Buffer.concat( [buf, buffer] );
        next();
    };
    // perhaps we need to buffer the data up
    t._flush = function( done ) {
        this.push( buf.toString('base64') );
        done();
    };

    return t;
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
            //o.dead_code = true;
            this.push( UglifyJS.minify( data, o ).code );
            next();
        },
        style: function( next ) {
            this.push( new CleanCSS( opts ).minify( data ) );
            next();
        }
    };

    // some resources can get data in multiple chunks
    var transform = new Transform();

    transform._transform = function( chunk, enc, next ) {
        data += chunk.toString();
        next();
    };

    transform._flush = types[ type ];

    return transform;
}

/**
 * styles function
 *
 * returns a stream which will parse for link tag and fetch styles from link href
 */
function styles( dir, opts ) {
    var tr = trumpet();

    tr.selectAll('link[href]', function( link ) {

        if( link.getAttribute('packagify-ignore') ) {
            link.removeAttribute('packagify-ignore');
            return;
        }

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

        if( script.getAttribute('packagify-ignore') ) {
            script.removeAttribute('packagify-ignore');
            return;
        }

        var src = script.getAttribute('src');
            
            script.removeAttribute( 'src' );

        var file = resolveFile( src, dir );
        // if opts is truthy, pipe the file through the uglifier
        ( opts ? file.pipe( mini( 'script', opts ) ) : file )
            .pipe( script.createWriteStream() );
    });

    return tr;
}

function images( dir ) {
    var tr = trumpet();

    tr.selectAll('img[src]', function( img ) {

        if( img.getAttribute('packagify-ignore') ) {
            img.removeAttribute('packagify-ignore');
            return;
        }

        var imgSrc = img.getAttribute('src');

        var file = resolveFile( imgSrc, dir );

        var ws = img.createWriteStream({outer: true});
        // we need to use the attributes from the old one
        ws.write('<img src="data:image/png;base64,');

        file
            .pipe( base64() )
            .on('end', function() {ws.end('">');})
            .pipe( ws, {end: false} );

    });

    return tr;
}

// TODO:
// maybe..
function stripWhiteSpace() {

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
    images: true,
    external: true
};

var packagify = {

    pkg: function( filePath, options ) {
        var opts = extend( {}, defaultOptions, options );

        var folder = path.dirname( filePath );

        var parse = [];

        if( opts.scripts ) {
            parse.push( scripts( folder, opts.uglify) );
        }
        
        if( opts.styles ) {
            parse.push( styles( folder, opts.minifyCss ) );
        }

        if( opts.images ) {
            parse.push( images( folder ) );
        }

        return pipeline( parse );
    },

    pkgFile: function( file, opts ) {
        var con = fs.createReadStream( file );

        return con.pipe( this.pkg( file, opts ) );
    },

    // this will save the file
    pkgWrite: function( src, opts, dest ) {
        if( !dest ) {
            dest = opts;
            opts = null;
        }

        this.pkgFile( src, opts ).pipe( fs.createWriteStream( path.resolve( process.cwd(), dest ) ) );
    },

    // this will take a src and pipe it to stdout 
    pkgSync: function( src, opts ) {
        return this.pkgFile( src, opts ).pipe( process.stdout );
    }
};

module.exports = packagify;


