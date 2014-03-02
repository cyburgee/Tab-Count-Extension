//var width = window.innerWidth,
//    height = window.innerHeight;

var margin = {top: 20, right: 60, bottom: 30, left: 20},
    width = window.innerWidth - margin.left - margin.right,
    height = window.innerHeight - margin.top - margin.bottom;

var svg = d3.select(".chart").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g");
  //.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  //.call(d3.behavior.zoom().scaleExtent([1,20]).on("zoom",zoom))
  //.append("g");


/*function zoom() {
  svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  svg.select("g.x.axis").call(xAxis);
}*/

var startTime = -1;
var endTime = -1;

function getTabRange(starting, ending, timeStamps) {
  var low = 0;
  var high = 0;
  var low = _.find(timeStamps,function(time) {
    return time >= starting;
  });
  var high = _.find(timeStamps.reverse(), function(time) {
    return time <= ending;
  });
  timeStamps = timeStamps.reverse();
  var lowInd = timeStamps.indexOf(low);
  var highInd = timeStamps.indexOf(high);
  //console.log(timeStamps.slice(lowInd,highInd));
  return timeStamps.slice(lowInd,highInd);
}

/*function numTabsAtTime(timeStamp){


}
function numWindowsAtTime(timeStamp){

}*/

//get the stored tabs
chrome.storage.local.get(null, function(items){


  console.log(items);
  var timeStamps = Object.keys(items).sort();
  timeStamps = timeStamps.map(function(x){
    return parseInt(x,10);
  });
  var timeStampRange = getTabRange(0,timeStamps[timeStamps.length-1],timeStamps);
  //console.log(timeStampRange);

  /*chrome.storage.local.getBytesInUse(null,function(bytesInUse) {
    console.log("bytesInUse: " + bytesInUse);
  });*/

  
  var startTime = timeStamps[0];
  var endTime = timeStamps[timeStamps.length -1];

  function getTabsinRange(timeStampRange){
    var tabs = [];
    for(var time in timeStampRange) {
      var timePiece = timeStamps[time];
      for(var wind in items[timeStamps[time]].windows){
        for(var ind in items[timeStamps[time]].windows[wind]){
          var tab = items[timeStamps[time]].windows[wind][ind];
          //console.log(tab);
          var sesh = items[timeStamps[time]].sessionId;
          //console.log(sesh);
          var tabIsAlive = _.find(tabs,function(t) {
            return t.tabId == tab.tabId && t.windowId == tab.windowId && t.sessionId == sesh;
          });
          if(tabIsAlive)
            tabIsAlive.died = +timeStamps[time];
          else{
            var tabObj = {
              sessionId: items[timeStamps[time]].sessionId,
              tabId: tab.tabId,
              windowId: tab.windowId,
              born: +timeStamps[time],
              died: -1
            }
            tabs.push(tabObj);
          }
        }
      }
    }
    //console.log(tabs);

    for (var tab in tabs){
      if (tabs[tab].died == -1){
        tabs[tab].died = _.find(timeStamps, function(num) {
          return num > tabs[tab].born;
        });
      }
    }
    return tabs;
  }


  var tabs = getTabsinRange(timeStampRange,tabs);
  
  var barHeight = height/tabs.length;
  
  var x = d3.time.scale()
    .domain([startTime, endTime])
    .range([0, width]);

  var y = d3.scale.linear()
    .domain([0, tabs.length])
    .range([0, height]);

  /*var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .tickSize(-height, 0)
    .tickPadding(6);*/


  var zoom = d3.behavior.zoom()
    .scaleExtent([1,10])
    .on("zoom", draw);

  /*svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")");*/
  svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "whitesmoke")
      .attr("stroke", "black")
      .attr("stroke-width", 0.5);

  svg.append("rect")
      .attr("class", "overlay")
      .attr("width", width)
      .attr("height", height)
      .call(zoom);

  var colorScale = d3.scale.linear()
    .domain([0, 1])
    .range(["hsl(0,50%,50%)", "hsl(300,50%,50%)"])
    .interpolate(d3.interpolateHsl);


  var bar = svg.selectAll("g")
    .data(tabs)
    .enter().append("g");

  bar.append("rect")
    .attr("transform", function(d,i) {
      if(d.born == null){
        console.log(d);
      }
      return "translate(" + x(d.born) + "," + y(i) + ")";
    })
    .attr("width", function(d) {
      if(isNaN(x(d.died) - x(d.born))){
        console.log(d.died);
        console.log(d.born);
        var date = new Date().getTime();
        var key = new String(date).valueOf();
        console.log(typeof(key));
        d.died = +key;
      }
      return x(d.died) - x(d.born);
    })
    .attr("height", barHeight/2)
    .style("fill", function(d){
      var sesh = d.sessionId;
      return colorScale(sesh);
    });

    bar.attr('opacity',0);
    bar.transition().duration(500)
      .attr('opacity',1);

  svg.append("rect")
      .attr("width",width)
      .attr("height", height)
      .style("fill", "white")
      .attr("transform", "translate(0," + height + ")");

  svg.append("rect")
      .attr("width",width)
      .attr("height", height*2)
      .style("fill", "white")
      .attr("transform", "translate(" + width +",0)");

  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")");

  var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .tickSize(-height, 0)
    .tickPadding(6);

  zoom.x(x);
    draw();

  function draw() {
    svg.select("g.x.axis").call(xAxis);
    bar.attr("transform", transform);
    //bar.selectAll("rect").call(xAxis);
  }
  function transform(d) {
  return "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")";
}
  /*function redraw(someArray){

    var bars = svg.selectAll("g")
      .data(someArray);
      

    bars.exit().transition().duration(1000)
      .attr('opacity',0)
      .remove();
  }


  var label = svg.append("text")
    .attr("class", "year label")
    .attr("text-anchor", "end")
    .attr("y", height - 24)
    .attr("x", width)
    .text(new Date(startTime).toLocaleDateString() + " " + new Date(startTime).toLocaleTimeString());

  var box = label.node().getBBox();

  var overlay = svg.append("rect")
      .attr("class", "overlay")
      .attr("x", box.x)
      .attr("y", box.y)
      .attr("width", box.width)
      .attr("height", box.height)
      .on("mouseover", enableInteraction);

  function enableInteraction() {
    var yearScale = d3.scale.linear()
        .domain([startTime, endTime])
        .range([box.x + 10, box.x + box.width - 10])
        .clamp(true);

    // Cancel the current transition, if any.
    svg.transition().duration(0);

    overlay
        .on("mouseover", mouseover)
        .on("mouseout", mouseout)
        .on("mousemove", mousemove)
        .on("touchmove", mousemove);

    function mouseover() {
      label.classed("active", true);
    }

    function mouseout() {
      label.classed("active", false);
    }

    function mousemove() {
      var scaleThing = yearScale.invert(d3.mouse(this)[0]);
      //console.log(scaleThing);
      var times = getTabRange(scaleThing,endTime,timeStamps);
      //console.log(times);
      var data = [];
      _.map(times,function(i){
        //console.log(i);
        data.push(tabs[i]);
      });
    
      var newTabs = getTabsinRange(times);
      
      redraw(newTabs);
      //console.log(data);
      displayYear(yearScale.invert(d3.mouse(this)[0]));
    }*/

    // Tweens the entire chart by first tweening the year, and then the data.
      // For the interpolated data, the dots and label are redrawn.
    /*function tweenYear() {
      var year = d3.interpolateNumber(startTime, endTime);
      return function(t) { displayYear(year(t)); };
    }
    // Updates the display to show the specified year.
    function displayYear(year) {
      //dot.data(interpolateData(year), key).call(position).sort(order);
      //console.log(year.toDateString());
      label.text(new Date(year).toLocaleDateString() + " " + new Date(year).toLocaleTimeString());
    }*/
    /*var items = foo.selectAll('bar').data(someArray);
    items.enter().append('bar')
      .attr('opacity',0)
      .attr('foo',initialPreAnimationValue);
    items.exit().transition().duration(500)
      .attr('opacity',0)
      .remove();
    items.transition.duration(500)
      .attr('opacity',1)
      .attr('foo',function(d){ return d });*/
});
