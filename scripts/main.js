/*----------------------------------------------------------------------
Here's where we pull all the libraries together and render the JS elements of the page.
Whole thing is wrapped in an anonymous self-executing function to avoid polluting global namespace.
-----------------------------------------------------------------------*/

/*jshint esversion:6, devel: true, browser: true*/

(function () {

	/********************/
	/* SET UP VARIABLES */
	/********************/

	const lessonTableTemplate = getTemplate('lessonTableTemplate'),
				unitSummaryTemplate = getTemplate('unitSummaryTemplate'),
				productSummaryTemplate = getTemplate('productSummaryTemplate'),
				charts = {}, //holds variables created by chartist.js
				tables = {}, //holds tables created by datatables.js
				myScores = document.getElementById('myScores'),
				filterActivities = document.getElementById('filterActivities');
	let studentID = 'student1',//will be set later using router
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

	document.addEventListener('DOMContentLoaded', () => {
		nautilus.init( () => {
			renderProductSummary();
			renderUnitSummaries();
			//add a click listener to each div inside myScores
			for (let i = 0; i < myScores.childNodes.length; i++) {
				myScores.childNodes[i].addEventListener('click', (e) => {
					//hide or show the tableAreaFull
					if (event.currentTarget.classList.contains('unit-card-selected')) {
						document.getElementById('tableAreaFull').classList.add('d-none');
						event.currentTarget.classList.remove('unit-card-selected');
					} else {
						renderUnitTables(e);
						styleOpenUnit(e);
					}
				});
			}
		});
	});
	
	filterActivities.addEventListener('change', (e) => {
		let filterVal = e.target.options[e.target.selectedIndex].value;
		filterTables(filterVal);
	});

	/*********************************/
	/* FUNCTIONS FOR EVENT LISTENERS */
	/*********************************/
	
	function filterTables (filterVal) {
		Object.keys(tables).map(function(key, index) {
			if (key.includes('lessonTable-') || key.includes('unitTable-')) {
				tables[key].columns(4).search(filterVal).draw()
			}
		});
	}

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
			makeChart(`#unitchart-${i}`, summary.degreeValues, summary.percentCompleted);
		}
	}

	function renderUnitTables (event) {
		const unitName = event.currentTarget.dataset.unit,
					lessons = nautilus.getLessonNames(productID, unitName),
					tableArea = document.getElementById('tableArea'),
					tableAreaFull = document.getElementById('tableAreaFull'),
					filterVal = filterActivities.options[filterActivities.selectedIndex].value;
		let i = 0,
				tableRows,
				results,
				context = {};
		
		//reveal the (emptied) table area
		tableArea.innerHTML = "";
		tableAreaFull.classList.remove('d-none');
		
		//loop through each lesson in the unit
		for (i; i < lessons.length; i++) {
			//use handlebars to create empty table and insert into DOM
			context = {
				lessonName: lessons[i],
				id: `lessonTable-${i}`
			};
			tableArea.insertAdjacentHTML('beforeend', lessonTableTemplate(context));
			//prepare data for the table, row by row
			results = nautilus.getLessonResults(studentID, productID, unitName, lessons[i]);
			tableRows = tabularise(results);
			//configure and draw the lesson table
			tables[context.id] = configureDataTable(context.id);
			tables[context.id].clear().rows.add(tableRows).draw();
		}
		
		//handle units without lessons
		if (!lessons.length) {
			context = {
				noLessons: true,
				id: `unitTable-${unitName}`
			};
			tableArea.insertAdjacentHTML('beforeend', lessonTableTemplate(context));
			tableRows = tabularise(nautilus.getUnitResults(studentID, productID, unitName));
			tables[context.id] = configureDataTable(context.id);
			tables[context.id].clear().rows.add(tableRows).draw();
		}
		
		//apply filters if currently selected
		filterTables(filterVal);
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
			columnDefs: [
				{targets: 0, orderable: false}, 
				{targets: 4, visible: false}
			]
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
	
	//takes array of LO results and prepares it into rows for rendering as table
	function tabularise (results) {
		let tableRows = [],
				i = 0;
		for (i; i < results.length; i++) {
			//get an icon depending on status
			let icon = "<i class='far fa-circle'></i>";
			if (results[i].status === 'aboveTarget') {
				icon = "<i class='fas fa-star'></i>"
			} else if (results[i].status === 'belowTarget') {
				icon = "<span class='belowTarget'><i class='far fa-star'></i><i class='fas fa-star-half'></i></span>";
			}
			results[i].status = results[i].status === 'inProgress' ? 'notStarted' : results[i].status;
			tableRows.push([
				`${icon} ${results[i].LO_name}`,
				results[i].first_score,
				results[i].best_score,
				results[i].attempts,
				results[i].status
			]);
		}
		return tableRows;
	}

})();