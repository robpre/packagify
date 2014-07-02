packagify
=========

Packagify html into a single http request

# usage

```js
var packagify = require('packagify-html');
var fs = require('fs');

var filename = __dirname + '/test.html';

fs.createReadStream( filename ).pipe( packagify.pkg() ).pipe( process.stdout );

```
