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
		//any code requiring nautilus data should go inside the callback
		nautilus.init( () => {
			
			//populate the unit selector dropdown
			
			//apply multiselect settings
			$('#unitSelector').multiselect({
        includeSelectAllOption: true,
        selectAllName: 'All Units'
      });
			
			//initialise the datatable (use helpers.configureDataTable)
			helpers.configureDataTable('studentSummary', [
				{targets: 0, orderData: [ 0, 1 ]}
			]);

			//fill the datatable with info for all units (use helpers.tabularise)
		});
	});
														
	/****************************************/
	/* HELPER FUNCTIONS FOR EVENT LISTENERS */
	/****************************************/
	


})();