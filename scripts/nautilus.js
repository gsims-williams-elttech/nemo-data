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

	let __studentIDs = []; //array of student IDs (get from JSON file)
	let __results = {}; //student results against each LO in course
	const __courseStructure = {}; //structure of Evolve with unit, level, LO names etc.

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

	/*----------------*/
	// PUBLIC METHODS //
	/*----------------*/

	//loads & assigns student/course data to private variables. Accepts optional callback to run after after load is complete.
	nautilus.init = function (callback) {
		let counter = 0;
		
		let finalCallback = function (res, i) {
			let parsedData = __parseCSV(res);
			__results[__studentIDs[i]] = __calculateStatus(parsedData);
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
					finalCallback(res, i);
				});
			}
		});
	};

	//returns an array of all student IDs
	nautilus.getStudentIds = function () {
		return __studentIDs;
	};
	
	//returns the student's result against all LOs in product
	nautilus.getAllResults = function (studentId) {
		__mapLODetails(__results[studentId]);
		return __results[studentId];
	};
	
	//returns the student's results against all LOs in specified unit
	nautilus.getUnitResults = function (studentId, unitName) {
		__mapLODetails(__results[studentId]);
		return __results[studentId].filter( el => el.unit_name === unitName);
	}

	/*----------------------------------------*/
	// DECLARE MODULE ON GLOBAL/WINDOW OBJECT //
	/*----------------------------------------*/

	root.nautilus = nautilus;

}(this));