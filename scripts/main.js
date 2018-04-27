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
				lessonTableTemplate = getTemplate('lessonTableTemplate'),
				unitSummaryTemplate = getTemplate('unitSummaryTemplate'),
				productSummaryTemplate = getTemplate('productSummaryTemplate'),
				charts = {}, //holds variables created by chartist.js
				tables = {}, //holds tables created by datatables.js
				myScores = document.getElementById('myScores');

	/************************/
	/* BIND EVENT LISTENERS */
	/************************/

	document.addEventListener('DOMContentLoaded', () => {
		nautilus.init( () => {
			renderProductSummary();
			renderUnitSummaries();
			//add a click listener to each div inside myScores
			for (let i = 0; i < myScores.childNodes.length; i++) {
				myScores.childNodes[i].addEventListener('click', (e) => {
					//hide or show the tableArea
					if (event.currentTarget.classList.contains('unit-card-selected')) {
						document.getElementById('tableArea').classList.add('d-none');
						event.currentTarget.classList.remove('unit-card-selected');
					} else {
						renderUnitTables(e);
						styleOpenUnit(e);
					}
				});
			}
		});
	});

	/*********************************/
	/* FUNCTIONS FOR EVENT LISTENERS */
	/*********************************/

  function renderProductSummary (){
    let context = nautilus.getAllSummary('student1');
    context.active_time = nautilus.getTotalTime('student1');
    document.getElementById('productSummary').innerHTML += productSummaryTemplate(context);
  }
	
	function renderUnitSummaries () {
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
	}

	function renderUnitTables (event) {
		const unitName = event.currentTarget.dataset.unit,
					lessons = nautilus.getLessonNames(unitName),
					tableArea = document.getElementById('tableArea');
		let i = 0,
				j = 0,
				tableRows,
				results,
				context = {};
		tableArea.innerHTML = "";
		//reveal the table area
		tableArea.classList.remove('d-none');
		//loop through each lesson in the unit
		for (i; i < lessons.length; i++) {
			tableRows = [];
			results = nautilus.getLessonResults(studentId, unitName, lessons[i]);
			context.lessonName = lessons[i];
			context.id = `lessonTable-${i}`;
			//use handlebars to create empty table and insert into DOM
			tableArea.insertAdjacentHTML('beforeend', lessonTableTemplate(context));
			//prepare data for the table, row by row
			for (j = 0; j < results.length; j++) {
				//get an icon depending on status
				let icon = "<i class='far fa-circle'></i>";
				if (results[j].status === 'aboveTarget') {
					icon = "<i class='fas fa-star'></i>"
				} else if (results[j].status === 'belowTarget') {
					icon = "<span class='fa-layers fa-fw'><i class='far fa-star'></i><i class='fas fa-star-half'></i></span>";
				}
				tableRows.push([
					`${icon} ${results[j].LO_name}`,
					results[j].first_score,
					results[j].best_score,
					results[j].attempts
				]);
			}
			//configure and draw the lesson table
			tables[context.id] = configureDataTable(context.id);
			tables[context.id].clear().rows.add(tableRows).draw();
		}
	}

	//style the open unit	and remove style from other units
	function styleOpenUnit (event) {			
		Array.from(event.currentTarget.parentElement.children).forEach( (el) => {
			el.classList.remove('unit-card-selected');
		});
		event.currentTarget.classList.add('unit-card-selected');
	}

	/********************/
	/* HELPER FUNCTIONS */
	/********************/

	//shortcut which generates & returns a handlebars template
	function getTemplate (elementId) {
		return Handlebars.compile(document.getElementById(elementId).innerHTML);
	}

	function configureDataTable (elementId) {
		return $(`#${elementId}`).DataTable({
			paging:   false,
			retrieve: true,
			info:     false,
			order: [],
			columnDefs: [{
				targets: 0,
				orderable: false
				//width: '40%'
			}]
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