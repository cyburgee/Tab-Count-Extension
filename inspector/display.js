

var margin = {top: 60, right: 60, bottom: 60, left: 60},
    width = window.innerWidth - margin.left - margin.right,
    height = window.innerHeight - margin.top - margin.bottom;

var svg = d3.select(".chart").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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

function secondsToString(seconds) {
  var numyears = Math.floor(seconds / 31536000);
  var numdays = Math.floor((seconds % 31536000) / 86400); 
  var numhours = Math.floor(((seconds % 31536000) % 86400) / 3600);
  var numminutes = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60);
  var numseconds = Math.floor((((seconds % 31536000) % 86400) % 3600) % 60);
  return numyears + " years " +  numdays + " days " + numhours + " hours " + numminutes + " minutes " + numseconds + " seconds";
}

var maxNumWindows = 0;



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
  var seshNums = [];

  function getTabsinRange(timeStampRange){
    var tabs = [];
    for(var time in timeStampRange) {
      var timePiece = timeStamps[time];
      var numberOfTabs = 0;
      var numberOfWindows = 0;
      numberOfWindows += items[timeStamps[time]].windows.length;
      var sesh = items[timeStamps[time]].sessionId;
      for(var wind in items[timeStamps[time]].windows){
        numberOfTabs += items[timeStamps[time]].windows[wind].length;
        for(var ind in items[timeStamps[time]].windows[wind]){
          var tab = items[timeStamps[time]].windows[wind][ind];
          //console.log(tab);
          //var sesh = items[timeStamps[time]].sessionId;
          //console.log(sesh);
          //seshNums.push(sesh);
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
      seshNums.push(sesh);
      tabAmnt.push(numberOfTabs);
      windAmnt.push(numberOfWindows);
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

  var maxSesh = d3.max(seshNums);
  var maxSeshTime = timeStamps[seshNums.indexOf(maxSesh)];

  var maxNumTabs = d3.max(tabAmnt);
  var maxTabsTime = timeStamps[tabAmnt.indexOf(maxNumTabs)];

  maxNumWindows = d3.max(windAmnt);
  var maxWindTime = timeStamps[windAmnt.indexOf(maxNumWindows)];


  var tabLives = [];
  var maxWindInd = [];
  var maxTabsInd = [];
  for(var tab in tabs ){
      tabLives.push(tabs[tab].died - tabs[tab].born);
      if (tabs[tab].born <= maxWindTime && tabs[tab].died >= maxWindTime)
        maxWindInd.push(tab);
      if (tabs[tab].born <= maxTabsTime && tabs[tab].died >= maxTabsTime)
        maxTabsInd.push(+tab);
  }

  console.log(maxTabsInd);


  var oldestTab = d3.max(tabLives);
  var oldestTabIndex = tabLives.indexOf(oldestTab);

  console.log("maxSesh: " + maxSesh);
  console.log("maxSeshTime: " + maxSeshTime);
  console.log("maxTabs: " + maxNumTabs);
  console.log("maxTabsTime: " + maxTabsTime);
  console.log("maxWindows " + maxNumWindows);
  console.log("maxWindTime " + maxWindTime);
  
  var barHeight = height/tabs.length;
  
  var x = d3.time.scale()
    .domain([startTime, endTime])
    .range([margin.left, width-margin.left]);

  var y = d3.scale.linear()
    .domain([0, tabs.length])
    .range([margin.top, height-margin.bottom]);

  svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "whitesmoke")
      .attr("stroke", "black")
      .attr("stroke-width", 0.5);

  var colorScale = d3.scale.linear()
    .domain([0, 1])
    .range(["hsl(0,50%,50%)", "hsl(200,50%,50%)"])
    .interpolate(d3.interpolateHsl);


  var bar = svg.selectAll("g")
    .data(tabs)
    .enter().append("g");


  bar.append("rect")
    .attr("transform", function(d,i) {
      if(d.born == null){
        console.log(d);
      }

      /*if (d.born == maxTabsTime){
        //console.log("fuckit");
        //console.log("translate(" + x(d.born) + "," + y(i) + ")");
        bar.append("text")
          .attr("transform", "translate(" + x(d.born) + "," + y(i) + ")")
          .text("Most Tabs Open: " + maxNumTabs);
      }
      else if (d.born == maxWindTime){
        //console.log("fuckit");
        //console.log("translate(" + x(d.born) + "," + y(i) + ")");
        bar.append("text")
          .attr("transform", "translate(" + x(d.born) + "," + y(i) + ")")
          .text("Most Windows Open: " + maxNumWindows);
      }
      else if (i == oldestTabIndex){
        bar.append("text")
          .attr("transform", "translate(" + x(d.born) + "," + y(i) + ")")
          .text("Oldest Tab: " + secondsToString(oldestTab/1000));
      }*/
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
    .attr("height", 0.75*barHeight)
    //.attr("rx", 0.5)
    //.attr("ry", 0.5)
    .style("fill", function(d){
      var sesh = d.sessionId;
      return colorScale(sesh);
    });

    bar.attr('opacity',0);
    bar.transition().duration(1000)
      .attr('opacity',1);


  var zoom = d3.behavior.zoom()
    .x(x)
    .y(y)
    .scaleExtent([1,80])
    .on("zoom", draw);

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
      .attr("height", height+ margin.top + margin.bottom)
      .style("fill", "white")
      .attr("transform", "translate(" + width +"," + -margin.top + ")");

  svg.append("rect")
    .attr("width",width)
    .attr("height", margin.top)
    .attr("transform", "translate(0," + -margin.top + ")")
    .style("fill", "white");

  svg.append("rect")
    .attr("width",margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .attr("transform", "translate(" + -margin.left + "," + -margin.top +")")
    .style("fill", "white");


  var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .tickSize(-height, 0)
    .tickPadding(6);

  var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .tickSize(-height, 0)
    .tickPadding(6);

  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);

  svg.append("text")
    .attr("transform", "translate(" + -margin.left +"," + height/2 + ")")
    .style("text-anchor", "start")
    .style("font-weight", "bold")
    .text("Tab");

  svg.append("text")
    .attr("transform", "translate(" + (width/2) + "," + (height + margin.bottom/2) + ")")
    .style("text-anchor", "middle")
    .style("font-weight", "bold")
    .text("Time");

  var oldTabLabel = svg.append("text")
    .attr("x", (width - 10) )
    .attr("y", 20)
    .style("font", "15px Helvetica Neue")
    .style("font-weight","bold")
    .text("Longest-Lived Tab: " + secondsToString(oldestTab/1000));

  var oldTabBox = oldTabLabel.node().getBBox();

  console.log(oldTabBox);

  var oldTabOverlay = svg.append("rect")
        .attr("class", "overlay")
        .attr("x", oldTabBox.x)
        .attr("y", oldTabBox.y)
        .attr("width", oldTabBox.width)
        .attr("height", oldTabBox.height)
        .on("mouseover", function() {
          var data = tabs[oldestTabIndex];
          var select = bar[0][oldestTabIndex];
          var selectAgain = d3.selectAll(bar[0]).filter(function(d,i){
            if (i != oldestTabIndex)
              return d;
          });
          selectAgain.selectAll("rect")
            .style("opacity", 0.25);
        })
        .on("mouseout", function(){
          var data = tabs[oldestTabIndex];
          var select = bar[0][oldestTabIndex];
          var selectAgain = d3.selectAll(bar[0]).filter(function(d,i){
            if (i != oldestTabIndex)
              return d;
          });
          selectAgain.selectAll("rect")
            .style("opacity", 1);
        });


  var mostTabsLabel = svg.append("text")
    .attr("x", (width - 10) )
    .attr("y", 20+15)
    .style("font", "15px Helvetica Neue")
    .style("font-weight","bold")
    .text("Most Tabs Open: " + maxNumTabs);

  var mostTabBox = mostTabsLabel.node().getBBox();

  console.log(mostTabBox);

  var mostTabOverlay = svg.append("rect")
        .attr("class", "overlay")
        .attr("x", mostTabBox.x)
        .attr("y", mostTabBox.y)
        .attr("width", mostTabBox.width)
        .attr("height", mostTabBox.height)
        .on("mouseover", function() {
          var select = bar[0][maxTabsInd];
          var selectAgain = d3.selectAll(bar[0]).filter(function(d,i){
            if (maxTabsInd.indexOf(i) < 0)
              return d;
          });
          selectAgain.selectAll("rect")
            .style("opacity", 0.25);
        })
        .on("mouseout", function(){
          var select = bar[0][maxTabsInd];
          var selectAgain = d3.selectAll(bar[0]).filter(function(d,i){
            if (maxTabsInd.indexOf(i) < 0)
              return d;
          });
          selectAgain.selectAll("rect")
            .style("opacity", 1);
        });


  function draw() {
    svg.select("g.x.axis").call(xAxis);
    svg.select("g.y.axis").call(yAxis);
    bar.attr("transform", transform);
  }

  function transform(d) {
    return "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")";
  }
});
