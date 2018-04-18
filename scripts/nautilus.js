// Nautilus plunges into the depths to return student data for Nemo!
// Gets and parses data from CSV files in the 'data' directory
// Handles logic e.g. aggregating scores and progress

// TODO: set up tiny-test.js and blank test html page
// write basic function for getting and parsing entire student1 CSV and returning it as an object
// TODO: stop this madness, why not just have a function which pre-loads all the CSVs as variables? Then have some kind of nautilus.init in the main page with all the other code wrapped inside its callback (or just nautilus.init() and hope everything loads before it's required!)
// TODO: check out this method for XHR in for-loop: https://stackoverflow.com/questions/25220486/xmlhttprequest-in-for-loop
// TODO: cache the parsed CSV data to save time


/*jshint esversion:6, devel: true, browser: true*/

(function (root) {

	/*-----------------------------*/
	// PRIVATE VARIABLES & HELPERS //
	/*-----------------------------*/

	let __currentCSV = "";

	//get CSV via XMLHttpRequest and parse into JSON
	function __fetchCSV(path, callback) {
		let output = 0;

		const request = new XMLHttpRequest();
		request.onerror = function () {
			console.error(`Could not reach ${path}.`);
		};
		request.onload = function () {
			if (this.status == 200) {
				let parsedData = __parseCSV(request.responseText);
				callback(parsedData);
			} else {
				console.error(`No file at ${path}.`);
			}
		};
		request.open('GET', path, true);
		request.send();
	}

	// takes a csv and returns a JS object
	function __parseCSV(csv) {
		const lines = csv.split("\n"),
					result = [],
					headers = lines[0].split(",");
		let i, obj, currentline, j;

		for (i = 1; i < lines.length; i++) {
			obj = {};
			currentline=lines[i].split(",");
			for (j = 0; j < headers.length; j++) {
				obj[headers[j]] = currentline[j];
			}
			result.push(obj);
		}
		return result;
	}

	/*----------------*/
	// PUBLIC METHODS //
	/*----------------*/

	const nautilus = {};

	//gives you all of a student's data to use in your callback
	nautilus.allStudentData = function (studentID, callback) {
		__fetchCSV(`../data/students/${studentID}.csv`, callback);
	};

	/*----------------------------------------*/
	// DECLARE MODULE ON GLOBAL/WINDOW OBJECT //
	/*----------------------------------------*/

	root.nautilus = nautilus;

}(this));