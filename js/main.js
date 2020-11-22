let launchData, rocketData, satelliteData, treeData, geoData, globeData, airportData
let launchVis, brushVis, networkVis, flightVis, costVis, orbitVis, orbitVis3, orbitSystem

// init global time selction for map vis
let mapvis_selectedTime = []

// Function to convert date objects to strings or reverse
let dateFormatter = d3.timeFormat("%Y-%m-%d");
let dateParser = d3.timeParse("%m/%d/%y");


// (1) Load data with promises
let promises = [
    d3.csv("data/prepared_launch_data.csv"),
    d3.csv("data/prepared_rocket_data.csv"),
	d3.csv("data/prepared_satellite_data.csv"),
	d3.json("data/treeData.json"),
	d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json"),
	d3.json("https://gist.githubusercontent.com/mbostock/4090846/raw/d534aba169207548a8a3d670c9c2cc719ff05c47/world-110m.json"),
	d3.json("data/flare.json")
];

Promise.all(promises)
    .then( function(data){
    	// clean up satellite data
    	data[2].forEach(d=>{
    		// console.log(d)
    		d["Apogee"]=+d["Apogee (km)"];
			d["EL"]=+d["Expected Lifetime (yrs.)"];
			d["Period"]=+d["Period (minutes)"];
			d["LaunchMass"]=+d["Launch Mass (kg.)"];
			d["Country"] = d["Country of Operator/Owner"];
			d["Owner"]= d["Operator/Owner"];
			d["Date"] = dateParser(d["Date of Launch"])


			if (d.Country != "USA" & d.Country != "China" & d.Country != "United Kingdom"& d.Country != "Russia" &d.Country != "Japan" ){
				d.Country = "Other"
			}
			if (d.Purpose == "Communications" | d.Purpose == "Communications/Maritime Tracking" |d.Purpose == "Communications/Navigation" |d.Purpose == "Communications/Technology Development" ){
				d.Purpose = "Communications"
			} else if (d.Purpose == "Earth Observation" |d.Purpose == "Earth Observation/Communications" |d.Purpose == "Earth Observation/Communication/Space Science" |d.Purpose == "Earth Observation/Earth Science" |d.Purpose == "Earth Observation/Space Science" |d.Purpose == "Earth Observation/Technology Development" |d.Purpose == "Earth Science" |d.Purpose == "Earth Science/Earth Observation" |d.Purpose == "Earth/Space Observation") {
				d.Purpose = "Earth Science"
			} else if (d.Purpose == "Navigation/Global Positioning" |d.Purpose == "Navigation/Regional Postioning"){
				d.Purpose = "Navigation"
			} else if (d.Purpose == "Space Observation" |d.Purpose == "Space Science" |d.Purpose == "Space Science/Technology Demonstration" |d.Purpose == "Space Science/Technology Development"){
				d.Purpose = "Space Science"
			}
			else {
				d.Purpose = "Other"
			}

			// if (d.Users = "Civil/Government"){
			// 	d.Users = "Government/Civil"
			// } else if (d.Users = "Military/Government"){
			// 	d.Users = "Government/Military"
			// }
			// else if (d.Users = "Civil/Military"){
			// 	d.Users = "Military/Civil"
			// } else if (d.Users = "Commercial/Government"){
			// 	d.Users = "Government/Commercial"
			// } else if (d.Users = "Commercial/Military"){
			// 	d.Users = "Military/Commercial"
			// }  else if (d.Users = "Government/Commercial"){
			// 	d.Users = "Government/Commercial"
			// }
		})

		createVis(data)})
    .catch( function (err){console.log(err)} );


function createVis(data){

	// (2) Make our data look nicer and more useful
	launchData    = data[0];
	rocketData    = data[1];
	satelliteData = data[2];
	treeData      = data[3];
	geoData       = data[4];

	// console.log(satelliteData);



	// orbitVis = new OrbitvisREDO("canvas", satelliteData, geoData);
	orbitSystem = new OrbitSystem("orbit-vis","orbitLegend-vis", satelliteData, geoData);
	launchVis = new LaunchVis("world-map", launchData, geoData);
	brushVis   = new Brushvis("brush-plot", launchData);
	networkVis = new NetworkVis("network-vis", "networkLegend-vis",treeData);
	flightVis = new FlightVis("launches-vis", data);

	// makeViz()

	//loop through orbits after 10 seconds and continue for a few hours
	for (let ii = 1; ii <= 1000; ii++) {
		setTimeout(function () {
			orbitSystem.animate(10000, 17);
		}, (ii * 10000));
	}
}

function toggleButton(button) {
	if (document.getElementById("labelToggle").value == "OFF") {
		document.getElementById("labelToggle").value = "ON";
		// document.getElementById("labelToggle").class = "rgb(255,145,0)";
		networkVis.updateVis();

	} else if (document.getElementById("labelToggle").value == "ON") {
		document.getElementById("labelToggle").value = "OFF";
		// document.getElementById("labelToggle").style.background = "rgb(26,255,0)";
		networkVis.updateVis();
	}
}

var selectedCategory = $('#categorySelector').val();
var selectedSatCategory = $('#satColor').val();
// var selectedCategory = $('#categorySelector').val();

function categoryChange() {
	selectedCategory = $('#categorySelector').val();

	networkVis.wrangleData();
}
function satCategoryChange(){

	orbitSystem.selectedSatCategory = $('#satColor').val();
	// console.log(selectedSatCategory)
	orbitSystem.updateLegend();
	orbitSystem.updateColor();
}

function animateMap () {
	console.log("Button Pressed. Starting Animation");
	let animation_steps = 100;
	let step_delay      = 100; // [ms]

	// clear launches over time plot.
	brushVis.clip_path
		.attr("width", 0);

	//find min and max year
	let min_year = d3.min(brushVis.data, d => d.date).getFullYear();
	let max_year = d3.max(brushVis.data, d => d.date).getFullYear();

	//steps.forEach(function (d) {
	for (let ii = 1; ii <= animation_steps; ii++) {
		setTimeout(function() {
			let brush_width = brushVis.width / animation_steps * ii;
			brushVis.clip_path
				.transition()
				.ease(d3.easeLinear)
				.duration(step_delay)
				.attr("width", brush_width);
			mapvis_selectedTime = [min_year, (min_year + (max_year - min_year) / animation_steps * ii)];
			launchVis.wrangleData();
			console.log("wrangled " + ii + " with " + mapvis_selectedTime + " and width: " + brush_width);

		}, (ii * step_delay));
	}
}


