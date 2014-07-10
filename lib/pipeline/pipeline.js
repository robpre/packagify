'use strict';

var ThroughPlex = require('../throughplex');
var PassThrough = require('readable-stream/passthrough');

var ArrProto    = Array.prototype;
var slice       = ArrProto.slice;
var concat      = ArrProto.concat;
/**
 * @param  {Array OR Stream} line... accepts either an array representing the stream, or Stream1, Strean2.. Stream n
 * @return {ThroughPlex}      Wrapping Duplex which will be the single entry and exit way for the data
 */
function pipeline( /* streams.. */ ) {
    var _line = concat.apply( ArrProto, slice.call( arguments ) );

    var start = _line.splice(0, 1)[0] || new PassThrough();

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

module.exports = pipeline;
