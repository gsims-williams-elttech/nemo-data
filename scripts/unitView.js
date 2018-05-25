/*jshint esversion:6, devel: true, browser: true*/

(function () {
	
	/********************/
	/* SET UP VARIABLES */
	/********************/

	const charts = {},
				unitTileTemplate = getTemplate('unitTileTemplate');
	
	let studentID, //router will set this variable depending on the URL
			productID = 'evolve1op'; 
	
	/***************************/
	/* SET UP AND INIT ROUTING */
	/***************************/
	
	const routes = {
        '/:id': function(id) {
					//swap studentID variable to match hash
          studentID = id;
        }
      };
  const router = Router(routes);
	router.init(['/student1']); //by default, redirect to student1
	
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
				makeChart(`#unitchart-${i}`, [percentAbove, percentBelow, percentNot], summary.percentCompleted);
			}
		});
	});
	
	/********************/
	/* HELPER FUNCTIONS */
	/********************/
	
	//takes string, array of series values, and percent integer; makes chart on page
	function makeChart (id, series, percent) {
		charts[id] = new Chartist.Pie(id, {
			series: series,
			labels: ['', '']
		}, {
			fullWidth: true,
			width: '100%',
			height: '200px',
			donut: true,
			donutWidth: 40,
			startAngle: 270,
  		total: 200,
			showLabel: false
		});
	}
	
	//shortcut which generates & returns a handlebars template
	function getTemplate (elementId) {
		return Handlebars.compile(document.getElementById(elementId).innerHTML);
	}
	

})();	