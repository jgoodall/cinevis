/*
  TODO LIST

# Vis
  * Zoom in/out of axis based on filters
  * Color legend
  * Filter by year (bar chart)
  * Filter by story (list)
  * Filter by genre (list)
  * Show std deviations on axes/background
  * Show only anomalies (more than 1 std dev for each axis)
  * Click to select and show details for multiple films

# Bugs
  * REMOVE GLOBAL VARS
  * Paranormal Activity (2009) is not being included in result data set
  * fix profitability in data when no budget data is available (change to 0?)

*/


// axes: by default, x = budget, y = gross
var xField = 'Budget',
    yField = 'Worldwide Gross';
var xScale, yScale,
    xAxis, yAxis,
    xAxisPanel, yAxisPanel,
    xLegend, yLegend;

// build the array of filters to be populated when filters are set
var allFilters = [];
$.each(['Profitability', 'Budget', 'Worldwide Gross', 'Audience Rating', 'Critic Rating'], function(index, value) {
  allFilters.push( {field: value, min:-1, max:-1} );
});

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
var data;     // the main film data structure
var averages; // {year: {field: avg,..}, ..}
var svg;

// format functions
var numberFormat = d3.format(',.2f');
var intFormat = d3.format(',');
var percentFormat = d3.format(',%');

// getter/setter for domain (min/max) of a given data field
//   axis = 'x' or 'y', field is the data field to find the domain for
//   optional arguments: min, max - if set use those rather than figure out
var domain = function(axis, field, min, max) {
  var dmn = [];
  if ( arguments.length === 4 ) {
    dmn = [min,max];
  }
  else if ( arguments.length === 2 ) {
    dmn = [ d3.min(data, function(d) { return $.isNumeric(d[field]) ? +d[field] : 0; }), d3.max(data, function(d) { return $.isNumeric(d[field]) ? +d[field] : 0; }) ];
  }
  if ( arguments.length > 1 ) {
    axis === 'x' ? this.xDomain = dmn : this.yDomain = dmn;
  }
  return axis === 'x' ? this.xDomain : this.yDomain;
};


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
};

// return the color based on the current scale
// d = the data item to colorize
var colorize = function(d) {
  return colorField !== 'None' ? colorScale(d[colorField]) : null;
};

// load the data asynchronously
d3.json('/data/moviedata.json', function(json) {
  data = json;

  setupSliders('#profit-slider', '#profit-slider-text', percentFormat, 'Profitability');
  setupSliders('#budget-slider', '#budget-slider-text', intFormat, 'Budget', {prepend:'$', append:' M'});
  setupSliders('#wgross-slider', '#wgross-slider-text', intFormat, 'Worldwide Gross', {prepend:'$', append:' M'});
  setupSliders('#arating-slider', '#arating-slider-text', intFormat, 'Audience Rating', {min: 0, max: 100});
  setupSliders('#crating-slider', '#crating-slider-text', intFormat, 'Critic Rating', {min: 0, max: 100});

  // set controls to be defaults
  $('#xaxis').val(xField);
  $('#yaxis').val(yField);
  $('#color').val(colorField);


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
      .attr('r', 6)
      .attr('cx', function(d) { return locate(d, 'x'); } )
      .attr('cy', function(d) { return locate(d, 'y'); } )
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
  $('#detail-budget-value').html('$ ' + numberFormat(d['Budget']) + 'M');
  $('#detail-worldwide-value').html('$ ' + numberFormat(d['Worldwide Gross']) + 'M');
  $('#detail-domestic-value').html('$ ' + numberFormat(d['Domestic Gross']) + 'M');
  $('#detail-foreign-value').html('$ ' + numberFormat(d['Foreign Gross']) + 'M');
  $('#detail-audience-value').html(d['Audience Rating']);
  $('#detail-rotten-value').html(d['Critic Rating']);
  $('#detail-theatres-value').html(intFormat(d['Opening Weekend Theaters']));
  $('#detail-openingweekend-value').html('$ ' + numberFormat(d['Opening Weekend Revenue']) + 'M');
  $('#detail-avgcinema-value').html('$ ' + numberFormat(d['Opening Weekend per Cinema']));
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
// TODO - keep details on screen for highlighted - for development only
//  $('#details').css('display', 'none');
  d3.select(this)
      .style('stroke-width', null)
      .style('stroke', null)
      .style('stroke-opacity', null)
      .style('fill-opacity', null);
}


// set up sliders and input boxes, and listen for events
// opts can be:
//  min, max : hard code the domain regardless of the data
//  prepend, append : add text to prepend or append to label values
var setupSliders = function(sliderElement, labelElement, labelFormatter, dataField, opts) {

  var minVal = opts && opts.min ? opts.min : d3.round( d3.min(data, function(d) { return $.isNumeric(d[dataField]) ? +d[dataField] : 0; }) );
  var maxVal = opts && opts.max ? opts.max : d3.round( d3.max(data, function(d) { return $.isNumeric(d[dataField]) ? +d[dataField] : 0; }) );

  // init the sliders
  var sliderOpts = {
    range: true,
    min: minVal,
    max: maxVal,
    values: [ minVal, maxVal ],
    animate: true
  };
  $(sliderElement).slider(sliderOpts);
  $(sliderElement).on('slide', function( event, ui ) {
    $( labelElement ).val(
      (opts && opts.prepend ? opts.prepend : '') + labelFormatter(ui.values[0]) + (opts && opts.append ? opts.append : '') +
      " - " +
      (opts && opts.prepend ? opts.prepend : '') + labelFormatter(ui.values[1]) + (opts && opts.append ? opts.append : '')
    );
    filter({field: dataField, min: ui.values[0], max: ui.values[1]});
  });
  $(sliderElement).on('slidestop', function( event, ui ){
    zoom();
  });

  // set up the text values for the min and max
  $( labelElement ).val(
    (opts && opts.prepend ? opts.prepend : '') + labelFormatter(minVal) + (opts && opts.append ? opts.append : '') +
    " - " +
    (opts && opts.prepend ? opts.prepend : '') + labelFormatter(maxVal) + (opts && opts.append ? opts.append : '')
  );

  // update default allFilters values
  for ( var i = 0 ; i < allFilters.length ; i++ ) {
    if ( dataField === allFilters[i].field ) {
      allFilters[i].min = minVal;
      allFilters[i].max = maxVal;
      break;
    }
  }
}

// filter out data based on the spec
// spec: {field: dataField, min: minValue, max: maxValue}
var filter = function(spec) {

  // update global filters
  for ( var i = 0; i < allFilters.length; i++ ) {
    if ( allFilters[i].field === spec.field ) {
      allFilters[i].min = spec.min;
      allFilters[i].max = spec.max;
      break;
    }
  }

  // match data not in the range and hide those items
  svg.selectAll('circle')
      .select(function(d) {
        if ( (d[ allFilters[0].field ] < allFilters[0].min || d[ allFilters[0].field ] > allFilters[0].max)
          || (d[ allFilters[1].field ] < allFilters[1].min || d[ allFilters[1].field ] > allFilters[1].max)
          || (d[ allFilters[2].field ] < allFilters[2].min || d[ allFilters[2].field ] > allFilters[2].max)
          || (d[ allFilters[3].field ] < allFilters[3].min || d[ allFilters[3].field ] > allFilters[3].max)
          || (d[ allFilters[4].field ] < allFilters[4].min || d[ allFilters[4].field ] > allFilters[4].max)
          ) {
          return this;
        }
        else {
          return null;
        }
      })
      .style('display', 'none'); // hide items

  // match data within the range (for previously hidden (display:none) items)
  svg.selectAll('circle')
      .select(function(d) {
        if ( (d[ allFilters[0].field ] >= allFilters[0].min && d[ allFilters[0].field ] <= allFilters[0].max)
          && (d[ allFilters[1].field ] >= allFilters[1].min && d[ allFilters[1].field ] <= allFilters[1].max)
          && (d[ allFilters[2].field ] >= allFilters[2].min && d[ allFilters[2].field ] <= allFilters[2].max)
          && (d[ allFilters[3].field ] >= allFilters[3].min && d[ allFilters[3].field ] <= allFilters[3].max)
          && (d[ allFilters[4].field ] >= allFilters[4].min && d[ allFilters[4].field ] <= allFilters[4].max)
          ) {
          return this;
        }
        else {
          return null;
        }
      })
      .style('display', 'inherit'); // show item

}

// animate to zoomed in/out axis if filters change
function zoom() {

  // This really needs to check the max/min values of *displayed* items
  // for each axis, otherwise only zooms when axis values change.

  var xField = $('#xaxis').val();
  var yField = $('#yaxis').val();
  var xDomain, yDomain;
  
  var xfield, yfield;
  for ( var i = 0; i < allFilters.length; i++ ) {
    if ( allFilters[i].field === xField ) {
      xDomain = [allFilters[i].min, allFilters[i].max];
    }
    else if ( allFilters[i].field === yField ) {
      yDomain = [allFilters[i].min, allFilters[i].max];
    }
  }

  domain('x', xField, xDomain[0], xDomain[1]);
  xScale.domain(domain('x'));
  xAxis.scale(xScale);
  svg.select('#xTicks')
    .transition()
      .duration(1500)
      .call(xAxis);
  redraw();

  domain('y', yField, yDomain[0], yDomain[1]);
  yScale.domain(domain('y'));
  yAxis.scale(yScale);
  svg.select('#yTicks')
    .transition()
      .duration(1500)
      .call(yAxis);
  redraw();

}

// animate updated display when controls change (axes, color)
function redraw(filter) {
  svg.selectAll('circle')
    .transition()
      .duration(1500)
      .style('fill', function(d) { return colorize(d); } )
      .attr('cx', function(d) { return locate(d, 'x'); } )
      .attr('cy', function(d) { return locate(d, 'y'); } );
}


// set up listeners when dom is ready
$( function() {

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


