// by default, x = budget, y = gross
var xField = 'Budget',
    yField = 'Worldwide Gross';
var xDomain, yDomain,
    xScale, yScale,
    xAxis, yAxis;

// return the value for a given scale, checking if it is a number
// d = the data item to locate, axis = 'x' or 'y'
var locate = function(d, axis) {
  var datum, scale, domain;
  if ( axis === 'x' ) {
    datum = d[xField];
    scale = xScale;
    domain = xDomain;
  }
  else {
    datum = d[yField];
    scale = yScale;
    domain = yDomain;
  }
  return $.isNumeric(datum) ? scale(datum) : domain[0];
}

d3.json('/data/moviedata.json', function(data) {
  var w = $('#vis').width(),
      h = $('#vis').height();

  var axisPadding = 60; // for padding on the axis side
  var padding = 15;     // for padding opposite side of axis
  var xRange = [0, w - axisPadding],
      yRange = [h - axisPadding, 0];

  xDomain = [ d3.min(data, function(d) { return $.isNumeric(d[xField]) ? +d[xField] : 0; }),
              d3.max(data, function(d) { return $.isNumeric(d[xField]) ? +d[xField] : 0; }) ];
  yDomain = [ d3.min(data, function(d) { return $.isNumeric(d[yField]) ? +d[yField] : 0; }),
              d3.max(data, function(d) { return $.isNumeric(d[yField]) ? +d[yField] : 0; }) ];

  xScale = d3.scale.linear()
    .domain(xDomain)
    .range(xRange);
  yScale = d3.scale.linear()
    .domain(yDomain)
    .range(yRange);

  xAxis = d3.svg.axis()
    .scale(xScale)
    .orient('bottom')
    .ticks(5)
    .tickSize(-(h-axisPadding), 0, 0)
    .tickFormat(d3.format(',.0f'));
  yAxis = d3.svg.axis()
    .orient('left')
    .scale(yScale)
    .ticks(5)
    .tickSize(-(w-axisPadding), 0, 0)
    .tickFormat(d3.format(',.0f'));

  var svg = d3.select('#vis')
    .append('svg')
      .attr('width', w)
      .attr('height',h)
    .append('g')
      .attr('transform', 'translate(' + (axisPadding - padding) + ',' + padding + ')');

  var plot = svg.selectAll('circle')
    .data(data)
      .enter()
    .append('circle')
      .attr('class', 'point')
      .attr('cx', function(d) { return locate(d, 'x'); } )
      .attr('cy', function(d) { return locate(d, 'y'); } )
      .attr('r', 5);

  svg.append('g')
      .attr('class', 'x axis')
       .attr('transform', 'translate(0,' + (h-axisPadding) + ')')
      .call(xAxis);
  svg.append('g')
      .attr('class', 'y axis')
      .attr('transform', 'translate(0,0)')
      .call(yAxis);

});