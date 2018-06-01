/*----------------------------------------------------------------------
Here's where we pull all the libraries together and render the JS elements of the page.
Whole thing is wrapped in an anonymous self-executing function to avoid polluting global namespace.
-----------------------------------------------------------------------*/

/*jshint esversion:6, devel: true, browser: true*/

(function () {

	/********************/
	/* SET UP VARIABLES */
	/********************/
	


  /************************/
	/* BIND EVENT LISTENERS */
	/************************/

	document.addEventListener('DOMContentLoaded', () => {
		nautilus.init( () => {
			//any code that requires nautilus data should go inside this callback
		});
	};
														
	/****************************************/
	/* HELPER FUNCTIONS FOR EVENT LISTENERS */
	/****************************************/
	


})();