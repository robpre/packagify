packagify
=========

Packagify HTML into a single http request by inlining all the linked assets (CSS, JS).

Packagify will attempt to turn resources and references to external stylesheets, scripts and images.

The module attempts to fetch resource, whether that be off disk, or from a remote server, and then squash the resources using a css
minification and a js uglifier.

It will then attempt to stuff them inline, so for example:
```html
<script type="text/javascript" src="/path/to/file.js"></script>
<script type="text/javascript" src="http://somehost/path/to/file.js"></script>
```
would become
```html
<script type="text/javascript">alert('minified resources!');</script>
<script type="text/javascript">(function() {alert('some other resources!');})(window);</script>
```
and
```html
<link rel="stylesheet" type="text/css" href="style.css">
<link rel="stylesheet" type="text/css" href="//otherhost/screen.css">
```
would become
```html
<style type="text/css">body:after{content:'i have also been shrunk';}*{font-family:'Comic Sans MS'}</style>
<style type="text/css">ul{float:left;}*:before{content:'etc';}</style>
```

# usage

## pipe data

Example usage can be shown by running 
```bash
# this will just parse test/test.html and pipe to stdout
node test/test.js
```

The methods exposed by packagify-html are.
```js
// returns a stream which will parse the input and stream the output out
pkg( inputfile, /* optional options */ )

// create a file readStream and pipe to the pkg method and return the stream
pkgFile( inputfile, /* optional options */ )

// create read stream and pipe to stdout, returning the stream
pkgSync( inputfile, /* optional options */ )

// create a read and write stream to the fs 
pkgWrite( inputfile, /* optional options */, output )
```
Options are _always_ optional

```js
var packagify 	= require('packagify-html');
var fs 			= require('fs');

var filename = __dirname + '/test.html';

// basic usage of packagify.pkg( filename, opts );
fs.createReadStream( filename ).pipe( packagify.pkg( filename, opts ) ).pipe( process.stdout );

// shorthand
packagify.pkgFile( filename, opts ).pipe( process.stdout );

// this will create a stream of data for the file and pipe it directly to stdout
packagify.pkgSync( filename, opts );

// write out the squished file to the dest
packagify.pkgWrite( filename, opts, __dirname + '/mini.html' );
// or
packagify.pkgWrite( filename, __dirname + '/mini.html' );

```

## or even as middleware in a server.

```js

var clienthtml = __dirname + '/../client/index.html';

var server = require('http').createServer(function( req, res ) {
	var file = fs.createReadStream( clienthtml );

	file.pipe( packagify.pkg( clienthtml ).pipe( res );
}).listen(9001);

```

## coming soon: from the terminal

```bash
cat input.html | ./node_modules/.bin/packigify-html > output.html

packagify-html -i input.html -o output.html
```

# options

Options can be passed to the pkg methods
```js
// packagify-html opts
var opts = {
	scripts: true/false, 	/// (default: true) package scripts
	styles: true/false, 	/// (default: true)	package styles
	uglify: true/false, 	/// (default: true) uglify packaged scripts
	minifyCss: true/false, 	/// (default: true)	minify packaged styles
	images: true/false, 	/// (default: true) package images
	external: true/false 	/// (default: false) only scrape external resources
};
// minification opts
var opts = {
	uglify: true/false,
	minifyCss: true/false
};
// or
var opts = {
	uglify: {
		options: 'value'
	},
	minifyCss: {
		options: 'value'
	}
};
```
- Minification of the css is completed using [clean-css](https://www.npmjs.org/package/clean-css) and the options are available [here](https://www.npmjs.org/package/clean-css#how-to-use-clean-css-programmatically-)

- Uglification of the JS uses [uglify-js](https://www.npmjs.org/package/uglify-js) and the options are [here](https://www.npmjs.org/package/uglify-js#compressor-options)

### TODO

- Improve logging, so that we produce a debug.log, since stdout could be used to make the destination file.
