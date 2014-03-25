var session = 0;
var listenerEnable = false;

//chrome.runtime.onStartup.addListener(function(){
  //console.log(session);
  chrome.storage.local.get(null, function(items){
    //console.log(session);
    if (Object.keys(items).length > 0){
      var highestInd = Object.keys(items).sort().pop();
      session = items[highestInd].sessionId + 1;
      console.log(session);
    }
    listenerEnable = true;
  });
  //listenerEnable = true;
//});

function saveData() {
  if(listenerEnable){
  	chrome.windows.getAll({"populate" : true}, function(wins) {
      var json = { sessionId: session,
        windows : []};
      for (var i = 0; i < wins.length; i++) {
        var tabsArr = [];
        //console.log("session: " + wins[i].sessionId);
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
        //console.log(json.windows);
    	}  
      var date = new Date().getTime();
      var key = new String(date).valueOf();
      //console.log(typeof(time));
      var data = {};
      data[key] = json;
      //console.log(data);

      chrome.storage.local.set(data);
      chrome.storage.local.get(null, function(items){
        console.log(items);
      });
      /*chrome.storage.local.getBytesInUse(null,function(bytes){
        console.log(bytes);
      })*/
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
