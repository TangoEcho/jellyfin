define([], function() {
    "use strict";

    function getDisplayPlayMethod(session) {
        return session.NowPlayingItem ? session.TranscodingInfo && session.TranscodingInfo.IsVideoDirect ? "DirectStream" : "Transcode" === session.PlayState.PlayMethod ? "Transcode" : "DirectStream" === session.PlayState.PlayMethod ? "DirectPlay" : "DirectPlay" === session.PlayState.PlayMethod ? "DirectPlay" : void 0 : null
    }
    return {
        getDisplayPlayMethod: getDisplayPlayMethod
    }
});