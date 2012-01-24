/*
  TODO LIST

# Vis
  * Color legend
  * Filter by year (bar chart)
  * Filter by story (list)
  * Filter by genre (list)
  * Filter by profitability (slider)
  * Filter by budget (slider)
  * Filter by worldwide gross (slider)
  * Filter by budget (slider)
  * Filter by average rating (slider)
  * Show only anomalies (more than 1 std dev for each axis)
  * Click to select and show details for multiple films

# Bugs
  * Fix 'average' row to bring out of regular json data file
  * REMOVE GLOBAL VARS

*/


// axes: by default, x = budget, y = gross
var xField = 'Budget',
    yField = 'Worldwide Gross';
var xScale, yScale,
    xAxis, yAxis,
    xAxisPanel, yAxisPanel,
    xLegend, yLegend;

// color: scales for numeric fields
var redBlue = ["rgb(103, 0, 31)", "rgb( 178, 24, 43)", "rgb( 214, 96, 77)", "rgb( 244, 165, 130)", "rgb( 253, 219, 199)", "rgb( 209, 229, 240)", "rgb( 146, 197, 222)", "rgb( 67, 147, 195)", "rgb( 33, 102, 172)", "rgb( 5, 48, 97)"];
var brownBlueGreen = ["rgb(84, 48, 5)", "rgb( 140, 81, 10)", "rgb( 191, 129, 45)", "rgb( 223, 129, 125)", "rgb( 246, 232, 195)", "rgb( 199, 234, 229)", "rgb( 128, 205, 193)", "rgb( 53, 151, 143)", "rgb( 1, 102, 94)", "rgb( 0, 60, 48)"];
var purpleGreen = ["rgb(64, 0, 75)", "rgb( 118, 42, 131)", "rgb( 153, 112, 171)", "rgb( 194, 165, 207)", "rgb( 231, 212, 232)", "rgb( 217, 240, 211)", "rgb( 166, 219, 160)", "rgb( 90, 174, 97)", "rgb( 27, 120, 55)", "rgb( 0, 68, 27)"];
var redYellowBlue = ["rgb(165, 0, 38)", "rgb( 215, 48, 39)", "rgb( 244, 109, 67)", "rgb( 253, 174, 97)", "rgb( 254, 224, 144)", "rgb( 224, 243, 248)", "rgb( 171, 217, 233)", "rgb( 116, 173, 209)", "rgb( 69, 117, 180)", "rgb( 49, 54, 149)"];
var purpleOrange = ["rgb(127, 59, 8)", "rgb( 179, 88, 6)", "rgb( 224, 130, 20)", "rgb( 253, 184, 99)", "rgb( 254, 224, 182)", "rgb( 216, 218, 235)", "rgb( 178, 171, 210)", "rgb( 128, 115, 172)", "rgb( 84, 39, 136)", "rgb( 45, 0, 75)"];
var palettes = [redBlue, brownBlueGreen, purpleGreen, redYellowBlue, purpleOrange],
    currentPaletteIndex = 0,
    currentPalette = palettes[currentPaletteIndex];

var colorField = 'Story';
var categoricalFields = ['Story', 'Genre', 'Lead Studio'];
var categoricalColorScale = d3.scale.category20c();
// need to set domain of numeric scale: domain([minVal, mean, maxVal])
var numericColorScale = d3.scale.quantile().range(currentPalette);
var colorScale = $.inArray(colorField, categoricalFields) >= 0 ? categoricalColorScale : numericColorScale;


// TODO - these probably shouldnt be globals
var data;
var svg;

// format functions
var numberFormat = d3.format(',.2f');
var intFormat = d3.format(',');
var percentFormat = d3.format(',p');

// getter/setters

var domain = function(axis, field) {
  if ( arguments.length > 1 ) {
    var dmn = [ d3.min(data, function(d) { return $.isNumeric(d[field]) ? +d[field] : 0; }), d3.max(data, function(d) { return $.isNumeric(d[field]) ? +d[field] : 0; }) ]
    axis === 'x' ? this.xDomain = dmn : this.yDomain = dmn;
  }
  return axis === 'x' ? this.xDomain : this.yDomain;
}


// return the value for a given scale, checking if it is a number
// d = the data item to locate, axis = 'x' or 'y'
var locate = function(d, axis) {
  var datum, scale;
  if ( axis === 'x' ) {
    datum = d[xField];
    scale = xScale;
  }
  else {
    datum = d[yField];
    scale = yScale;
  }
  return $.isNumeric(datum) ? scale(datum) : domain(axis)[0];
}

// return the color based on the current scale
// d = the data item to colorize
var colorize = function(d) {
  return colorField !== 'None' ? colorScale(d[colorField]) : null;
}

// load the data asynchronously
d3.json('/data/moviedata.json', function(json) {
  data = json;

  var w = $('#vis').width(),
      h = $('#vis').height();

  var axisPadding = 65; // for padding on the axis side
  var padding = 10;     // for padding opposite side of axis
  var xRange = [0, w - axisPadding],
      yRange = [h - axisPadding, 0];

  domain('x', xField);
  domain('y', yField);

  xScale = d3.scale.linear()
    .domain(domain('x'))
    .range(xRange);
  yScale = d3.scale.linear()
    .domain(domain('y'))
    .range(yRange);

  xAxis = d3.svg.axis()
    .scale(xScale)
    .orient('bottom')
    .ticks(5)
    .tickSize(-(h-axisPadding), 0, 0)
    .tickFormat(intFormat);
  yAxis = d3.svg.axis()
    .orient('left')
    .scale(yScale)
    .ticks(5)
    .tickSize(-(w-axisPadding), 0, 0)
    .tickFormat(intFormat);

  svg = d3.select('#vis')
    .append('svg')
      .attr('width', w)
      .attr('height',h)
    .append('g')
      .attr('transform', 'translate(' + (axisPadding - padding) + ',' + padding + ')');

  xAxisPanel = svg.append('g')
      .attr('class', 'x axis')
      .attr('id', 'xTicks')
      .attr('transform', 'translate(0,' + (h-axisPadding) + ')')
      .call(xAxis);
  xLegend = svg.append('text')
      .attr('id', 'xLabel')
      .attr('x', w/2)
      .attr('y', h-(axisPadding/3))
      .attr('text-anchor', 'middle')
      .attr('class', 'axisTitle')
      .text(xField);
//      .on('click', changeAxis('x') );

  yAxisPanel = svg.append('g')
      .attr('class', 'y axis')
      .attr('id', 'yTicks')
      .attr('transform', 'translate(0,0)')
      .call(yAxis);
  yLegend = svg.append('text')
      .attr('id', 'yLabel')
      .attr('x', h/2)
      .attr('y', (axisPadding/3))
      .attr('text-anchor', 'end')
      .attr('class', 'axisTitle')
      .attr('transform', 'translate(-' + axisPadding + ',' + (h * 0.85) + ')rotate(-90)')
      .text(yField);
//      .on('click', changeAxis('y') );

  // TODO - make this selectable
  svg.selectAll('circle')
    .data(data)
      .enter()
    .append('circle')
      .attr('class', 'point')
      .attr('cx', function(d) { return locate(d, 'x'); } )
      .attr('cy', function(d) { return locate(d, 'y'); } )
      .attr('r', 6)
      .style('fill', function(d) { return colorize(d); } )
      .on('mouseover', mouseover)
      .on('mouseout', mouseout);

});


// set details with current item and emphasize visual item
function mouseover(d, i) {
  $('#details').css('display', 'inline');
  $('#detail-film-value').html(d.Film);
  $('#detail-year-value').html(d.Year);
  $('#detail-profitability-value').html(percentFormat(d['Profitability']));
  $('#detail-budget-value').html('$' + numberFormat(d['Budget']) + 'M');
  $('#detail-worldwide-value').html('$' + numberFormat(d['Worldwide Gross']) + 'M');
  $('#detail-domestic-value').html('$' + numberFormat(d['Domestic Gross']) + 'M');
  $('#detail-foreign-value').html('$' + numberFormat(d['Foreign Gross']) + 'M');
  $('#detail-audience-value').html(d['Audience Rating']);
  $('#detail-rotten-value').html(d['Critic Rating']);
  $('#detail-theatres-value').html(intFormat(d['Opening Weekend Theaters']));
  $('#detail-openingweekend-value').html('$' + numberFormat(d['Opening Weekend Revenue']) + 'M');
  $('#detail-avgcinema-value').html('$' + numberFormat(d['Opening Weekend per Cinema']));
  $('#detail-genre-value').html(d['Genre']);
  $('#detail-story-value').html(d['Story']);
  $('#detail-oscar-value').html(d['Oscar']);
  $('#detail-studio-value').html(d['Lead Studio']);

  d3.select(this)
      .style('stroke-width', 2.5)
      .style('stroke', 'orange')
      .style('stroke-opacity', 1.0)
      .style('fill-opacity', 1.0);
}

// reset detail view and visual properties
function mouseout(d, i) {
  $('#details').css('display', 'none');
  d3.select(this)
      .style('stroke-width', null)
      .style('stroke', null)
      .style('stroke-opacity', null)
      .style('fill-opacity', null);
}

// execute when dom is ready
$( function() {
  // set controls to be defaults
  $('#xaxis').val(xField);
  $('#yaxis').val(yField);
  $('#color').val(colorField);

  // listen for changes to axis and color controls
  $('#xaxis').change(function() {
    xField = $('#xaxis').val();
    domain('x', xField);
    xScale.domain(domain('x'));
    xAxis.scale(xScale);
    svg.select('#xTicks').call(xAxis);
    svg.select('#xLabel').text(xField);
    redraw();
  });
  $('#yaxis').change(function() {
    yField = $('#yaxis').val();
    domain('y', yField);
    yScale.domain(domain('y'));
    yAxis.scale(yScale);
    svg.select('#yTicks').call(yAxis);
    svg.select('#yLabel').text(yField);
    redraw();
  });
  $('#color').change(function() {
    colorField = $('#color').val();
    colorScale = $.inArray(colorField, categoricalFields) >= 0 ? categoricalColorScale : numericColorScale.domain([d3.min(data, function(d) {return d[colorField];}), d3.sum(data, function(d) {return d[colorField];}) / data.length, d3.max(data, function(d) {return d[colorField];})]);
    // TODO - update color legend
    redraw();
  });

});

// update display for when controls change
function redraw() {
  svg.selectAll('circle')
      .data(data)
    .transition()
      .duration(1000)
      .attr('cx', function(d) { return locate(d, 'x'); } )
      .attr('cy', function(d) { return locate(d, 'y'); } )
      .style('fill', function(d) { return colorize(d); } );
}