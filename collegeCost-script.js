//"use strict";
//$('input[type=checkbox]').removeAttr('checked');
let searchBtn = document.querySelector('button');
searchBtn.onclick = findSelections;
//d3.selectAll('.collegeBox').on('change', drawChart());
//d3.select('#startYr').on('change', drawChart());
let selectedColleges = [];
let selectedYears = [];
let filteredData;
// let lastSelectedColleges;
// let lastSelectedYears;

function findSelections(e) {
	e.preventDefault();
	//clear prior selections
	selectedColleges = [];
	selectedYears = [];

	//find checked colleges
	d3.selectAll('.collegeBox').each(function(d) {
	cb = d3.select(this);
	if(cb.property("checked")) {
		selectedColleges.push(cb.property("value"));
	}
	});

	//find years of attendance from selected start yr
	startYr = parseInt($('#startYr').val().split("-")[0]);
	for(let s=1; s < 5; s++) {
		let year = startYr.toString() + "-" + (startYr+1).toString();
		selectedYears.push(year);
		startYr++;
	}

// if (lastSelectedColleges == selectedColleges && lastSelectedYears == selectedYears) {
	//console.log("in if");
// 	return;
// }
// else {
	// console.log(lastSelectedColleges);
	// console.log(selectedColleges);
	// console.log(lastSelectedYears);
	// console.log(selectedYears);
	//update record of last college and yr
	// lastSelectedColleges = selectedColleges;
	// lastSelectedYears = selectedYears;
	drawChart();
//}
}

function projectCost(school, year) {
	if (school == "Amherst College") {
		return projectAmherstCost(year);
	}
	else if (school == "Hampshire College") {
		return projectHampCost(year);
	}

	else if (school == "Mount Holyoke College") {
		return projectMoHoCost(year);
	}

	else if (school == "Smith College") {
		return projectSmithCost(year);
	}

	else if (school == "University of Massachusetts-Amherst") {
		return projectUMassCost(year);
	}

	function projectAmherstCost(year) { 
		let projectedCost = (year-1988)/0.0004273;
		return projectedCost;
	}

	function projectHampCost(year) {
		let projectedCost = (year-1985)/0.0004805;
		return projectedCost;
	}

	function projectMoHoCost(year) {
		let projectedCost = (year-1961)/0.0009341;
		return projectedCost;
	}

	function projectSmithCost(year) {
		let projectedCost = (year-1983)/0.00052;
		return projectedCost;
	}

	function projectUMassCost(year) { 
		let projectedCost = (year - 1988)/0.001009;
		return projectedCost;
	}
}

function drawChart() {
	//remove prior graph
	d3.selectAll("svg > *").remove();

	//stacked bar chart adapted from https://bl.ocks.org/mbostock/3886208
	let svg = d3.select("svg"),
	margin = {top: 20, right: 20, bottom: 30, left: 40},
	width = +svg.attr("width") - margin.left - margin.right,
	height = +svg.attr("height") - margin.top - margin.bottom,
	g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	let x = d3.scaleBand()
	    .rangeRound([0, width-80])
	    .paddingInner(0.05)
	    .align(0.1);

	let y = d3.scaleLinear()
	    .rangeRound([height, 0]);

	let z = d3.scaleOrdinal()
	    .range(["#191970", "#0018A8", "#1F75FE", "#89CFF0"]);

	d3.csv("collegeData.csv", function(d, i, columns) {
	  for (i = 1, t = 0; i < columns.length; ++i) t += d[columns[i]] = +d[columns[i]];
	  d.total = t;
	  return d;
	}, function(error, data) {
	  if (error) throw error;

	//multiple checkbox filtering adapted from https://bl.ocks.org/johnnygizmo/531991a77047112b7ca89f78b840fba5
	//filter data to include only selected colleges
	if(selectedColleges.length > 0) {
		filteredData = data.filter(function(d, i) {
			return selectedColleges.includes(d.INSTNM);
		})
	} else {
		filteredData = data;
	}

	//filter data to include only selected years
	let yrFilteredData = [];
	for(let j = 0; j < filteredData.length; j++) {
		let schoolData = filteredData[j];
		let yrFilteredOneCollegeData = {"INSTNM": schoolData["INSTNM"]};
		let selCosts = [];
		for(let k = 0; k < selectedYears.length; k++) {
			let schoolYr = selectedYears[k];
			if(schoolYr in schoolData) {
				let yearCost = schoolData[schoolYr];
				yrFilteredOneCollegeData[schoolYr] = yearCost;
				selCosts.push(yearCost);
			}
			else {
				let year = parseInt(schoolYr.split("-")[0]);
				let yearProjectedCost = projectCost(filteredData[j]["INSTNM"], year);
				yrFilteredOneCollegeData[schoolYr] = yearProjectedCost;
				selCosts.push(yearProjectedCost);
			}
		}
		//add total
		let sum = selCosts.reduce(function(a, b) {return a + b;},0);
		yrFilteredOneCollegeData["total"] = sum;
		yrFilteredData.push(yrFilteredOneCollegeData);
	}
	filteredData = yrFilteredData;

	//keys=years
  let keys = selectedYears;

  filteredData.sort(function(a, b) { return b.total - a.total; });
  x.domain(filteredData.map(function(d) { return d.INSTNM;}));
  y.domain([0, d3.max(filteredData, function(d) { return d.total; })]).nice();
  z.domain(keys);

  g.append("g")
    .selectAll("g")
    .data(d3.stack().keys(keys)(filteredData))
    .enter().append("g")
      .attr("fill", function(d) { return z(d.key); })
    .selectAll("rect")
    .data(function(d) { return d; })
    .enter().append("rect")
      .on('mouseover', function(d) {
      	d3.select("#totalCostBox").html("Total Projected Cost of Attending " + "<br>" + d["data"].INSTNM + ": $" + Math.round(d["data"].total).toString());
      })
      .on('mouseout', function(d) {
      	d3.select("#totalCostBox").html("");
      })
      .attr("x", function(d) { return x(d.data.INSTNM); })
      .attr("y", function(d) { return y(d[1]); })
      .attr("height", function(d) { return y(d[0]) - y(d[1]); })
      .attr("width", x.bandwidth())
      .attr('opacity', 0)
      .transition()
      	.delay(function(d,i){return i *200;})
      	.duration(200)
      	.attr("opacity", 1);

  g.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

  g.append("g")
      .attr("class", "axis")
      .call(d3.axisLeft(y).ticks(null, "s"))
    .append("text")
      .attr("x", 2)
      .attr("y", y(y.ticks().pop()) + 0.5)
      .attr("dy", "0.32em")
      .attr("fill", "#000")
      .attr("text-anchor", "start")
      .text("Total Projected Cost of Attendance")
      .transition()
	    .delay(function(d,i){return i *200;})
	    .duration(200)
	    .attr("opacity", 1);

  let legend = g.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "end")
    .selectAll("g")
    .data(keys.slice().reverse())
    .enter().append("g")
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

  legend.append("rect")
      .attr("x", width - 19)
      .attr("width", 19)
      .attr("height", 19)
      .attr("fill", z)
      .transition()
    .delay(function(d,i){return i *200;})
    .duration(200)
    .attr("opacity", 1);

  legend.append("text")
      .attr("x", width - 24)
      .attr("y", 9.5)
      .attr("dy", "0.32em")
      .text(function(d) { return d; })
      .transition()
    .delay(function(d,i){return i *200;})
    .duration(200)
    .attr("opacity", 1);
});
}