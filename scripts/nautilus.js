/*----------------------------------------------------------------------
Nautilus plunges into the depths to return student data for Nemo!
Gets and parses data from CSV files in the 'data' directory.
Handles logic for you, e.g. aggregating scores and progress.
-----------------------------------------------------------------------*/

/*jshint esversion:6, devel: true, browser: true*/

(function (root) {

	const nautilus = {};

	/*-----------------------------*/
	// PRIVATE VARIABLES & HELPERS //
	/*-----------------------------*/

	const __productStructure = {}; //structure of each product with unit, level, LO names etc. LO ids as keys
	let __productStructureArray = {}; //the course structures as arrays, for ease of access to unit names
	let __studentIDs = []; //array of student IDs (get from JSON 'student manifest' file)
	let __productIDs = [];
	let __studentDetails = {}; //metadata about each student, e.g. lastname
	let __productDetails = {}; //metadata about each product, e.g. icon
	let __results = {}; //student results against each LO in each product
  
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

	// calculate each LO's status (above/below target) based on score, and convert blank scores to '-'
	function __calculateStatus(res) {
		let threshold = localStorage.getItem("threshold") ? localStorage.getItem("threshold") : 70,
        i = 0,
				len = res.length;
		for (i; i < len; i++) {
			if (res[i].status === 'completed') {
				if (res[i].nonscorable) {
					res[i].status = 'aboveTarget';
					res[i].attempts = 'viewed';
					res[i].best_score = 'n/a';
					res[i].first_score = 'n/a';
				} else {
					res[i].status = res[i].best_score >= threshold ? 'aboveTarget' : 'belowTarget';
				}
			} else {
				res[i].attempts = 0;
				res[i].best_score = '-';
				res[i].first_score = '-';
			}
		}
		return res;
	}

	//map course structure details onto student's LO scores
	function __mapLODetails(results, productID) {
		if (results[0].LO_name === undefined) {
			results.map( (x) => {
				x.LO_name = __productStructure[productID][x.LO_id].LO_name;
				x.lesson_name = __productStructure[productID][x.LO_id].lesson_name || null;
				x.unit_name = __productStructure[productID][x.LO_id].unit_name;
				x.nonscorable = __productStructure[productID][x.LO_id].nonscorable === 'TRUE' ? true : false;
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
	
	//takes an array of objects representing LOs, and calculates their average score (best/first depending on parameter)
	function __averageScore (results, scoreType) {
		scoreType = scoreType === undefined ? 'best_score' : scoreType;
		let completedNum = 0;
		let average = results.reduce( function (acc, val) {
			if (typeof val[scoreType] === 'number') {
				acc += val[scoreType];
				completedNum += 1;
			}
			return acc;
		}, 0);
		average = completedNum ? Math.round(average / completedNum) : false;
		return average;
	}
  
  //convert time spent in the product/unit into hours, minutes and seconds.
  function __timeSpent (value) {
    let hours = Math.floor(value.active_time / 3600);
    let minutes = Math.floor((value.active_time - (hours * 3600)) / 60);
    let timeLearning = hours +':'+ minutes;
    return timeLearning;
  }

	/*----------------*/
	// PUBLIC METHODS //
	/*----------------*/

	//loads & assigns student/course data to private variables. Accepts optional callback to run after after load is complete.
	nautilus.init = function (callback) {
		let resultsCounter = 0;
		
		//loads and stores the structure of an individual product, then calls parseStudentResults for it (step 3)
		const parseProductStructure = function (res, productID) {
			let data = __parseCSV(res),
					len = data.length,
					i = 0;
			__productStructureArray[productID] = data;
			__productStructure[productID] = {};
			__results[productID] = {};
			for (i; i < len; i++) {
				__productStructure[productID][data[i].LO_id] = data[i];
			}
			//As each product gets loaded, load the corresponding student results
			for (i = 0; i < __studentIDs.length; i++) {
				let studentID = __studentIDs[i];
				try {
					__fetchCSV(`../data/results/${productID}/${studentID}.csv`, (res) => {
						parseStudentResults(res, productID, studentID);
						//once all product structures and student results have loaded, run the user-defined callback if one is supplied
						if (!resultsCounter && callback) {
							callback();
						}
					});
				} catch (e) {
					//decrement regardless of whether student has results against product or not
					resultsCounter -= 1;
					if (!resultsCounter && callback) {
						callback();
					}
				}
			}
		};
		
		//TODO: store results against specific product
		//loads, maps and stores an individual student's results (step 3.5)
		const parseStudentResults = function (res, productID, studentID) {
			let parsedData = __parseCSV(res);
			__mapLODetails(parsedData, productID);
			__results[productID][studentID] = __calculateStatus(parsedData);
			resultsCounter -= 1;
		};
		
		//fetch student IDs from the student manifest (step 1)
		__fetchCSV('../data/studentManifest.json', (res) => {
			let parsedData = JSON.parse(res);
			__studentIDs = parsedData.studentManifest.map( obj => {
				obj.lastInteraction = new Date(parseInt(obj.lastInteraction)); //timestamp -> Date object
				__studentDetails[obj.id] = obj;
				return obj.id;
			});
			//then, fetch product IDs from product manifest (step 2)
			__fetchCSV('../data/productManifest.json', (res) => {
				let parsedData = JSON.parse(res),
						i = 0;
				//store product IDs and product metadata
				__productIDs = parsedData.productManifest.map( obj => {
					__productDetails[obj.id] = obj;
					return obj.id;
				});
				//this keeps track of how many student results are left to load (across all products)
				resultsCounter = __studentIDs.length * __productIDs.length;
				//For each product, load the course structure CSV
				for (i; i < __productIDs.length; i++) {
					let productID = __productIDs[i];
					__fetchCSV(`../data/structures/${productID}.csv`, (res) => {
						parseProductStructure(res, productID);
					});
				}
			});
		});
    
	};

	//returns an array of all student IDs
	nautilus.getStudentIDs = function () {
		return __studentIDs;
	};
	
	//returns an array of all product IDs
	nautilus.getProductIDs = function () {
		return __productIDs;
	};
	
	//returns any metadata associated with a student ID
	nautilus.getStudentDetails = function (studentID) {
		return __studentDetails[studentID];
	};

	//returns an array of all unit names in the product
	nautilus.getUnitNames = function (productId) {
		const names = [];
		__productStructureArray[productId].forEach( el => {
			if (!names.includes(el.unit_name)) {
				names.push(el.unit_name);
			}
		});
		return names;
	};

	//returns an array of all lesson names in the unit
	nautilus.getLessonNames = function (unitName) {
		const names = [],
					los = __productStructureArray.filter( el => el.unit_name === unitName);
		los.forEach( el => {
			//only get unique and non-null lesson names
			if (!names.includes(el.lesson_name) && el.lesson_name) {
				names.push(el.lesson_name);
			}
		});
		return names;
	};

	//returns the student's result against all LOs in product
	nautilus.getAllResults = function (studentId, productId) {
		return __results[productId][studentId];
	};

	//returns the student's results against all LOs in specified unit
	nautilus.getUnitResults = function (studentId, productId, unitName) {
		return __results[productId][studentId].filter( el => el.unit_name === unitName);
	};

	//returns the student's results against all LOs in specified unit + lesson
	nautilus.getLessonResults = function (studentId, productId, unitName, lessonName) {
		return __results[productId][studentId].filter( el => el.unit_name === unitName && el.lesson_name === lessonName);
	};
	
	//returns a summary of the student's results across the whole product
	nautilus.getAllSummary = function (studentId, productId) {
		return __summariseStatus(__results[productId][studentId]);
	};

	//returns a summary of the student's results in a specified unit
	nautilus.getUnitSummary = function (studentId, unitName) {
		const unitResults = this.getUnitResults(studentId, unitName);
		return __summariseStatus(unitResults);
	};
	
	//returns the average of all best/first scores in a product, or false if no completed LOs
	nautilus.getAllAverage = function (studentId, scoreType) {
		const results = nautilus.getAllResults(studentId);
		return __averageScore(results, scoreType);
	};
	
	//returns the average of all best/first scores in a unit, or false if no completed LOs
	nautilus.getUnitAverage = function (studentId, unitName, scoreType) {
		const results = nautilus.getUnitResults(studentId, unitName);
		return __averageScore(results, scoreType);
	};
  
  //returns the average of all best/first scores in a lesson, or false if no completed LOs
  nautilus.getLessonAverage = function (studentId, unitName, lessonName, scoreType) {
    const results = nautilus.getLessonResults(studentId, unitName, lessonName);
		return __averageScore(results, scoreType);
  };
  
  //Calculate total time spent in the product
  nautilus.getTotalTime = function (studentId) {
    let totalTime = __results[productId][studentId].reduce((a, b) => ({active_time: a.active_time + b.active_time}));
    return __timeSpent(totalTime);
	};

	/*----------------------------------------*/
	// DECLARE MODULE ON GLOBAL/WINDOW OBJECT //
	/*----------------------------------------*/

	root.nautilus = nautilus;

}(this));