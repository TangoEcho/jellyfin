define(["connectionManager", "playbackManager", "events", "inputManager", "focusManager", "appRouter"], function(connectionManager, playbackManager, events, inputManager, focusManager, appRouter) {
    "use strict";

    function notifyApp() {
        inputManager.notify()
    }

    function displayMessage(cmd) {
        var args = cmd.Arguments;
        args.TimeoutMs ? require(["toast"], function(toast) {
            toast({
                title: args.Header,
                text: args.Text
            })
        }) : require(["alert"], function(alert) {
            alert({
                title: args.Header,
                text: args.Text
            })
        })
    }

    function displayContent(cmd, apiClient) {
        playbackManager.isPlayingLocally(["Video", "Book", "Game"]) || appRouter.showItem(cmd.Arguments.ItemId, apiClient.serverId())
    }

    function playTrailers(apiClient, itemId) {
        apiClient.getItem(apiClient.getCurrentUserId(), itemId).then(function(item) {
            playbackManager.playTrailers(item)
        })
    }

    function processGeneralCommand(cmd, apiClient) {
        switch (cmd.Name) {
            case "Select":
                return void inputManager.trigger("select");
            case "Back":
                return void inputManager.trigger("back");
            case "MoveUp":
                return void inputManager.trigger("up");
            case "MoveDown":
                return void inputManager.trigger("down");
            case "MoveLeft":
                return void inputManager.trigger("left");
            case "MoveRight":
                return void inputManager.trigger("right");
            case "PageUp":
                return void inputManager.trigger("pageup");
            case "PageDown":
                return void inputManager.trigger("pagedown");
            case "PlayTrailers":
                playTrailers(apiClient, cmd.Arguments.ItemId);
                break;
            case "SetRepeatMode":
                playbackManager.setRepeatMode(cmd.Arguments.RepeatMode);
                break;
            case "VolumeUp":
                return void inputManager.trigger("volumeup");
            case "VolumeDown":
                return void inputManager.trigger("volumedown");
            case "ChannelUp":
                return void inputManager.trigger("channelup");
            case "ChannelDown":
                return void inputManager.trigger("channeldown");
            case "Mute":
                return void inputManager.trigger("mute");
            case "Unmute":
                return void inputManager.trigger("unmute");
            case "ToggleMute":
                return void inputManager.trigger("togglemute");
            case "SetVolume":
                notifyApp(), playbackManager.setVolume(cmd.Arguments.Volume);
                break;
            case "SetAudioStreamIndex":
                notifyApp(), playbackManager.setAudioStreamIndex(parseInt(cmd.Arguments.Index));
                break;
            case "SetSubtitleStreamIndex":
                notifyApp(), playbackManager.setSubtitleStreamIndex(parseInt(cmd.Arguments.Index));
                break;
            case "ToggleFullscreen":
                return void inputManager.trigger("togglefullscreen");
            case "GoHome":
                return void inputManager.trigger("home");
            case "GoToSettings":
                return void inputManager.trigger("settings");
            case "DisplayContent":
                displayContent(cmd, apiClient);
                break;
            case "GoToSearch":
                return void inputManager.trigger("search");
            case "DisplayMessage":
                displayMessage(cmd);
                break;
            case "ToggleOsd":
            case "ToggleContextMenu":
            case "TakeScreenShot":
            case "SendKey":
                break;
            case "SendString":
                focusManager.sendText(cmd.Arguments.String);
                break;
            default:
                console.log("processGeneralCommand does not recognize: " + cmd.Name)
        }
        notifyApp()
    }

    function onMessageReceived(e, msg) {
        var apiClient = this;
        if ("Play" === msg.MessageType) {
            notifyApp();
            var serverId = apiClient.serverInfo().Id;
            "PlayNext" === msg.Data.PlayCommand ? playbackManager.queueNext({
                ids: msg.Data.ItemIds,
                serverId: serverId
            }) : "PlayLast" === msg.Data.PlayCommand ? playbackManager.queue({
                ids: msg.Data.ItemIds,
                serverId: serverId
            }) : playbackManager.play({
                ids: msg.Data.ItemIds,
                startPositionTicks: msg.Data.StartPositionTicks,
                mediaSourceId: msg.Data.MediaSourceId,
                audioStreamIndex: msg.Data.AudioStreamIndex,
                subtitleStreamIndex: msg.Data.SubtitleStreamIndex,
                startIndex: msg.Data.StartIndex,
                serverId: serverId
            })
        } else if ("Playstate" === msg.MessageType) "Stop" === msg.Data.Command ? inputManager.trigger("stop") : "Pause" === msg.Data.Command ? inputManager.trigger("pause") : "Unpause" === msg.Data.Command ? inputManager.trigger("play") : "PlayPause" === msg.Data.Command ? inputManager.trigger("playpause") : "Seek" === msg.Data.Command ? playbackManager.seek(msg.Data.SeekPositionTicks) : "NextTrack" === msg.Data.Command ? inputManager.trigger("next") : "PreviousTrack" === msg.Data.Command ? inputManager.trigger("previous") : notifyApp();
        else if ("GeneralCommand" === msg.MessageType) {
            var cmd = msg.Data;
            processGeneralCommand(cmd, apiClient)
        } else if ("UserDataChanged" === msg.MessageType) {
            if (msg.Data.UserId === apiClient.getCurrentUserId())
                for (var i = 0, length = msg.Data.UserDataList.length; i < length; i++) events.trigger(serverNotifications, "UserDataChanged", [apiClient, msg.Data.UserDataList[i]])
        } else events.trigger(serverNotifications, msg.MessageType, [apiClient, msg.Data])
    }

    function bindEvents(apiClient) {
        events.off(apiClient, "message", onMessageReceived), events.on(apiClient, "message", onMessageReceived)
    }
    var serverNotifications = {};
    return connectionManager.getApiClients().forEach(bindEvents), events.on(connectionManager, "apiclientcreated", function(e, newApiClient) {
        bindEvents(newApiClient)
    }), serverNotifications
});