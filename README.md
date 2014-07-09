packagify
=========

Packagify html into a single http request

Packagify will attempt to turn resources and references to external stylesheets, scripts and images (coming soon).

Currently, this module attempts to guess at whether the resource is hosted externally, or locally on the machine,
so it requires the location of the html document to trace dependencies from the local disk.

It will then attempt to stuff them inline, so for example:
```html
&lt;script type="text/javascript" src="/path/to/file.js"&gt;&lt;/script&gt;
&lt;script type="text/javascript" src="http://somehost/path/to/file.js"&gt;&lt;/script&gt;
```
would become
```html
&lt;script type="text/javascript"&gt;alert('minified resources!');&lt;/script&gt;
&lt;script type="text/javascript"&gt;(function() {alert('some other resources!');})(window);&lt;/script&gt;
```
and
```html
&lt;link rel="stylesheet" type="text/css" href="style.css"&gt;
&lt;link rel="stylesheet" type="text/css" href="//otherhost/screen.css"&gt;
```
would become
```html
&lt;style type="text/css"&gt;body:after{content:'i have also been shrunk';}*{font-family:'Comic Sans MS'}&lt;/style&gt;
&lt;style type="text/css"&gt;ul{float:left;}*:before{content:'etc';}&lt;/style&gt;
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
pkg( inputfile, /* optional options */ ) // returns a stream which will parse the input and stream the output out
pkgFile( inputfile, /* optional options */ ) // create a file readStream and pipe to the pkg method and return the stream
pkgSync( inputfile, /* optional options */ ) // create read stream and pipe to stdout, returning the stream
pkgWrite( inputfile, /* optional options */, output ) // create a read and write stream to the fs 
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
	scripts: true/false, // (default: true)
	styles: true/false, // (default: true)
	uglify: true/false, // (default: true)
	minifyCss: true/false, // (default: true)
	images: true/false, // (default: true)
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
