/*jshint esversion:6, devel: true, browser: true*/

(function () {
	
	/********************/
	/* SET UP VARIABLES */
	/********************/

	const charts = {},
				unitTileTemplate = helpers.getTemplate('unitTileTemplate');
	
	let studentID = helpers.getVariableFromURL('student1'), //setup router
			productID = 'evolve1op'; 
	
	/************************/
	/* BIND EVENT LISTENERS */
	/************************/
	
	//when page loads...
	
	document.addEventListener('DOMContentLoaded', () => {
		nautilus.init( () => {
			//get list of unit names for current product
			const unitNames = nautilus.getUnitNames(productID),
						len = unitNames.length;
			let i = 0;

			//first loop. For each unit, add a unit tile to the page.
			for (i; i < len; i++) {
				let context = nautilus.getUnitSummary(studentID, productID, unitNames[i]);
				let sum = context.aboveTarget + context.belowTarget + context.notStarted;
				let percentAbove = Math.floor((context.aboveTarget / sum) * 100);
				let percentBelow = Math.floor((context.belowTarget / sum) * 100);
				let percentNot = Math.floor((context.notStarted / sum) * 100);
				//start building our context object
				context.aboveTarget = percentAbove;
				context.belowTarget = percentBelow;
				context.notStarted = percentNot;
				//add the unit name to the context object
				context.unitName = unitNames[i];
				context.num = i;
				//compile Handlebars html and place it into the DOM
				document.getElementById('unitTileContainer').innerHTML += unitTileTemplate(context);
			}
			//second loop because chartist doesn't want to behave in loop 1. Add charts to each div.
			for (i = 0; i < len; i++) {
				let summary = nautilus.getUnitSummary(studentID, productID, unitNames[i]);
				let sum = summary.aboveTarget + summary.belowTarget + summary.notStarted;
				let percentAbove = (summary.aboveTarget / sum) * 100;
				let percentBelow = (summary.belowTarget / sum) * 100;
				let percentNot = (summary.notStarted / sum) * 100;
				charts[`#unitchart-${i}`] = helpers.makeChart(`#unitchart-${i}`, [percentAbove, percentBelow, percentNot]);
			}
		});
	});
	

})();	