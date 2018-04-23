/*----------------------------------------------------------------------
Nautilus plunges into the depths to return student data for Nemo!
Gets and parses data from CSV files in the 'data' directory.
Handles logic for you, e.g. aggregating scores and progress.
-----------------------------------------------------------------------*/

// TODO: set up tiny-test.js and blank test html page
// TODO: cache the parsed CSV data to save time


/*jshint esversion:6, devel: true, browser: true*/

(function (root) {

	const nautilus = {};

	/*-----------------------------*/
	// PRIVATE VARIABLES & HELPERS //
	/*-----------------------------*/

	const __courseStructure = {}; //structure of Evolve with unit, level, LO names etc. LO ids as keys
	let __studentIDs = []; //array of student IDs (get from JSON file)
	let __results = {}; //student results against each LO in course
	let __courseStructureArray = []; //the course structure as an array

	// fetch CSV file via XMLHttpRequest
	function __fetchCSV(path, callback) {
		const request = new XMLHttpRequest();
		request.onerror = function () {
			console.error(`Could not reach ${path}.`);
		};
		request.onload = function () {
			if (this.status == 200) {
				callback(request.responseText);
			} else {
				console.error(`No file at ${path}.`);
			}
		};
		request.open('GET', path, true);
		request.send();
	}

	// accepts a CSV and returns a JS object
	function __parseCSV(csv) {
		const lines = csv.split("\n"),
					result = [],
					headers = lines[0].split(",");
		let i, obj, currentline, j;

		for (i = 1; i < lines.length; i++) {
			obj = {};
			currentline=lines[i].split(",");
			//skip empty lines
			if (currentline[0] !== '') {
				for (j = 0; j < headers.length; j++) {
					let asNum = parseInt(currentline[j]);
					obj[headers[j].trim()] = isNaN(asNum) ? currentline[j].trim() : asNum;
				}
				result.push(obj);
			}
		}
		return result;
	}

	// calculate each LO's status (above/below target) based on score
	function __calculateStatus(res) {
		let i = 0,
				len = res.length;
		for (i; i < len; i++) {
			if (res[i].status === 'completed') {
				res[i].status = res[i].best_score >= 70 ? 'aboveTarget' : 'belowTarget';
			}
		}
		return res;
	}

	//map course structure details onto student's LO scores
	function __mapLODetails(results) {
		if (results[0].LO_name === undefined) {
			results.map( (x) => {
				x.LO_name = __courseStructure[x.LO_id].LO_name;
				x.lesson_name = __courseStructure[x.LO_id].lesson_name;
				x.unit_name = __courseStructure[x.LO_id].unit_name;
				return x;
			});
		}
	}

	//returns a summary of aggregated status info
	function __summariseStatus(results) {
		const summary = {
			notStarted: 0,
			belowTarget: 0,
			aboveTarget: 0
		};
		results.forEach( el => {
			if (el.status === 'inProgress') {
				summary.notStarted += 1;
			} else {
				summary[el.status] += 1;
			}
		});
		let completed = summary.aboveTarget + summary.belowTarget;
		summary.percentCompleted = __asPercentage(completed, completed + summary.notStarted);
		summary.degreeValues = __asDegreeValues([summary.aboveTarget, summary.belowTarget, summary.notStarted]);
		return summary;
	}
	
	//returns a rounded percentage based on the inputted numbers
	function __asPercentage (subset, total) {
		return Math.round((subset / total) * 100);
	}
	
	//takes array and returns corresponding array with values as fractions of 360
	function __asDegreeValues (arr) {
		const total = arr.reduce( (acc, val) => acc + val),
					out = [];
		for (let i = 0; i < arr.length; i++) {
			let deg = (arr[i] / total) * 360;
			out.push(deg);
		}
		return out;
	}

	/*----------------*/
	// PUBLIC METHODS //
	/*----------------*/

	//loads & assigns student/course data to private variables. Accepts optional callback to run after after load is complete.
	nautilus.init = function (callback) {
		let counter = 0;

		let parseStudentResults = function (res, i) {
			let parsedData = __parseCSV(res);
			__results[__studentIDs[i]] = __calculateStatus(parsedData);
			__mapLODetails(__results[__studentIDs[i]]);
			counter -= 1;
			//once all student results have loaded, run the user-defined callback if one is supplied
			if (!counter && callback) {
				callback();
			}
		};

		//load the course structure CSV
		__fetchCSV('../data/structure.csv', (res) => {
			let data = __parseCSV(res),
					i = 0,
					len = data.length;
			__courseStructureArray = data;
			for (i; i < len; i++) {
				__courseStructure[data[i].LO_id] = data[i];
			}
		});

		//meanwhile, fetch student IDs from the JSON
		__fetchCSV('../data/studentIDs.json', (res) => {
			let parsedData = JSON.parse(res);
			__studentIDs = parsedData.studentIDs.ids;
			counter = __studentIDs.length;
			//for each student, load their results...
			for (let i = 0; i < __studentIDs.length; i++) {
				__fetchCSV(`../data/students/${__studentIDs[i]}.csv`, (res) => {
					parseStudentResults(res, i);
				});
			}
		});
	};

	//returns an array of all student IDs
	nautilus.getStudentIds = function () {
		return __studentIDs;
	};

	//returns an array of all unit names in the product
	nautilus.getUnitNames = function () {
		const names = [];
		__courseStructureArray.forEach( el => {
			if (!names.includes(el.unit_name)) {
				names.push(el.unit_name);
			}
		});
		return names;
	};

	//returns an array of all lesson names in the unit
	nautilus.getLessonNames = function (unitName) {
		const names = [],
					los = __courseStructureArray.filter( el => el.unit_name === unitName);
		los.forEach( el => {
			if (!names.includes(el.lesson_name)) {
				names.push(el.lesson_name);
			}
		});
		return names;
	};

	//returns the student's result against all LOs in product
	nautilus.getAllResults = function (studentId) {
		return __results[studentId];
	};

	//returns the student's results against all LOs in specified unit
	nautilus.getUnitResults = function (studentId, unitName) {
		return __results[studentId].filter( el => el.unit_name === unitName);
	};

	//returns the student's results against all LOs in specified unit + lesson
	nautilus.getLessonResults = function (studentId, unitName, lessonName) {
		return __results[studentId].filter( el => el.unit_name === unitName && el.lesson_name === lessonName);
	};
	
	//returns a summary of the student's results across the whole product
	nautilus.getAllSummary = function (studentId) {
		return __summariseStatus(__results[studentId]);
	};

	//returns a summary of the student's results in a specified unit
	nautilus.getUnitSummary = function (studentId, unitName) {
		const unitResults = this.getUnitResults(studentId, unitName);
		return __summariseStatus(unitResults);
	};

	/*----------------------------------------*/
	// DECLARE MODULE ON GLOBAL/WINDOW OBJECT //
	/*----------------------------------------*/

	root.nautilus = nautilus;

}(this));