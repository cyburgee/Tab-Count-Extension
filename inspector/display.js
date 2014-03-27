var now = new Date().getTime();

var margin = {top: 60, right: 60, bottom: 60, left: 60},
    width = window.innerWidth - margin.left - margin.right,
    height = window.innerHeight - margin.top - margin.bottom;
    twoPi = 2 * Math.PI,
    progress = 0,
    formatPercent = d3.format(".0%");

var arc = d3.svg.arc()
    .startAngle(0)
    .innerRadius(180)
    .outerRadius(240);


var svg = d3.select("body").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


svg.append("text")
  .attr("x", width/2)
  .attr("y", -margin.top/2)
  .style("font", "30px Helvetica")
  .style("text-anchor", "middle")
  .style("letter-spacing", "-1px")
  .style("fill", "black")
  .text("Tabs Rule Everything Around Me");

svg.append("rect")
  .attr("width", width)
  .attr("height", height)
  .attr("fill", "whitesmoke")
  .attr('opacity',0)
  .transition().duration(500)
    .attr('opacity',1);

svg.append("text")
  .attr("transform", "translate(" + -margin.left +"," + height/2 + ")")
  .style("text-anchor", "start")
  .style("font-weight", "bold")
  .text("Tab")
  .attr('opacity',0)
  .transition().duration(250)
    .attr('opacity',1);

svg.append("text")
  .attr("transform", "translate(" + (width/2) + "," + (height + margin.bottom/2) + ")")
  .style("text-anchor", "middle")
  .style("font-weight", "bold")
  .text("Time")
  .attr('opacity',0)
  .transition().duration(250)
    .attr('opacity',1);

var colorScale = d3.scale.linear()
  .domain([0, 1])
  .range(["hsl(0,50%,50%)", "hsl(200,50%,50%)"])
  .interpolate(d3.interpolateHsl);


var svg2 = d3.select("svg").append("svg")
  .attr("x", margin.left)
  .attr("y", margin.top)
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)


var svg3 = svg2.append("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("overflow", "hidden")



var loading = svg.append("g")
    .attr("class", "progress-meter")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

var loadText = loading.append("text")
  .style("text-anchor", "middle")
  .style("font-weight", "bold")
  .style("font", "15px Helvetica Neue")
  .text("Loading...")
  .attr('opacity',0)
  .transition().duration(250)
    .attr('opacity',1);

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
  if (numminutes == 0 && numhours == 0 && numdays == 0 && numyears == 0)
    return numseconds + " seconds";
  else if (numhours == 0 && numdays == 0 && numyears == 0)
    return numminutes + " minutes " + numseconds + " seconds";
  else if (numdays == 0 && numyears == 0)
    return numhours + " hours " + numminutes + " minutes " + numseconds + " seconds";
  else if (numyears == 0)
    return numdays + " days " + numhours + " hours " + numminutes + " minutes " + numseconds + " seconds";
  return numyears + " years " +  numdays + " days " + numhours + " hours " + numminutes + " minutes " + numseconds + " seconds";
}

var maxNumWindows = 0;

function doThangs() {
  chrome.storage.local.get(null, function(items){
    ////console.log(items);
    var timeStampsStrings = Object.keys(items).sort();
    var timeStamps = timeStampsStrings.map(function(x){
      return parseInt(x,10);
    });

    //var timeStampRange = getTabRange(0,timeStamps[timeStamps.length-1],timeStamps);
    
    var timeStampRange = timeStamps;

    var startTime = timeStamps[0];
    var endTime = timeStamps[timeStamps.length -1] + 1;

    var tabAmnt = [];
    var windAmnt = [];
    var seshNums = [];

    var total = timeStamps.length*3;

    var tabs = [];

    function getTabsinRange(timeStampRange,tabs){
      //var tabs = [];

      for(var time in timeStampRange) {
        ////console.log(time);
        var timePiece = timeStamps[time];
        var numberOfTabs = 0;
        var numberOfWindows = 0;
        numberOfWindows += items[timeStamps[time]].windows.length;
        var sesh = items[timeStamps[time]].sessionId;
        for(var wind in items[timeStamps[time]].windows){
          numberOfTabs += items[timeStamps[time]].windows[wind].length;
          for(var ind in items[timeStamps[time]].windows[wind]){
            var tab = items[timeStamps[time]].windows[wind][ind];
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

          //tabs[tab].died = new Date().getTime();
          //tabs[tab].died = now + 1;
          tabs[tab].died = _.find(timeStamps, function(num) {
            return num > tabs[tab].born;
          });
        }
      }

      //return tabs;
    }


    getTabsinRange(timeStampRange,tabs);

    var maxSesh = d3.max(seshNums);
    var maxSeshTime = timeStamps[seshNums.indexOf(maxSesh)];

    var maxNumTabs = d3.max(tabAmnt);
    //console.log(tabAmnt);
    var maxTabsTime = timeStamps[tabAmnt.indexOf(maxNumTabs)];
    //console.log(maxTabsTime);

    maxNumWindows = d3.max(windAmnt);
    var maxWindTime = timeStamps[windAmnt.indexOf(maxNumWindows)];



    var tabLives = [];
    var maxWindInd = [];
    var maxTabsInd = [];
    for(var tab in tabs ){
      //if(isNaN(tabs[tab].died - tabs[tab].born)){
          //var date = new Date().getTime();
          //var key = new String(date).valueOf();
        //  tabs[tab].died = now;
       // }
        tabLives.push(tabs[tab].died - tabs[tab].born);
        if (tabs[tab].born <= maxWindTime && tabs[tab].died >= maxWindTime)
          maxWindInd.push(tab);
        if (tabs[tab].born <= maxTabsTime && tabs[tab].died >= maxTabsTime)
          maxTabsInd.push(+tab);
    }

    //console.log(maxTabsInd);
    var avgTabLife = Math.round(d3.mean(tabLives));
    var avgNumTabs = Math.round(d3.mean(tabAmnt));



    var oldestTab = d3.max(tabLives);
    var oldestTabIndex = tabLives.indexOf(oldestTab);

    if (timeStampsStrings.length == 0){
      avgTabLife = 0;
      avgNumTabs = 0;
      oldestTab = 0;
      maxNumTabs = 0;
    }

    ////console.log("maxSesh: " + maxSesh);
    ////console.log("maxSeshTime: " + maxSeshTime);
    ////console.log("maxTabs: " + maxNumTabs);
    ////console.log("maxTabsTime: " + maxTabsTime);
    ////console.log("maxWindows " + maxNumWindows);
    ////console.log("maxWindTime " + maxWindTime);
    
    var barHeight = height/tabs.length;

    //var date = new Date().getTime();
    //var now = new String(date).valueOf();

  ////console.log(startTime);
  ////console.log(now);
    var x = d3.time.scale()
      .domain([startTime, now + 1])
      //.domain([startTime, new Date().getTime()])
      .range([0, width]);

    var y = d3.scale.linear()
      .domain([0, tabs.length])
      .range([0, height]);

    var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom")
      .tickSize(-height, 0)
      .tickPadding(6);

    var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .tickSize(-width, 0)
      .tickPadding(6)
      .tickFormat(d3.format("d"))
      .tickSubdivide(0);

    var zoom = d3.behavior.zoom()
      .x(x)
      .y(y)
      .scaleExtent([1,80])
      .on("zoom", draw);
      
    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .attr('opacity',0)
      .transition().duration(2000)
        .attr('opacity',1)
      .call(xAxis);

    svg.append("g")
      .attr("class", "y axis")
      .attr('opacity',0)
      .transition().duration(2000)
        .attr('opacity',1)
      .call(yAxis);

  //console.log(tabs);

  var bar = svg3.selectAll("g")
      .data(tabs)
      .enter().append("g");


  bar.append("rect")
    .attr("transform", function(d,i) {
      return "translate(" + x(d.born) + "," + y(i) + ")";
    })
    .attr("width", function(d) {
      if(isNaN(x(d.died) - x(d.born))){
        //var date = new Date().getTime();
        //var key = new String(date).valueOf();
        //d.died = +key;
        d.died = now;
      }
      return x(d.died) - x(d.born);
    })
    .attr("height", 0.75*barHeight)
    //.attr("rx", 0.5)
    //.attr("ry", 0.5)
    .style("fill", function(d){
      var sesh = d.sessionId;
      return colorScale(sesh);
    })
    .attr("overflow", "hidden");

  bar.attr('opacity',0);
  bar.transition().duration(1000)
    .attr('opacity',1);


  var avgLifeTabLabel = svg3.append("text")
    .attr("x", 10 )
    .attr("y", height - 20)
    .style("text-anchor", "start")
    .style("font", "15px Helvetica Neue")
    .text("Average Tab Life: " + secondsToString(avgTabLife/1000))
    //.attr('opacity',0)
    //.transition().duration(1000)
    //.attr('opacity',1);

  var avgNumTabLabel = svg3.append("text")
    .attr("x", 10 )
    .attr("y", height - 20 - 15)
    .style("text-anchor", "start")
    .style("font", "15px Helvetica Neue")
    .text("Average Number of Tabs Open: " + avgNumTabs)
    //.attr('opacity',0)
    //.transition().duration(1000)
    //.attr('opacity',1);

  svg3.append("rect")
    .attr("class", "overlay")
    .attr("width", width)
    .attr("height", height)
    .call(zoom);

  var oldTabLabelUnder = svg3.append("text")
    .attr("x", (width - 10) )
    .attr("y", 20)
    .style("font", "15px Helvetica Neue")
    .style("font-weight","bold")
    .style("fill", "black")
    .text("Longest-Lived Tab: " + secondsToString(oldestTab/1000));

  var oldTabBox = oldTabLabelUnder.node().getBBox();

  ////console.log(oldTabBox);
  var oldTabBackground = svg3.append("rect")
    .attr("x", oldTabBox.x)
    .attr("y", oldTabBox.y)
    .attr("rx", 2)
    .attr("ry", 2)
    .attr("width", oldTabBox.width)
    .attr("height", oldTabBox.height)
    .style("fill","black")
    .style("text-shadow", "2px 0 0 #fff, -2px 0 0 #fff, 0 2px 0 #fff, 0 -2px 0 #fff, 1px 1px #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff")
    .attr("opacity", 0);

  var oldTabLabel = svg3.append("text")
    .attr("x", (width - 10) )
    .attr("y", 20)
    .style("font", "15px Helvetica Neue")
    .style("font-weight","bold")
    .style("fill", "white")
    .attr("opacity", 0)
    .text("Longest-Lived Tab: " + secondsToString(oldestTab/1000));

   var oldTabOverlay = svg3.append("rect")
      .attr("class", "overlay")
      .attr("x", oldTabBox.x)
      .attr("y", oldTabBox.y)
      .attr("width", oldTabBox.width)
      .attr("height", oldTabBox.height)
      .style("cursor","pointer")
      .on("mouseover", function() {
        oldTabBackground.attr("opacity", 1);
        oldTabLabel.attr("opacity", 1);
        mostTabsLabelUnder.attr("opacity", 0.2);
        avgLifeTabLabel.attr("opacity",0.2);
        avgNumTabLabel.attr("opacity", 0.2);
        var data = tabs[oldestTabIndex];
        var select = bar[0][oldestTabIndex];
        var selectAgain = d3.selectAll(bar[0]).filter(function(d,i){
          if (i != oldestTabIndex)
            return d;
        });
        selectAgain.selectAll("rect")
          .style("opacity", 0.2);
      })
      .on("mouseout", function(){
        mostTabsLabelUnder.attr("opacity", 1);
        avgLifeTabLabel.attr("opacity",1);
        avgNumTabLabel.attr("opacity", 1);
        oldTabBackground.attr("opacity", 0);
        oldTabLabel.attr("opacity", 0);
        var data = tabs[oldestTabIndex];
        var select = bar[0][oldestTabIndex];
        var selectAgain = d3.selectAll(bar[0]).filter(function(d,i){
          if (i != oldestTabIndex)
            return d;
        });
        selectAgain.selectAll("rect")
          .style("opacity", 1);
      });


  var mostTabsLabelUnder = svg3.append("text")
    .attr("x", (width - 10) )
    .attr("y", 20+20)
    .style("font", "15px Helvetica Neue")
    .style("font-weight","bold")
    .style("fill", "black")
    .text("Most Tabs Open: " + maxNumTabs)


  var mostTabBox = mostTabsLabelUnder.node().getBBox();

  ////console.log(mostTabBox);

  var mostTabBackground = svg3.append("rect")
    .attr("class", "overlay")
    .attr("x", mostTabBox.x)
    .attr("y", mostTabBox.y)
    .attr("width", mostTabBox.width)
    .attr("height", mostTabBox.height)
    .attr("rx", 2)
    .attr("ry", 2)
    .style("fill", "black")
    .attr("opacity", 0);

  var mostTabsLabel = svg3.append("text")
    .attr("x", (width - 10) )
    .attr("y", 20+20)
    .style("font", "15px Helvetica Neue")
    .style("font-weight","bold")
    .style("fill", "white")
    .text("Most Tabs Open: " + maxNumTabs)
    .attr("opacity", 0);

  var mostTabOverlay = svg3.append("rect")
    .attr("class", "overlay")
    .attr("x", mostTabBox.x)
    .attr("y", mostTabBox.y)
    .attr("width", mostTabBox.width)
    .attr("height", mostTabBox.height)
    .style("cursor","pointer")
    .on("mouseover", function() {
      mostTabBackground.attr("opacity", 1);
      mostTabsLabel.attr("opacity", 1);
      oldTabLabelUnder.attr("opacity", 0.2);
      avgLifeTabLabel.attr("opacity",0.2);
      avgNumTabLabel.attr("opacity", 0.2);
      var select = bar[0][maxTabsInd];
      var selectAgain = d3.selectAll(bar[0]).filter(function(d,i){
        if (maxTabsInd.indexOf(i) < 0)
          return d;
      });
      selectAgain.selectAll("rect")
        .style("opacity", 0.2);
    })
    .on("mouseout", function(){
      oldTabLabelUnder.attr("opacity", 1);
      avgLifeTabLabel.attr("opacity",1);
      avgNumTabLabel.attr("opacity", 1);
      mostTabBackground.attr("opacity", 0);
      mostTabsLabel.attr("opacity", 0);
      var select = bar[0][maxTabsInd];
      var selectAgain = d3.selectAll(bar[0]).filter(function(d,i){
        if (maxTabsInd.indexOf(i) < 0)
          return d;
      });
      selectAgain.selectAll("rect")
        .style("opacity", 1);
      });

  var clearHistoryLabelUnder = svg.append("text")
    .attr("x", width )
    .attr("y", -15)
    .style("font", "15px Helvetica Neue")
    .style("font-weight","bold")
    .style("text-anchor", "end")
    .style("fill", "black")
    .text("Clear History");

  var clearHistoryBox = clearHistoryLabelUnder.node().getBBox();

  var clearHistoryBackground = svg.append("rect")
    .attr("x", clearHistoryBox.x)
    .attr("y", clearHistoryBox.y)
    .attr("rx", 2)
    .attr("ry", 2)
    .attr("width", clearHistoryBox.width)
    .attr("height", clearHistoryBox.height)
    .style("fill","black")
    .attr("opacity", 0);

  var clearHistoryLabel = svg.append("text")
    .attr("x", width )
    .attr("y", -15)
    .style("font", "15px Helvetica Neue")
    .style("font-weight","bold")
    .style("text-anchor", "end")
    .style("fill", "white")
    .attr("opacity", 0)
    .text("Clear History");

  var clearHistoryOverlay = svg.append("rect")
    .attr("class", "overlay")
    .attr("x", clearHistoryBox.x)
    .attr("y", clearHistoryBox.y)
    .attr("width", clearHistoryBox.width)
    .attr("height", clearHistoryBox.height)
    .style("cursor","pointer")
    .on("mouseover", function() {
      clearHistoryBackground.attr("opacity", 1);
      clearHistoryLabel.attr("opacity", 1);
    })
    .on("mouseout", function(){
      clearHistoryBackground.attr("opacity", 0);
      clearHistoryLabel.attr("opacity", 0);
    })
    .on("click", function(){
      chrome.storage.local.clear();
      chrome.extension.getBackgroundPage().session = 0;
      tabs = [];
      d3.selectAll(bar[0]).remove();
      avgLifeTabLabel.text("Average Number of Tabs Open: 0");
      avgNumTabLabel.text("0 seconds");
      oldTabLabelUnder.text("Longest-Lived Tab: 0 seconds");
      oldTabLabel.text("Longest-Lived Tab: 0 seconds");
      mostTabsLabelUnder.text("Most Tabs Open: 0");
      mostTabsLabel.text("Most Tabs Open: 0");
    });

   loading.remove();

    function draw() {
      svg.select("g.x.axis").call(xAxis);
      svg.select("g.y.axis").call(yAxis);
      bar.attr("transform", transform);
    }

    function transform(d) {
      return "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")";
    }
  });
}



function clearOldHistory(){
  chrome.storage.local.getBytesInUse(null,function(bytes){
      console.log(bytes);
      if (bytes >= 5000000) {
        chrome.storage.local.get(null, function(items){
          var timeStampsStrings = Object.keys(items).sort();
          chrome.storage.local.remove(timeStampsStrings.slice(0,10));
        });
        clearOldHistory();
      }
  });
}


function saveData() {
  var session = chrome.extension.getBackgroundPage().session;
    chrome.windows.getAll({"populate" : true}, function(wins) {
      ////console.log("sesh:" + session);
      var json = { sessionId: session,
        windows : []};
      for (var i = 0; i < wins.length; i++) {
        var tabsArr = [];
        ////console.log("session: " + wins[i].sessionId);
        for(var j = 0; j < wins[i].tabs.length; j++){
          var tab = wins[i].tabs[j];
          var tabson= {};
          tabson.windowId = tab.windowId;
          tabson.tabId = tab.id;
          tabson.active = tab.active;
          tabson.openerId = tab.openerTabId;
          tabson.highlight = tab.highlighted;
          tabson.pin = tab.pinned;
          tabson.ind = tab.index;
          //json.windows.push(tabson);
          tabsArr.push(tabson);
          //tabsArr.push(wins[i].tabs[j].id);
        }
        json.windows.push(tabsArr);
        ////console.log(json.windows);
      }  
      //var date = new Date().getTime();
      //var key = new String(date).valueOf();
      ////console.log(typeof(time));
      key = now;
      var data = {};
      ////console.log(json);
      data[key] = json;
      ////console.log(data);

      chrome.storage.local.set(data,function(){
        //console.log(chrome.runtime.lastError);
        if (typeof chrome.runtime.lastError === 'undefined')
          doThangs();
        else{
          clearOldHistory();
          saveData();
        }
      });
    });
}

clearOldHistory();
saveData();
