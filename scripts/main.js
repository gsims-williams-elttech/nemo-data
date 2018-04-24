/*----------------------------------------------------------------------
Here's where we pull all the libraries together and render the JS elements of the page.
Whole thing is wrapped in an anonymous self-executing function to avoid polluting global namespace.
-----------------------------------------------------------------------*/

/*jshint esversion:6, devel: true, browser: true*/

(function () {
	
	/********************/
  /* SET UP VARIABLES */
  /********************/
	
	const studentId = 'student1',
				unitSummaryTemplate = getTemplate('unitSummaryTemplate'),
				charts = {}; //holds variables created by chartist.js
	
	/************************/
  /* BIND EVENT LISTENERS */
  /************************/
	
	document.addEventListener('DOMContentLoaded', () => {
		nautilus.init( () => {
			//first we get the names of units, and derive number of units,
			//and we set up variables which we'll need in our for loop.
			const unitNames = nautilus.getUnitNames(),
		  			len = unitNames.length;
			let i = 0;
      
			//first loop. For each unit, add a div to the page.
			for (i; i < len; i++) {
				//start building our context object using the current unit's summary data
        let context = nautilus.getUnitSummary('student1', unitNames[i]);
				//add the unit name to the context object
				context.unitName = unitNames[i];
				context.num = i;
				//compile Handlebars html and place it into the DOM
				document.getElementById('myScores').innerHTML += unitSummaryTemplate(context);
			}
			//second loop because chartist doesn't want to behave in loop 1. Add charts to each div.
			for (i = 0; i < len; i++) {
        let summary = nautilus.getUnitSummary('student1', unitNames[i]);
				makeChart(`#unitchart-${i}`, summary.degreeValues, summary.percentCompleted);
			}
		});
		
		//apply configurations to the data table
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
	
	//takes string, array of series values, and percent integer; makes chart on page
	function makeChart (id, series, percent) {
		charts[id] = new Chartist.Pie(id, {
			series: series,
			labels: ['', '']
		}, {
			donut: true,
			donutWidth: 20,
			startAngle: 0,
			total: 360,
			showLabel: false,
			plugins: [
				Chartist.plugins.fillDonut({
					items: [{
						content: '<i class="fa fa-tachometer"></i>',
						position: 'bottom',
						offsetY : 10,
						offsetX: -2
					}, {
						content: `<h5>${percent}<span class="small">%</span></h5>`,
            offsetY : 0,
						offsetX: 0,
            margin: 'auto',
					}]
				})
			],
		});
	}

	
})();