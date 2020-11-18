/*
* LaunchVis - Object constructor function
* @param _parentElement 	-- the HTML element in which to draw the visualization
* @param _data						-- the actual data
*/

class LaunchVis {


    constructor(_parentElement, _data, _geoData) {
        this.parentElement = _parentElement;
        this.data = _data;
        this.geoData = _geoData;
        this.filteredData = [];

        // convert to js Date object
        this.data.forEach(d => d.date = new Date(d.Datum));

        // condense country_list
        this.data.forEach(function (d) {
            if (d.Country === "Florida" | d.Country === "California" | d.Country === "Canaria") {
                d.Country = "USA";
                d.lat = 39.75;
                d.lon = -98.3;
            }
            if (d.Country === "Kazakhstan") {
                d.Country = "Russia";
                d.lat = 60;
                d.lon = 100;
            }

        });

        // pull out the country names and exclude bad data
        function onlyUnique(value, index, self) {
            return self.indexOf(value) === index;
        }
        // make list of countries
        let countries = [];
        this.data.forEach(d => countries.push(d.Country));
        let unique_countries = countries.filter(onlyUnique);
        this.countries_list = unique_countries.filter(function (d) {
            return (d !== "Sea") && (d !== "Site") && (d  !== "Facility") && (d !== "Ocean")
        });


        console.log("Unique Countries/States: " + this.countries_list)

        this.initVis();
    }


    /*
     * Initialize visualization (static content, e.g. SVG area or axes)
     */

    initVis() {
        let vis = this;

        vis.margin = {top: 20, right: 20, bottom: 20, left: 20};
        vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right;
        vis.height = $("#" + vis.parentElement).height() - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        // add title
        vis.svg.append('g')
            .attr('class', 'title map-title')
            .append('text')
            .text("Launches per Country")
            .attr('transform', `translate(${vis.width / 2}, 20)`)
            .attr('text-anchor', 'middle');

        // define scale factor
        vis.map_scale = 0.3;

        // define projection
        vis.projection = d3.geoNaturalEarth1()
            .translate([vis.width / 2, vis.height / 2])
            .scale(d3.min([vis.height * vis.map_scale, vis.width * vis.map_scale]));

        // define geo generator
        vis.path = d3.geoPath()
            .projection(vis.projection);

        // convert topojson data to geojson
        vis.world = topojson.feature(vis.geoData, vis.geoData.objects.countries).features;

        // create map vis group and circle group
        vis.map_group = vis.svg.append("g");
        vis.circle_group = vis.svg.append("g");

        vis.map_group.append("path")
            .attr("id", "outline")
            .attr("fill","none")
            .attr("stroke","white")
            .attr("d", vis.path({type: "Sphere"}));

        // add graticule
        vis.map_group.append("path")
            .attr("d", vis.path(d3.geoGraticule10()))
            .attr("stroke", "#ddd")
            .attr("fill", "none");

        // draw countries
        vis.countries = vis.map_group.selectAll(".country")
            .data(vis.world)
            .enter().append("path")
            .attr('class', 'country')
            .attr('fill','white')
            .attr("d", vis.path);

        // append and call tooltip
        vis.tooltip = d3.tip()
            .attr("class", "d3-tip")
            .offset([0, 0])
            .html(function(d) {
                return "<p>" + d.name + "</p><p>Launches: " + d.launches + "</p>";
            });
        vis.circle_group.call(vis.tooltip);

        // add listener to push button
        d3.select("#map_animation").on("click", function() {
            animateMap();
        });

        // // (Filter, aggregate, modify data)
        // vis.wrangleData();
    }



    /*
     * Data wrangling
     */

    wrangleData() {
        let vis = this;

        // filter data on brushed range
        if (mapvis_selectedTime.length !== 0){
            vis.filteredData = vis.data.filter(function (d) {
                return (d.date.getFullYear() <= mapvis_selectedTime[1]) && (d.date.getFullYear() >= mapvis_selectedTime[0]);
            })
        } else {
            vis.filteredData = vis.data;
        }

        // create data
        vis.displayData = [];

        // count launches per country/state for filtered data
        vis.countries_list.forEach(function (c) {
            let country_data = vis.filteredData.filter(d => d.Country === c)

            let country_index = vis.data.findIndex(d => d.Country == c);

            vis.displayData.push( { name:     c,
                                    launches: country_data.length,
                                    lat:      vis.data[country_index].lat,
                                    lon:      vis.data[country_index].lon}
            );
        })

        // Update the visualization
        vis.updateVis();
    }



    /*
     * The drawing function
     */

    updateVis() {
        let vis = this;

        // Data-join
        vis.circle = vis.circle_group.selectAll("circle")
            .data(vis.displayData);

        // Enter (initialize the newly added elements)
        vis.circle.enter().append("circle")
            .attr("class", "circle")

            // Enter and Update (set the dynamic properties of the elements)
            .merge(vis.circle)
            .on("mouseover", function (e,d) {
                vis.tooltip.show(d,this);
            })
            .on("mouseout", function (){
                vis.tooltip.hide();
            })
            .on("click", function (e,d) {
                console.log(d);
            })
            .transition()
            .duration(100)
            .attr("transform", d => `translate(${vis.projection([d.lon, d.lat])})`)
            .attr("r", d => Math.sqrt(d.launches))
            .attr("fill", "black");


        // Exit
        vis.circle.exit().remove();

    }

}