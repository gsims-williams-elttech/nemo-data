/*----------------------------------------------------------------------
These are helper functions which can be used throughout the other 'page rendering' JS scripts, to save time.

Creates a module called 'helpers'. To use its methods in other scripts, call like this: helpers.configureDataTable(...)
-----------------------------------------------------------------------*/

/*jshint esversion:6, devel: true, browser: true*/

(function (root) {

	//create object for storing methods which will be made public
	const helpers = {};
	
	/*----------------------------------------*/
	// HANDLEBARS                             //
	/*----------------------------------------*/
	
	//generates & returns a handlebars template if given a handlebars script ID
	helpers.getTemplate = function (elementId) {
		return Handlebars.compile(document.getElementById(elementId).innerHTML);
	};
	
	/*----------------------------------------*/
	// ROUTING 				                        //
	/*----------------------------------------*/

	//sets up router so that you can use URL hashes as variables, e.g. studentId.
	//returns the current hash variable
	helpers.getVariableFromURL = function (defaultVariable) {
		let returnValue = defaultVariable;
		//set up the router
		const routes = {
			'/:id': function(id) {
				//swap return variable to match current hash
				returnValue = id;
			}
		};
  	const router = Router(routes);
		router.init([`/${defaultVariable}`]);
		return returnValue;
	};
	
	/*----------------------------------------*/
	// WORKING WITH TABLES                    //
	/*----------------------------------------*/
	
	//takes array of objects (e.g. LO results output by nautilus) and prepares it into rows which can be rendered as datatables table.
	helpers.tabularise = function (rowVals, cols = ['LO_name', 'first_score', 'best_score', 'attempts', 'status']) {
		let tableRows = [],
				i = 0;
		
		//todo - make this reusable, use the col values
		for (i; i < rowVals.length; i++) {
			//get an icon depending on status
			let icon = this.getStatusIcon(rowVals[i].status);
			rowVals[i].status = (rowVals[i].status === 'inProgress') ? 'notStarted' : rowVals[i].status;
			tableRows.push([
				this.formatAsLaunchable(rowVals[i].LO_name, icon),
				rowVals[i].first_score,
				rowVals[i].best_score,
				rowVals[i].attempts,
				rowVals[i].status
			]);
		}
		return tableRows;
	};
	
	//configures and returns data table, with default columnDefs or supplied columnDefs array
	helpers.configureDataTable = function (elementId, columnDefs) {
		if (columnDefs === undefined) {
			columnDefs = [
				{targets: 0, orderable: false, responsivePriority: 1}, 
				{targets: 1, responsivePriority: 4},
				{targets: 2, responsivePriority: 2},
				{targets: 3, responsivePriority: 3},
				{targets: 4, visible: false}
			];
		}
		return $(`#${elementId}`).DataTable({
			responsive: true,
			paging:   false,
			retrieve: true,
			info:     false,
			order: [],
			columnDefs: columnDefs
		});
	};
	
	//pass in an object containing one or more datatables; the value to filter by; and the column to filter on
	helpers.filterTables = function (tables, filterVal, sortCol) {
		Object.keys(tables).map(function(key, index) {
			tables[key].columns(sortCol).search(filterVal).draw();
		});
	};
	
	/*----------------------------------------*/
	// WORKING WITH CHARTS                    //
	/*----------------------------------------*/
	
	//takes desired chart id, series values as array, Chartist options (optional); returns a Chartist piechart
	helpers.makeChart = function (id, series, optionsObject) {
		if (optionsObject === undefined) {
			optionsObject = {
				fullWidth: true,
				width: '100%',
				height: '200px',
				donut: true,
				donutWidth: 40,
				startAngle: 270,
				total: 200,
				showLabel: false
			};
		}
		return new Chartist.Pie(id, {
			series: series,
			labels: ['', '']
		}, optionsObject);
	};
	
	//return a chartist options object, configured for donut with central percent
	helpers.generateDonutOptions = function (percent) {
		let options = {
			donut: true,
			donutWidth: 20,
			startAngle: 0,
			total: 360,
			showLabel: false,
			plugins: [
				Chartist.plugins.fillDonut({
					items: [{
						content: `<h5>${percent}<span class="small">%</span></h5>`,
						offsetY : 0,
						offsetX: 0,
						margin: 'auto',
					}]
				})
			]
		};
		return options;
	};
	
	/*----------------------------------------*/
	// RENDERING TABLES FOR ALL LOs IN UNIT   //
	/*----------------------------------------
	
	HOW TO USE
	
	tableArea = the #id of the DOM element into which table(s) should be placed.
	
	template = the #id of a handlebars template for each table.
	
	tablesObject = the object you're using to store your datatables objects.
	
	columnDefs = OPTIONAL. This is the datatables columnDefs object which will be used when generating your tables, if you want to format/order/display columns differently to the standard
	
	IMPORTANT: this function returns the supplied 'tables' object with any extra datatables now included. You should set your 'tables' object to the return value of the renderUnitTables function, or you won't be able to reference its tables later.
	
	*/
	
	//renders LO tables at the target location in the DOM
	helpers.renderUnitTables = function (studentID, productID, unitName, tableTarget, template, tablesObject, columnDefs) {
		const lessons = nautilus.getLessonNames(productID, unitName);
		let i = 0,
				tableRows,
				results,
				context = {};
		
		//mini-helper
		function buildTable() {
			tableTarget.insertAdjacentHTML('beforeend', template(context));
			results = nautilus.getUnitResults(studentID, productID, unitName);
			tableRows = helpers.tabularise(results);
			tablesObject[context.id] = helpers.configureDataTable(context.id, columnDefs);
			tablesObject[context.id].clear().rows.add(tableRows).draw();
		}
		
		//empty the target table area
		tableTarget.innerHTML = "";
		
		//loop through each lesson in the unit
		for (i; i < lessons.length; i++) {
			//use handlebars to create empty table and insert into DOM
			context = {
				lessonName: lessons[i],
				id: `lessonTable-${i}`
			};
			buildTable();
		}
		
		//handle units without lessons
		if (!lessons.length) {
			context = {
				noLessons: true,
				id: `unitTable-${unitName}`
			};
			buildTable();
		}
		
		return tablesObject;
	};
	
	
	/*----------------------------------------*/
	// GENERAL FORMATTING                     //
	/*----------------------------------------*/
	
	//returns HTML for fontawesome icon corresponding to status (aboveTarget, belowTarget). Returns notStarted icon by default
	helpers.getStatusIcon = function (status) {
		let icon = "<i class='far fa-circle'></i>";
		if (status === 'aboveTarget') {
			icon = "<i class='fas fa-star'></i>";
		} else if (status === 'belowTarget') {
			icon = "<span class='belowTarget'><i class='far fa-star'></i><i class='fas fa-star-half'></i></span>";
		}
		return icon;
	};
	
	//return an LO name (and optional icon) formatted together with launch link 
	helpers.formatAsLaunchable = function(LOName, icon = '') {
		return `${icon} <span class="tableLO">${LOName}</span> <i class="fas fa-external-link-alt" title="launch activity"></i>`;
	};
	
	//-----------------//
	
	// DECLARE MODULE ON GLOBAL/WINDOW OBJECT
	root.helpers = helpers;

}(this));