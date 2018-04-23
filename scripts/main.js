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
		
		//we'll run nautilus.init in here, with callback which does the handlebars work and edits the DOM.
		nautilus.init( () => {
			const unitNames = nautilus.getUnitNames(),
		  len = unitNames.length;
			let i = 0,
					context,
					summary
          
			for (i; i < len; i++) {
         summary = nautilus.getUnitSummary('student1', unitNames[i]);
				context = {
          unitName: unitNames[i],
					num: i,
          aboveTarget: summary.aboveTarget,
          belowTarget: summary.belowTarget,
          notStarted: summary.notStarted
				};

				document.getElementById('myScores').innerHTML += unitSummaryTemplate(context);
			}
			for (i = 0; i < len; i++) {
        chartSummary = nautilus.getUnitSummary('student1', unitNames[i]);
				makeChart(`#unitchart-${i}`, chartSummary.degreeValues, chartSummary.percentCompleted);
			}
		});
		
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