/*----------------------------------------------------------------------
Here's where we pull all the libraries together and render the JS elements of the page.
Whole thing is wrapped in an anonymous self-executing function to avoid polluting global namespace.
-----------------------------------------------------------------------*/

/*jshint esversion:6, devel: true, browser: true*/

(function () {

	/********************/
	/* SET UP VARIABLES */
	/********************/

	const lessonTableTemplate = helpers.getTemplate('lessonTableTemplate'),
				unitSummaryTemplate = helpers.getTemplate('unitSummaryTemplate'),
				productSummaryTemplate = helpers.getTemplate('productSummaryTemplate'),
				charts = {}, //holds variables created by chartist.js
				myScores = document.getElementById('myScores'),
				filterActivities = document.getElementById('filterActivities');
	let studentID = helpers.getVariableFromURL('student1'), //init routing
			productID = 'evolve1op',
			tables = {}; //holds tables created by datatables.js

	/************************/
	/* BIND EVENT LISTENERS */
	/************************/

	document.addEventListener('DOMContentLoaded', () => {
		nautilus.init( () => {
			renderProductSummary();
			renderUnitSummaries();
			//add a click listener to each unit tile, to reveal tables
			for (let i = 0; i < myScores.childNodes.length; i++) {
				myScores.childNodes[i].addEventListener('click', (e) => {
					toggleTables(e);
				});
			}
		});
	});
	
	filterActivities.addEventListener('change', (e) => {
		let filterVal = e.target.options[e.target.selectedIndex].value;
		helpers.filterTables(tables, filterVal, 4);
	});

	/****************************************/
	/* HELPER FUNCTIONS FOR EVENT LISTENERS */
	/****************************************/
	
	//hide or show the tableAreaFull region and format selected unit tile
	function toggleTables (e) {
		const tableArea = document.getElementById('tableAreaFull'),
					tableTarget = document.getElementById('tableArea'),
					unitName = event.currentTarget.dataset.unit,
					filterVal = filterActivities.options[filterActivities.selectedIndex].value;
		if (e.currentTarget.classList.contains('unit-card-selected')) {
			tableArea.classList.add('d-none');
			e.currentTarget.classList.remove('unit-card-selected');
		} else {
			tableArea.classList.remove('d-none');
			//render unit tables and store resulting datatables objects
			tables = helpers.renderUnitTables(
				studentID,
				productID,
				unitName,
				tableTarget,
				lessonTableTemplate,
				tables
			);
			helpers.filterTables(tables, filterVal, 4); //apply filters if any selected
			styleOpenUnit(e);
		}
	};

  function renderProductSummary (){
    let context = nautilus.getAllSummary(studentID, productID);
    context.active_time = nautilus.getTotalTime(studentID, productID);
    document.getElementById('productSummary').innerHTML += productSummaryTemplate(context);
  }
	
	function renderUnitSummaries () {
		//first we get the names of units, and derive number of units,
		//and we set up variables which we'll need in our for loop.
		const unitNames = nautilus.getUnitNames(productID),
					len = unitNames.length;
		let i = 0;

		//first loop. For each unit, add a div to the page.
		for (i; i < len; i++) {
			//start building our context object using the current unit's summary data
			let context = nautilus.getUnitSummary(studentID, productID, unitNames[i]);
			//add the unit name to the context object
			context.unitName = unitNames[i];
			context.num = i;
			//compile Handlebars html and place it into the DOM
			document.getElementById('myScores').innerHTML += unitSummaryTemplate(context);
		}
		//second loop because chartist doesn't want to behave in loop 1. Add charts to each div.
		for (i = 0; i < len; i++) {
			let summary = nautilus.getUnitSummary(studentID, productID, unitNames[i]);
			let chartOptions = helpers.generateDonutOptions(summary.percentCompleted);
			charts[`#unitchart-${i}`] = helpers.makeChart(`#unitchart-${i}`, summary.degreeValues, chartOptions);
		}
	}

	//style the open unit	and remove style from other units
	function styleOpenUnit (event) {			
		Array.from(event.currentTarget.parentElement.children).forEach( (el) => {
			el.classList.remove('unit-card-selected');
		});
		event.currentTarget.classList.add('unit-card-selected');
	}

})();