define([], function() {
    "use strict";
    return function(view, params) {
        view.addEventListener("viewbeforeshow", function(e) {
            var elem = view.querySelector("#appVersionNumber");
            elem.innerHTML = elem.innerHTML.replace("{0}", ConnectionManager.appVersion())
        })
    }
});