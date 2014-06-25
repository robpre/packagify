(function( window ) {
'use strict';
	if( window.document && window.document.getElementsByTagName ) {
		document.getElementsByTagName('body')[0].classList.add('I\'veaddedaclass');
		var p = document.createElement('p');
		p.innerHTML = 'I\'ve been injected by javascript';

		document.getElementsByTagName('body')[0].appendChild( p );
	}

})(window);