/*----------------------------------------------------------------------
Here's where we pull all the libraries together and render the JS elements of the page.
Whole thing is wrapped in an anonymous self-executing function to avoid polluting global namespace.
-----------------------------------------------------------------------*/

/*jshint esversion:6, devel: true, browser: true*/

(function () {
	
	/********************/
  /* SET UP VARIABLES */
  /********************/
	
	const studentId = 'student1';
	//we'll set up handlbars templates here too
	
	/************************/
  /* BIND EVENT LISTENERS */
  /************************/
	
	document.addEventListener('DOMContentLoaded', () => {
		
		//we'll run nautilus.init in here, with callback which does the handlebars work and edits the DOM.
		console.log('yup, loaded');
		configureDataTable('unitTable');
		
	});
	
	/********************/
  /* HELPER FUNCTIONS */
  /********************/
	
	//shortcut which generates & returns a handlebars template
	function getTemplate (elementId) {
    return Handlebars.compile(document.getElementById(elementId).innerHTML);
  }
	
	function configureDataTable (elementId) {
		$(`#${elementId}`).DataTable({
			"paging":   false,
       "info":     false
		});
	}

	
})();