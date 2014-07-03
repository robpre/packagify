'use strict';

var Stream      = require('readable-stream');
var util        = require('util');

function ThroughPlex( opts ) {
    if( !(this instanceof ThroughPlex) ) {
        return new ThroughPlex( opts );
    }

    Stream.Duplex.call( this, opts );

    this.inStream = new Stream.ThroughStream();
    this.outStream = new Stream.ThroughStream();

    var self = this;
    this.outStream.on('end', function() {
        self.push(null);
    });
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
    }

    os.removeListener( 'readable', readable );
    os.once('readable', readable);
};

module.exports = ThroughPlex;