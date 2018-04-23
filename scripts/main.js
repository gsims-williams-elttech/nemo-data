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
				unitSummaryTemplate = getTemplate('unitSummaryTemplate');
	
	/************************/
  /* BIND EVENT LISTENERS */
  /************************/
	
	document.addEventListener('DOMContentLoaded', () => {
		
		//we'll run nautilus.init in here, with callback which does the handlebars work and edits the DOM.
		nautilus.init( () => {
			let i = 0,
					unitNames = nautilus.getUnitNames(),
					len = unitNames.length,
					context;
			for (i; i < len; i++) {
				context = nautilus.getUnitSummary(studentId, unitNames[i]);
				context.unitName = unitNames[i];
				context.num = i;
				document.getElementById('myScores').innerHTML += unitSummaryTemplate(context);
				//chartist goes here (makeChart...)
				//use 'unitchart-i' as id
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
		var chart = new Chartist.Pie(id, {
			series: series,
			labels: ['', '']
		}, {
			donut: true,
			donutWidth: 40,
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
						content: `<h3>${percent}<span class="small">%</span></h3>`
					}]
				})
			],
		});
	}

	
})();