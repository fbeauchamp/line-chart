/*! line-chart - v0.0.1 - 2013-05-22
* https://github.com/angular-d3/line-chart
* Copyright (c) 2013 Angular D3; Licensed ,  */
angular.module('n3-charts.linechart', [])

.factory('n3utils', function() {
  return {
    getDefaultMargins: function() {
      return {top: 20, right: 50, bottom: 30, left: 50};
    },

    clean: function(element) {
      d3.select(element).select('svg').remove();
    },

    bootstrap: function(element, dimensions) {
      d3.select(element).classed('chart', true);

      var width = dimensions.width;
      var height = dimensions.height;

      var svg = d3.select(element).append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
          .attr('transform', 'translate(' + dimensions.left +
            ',' + dimensions.top + ')'
          );

      return svg;
    },

    getTextWidth: function(text) {
      return Math.max(25, text.length*6.7);
    },

    getWidestOrdinate: function(data, series) {
      var widest = '';

      data.forEach(function(row) {
        series.forEach(function(series) {
          if (('' + row[series.y]).length > ('' + widest).length) {
            widest = row[series.y];
          }
        });
      });

      return widest;
    },

    createAxes: function(svg, dimensions, axesOptions) {
      var drawY2Axis = axesOptions.y2 !== undefined;

      var width = dimensions.width;
      var height = dimensions.height;

      width = width - dimensions.left - dimensions.right;
      height = height - dimensions.top - dimensions.bottom;

      var x = axesOptions.x.type === 'date' ?
        d3.time.scale().rangeRound([0, width]) :
        d3.scale.linear().rangeRound([0, width]);

      var y = d3.scale.linear().rangeRound([height, 0]);
      var y2 = d3.scale.linear().rangeRound([height, 0]);

      var xAxis = d3.svg.axis().scale(x).orient('bottom');
      var yAxis = d3.svg.axis().scale(y).orient('left');
      var y2Axis = d3.svg.axis().scale(y2).orient('right');

      var that = this;

      return {
        xScale: x,
        yScale: y,
        y2Scale: y2,
        xAxis: xAxis,
        yAxis: yAxis,
        y2Axis: y2Axis,

        andAddThemIf: function(expression) {
          if (!!expression) {
            svg.append('g')
              .attr('class', 'x axis')
              .attr('transform', 'translate(0,' + height + ')')
              .call(xAxis);

            svg.append('g')
              .attr('class', 'y axis')
              .call(yAxis);

            if (drawY2Axis) {
              svg.append('g')
                .attr('class', 'y2 axis')
                .attr('transform', 'translate(' + width + ', 0)')
                .call(y2Axis);
            }

            that.addTooltips(svg, width, height, drawY2Axis);
          }

          return {
            xScale: x, yScale: y, y2Scale: y2,
            xAxis: xAxis, yAxis: yAxis, y2Axis: y2Axis
          };
        }
      };
    },

    addTooltips: function (svg, width, height, drawY2Axis) {
      var w = 24;
      var h = 18;
      var p = 5;

      var xTooltip = svg.append('g')
        .attr({
          'id': 'xTooltip',
          'opacity': 0
        });

      xTooltip.append('path')
        .attr({
          'transform': 'translate(0,' + (height + 1) + ')'
        });

      xTooltip.append('text')
        .style({
          'text-anchor': 'middle'
        })
        .attr({
          'width': w,
          'height': h,
          'font-family': 'monospace',
          'font-size': 10,
          'transform': 'translate(0,' + (height + 19) + ')',
          'fill': 'white',
          'text-rendering': 'geometric-precision'
        });

      var yTooltip = svg.append('g')
        .attr({
          'id': 'yTooltip',
          'opacity': 0
        });

      yTooltip.append('path');
      yTooltip.append('text')
        .attr({
          'width': h,
          'height': w,
          'font-family': 'monospace',
          'font-size': 10,
          'fill': 'white',
          'text-rendering': 'geometric-precision'
        });

      if (drawY2Axis) {
        var y2Tooltip = svg.append('g')
          .attr({
            'id': 'y2Tooltip',
            'opacity': 0,
            'transform': 'translate(' + width + ',0)'
          });

        y2Tooltip.append('path');

        y2Tooltip.append('text')
          .attr({
            'width': h,
            'height': w,
            'font-family': 'monospace',
            'font-size': 10,
            'fill': 'white',
            'text-rendering': 'geometric-precision'
          });
      }
    },

    createContent: function(svg) {
      svg.append('g')
        .attr('class', 'content');
    },

    drawLines: function(svg, scales, data, interpolateMode) {
      var drawers = {
        y: this.createLeftLineDrawer(scales, interpolateMode),
        y2: this.createRightLineDrawer(scales, interpolateMode)
      };

      svg.select('.content').selectAll('.lineGroup')
        .data(data.filter(function(s) { return s.type === 'line'  || s.type === 'area'; }))
        .enter().append('g')
          .style('stroke', function(serie) {return serie.color;})
          .attr('class', function(s) {
            return 'lineGroup ' + 'series_' + s.index;
          })
          .append('path')
            .attr('class', 'line')
            .attr('d', function(d) {return drawers[d.axis](d.values);})
            .style({
              'fill': 'none',
              'stroke-width': '1px'
            });

      return this;
    },

    createLeftLineDrawer: function(scales, interpolateMode) {
      return d3.svg.line()
        .x(function(d) {return scales.xScale(d.x);})
        .y(function(d) {return scales.yScale(d.value);})
        .interpolate(interpolateMode);
    },

    createRightLineDrawer: function(scales, interpolateMode) {
      return d3.svg.line()
        .x(function(d) {return scales.xScale(d.x);})
        .y(function(d) {return scales.y2Scale(d.value);})
        .interpolate(interpolateMode);
    },

    drawArea: function(svg, scales, data, interpolateMode){
      var drawers = {
        y: this.createLeftAreaDrawer(scales, interpolateMode),
        y2: this.createRightAreaDrawer(scales, interpolateMode)
      };

      svg.select('.content').selectAll('.areaGroup')
        .data(data.filter(function(series) { return series.type === 'area'; }))
        .enter().append('g')
          .style('fill', function(serie) { return serie.color; })
          .attr('class', function(s) {
            return 'areaGroup ' + 'series_' + s.index;
          })
          .append('path')
            .style('opacity', '0.3')
            .attr('class', 'area')
            .attr('d',  function(d) { return drawers[d.axis](d.values); });

      return this;
    },

    createLeftAreaDrawer: function(scales, interpolateMode) {
      return d3.svg.area()
        .x(function(d) { return scales.xScale(d.x); })
        .y0(function(d) { return scales.yScale(0); })
        .y1(function(d) { return scales.yScale(d.value); })
        .interpolate(interpolateMode);
    },

    createRightAreaDrawer: function(scales, interpolateMode) {
      return d3.svg.area()
        .x(function(d) { return scales.xScale(d.x); })
        .y0(function(d) { return scales.y2Scale(0); })
        .y1(function(d) { return scales.y2Scale(d.value); })
        .interpolate(interpolateMode);
    },

    getBestColumnWidth: function(dimensions, data) {
      if (!data || data.length === 0) {
        return 10;
      }

      var n = data[0].values.length + 2; // +2 because abscissas will be extended
                                         // to one more row at each end
      var s = data.length;
      var oP = 3; // space between two rows
      var avWidth = dimensions.width - dimensions.left - dimensions.right;

      return (avWidth - (n - 1)*oP) / (n*s);
    },

    drawColumns: function(svg, axes, data, columnWidth) {
      data = data.filter(function(s) {return s.type === 'column';});

      var x1 = d3.scale.ordinal()
        .domain(data.map(function(s) {return s.name;}))
        .rangeRoundBands([0, data.length * columnWidth], 0.05);

      var that = this;

      var colGroup = svg.select('.content').selectAll('.columnGroup')
        .data(data)
        .enter().append("g")
          .attr('class', function(s) {
            return 'columnGroup ' + 'series_' + s.index;
          })
          .style("fill", function(s) {return s.color;})
          .style("fill-opacity", 0.8)
          .attr("transform", function(series) {
            return "translate(" + (
              x1(series.name) - data.length*columnWidth/2
            ) + ",0)";
          })
          .on('mouseover', function(series) {
            var target = d3.select(d3.event.target);

            that.onMouseOver(svg, {
              series: series,
              x: target.attr('x'),
              y: axes[series.axis + 'Scale'](target.datum().value),
              datum: target.datum()
            });
          })
          .on('mouseout', function(d) {
            d3.select(d3.event.target).attr('r', 2);
            that.onMouseOut(svg);
          });

      colGroup.selectAll("rect")
        .data(function(d) {return d.values;})
        .enter().append("rect")
          .attr("width", columnWidth)
          .attr("x", function(d) {return axes.xScale(d.x);})

          .attr("y", function(d) {
            return axes[d.axis + 'Scale'](Math.max(0, d.value));
          })

          .attr("height", function(d) {
            return Math.abs(axes[d.axis + 'Scale'](d.value) -
              axes[d.axis + 'Scale'](0));
          });

      return this;
    },

    drawDots: function(svg, axes, data) {
      var that = this;

      svg.select('.content').selectAll('.dotGroup')
        .data(data.filter(function(s) { return s.type === 'line' || s.type === 'area'; }))
        .enter().append('g')
          .attr('class', function(s) {
            return 'dotGroup ' + 'series_' + s.index;
          })
          .attr('fill', function(s) {return s.color;})
          .on('mouseover', function(series) {
            var target = d3.select(d3.event.target);
            target.attr('r', 4);

            that.onMouseOver(svg, {
              series: series,
              x: target.attr('cx'),
              y: target.attr('cy'),
              datum: target.datum()
            });
          })
          .on('mouseout', function(d) {
            d3.select(d3.event.target).attr('r', 2);
            that.onMouseOut(svg);
          })
          .selectAll('.dot').data(function(d) {return d.values;})
            .enter().append('circle')
            .attr({
              'class': 'dot',
              'r': 2,
              'cx': function(d) { return axes.xScale(d.x); },
              'cy': function(d) { return axes[d.axis + 'Scale'](d.value); }
            })
            .style({
              'stroke': 'white',
              'stroke-width': '2px'
            });

      return this;
    },

    onMouseOver: function(svg, target) {
      this.updateXTooltip(svg, target);

      if (target.series.axis === 'y2') {
        this.updateY2Tooltip(svg, target);
      } else {
        this.updateYTooltip(svg, target);
      }
    },

    onMouseOut: function(svg) {
      this.hideTooltips(svg);
    },

    updateXTooltip: function(svg, target) {
      var xTooltip = svg.select("#xTooltip")
        .transition()
        .attr({
          'opacity': 1.0,
          'transform': 'translate(' + target.x + ',0)'
        });

      var textX;
      if (target.series.xFormatter) {
        textX = '' + target.series.xFormatter(target.datum.x);
      } else {
        textX = '' + target.datum.x;
      }

      xTooltip.select('text').text(textX);
      xTooltip.select('path')
        .attr('fill', target.series.color)
        .attr('d', this.getXTooltipPath(textX));
    },

    getXTooltipPath: function(text) {
      var w = this.getTextWidth(text);
      var h = 18;
      var p = 5; // Size of the 'arrow' that points towards the axis

      return 'm-' + w/2 + ' ' + p + ' ' +
        'l0 ' + h + ' ' +
        'l' + w + ' 0 ' +
        'l0 ' + '-' + h +
        'l-' + (w/2 - p) + ' 0 ' +
        'l-' + p + ' -' + h/4 + ' ' +
        'l-' + p + ' ' + h/4 + ' ' +
        'l-' + (w/2 - p) + ' 0z';
    },

    updateYTooltip: function(svg, target) {
      var yTooltip = svg.select("#yTooltip")
        .transition()
        .attr({
          'opacity': 1.0,
          'transform': 'translate(0, ' + target.y + ')'
        });

      var textY = '' + target.datum.value;
      var yTooltipText = yTooltip.select('text').text(textY);
      yTooltipText.attr(
        'transform',
        'translate(-' + (this.getTextWidth(textY) + 3) + ',3)'
      );
      yTooltip.select('path')
        .attr('fill', target.series.color)
        .attr('d', this.getYTooltipPath(textY));
    },

    getYTooltipPath: function(text) {
      var w = this.getTextWidth(text);
      var h = 18;
      var p = 5; // Size of the 'arrow' that points towards the axis

      return 'm0 0' +
        'l-' + p + ' -' + p + ' ' +
        'l0 -' + (h/2 - p) + ' ' +
        'l-' + w + ' 0 ' +
        'l0 ' + h + ' ' +
        'l' + w + ' 0 ' +
        'l0 -' + (h/2 - p) +
        'l-' + p + ' ' + p + 'z';
    },

    updateY2Tooltip: function(svg, target) {
      var y2Tooltip = svg.select("#y2Tooltip")
        .transition()
        .attr({
          'opacity': 1.0
        });

      var textY = '' + target.datum.value;
      var y2TooltipText = y2Tooltip.select('text').text(textY);
      y2TooltipText.attr(
        'transform',
        'translate(5, ' + (parseFloat(target.y) + 3) + ')'
      );
      y2Tooltip.select('path')
        .attr({
          'fill': target.series.color,
          'd': this.getY2TooltipPath(textY),
          'transform': 'translate(0, ' + target.y + ')'
        });
    },

    getY2TooltipPath: function(text) {
      var w = this.getTextWidth(text);
      var h = 18;
      var p = 5; // Size of the 'arrow' that points towards the axis

      return 'm0 0' +
        'l' + p + ' ' + p + ' ' +
        'l0 ' + (h/2 - p) + ' ' +
        'l' + w + ' 0 ' +
        'l0 -' + h + ' ' +
        'l-' + w + ' 0 ' +
        'l0 ' + (h/2 - p) + ' ' +
        'l-' + p + ' ' + p + 'z';
    },

    hideTooltips: function(svg) {
      svg.select("#xTooltip")
        .transition()
        .attr({ 'opacity': 0 });

      svg.select("#yTooltip")
        .transition()
        .attr({'opacity': 0 });

      svg.select("#y2Tooltip")
        .transition()
        .attr({'opacity': 0 });
    },

    getDataPerSeries: function(data, options) {
      var series = options.series;
      var axes = options.axes;

      if (!series || !series.length || !data || !data.length) {
        return [];
      }

      var lineData = [];

      series.forEach(function(s) {
        var seriesData = {
          xFormatter: axes.x.tooltipFormatter,
          index: lineData.length,
          name: s.y,
          values: [],
          color: s.color,
          axis: s.axis || 'y',
          type: s.type || 'line'
        };

        data.forEach(function(row) {
          seriesData.values.push({
            x: row.x,
            value: row[s.y],
            axis: s.axis || 'y'
          });
        });

        lineData.push(seriesData);
      });

      return lineData;
    },

    setScalesDomain: function(scales, data, series, svg) {
      this.setXScale(scales.xScale, data, series);

      var ySeries = series.filter(function(s) { return s.axis !== 'y2'; });
      var y2Series = series.filter(function(s) { return s.axis === 'y2'; });

      scales.yScale.domain(this.yExtent(ySeries, data)).nice();
      scales.y2Scale.domain(this.yExtent(y2Series, data)).nice();

      svg.selectAll('.x.axis').call(scales.xAxis);
      svg.selectAll('.y.axis').call(scales.yAxis);
      svg.selectAll('.y2.axis').call(scales.y2Axis);
    },

    yExtent: function(series, data) {
      var minY = Number.POSITIVE_INFINITY;
      var maxY = Number.NEGATIVE_INFINITY;

      series.forEach(function(s) {
        minY = Math.min(minY, d3.min(data, function(d) { return d[s.y]; }));
        maxY = Math.max(maxY, d3.max(data, function(d) { return d[s.y]; }));
      });

      return [minY, maxY];
    },

    setXScale: function(xScale, data, series) {
      xScale.domain(d3.extent(data, function(d) { return d.x; }));

      if (series.filter(function(s) { return s.type === 'column'; }).length) {
        this.adjustXScaleForColumns(xScale, data);
      }
    },

    adjustXScaleForColumns: function(xScale, data) {
      var step = this.getAverageStep(data, 'x');
      var d = xScale.domain();

      if (angular.isDate(d[0])) {
        xScale.domain([new Date(d[0].getTime() - step), new Date(d[1].getTime() + step)]);
      } else {
        xScale.domain([d[0] - step, d[1] + step]);
      }
    },

    getAverageStep: function(data, field) {
      var sum = 0;
      var n = data.length - 1;

      for (var i = 0; i<n; i++) {
        sum += data[i + 1][field] - data[i][field];
      }

      return sum/n;
    },

    haveSecondYAxis: function(series) {
      var doesHave = false;

      angular.forEach(series, function(s) {
        doesHave = doesHave || s.axis === 'y2';
      });

      return doesHave;
    },

    resetMargins: function(dimensions) {
      var defaults = this.getDefaultMargins();

      dimensions.left = defaults.left;
      dimensions.right = defaults.right;
      dimensions.top = defaults.top;
      dimensions.bottom = defaults.bottom;
    },

    adjustMargins: function(dimensions, options, data) {
      this.resetMargins(dimensions);

      if (!data || data.length === 0) {
        return;
      }

      var series = options.series;

      var leftSeries = series.filter(function(s) { return s.axis !== 'y2'; });
      var leftWidest = this.getWidestOrdinate(data, leftSeries);
      dimensions.left = this.getTextWidth('' + leftWidest) + 20;

      var rightSeries = series.filter(function(s) { return s.axis === 'y2'; });
      if (rightSeries.length === 0) {
        return;
      }
      var rightWidest = this.getWidestOrdinate(data, rightSeries);
      dimensions.right = this.getTextWidth('' + rightWidest) + 20;
    },

    adjustMarginsForThumbnail: function(dimensions, options, data) {
      dimensions.left = 0;
      dimensions.right = 0;
      dimensions.top = 0;
      dimensions.bottom = 0;
    },

    drawLegend: function(svg, series, dimensions) {
      var layout = [0];

      for (var i = 1; i < series.length; i++) {
        var l = series[i - 1].label || series[i - 1].y;
        layout.push(this.getTextWidth(l) + layout[i - 1] + 20);
      }

      var that = this;
      var legend = svg.append('g').attr('class', 'legend');

      var item = legend.selectAll('.legendItem')
        .data(series)
        .enter().append('g')
          .attr({
            'class': 'legendItem',
            'transform': function(s, i) {
              return 'translate(' + layout[i] + ',' + (dimensions.height - 25) + ')';
            }
          });

      item.append('circle')
        .attr({
          'fill': function(s) {return s.color;},
          'r': 4,
          'stroke': function(s) {return s.color;},
          'stroke-width': '2px'
        })
        .on('click', function(s, i) {
          d3.select(this).attr('fill-opacity', that.toggleSeries(svg, i) ? '1' : '0.2');
        })
        ;

      item.append('text')
        .attr({
          'font-family': 'monospace',
          'font-size': 10,
          'transform': 'translate(10, 3)',
          'text-rendering': 'geometric-precision'
        })
        .text(function(s) {return s.label || s.y;});

      return this;
    },

    toggleSeries: function(svg, index) {
      var isVisible = false;

      svg.select('.content').selectAll('.series_' + index)
        .attr('opacity', function(s) {
          if (d3.select(this).attr('opacity') === '0') {
            isVisible = true;
            return '1';
          }

          isVisible = false;
          return '0';
        });

      return isVisible;
    },

    getDefaultOptions: function() {
      return {
        lineMode: 'linear',
        axes: {
          x: {type: 'linear'},
          y: {}
        },
        series: []
      };
    },

    sanitizeOptions: function(options) {
      if (options === null || options === undefined) {
        return this.getDefaultOptions();
      }

      if (!options.series) {
        options.series = [];
      }

      if (!options.axes) {
        options.axes = {x: {type: 'linear'}, y: {}};
      }

      if (!options.axes.y) {
        options.axes.y = {};
      }

      if (!options.axes.x) {
        options.axes.x = {type: 'linear'};
      }

      if (!options.axes.x.type) {
        options.axes.x.type = 'linear';
      }

      if (!options.lineMode) {
        options.lineMode = 'linear';
      }

      if (this.haveSecondYAxis(options.series)) {
        options.axes.y2 = {};
      }

      return options;
    }
  };
})

.directive('linechart', ['n3utils', '$window', '$timeout', function(n3utils, $window, $timeout) {
  var link  = function(scope, element, attrs, ctrl) {
    var dim = n3utils.getDefaultMargins();

    scope.updateDimensions = function(dimensions) {
      dimensions.width = element[0].parentElement.offsetWidth || 900;
      dimensions.height = element[0].parentElement.offsetHeight || 500;
    };

    scope.update = function() {
      scope.updateDimensions(dim);
      scope.redraw(dim);
    };

    scope.redraw = function(dimensions) {
      var options = n3utils.sanitizeOptions(scope.options);

      var data = scope.data;

      var series = options.series;

      var dataPerSeries = n3utils.getDataPerSeries(data, options);

      var isThumbnail = (attrs.mode === 'thumbnail');

      if (isThumbnail) {
        n3utils.adjustMarginsForThumbnail(dimensions, options, data);
      } else {
        n3utils.adjustMargins(dimensions, options, data);
      }
      n3utils.clean(element[0]);

      var svg = n3utils.bootstrap(element[0], dimensions);
      var axes = n3utils
        .createAxes(svg, dimensions, options.axes)
        .andAddThemIf(!isThumbnail);

      n3utils.createContent(svg);

      if (!isThumbnail) {
        n3utils.drawLegend(svg, series, dimensions);
      }

      var lineMode = options.lineMode;

      if (dataPerSeries.length > 0) {
        n3utils.setScalesDomain(axes, data, options.series, svg);

        var columnWidth = n3utils.getBestColumnWidth(dimensions, dataPerSeries);

        n3utils
          .drawArea(svg, axes, dataPerSeries, lineMode)
          .drawColumns(svg, axes, dataPerSeries, columnWidth)
          .drawLines(svg, axes, dataPerSeries, lineMode)
          .drawDots(svg, axes, dataPerSeries)
        ;
      }
    };

    var timeoutPromise;
    var window_resize = function(e) {
      $timeout.cancel(timeoutPromise);
      timeoutPromise = $timeout(scope.update, 1);
    };

    $window.addEventListener('resize', window_resize);

    scope.$watch('data', scope.update);
    scope.$watch('options', scope.update, true);
  };

  return {
    replace: true,
    restrict: 'E',
    scope: {data: '=', options: '='},
    template: '<div></div>',
    link: link
  };
}]);
