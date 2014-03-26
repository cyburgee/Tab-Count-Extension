var session = 0;
var listenerEnable = false;

chrome.runtime.onStartup.addListener(function(){
  console.log("startup");
  chrome.storage.local.get(null, function(items){
    if (Object.keys(items).length > 0){
      var highestInd = Object.keys(items).sort().pop();
      session = items[highestInd].sessionId + 1;
      //console.log("sesh:" + session);
    }
    listenerEnable = true;
  });
  //console.log("sesh:" + session);
});

function saveData() {
  if(listenerEnable){
  	chrome.windows.getAll({"populate" : true}, function(wins) {

      var json = { sessionId: session,
        windows : []};
      for (var i = 0; i < wins.length; i++) {
        var tabsArr = [];
        for(var j = 0; j < wins[i].tabs.length; j++){
          var tab = wins[i].tabs[j];
          var tabson= {};
          tabson.windowId = tab.windowId;
          tabson.tabId = tab.id;
          //tabson.active = tab.active;
          //tabson.openerId = tab.openerTabId;
          //tabson.highlight = tab.highlighted;
          //tabson.pin = tab.pinned;
          //tabson.ind = tab.index;
          tabsArr.push(tabson);
        }
        json.windows.push(tabsArr);
    	}  
      var date = new Date().getTime();
      var key = new String(date).valueOf();
      var data = {};
      data[key] = json;
      chrome.storage.local.set(data);
    });
  }
}


chrome.tabs.onCreated.addListener(function(tab){
  if(listenerEnable){
	 saveData();
  }
});

chrome.tabs.onRemoved.addListener(function(tabId,removeInfo){
  if(listenerEnable){
   saveData();
 }
});

chrome.tabs.onDetached.addListener(function(tabId,detachInfo){
  if(listenerEnable){
   saveData();
  }
});

chrome.tabs.onAttached.addListener(function(tabId,attachInfo){
  if(listenerEnable){
   saveData();
 }
});

chrome.alarms.create("testAlarm", {"when": Date.now(), "periodInMinutes": 10.0});

chrome.alarms.onAlarm.addListener(function(alarm){
  if(listenerEnable){
   saveData();
  }
});

chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.create({url:chrome.extension.getURL("tabs_api.html")});
});
