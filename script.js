window.onload = function () {
	var svg = document.querySelector('svg');
	var width = svg.width = parseInt(getComputedStyle(svg).width);
	var height = svg.height = parseInt(getComputedStyle(svg).height);

	var padding = Math.min(width, height) * 0.05;
	width -= padding * 2;
	height -= padding * 2;

	// height width / w
	var w = 10;
	var h = height * w / width; // Height has to be a scale of root 2 of the horizontal axis
	var muScale = d3.scale.linear().domain([-w / 2, w / 2]).range([0, width]);
	var sigmaScale = d3.scale.linear().domain([0, h]).range([height, 0]);
	var sigmaDisplayScale = d3.scale.linear().domain([0, h / Math.sqrt(2)]).range([height, 0]);

	var x = d3.svg.axis().scale(muScale).orient('bottom').ticks(10).tickSize(8);
	var y = d3.svg.axis().scale(sigmaDisplayScale).orient('left').ticks(5).tickSize(8).tickFormat(function (y) {
		return y == 0 ? '' : y.toFixed(1);
	});



	var svg = d3.select('svg')
		.append('g')
		.attr('transform', 'translate(' + padding + ',' + padding + ')');

	// A click target.
	// svg
	// 	.append("foreignObject")
	// 	.attr("x", 0)
	// 	.attr("y", function() { return 1 * i })
    //   	.attr("width", 1)
    //   	.attr("height", 1)
    //   	.html(function(d) {
    //     	return '<input type="text" value="Text goes here" />'
	//   	})
	  
	svg // the white dot
		.append('rect')
		.attr('class', 'click')
		.attr('width', width)
		.attr('height', height)
		.attr('fill', 'white');

	svg // x axis
		.append('g')
		.attr('class', 'axis')
		.call(x)
		.attr('transform', 'translate(0, ' + height + ')')
		.append('text')
		.attr({
			'x': 0,
			'y': -15,
			//'font-family': 'times new roman',
			'font-size': '18pt'
		})
		.text('\u03BC');

	svg // y axis
		.append('g')
		.attr('class', 'axis')
		.call(y)
		.attr('transform', 'translate(' + (width / 2) + ', 0)')
		.append('text')
		.attr({
			'x': -15,
			'y': 5,
			//'font-family': 'times new roman',
			'font-size': '18pt',
			'text-anchor': 'end'
		})
		.text('\u03C3');

	// var svgContainer = d3.select("body").append("svg")
	// 	.attr("width", width)
	// 	.attr("height", width);

	
	function getParameters1(event) {
		var coords = d3.mouse(event);
		return [muScale.invert(coords[0]), Math.max(sigmaScale.invert(coords[1]), 0)];
		// return [-2,2];
	}
	function getParameters2(event) {
		var coords = d3.mouse(event);
		return [muScale.invert(coords[0]), Math.max(sigmaScale.invert(coords[1]), 0)];
		// return [2,2];
	}

	var state = {
		progress: [],
		endCoords: null
	};
	state.initial = normalDistribution(0, Math.sqrt(2), state.initial);
	svg
		.call(
			d3.behavior.drag()
				.on('dragstart', function () {
					state.progress.map(function (dist) {
						dist.remove()
					});
					state.progress = [];

					if (state.geodesicArc) {
						state.geodesicArc.remove();
						state.geodesicFull.remove();
					}

					if (state.end)
						state.end.remove();
					state.endCoords = null;

					cancelAnimationFrame(state.animationRequest);
					if (state.animation)
						state.animation.remove();

					state.initialCoords = getParameters1(this);
					state.initial = normalDistribution(state.initialCoords[0], state.initialCoords[1], state.initial);

					d3.event.sourceEvent.preventDefault();
				})
				.on('drag', function () {
					var coords = state.endCoords = getParameters2(this);
					var thirdCoord = calcThirdPt(state.initialCoords, state.endCoords);
					var geodesic = getGeodesic(state.initialCoords, coords);

					// console.log(state.initialCoords[0]);
					// console.log(state.initialCoords[1]);
					// console.log(state.endCoords[0]);
					// console.log(state.endCoords[1]);

					// TODO: Handle case where line is straight up.
					if (geodesic[1] == Infinity)
						return;

					if (state.geodesicArc) {
						state.geodesicArc.remove();
						state.geodesicFull.remove();
					}

					var aLine = d3.svg.line().x(function(d) { return d.x; }).y(function(d) { return d.y; }).interpolate("linear");
					var lineData = [ { "x": muScale(state.initialCoords[0]),   "y": sigmaScale(state.initialCoords[1])},  { "x": muScale(coords[0]),  "y": sigmaScale(coords[1])}];
					var grayline = calcLine(state.initialCoords, coords);
					// console.log(grayline[0]);
					// console.log(grayline[1]);
					var lineData2 = [ { "x": muScale(-5),   "y": sigmaScale(grayline[0])},  { "x": muScale(5),  "y": sigmaScale(grayline[1])}];


					var direction = +(state.initialCoords[0] < coords[0]);
					var rPixels = muScale(geodesic[1]) - muScale(0);
					// var rPixels2 = muScale(geodesic2[1]) - muScale(0);
					// state.geodesicFull = svg
					// 	.append('path')
					// 	.attr({
					// 		'd': [
					// 			'M' + [muScale(geodesic[0]) - rPixels, sigmaScale(0)],
					// 			'A' + [rPixels, rPixels] + ' 0 ' + [0, 1] + ' ' + [muScale(geodesic[0]) + rPixels, sigmaScale(0)]
					// 		].join(' '),
					// 		'fill': 'none',
					// 		'stroke': '#ccc',
					// 		'stroke-width': '2px'
					// 	});
					state.geodesicArc = svg
						.append('path')
						.attr({
							'd': aLine(lineData2),
							'fill': 'none',
							'stroke': '#877',
							'stroke-width': '2px'
						});
					state.geodesicFull = svg
						.append('path')
						.attr({
							'd': aLine(lineData),
							'fill': 'black',
							'stroke': '#000',
							'stroke-width': '2px'
						});

					// state.geodesicArc = svg
					// 	.append('path')
					// 	.attr({
					// 		'd': [
					// 			'M' + [muScale(state.initialCoords[0]), sigmaScale(state.initialCoords[1])],
					// 			// 'M' + [muScale(state.endCoords[0]), sigmaScale(state.endCoords[1])],
					// 			'A' + [rPixels, rPixels] + ' 0 ' + [0, direction] + ' ' + [muScale(coords[0]), sigmaScale(coords[1])]
					// 			// 'A' + [muScale(geodesic2[1]) - muScale(0), muScale(geodesic2[1]) - muScale(0)] + ' 0 ' + [0, direction] + ' ' + [muScale(thirdCoord[0]), sigmaScale(thirdCoord[1])]
					// 		].join(' '),
					// 		'fill': 'none',
					// 		'stroke': '#877',
					// 		'stroke-width': '2px'
					// 	});


					state.end = normalDistribution(coords[0], coords[1], state.end);

					d3.event.sourceEvent.preventDefault();
				})
				.on('dragend', function () {
					if (!state.endCoords)
						return;

					var geodesic = getGeodesic(state.initialCoords, state.endCoords);
					var c = geodesic[0];
					var R = geodesic[1];

					var lineForm = calcSlope(state.initialCoords, state.endCoords);
					var m = lineForm[0];
					var b = lineForm[1];

					var length = lineLength(state.initialCoords, state.endCoords);

					var tau0 = arctanh((state.initialCoords[0] - c) / -R); // this is where the points are 
					var tau1 = arctanh((state.endCoords[0] - c) / -R);
					// var tau0 = 1; // this is where the points are 
					// var tau1 = 2;
                    // console.log(tau0);
                    // console.log(tau1);

					// TODO: Handle case where line is straight up.
					if (R == Infinity)
						return;

					// var duration = Math.abs(tau1 - tau0) * 1000;
					// normalDistribution(state.initialCoords[0], state.initialCoords[1], state.initial);
					var duration = Math.abs(state.initialCoords[0] - state.endCoords[0]) * 800;
					console.log(duration);
					// find length of line, divide into 5 pieces, graph

					// console.log(duration);
					// var tau = d3.scale.linear().domain([0, duration]).range([tau0,tau1]);
					var mylineScale = d3.scale.linear().domain([state.initialCoords[0],state.endCoords[0]]);

					var tickCount = Math.floor(duration / 500);
					console.log(tickCount);
					var ticks = d3.range(1, tickCount).map(function (i) { return i * duration / tickCount; });
					console.log(ticks);
					var now = performance.now();
					state.progress = [];
					var track = 0;
					state.animationRequest = requestAnimationFrame(function animate(time) {
						var mylineScale = d3.scale.linear().domain([state.initialCoords[0],state.endCoords[0]]);
						console.log(time);
						time -= now;
						console.log(time);
						console.log(now);
						
						state.animation = normalDistribution(mylineScale(time), getPtsOnLine(m,b,mylineScale(time)), state.animation);
						console.log(getPtsOnLine(m,b,mylineScale(time)));
						console.log(mylineScale(time));
						// state.animation = normalDistribution(300, 400, state.animation);

						state.progress.forEach(function (dist) {
							dist.select('path').style('opacity', 0.5 * Math.exp(-(time - dist.tick) / (tickCount * 200)));
							// dist.select('path').style('opacity', tickCount);
						});

						console.log(mylineScale(ticks[0]));
						if (ticks.length && time > mylineScale(ticks[0])) {
							console.log(ticks[0]);
							var tick = ticks.shift();
							var dist = normalDistribution(mylineScale(tick), getPtsOnLine(m,b,mylineScale(tick)));
							// var dist = normalDistribution(300, 400);
							dist.tick = tick;
							state.progress.push(dist);
						}
						console.log( mylineScale.domain()[1]);
						// state.animationRequest = requestAnimationFrame(animate);
						// if (time < mylineScale.domain()[1])
						track = track + 1;
						if (track != 10)
							state.animationRequest = requestAnimationFrame(animate);
						else
							state.animation.remove();
						});
						d3.event.sourceEvent.preventDefault();
					
					})
					// .on('click', function () {
					// 	state.progress.map(function (dist) {
					// 		dist.remove()
					// 	});
					// 	state.progress = [];
	
					// 	if (state.geodesicArc) {
					// 		state.geodesicArc.remove();
					// 		state.geodesicFull.remove();
					// 	}
	
					// 	if (state.end)
					// 		state.end.remove();
					// 	state.endCoords = null;
	
					// 	cancelAnimationFrame(state.animationRequest);
					// 	if (state.animation)
					// 		state.animation.remove();
	
					// 	var thirdCoord = calcThirdPt(state.initialCoords, state.endCoords);
					// 	state.initial = normalDistribution(state.endCoords[0], state.endCoords[1], state.initial);
					// 	d3.event.sourceEvent.preventDefault();
					// }
		)
	/*
	var old;
	requestAnimationFrame(function tick(time) {
		var tau = -0.25 * time / 1000 + 0.75;
		if (old)
			old.remove();

		// http://malkoun.org/RG/hyperbolic.pdf
		old = normalDistribution(-1.5 * tanh(tau), 1.5 * sech(tau));

		//requestAnimationFrame(tick);
	});*/

	function getGeodesic(a, b) {
		var x1 = a[0]; // coordinates
		var y1 = a[1];
		var x2 = b[0];
		var y2 = b[1];

		if (x1 == x2)
			return [x1, Infinity];

		// Solve (x1 - c)^2 + y1^2 == R^2 == (x2 - c)^2 + y2^2
		var c = ((y1*y1 - y2*y2)/(x1 - x2) + (x1 + x2)) / 2; 
		var R = Math.sqrt( (x1 - c)*(x1 - c) + y1*y1);		 

		// var c = 
		// var R = 
		return [c, R];
	}

    function calcCircle(a, b) {
        var x = (a[0] + b[0]) / 2; // calculating center of the circle, x axis
        var y = (a[1] + b[1]) / 2; // calculating center of the circle, y axis
        var R = Math.sqrt((a[0] - x) * (a[0] - x) + (a[1] - y) * (a[1] - y)); // finding radius
        return [x, y, R];
    }

	function calcThirdPt(a,b) {
		var x1 = a[0]; // coordinates
		var y1 = a[1];
		var x2 = b[0];
		var y2 = b[1];

		var x = (a[0] + b[0]) / 2;
		var slopePerp = (x1 - x2) / (y2 - y1);
		var y = slopePerp * (x - (x1 + x2) / 2) + (y1 + y2)/2;

		return [x,y];
	}

	function calcLine (a,b) {
		var x1 = a[0]; // coordinates
		var y1 = a[1];
		var x2 = b[0];
		var y2 = b[1];

		// line: mx + b = y
		var m = (y2 - y1) / (x2 - x1);
		var b = y2 - m * x2;

		var yleft = (-5) * m + b;
		var yright = 5 * m + b;

		return [yleft, yright];
	}
	function calcSlope(a,b) {
		var x1 = a[0]; // coordinates
		var y1 = a[1];
		var x2 = b[0];
		var y2 = b[1];

		// line: mx + b = y
		var m = (y2 - y1) / (x2 - x1);
		var b = y2 - m * x2;
		return [m,b];
	}

	function getPtsOnLine(m,b,x) {
		var y = x * m + b;
		return y;
	}
	function lineLength (a,b) {
		var x1 = a[0]; // coordinates
		var y1 = a[1];
		var x2 = b[0];
		var y2 = b[1];

		var length = Math.sqrt (Math.abs(x1-x2) * Math.abs(x1-x2)+ Math.abs(y1-y2)*Math.abs(y1-y2));
		return length;
	}




	function normalDistribution(mu, sigma, existing) {
		var domain = muScale.domain();
		var line = d3.svg.line()
			.x(muScale)
			.y(function (x) {
				return height * normalPDF(mu, sigma, x);
			})
			.interpolate('basis');

		if (existing)
			existing.remove()

		var color = 'hsl(' + (150 + Math.atan2(sigma, mu) * 180 / Math.PI) + ', 100%, 63%)';
		var group = svg.append('g');

		var coords = d3.range(domain[0] - 0.1, domain[1] + 0.1, 0.05);
		coords = coords.concat(d3.range(0.05, 1, 0.1).map(function (x) { return inverseNormalCDF(mu, sigma, x); }));
		coords.sort(function (a, b) { return a - b; });

		group
			.append('g')
			.attr('transform', 'translate(0, ' + height + ')')
			.append('g')
			.attr('transform', 'scale(1, -1)')
			.append('path')
			.attr({
				//'d': line(d3.range(domain[0], domain[1] + 0.1, 0.05)),
				'd': line(coords),
				'stroke-width': '2px',
				'stroke': color,
				'fill': 'none'
			})
			.style('opacity', '0.5');
			// .delay(500);

		group
			.append('circle')
			.attr({
				'cx': muScale(mu),
				'cy': sigmaScale(sigma),
				'r': 5,
				'fill': '#fff',
				'stroke': color,
				'stroke-width': '2px'
			});
			// .delay(500);

		// group
		// 	.append('line')
		// 	.attr({
		// 		'x1' : state.initialCoords[0],
		// 		'y1' : state.initialCoords[1],
		// 		'x2' : coords[0],
		// 		'y2' : coords[1],
		// 		'fill': 'none',
		// 		'stroke': '#ccc',
		// 		'stroke-width': '2px'
		// 	});

		return group;
	}

	function normalPDF(mu, sigma, x) {
		var y = Math.exp(-(x - mu) * (x - mu) / (sigma * sigma)) / (Math.sqrt(Math.PI) * sigma);
		return y > 1E-7 ? y : 0;
	}

	function inverseNormalCDF(mu, sigma, x) {
		return sigma * inverseStandardNormalCDF(x) + mu;
	}

	function inverseStandardNormalCDF(p) {
		// https://stackoverflow.com/questions/8816729/javascript-equivalent-for-inverse-normal-function-eg-excels-normsinv-or-nor
		var a1 = -39.6968302866538, a2 = 220.946098424521, a3 = -275.928510446969;
		var a4 = 138.357751867269, a5 = -30.6647980661472, a6 = 2.50662827745924;
		var b1 = -54.4760987982241, b2 = 161.585836858041, b3 = -155.698979859887;
		var b4 = 66.8013118877197, b5 = -13.2806815528857, c1 = -7.78489400243029E-03;
		var c2 = -0.322396458041136, c3 = -2.40075827716184, c4 = -2.54973253934373;
		var c5 = 4.37466414146497, c6 = 2.93816398269878, d1 = 7.78469570904146E-03;
		var d2 = 0.32246712907004, d3 = 2.445134137143, d4 = 3.75440866190742;
		var p_low = 0.02425, p_high = 1 - p_low;

		if (p <= 0)
			return -Infinity;
		if (p >= 1)
			return Infinity;

		if (p < p_low) {
			var q = Math.sqrt(-2 * Math.log(p));
			return (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) / ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
		}

		if (p <= p_high)
		{
			var q = p - 0.5;
			var r = q * q;
			return (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q / (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
		}

		var q = Math.sqrt(-2 * Math.log(1 - p));
		return -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) / ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
	}

	function tanh(t) {
		if (t >= 0)
			return (1 - Math.exp(-2*t)) / (1 + Math.exp(-2*t));
		return (Math.exp(2*t) - 1) / (Math.exp(2*t) + 1);
	}

	function sech(t) {
		return 2 / (Math.exp(t) + Math.exp(-t));
	}

	function arctanh(x) {
		return (Math.log(1 + x) - Math.log(1 - x)) / 2;
	}
};

document.body.addEventListener('touchmove', function (e) {
	e.preventDefault();
	e.stopImmediatePropagation();
}, { passive: false });
