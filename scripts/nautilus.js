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
	let __courseStructure = ''; //structure of Evolve with unit, level, LO names etc.

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
			for (j = 0; j < headers.length; j++) {
				let asNum = parseInt(currentline[j]);
				obj[headers[j]] = isNaN(asNum) ? currentline[j] : asNum;
			}
			result.push(obj);
		}
		return result;
	}

	/*----------------*/
	// PUBLIC METHODS //
	/*----------------*/

	//loads & assigns student/course data to private variables. Accepts optional callback to run after after load is complete.
	nautilus.init = function (callback) {
		let counter = 0;
		//load the course structure CSV
		__fetchCSV('../data/structure.csv', (res) => {
			let parsedData = __parseCSV(res);
			__courseStructure = parsedData;
		});
		//meanwhile, fetch student IDs from the JSON
		__fetchCSV('../data/studentIDs.json', (res) => {
			let parsedData = JSON.parse(res);
			__studentIDs = parsedData.studentIDs.ids;
			counter = __studentIDs.length;
			//for each student, load their results...
			for (let i = 0; i < __studentIDs.length; i++) {
				__fetchCSV(`../data/students/${__studentIDs[i]}.csv`, (res) => {
					let parsedData = __parseCSV(res);
					counter -= 1;
					__results[__studentIDs[i]] = parsedData;
					//once all student results have loaded, run the user-defined callback if one is supplied
					if (!counter && callback) {
						callback();
					}
				});
			}
		});
	};

	//test only
	nautilus.exposeAll = function () {
		console.log(__courseStructure);
		console.log(__studentIDs);
		console.log(__results);
	};

	/*----------------------------------------*/
	// DECLARE MODULE ON GLOBAL/WINDOW OBJECT //
	/*----------------------------------------*/

	root.nautilus = nautilus;

}(this));