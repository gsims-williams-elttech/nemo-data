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
				//call the callback, with the unparsed data as argument
				//for course structure CSV, the callback just assigns the data to a private variable
				//for studentIDs, this pushes the IDs to the __studentIDs array, then starts a for loop which calls __fetchCSV on each studentID
				//and passes in another callback which pushes the outcome to __results, decrements the counter, and checks whether it should proceed with the final, user-set callback (if it exists)
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