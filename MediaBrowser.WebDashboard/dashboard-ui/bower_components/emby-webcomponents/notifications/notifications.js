define(["serverNotifications", "playbackManager", "events", "globalize", "require"], function(serverNotifications, playbackManager, events, globalize, require) {
    "use strict";

    function onOneDocumentClick() {
        document.removeEventListener("click", onOneDocumentClick), document.removeEventListener("keydown", onOneDocumentClick), window.Notification && Notification.requestPermission()
    }

    function closeAfter(notification, timeoutMs) {
        setTimeout(function() {
            notification.close ? notification.close() : notification.cancel && notification.cancel()
        }, timeoutMs)
    }

    function resetRegistration() {
        var serviceWorker = navigator.serviceWorker;
        serviceWorker && serviceWorker.ready.then(function(registration) {
            serviceWorkerRegistration = registration
        })
    }

    function showPersistentNotification(title, options, timeoutMs) {
        serviceWorkerRegistration.showNotification(title, options)
    }

    function showNonPersistentNotification(title, options, timeoutMs) {
        try {
            var notif = new Notification(title, options);
            notif.show && notif.show(), timeoutMs && closeAfter(notif, timeoutMs)
        } catch (err) {
            if (!options.actions) throw err;
            options.actions = [], showNonPersistentNotification(title, options, timeoutMs)
        }
    }

    function showNotification(options, timeoutMs, apiClient) {
        var title = options.title;
        if (options.data = options.data || {}, options.data.serverId = apiClient.serverInfo().Id, options.icon = options.icon || getIconUrl(), options.badge = options.badge || getIconUrl("badge.png"), resetRegistration(), serviceWorkerRegistration) return void showPersistentNotification(title, options, timeoutMs);
        showNonPersistentNotification(title, options, timeoutMs)
    }

    function showNewItemNotification(item, apiClient) {
        if (!playbackManager.isPlayingLocally(["Video"])) {
            var body = item.Name;
            item.SeriesName && (body = item.SeriesName + " - " + body);
            var notification = {
                    title: "New " + item.Type,
                    body: body,
                    vibrate: !0,
                    tag: "newItem" + item.Id,
                    data: {}
                },
                imageTags = item.ImageTags || {};
            imageTags.Primary && (notification.icon = apiClient.getScaledImageUrl(item.Id, {
                width: 80,
                tag: imageTags.Primary,
                type: "Primary"
            })), showNotification(notification, 15e3, apiClient)
        }
    }

    function onLibraryChanged(data, apiClient) {
        var newItems = data.ItemsAdded;
        newItems.length && (newItems.length > 12 && (newItems.length = 12), apiClient.getItems(apiClient.getCurrentUserId(), {
            Recursive: !0,
            Limit: 3,
            Filters: "IsNotFolder",
            SortBy: "DateCreated",
            SortOrder: "Descending",
            Ids: newItems.join(","),
            MediaTypes: "Audio,Video",
            EnableTotalRecordCount: !1
        }).then(function(result) {
            for (var items = result.Items, i = 0, length = items.length; i < length; i++) showNewItemNotification(items[i], apiClient)
        }))
    }

    function getIconUrl(name) {
        return name = name || "notificationicon.png", require.toUrl(".").split("?")[0] + "/" + name
    }

    function showPackageInstallNotification(apiClient, installation, status) {
        apiClient.getCurrentUser().then(function(user) {
            if (user.Policy.IsAdministrator) {
                var notification = {
                    tag: "install" + installation.Id,
                    data: {}
                };
                if ("completed" === status ? (notification.title = globalize.translate("sharedcomponents#PackageInstallCompleted").replace("{0}", installation.Name + " " + installation.Version), notification.vibrate = !0) : "cancelled" === status ? notification.title = globalize.translate("sharedcomponents#PackageInstallCancelled").replace("{0}", installation.Name + " " + installation.Version) : "failed" === status ? (notification.title = globalize.translate("sharedcomponents#PackageInstallFailed").replace("{0}", installation.Name + " " + installation.Version), notification.vibrate = !0) : "progress" === status && (notification.title = globalize.translate("sharedcomponents#InstallingPackage").replace("{0}", installation.Name + " " + installation.Version), notification.actions = [{
                        action: "cancel-install",
                        title: globalize.translate("sharedcomponents#ButtonCancel"),
                        icon: getIconUrl()
                    }], notification.data.id = installation.id), "progress" === status) {
                    var percentComplete = Math.round(installation.PercentComplete || 0);
                    notification.body = percentComplete + "% complete."
                }
                showNotification(notification, "cancelled" === status ? 5e3 : 0, apiClient)
            }
        })
    }
    document.addEventListener("click", onOneDocumentClick), document.addEventListener("keydown", onOneDocumentClick);
    var serviceWorkerRegistration;
    resetRegistration(), events.on(serverNotifications, "LibraryChanged", function(e, apiClient, data) {
        onLibraryChanged(data, apiClient)
    }), events.on(serverNotifications, "PackageInstallationCompleted", function(e, apiClient, data) {
        showPackageInstallNotification(apiClient, data, "completed")
    }), events.on(serverNotifications, "PackageInstallationFailed", function(e, apiClient, data) {
        showPackageInstallNotification(apiClient, data, "failed")
    }), events.on(serverNotifications, "PackageInstallationCancelled", function(e, apiClient, data) {
        showPackageInstallNotification(apiClient, data, "cancelled")
    }), events.on(serverNotifications, "PackageInstalling", function(e, apiClient, data) {
        showPackageInstallNotification(apiClient, data, "progress")
    }), events.on(serverNotifications, "ServerShuttingDown", function(e, apiClient, data) {
        showNotification({
            tag: "restart" + apiClient.serverInfo().Id,
            title: globalize.translate("sharedcomponents#ServerNameIsShuttingDown", apiClient.serverInfo().Name)
        }, 0, apiClient)
    }), events.on(serverNotifications, "ServerRestarting", function(e, apiClient, data) {
        showNotification({
            tag: "restart" + apiClient.serverInfo().Id,
            title: globalize.translate("sharedcomponents#ServerNameIsRestarting", apiClient.serverInfo().Name)
        }, 0, apiClient)
    }), events.on(serverNotifications, "RestartRequired", function(e, apiClient) {
        var serverId = apiClient.serverInfo().Id,
            notification = {
                tag: "restart" + serverId,
                title: globalize.translate("sharedcomponents#PleaseRestartServerName", apiClient.serverInfo().Name)
            };
        notification.actions = [{
            action: "restart",
            title: globalize.translate("sharedcomponents#ButtonRestart"),
            icon: getIconUrl()
        }], showNotification(notification, 0, apiClient)
    })
});