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
  * Color by story, genre, profitibility
  * Click to select and show details for multiple films

# Bugs
  * Fix profitability - uses different formulas in different years
  * Fix 'average' row to bring out of regular json data file
  * REMOVE GLOBAL VARS
  * Fix format for details to show commas, $, etc.

*/


// by default, x = budget, y = gross
var xField = 'Budget',
    yField = 'Worldwide Gross';
var xScale, yScale,
    xAxis, yAxis,
    xAxisPanel, yAxisPanel,
    xLegend, yLegend;
var colorField = 'Story';
var colorScale = d3.scale.category20c();

var data;
var svg;

var numberFormat = d3.format(',.0f');

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
    .tickFormat(numberFormat);
  yAxis = d3.svg.axis()
    .orient('left')
    .scale(yScale)
    .ticks(5)
    .tickSize(-(w-axisPadding), 0, 0)
    .tickFormat(numberFormat);

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
      .attr('r', 5)
      .style('fill', function(d) { return colorScale(d[colorField]); } )
      .on('mouseover', mouseover)
      .on('mouseout', mouseout);

});


function mouseover(d, i) {
  $('#details').css('display', 'inline');
  $('#detail-film-value').html(d.Film);
  $('#detail-year-value').html(d.Year);
  $('#detail-profitability-value').html(d['Profitability']);
  $('#detail-budget-value').html(d['Budget']);
  $('#detail-theatres-value').html(d['Opening Weekend Theaters']);
  $('#detail-worldwide-value').html(d['Worldwide Gross']);
  $('#detail-audience-value').html(d['Audience Rating']);
  $('#detail-genre-value').html(d['Genre']);
  $('#detail-openingweekend-value').html(d['Opening Weekend Revenue']);
  $('#detail-domestic-value').html(d['Domestic Gross']);
  $('#detail-rotten-value').html(d['Critic Rating']);
  $('#detail-story-value').html(d['Story']);
  $('#detail-avgcinema-value').html(d['Opening Weekend per Cinema']);
  $('#detail-foreign-value').html(d['Foreign Gross']);
  $('#detail-oscar-value').html(d['Oscar']);
  $('#detail-studio-value').html(d['Lead Studio']);

  d3.select(this)
      .style('stroke-width', 2.5)
      .style('stroke', 'orange');
}

function mouseout(d, i) {
  $('#details').css('display', 'none');
  d3.select(this)
      .style('stroke-width', null)
      .style('stroke', null);
}

// execute when dom is ready
$( function() {
  $('#xaxis').val(xField);
  $('#yaxis').val(yField);

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

});


function redraw() {
  svg.selectAll('circle')
      .data(data)
    .transition()
      .duration(1000)
      .attr('cx', function(d) { return locate(d, 'x'); } )
      .attr('cy', function(d) { return locate(d, 'y'); } )
      .style('fill', function(d) { return colorScale(d[colorField]); } );
}