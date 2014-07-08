packagify
=========

Packagify html into a single http request

# usage

## pipe data

```js
var packagify = require('packagify-html');

var filename = __dirname + '/test.html';

packagify.pkgFile( filename ).pipe( process.stdout );

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
cat somefile | ./node_modules/.bin/packigify-html > output.html

pkg-html -i input.html -o output.html
```
