

var margin = {top: 20, right: 60, bottom: 30, left: 20},
    width = window.innerWidth - margin.left - margin.right,
    height = window.innerHeight - margin.top - margin.bottom;

var svg = d3.select(".chart").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g");

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
  return timeStamps.slice(lowInd,highInd);
}

//get the stored tabs
chrome.storage.local.get(null, function(items){

  console.log(items);
  var timeStamps = Object.keys(items).sort();
  timeStamps = timeStamps.map(function(x){
    return parseInt(x,10);
  });
  var timeStampRange = getTabRange(0,timeStamps[timeStamps.length-1],timeStamps);
  
  var startTime = timeStamps[0];
  var endTime = timeStamps[timeStamps.length -1];

  var tabAmnt = [];
  var windAmnt = [];
  function getTabsinRange(timeStampRange){
    var tabs = [];
    for(var time in timeStampRange) {
      var numberOfTabs = 0;
      var numberOfWindows = 0;
      numberOfWindows += items[timeStamps[time]].windows.length;
      for(var wind in items[timeStamps[time]].windows){
        numberOfTabs += items[timeStamps[time]].windows[wind].length;
        for(var ind in items[timeStamps[time]].windows[wind]){
          var tab = items[timeStamps[time]].windows[wind][ind];
          var sesh = items[timeStamps[time]].sessionId;
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
              tabIndex: ind,
              windowIndex: wind,
              born: +timeStamps[time],
              died: -1
            }
            tabs.push(tabObj);
          }
        }
      }
      tabAmnt.push(numberOfTabs);
      windAmnt.push(numberOfWindows)
    }

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
  var maxNumTabs = d3.max(tabAmnt);
  var maxNumWindows = d3.max(windAmnt);
  console.log("maxTabs: " + maxNumTabs);
  console.log("maxWindows " + maxNumWindows);

  
  var barHeight = height/maxNumWindows/maxNumTabs;
  console.log("barHeight " + barHeight);
  
  var x = d3.time.scale()
    .domain([startTime, endTime])
    .range([0, width]);

  var y = d3.scale.linear()
    .domain([0, tabs.length])
    .range([0, height]);

  var windowAxis = d3.scale.linear()
    .domain([0, 2*maxNumWindows])
    .range([height/maxNumWindows, height]);

  var tabAxis = d3.scale.linear()
    .domain([0, maxNumTabs])
    .range([0, height/maxNumWindows]);

  var printNum = 0;

  var zoom = d3.behavior.zoom()
    .scaleExtent([1,40])
    .on("zoom", draw);

  svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "whitesmoke")
      .attr("stroke", "black")
      .attr("stroke-width", 0.5);


  var colorScale = d3.scale.linear()
    .domain([0, 1])
    .range(["hsl(0,50%,50%)", "hsl(300,50%,50%)"])
    .interpolate(d3.interpolateHsl);


  var bar = svg.selectAll("g")
    .data(tabs)
    .enter().append("g");

  bar.append("rect")
    .attr("transform", function(d,i) {
      return "translate(" + x(d.born) + "," + transformTab(d,i) + ")";
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
      var sesh = d.tabId;//d.sessionId;
      return colorScale(sesh);
    });

    bar.attr('opacity',0);
    bar.transition().duration(500)
      .attr('opacity',1);

  svg.append("rect")
      .attr("class", "overlay")
      .attr("width", width)
      .attr("height", height)
      .call(zoom);

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

  function transformTab(d,i){
    if (printNum < 10) {
      console.log("window: " + d.windowIndex);
      console.log("windowPix: " + windowAxis(d.windowIndex));
      console.log("tab: " + d.tabIndex);
      console.log("tabPix: " + tabAxis(d.tabIndex));
      console.log(windowAxis(2*d.windowIndex) + tabAxis(d.tabIndex))
    }
    printNum++;
    return windowAxis(2*d.windowIndex) + tabAxis(d.tabIndex);
    //return y(i);
  }

  function draw() {
    svg.select("g.x.axis").call(xAxis);
    bar.attr("transform", transformView);
  }

  function transformView(d) {
    return "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")";
  }
});
