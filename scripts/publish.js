'use strict';

var exec        = require('child_process').exec;
var subarg      = require('subarg');
var fs          = require('fs');
var pkg         = require('../package.json');

var args = subarg( process.argv.slice( 2 ) );
var bumpType = process.env.npm_config_type;

function log() {
    if( args.v || args.verbose ) {
        console.log.apply(console, arguments);
    }
}

var version = (process.env.npm_package_version || pkg.version).split('.');

if( bumpType ) {
    args[ bumpType ] = true;
}

log( 'current version: ' + version.join('.') );

// default to patch
if( args.minor ) {
    version[2] = '0';
    version[1]++;
} else if( args.major ) {
    version[0]++;
    version[1] = '0';
    version[2] = '0';
} else {
    // do patch publish
    version[2]++;
}

log( 'new version: ' + version.join('.') );

pkg.version = version.join('.');

var file = 'package.json' + ( args.debug ? '.new' : '');

fs.writeFile( file, JSON.stringify( pkg, null, '  '), function( err ) {
    if( err ) {
        return console.error( err );
    }

    log('file saved!: ' + file);

    var child = exec('git status'/*'git commit -am "Release version ' + version.join('.') + '" && git tag'*/, function( err, stdout, stderr ) {
        if( err ) {
            log( stderr );
            return console.error( err );
        }
        log( stdout );

        
    });
    
});

