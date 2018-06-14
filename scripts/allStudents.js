/*----------------------------------------------------------------------
Here's where we pull all the libraries together and render the JS elements of the page.
Whole thing is wrapped in an anonymous self-executing function to avoid polluting global namespace.
-----------------------------------------------------------------------*/

/*jshint esversion:6, devel: true, browser: true*/

(function () {

	/********************/
	/* SET UP VARIABLES */
	/********************/
	
	const productID = 'evolve1op';
	const unitSelector = document.getElementById('unitSelector');
	const tables = {};


  /************************/
	/* BIND EVENT LISTENERS */
	/************************/

	document.addEventListener('DOMContentLoaded', () => {
		//any code requiring nautilus data should go inside the callback
		nautilus.init( () => {
			
			const units = nautilus.getUnitNames(productID),
						students = nautilus.getStudentIDs();
			
			//populate the unit selector dropdown
			units.forEach( unit => {
				unitSelector.insertAdjacentHTML('beforeend', `<option value="${unit}" selected>${unit}</option>`);
			});
			
			//apply multiselect settings
			$('#unitSelector').multiselect({
        includeSelectAllOption: true
      });
			
			//initialise the datatable (use helpers.configureDataTable)
			tables['studentSummary'] = helpers.configureDataTable('studentSummary', [
				{targets: 0, orderData: [ 0, 1 ]},
				{targets: 8, visible: false},
				{targets: 7, orderData: [8]}
			]);

			//fill the datatable with info for all units
			tables['studentSummary'].clear().rows.add(buildStudentSummary(students, units)).draw();
			
		});
	});
														
	/****************************************/
	/* HELPER FUNCTIONS FOR EVENT LISTENERS */
	/****************************************/
	
	//outputs an array of arrays (one per row) for use by datatables
	function buildStudentSummary(students, units) {
		const rows = students.map( student => {
			const details = nautilus.getStudentDetails(student),
						summary = nautilus.getAllSummary(student, productID);
			return [
				details.firstName,
				details.lastName,
				`${nautilus.getAllAverage(student, productID) || '--'}%`,
				`${summary.aboveTarget + summary.belowTarget}/${summary.aboveTarget + summary.belowTarget + summary.notStarted}`,
				summary.aboveTarget,
				summary.belowTarget,
				nautilus.getTotalTime(student, productID, 'prose'),
				details.lastInteraction.toDateString().slice(4),
				details.lastInteraction.getTime(),
			];
		});
		return rows;
	};


})();