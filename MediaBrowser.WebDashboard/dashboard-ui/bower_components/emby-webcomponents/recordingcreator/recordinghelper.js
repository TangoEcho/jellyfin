define(["globalize", "loading", "connectionManager", "registrationServices"], function(globalize, loading, connectionManager, registrationServices) {
    "use strict";

    function changeRecordingToSeries(apiClient, timerId, programId, confirmTimerCancellation) {
        return loading.show(), apiClient.getItem(apiClient.getCurrentUserId(), programId).then(function(item) {
            return item.IsSeries ? apiClient.getNewLiveTvTimerDefaults({
                programId: programId
            }).then(function(timerDefaults) {
                return apiClient.createLiveTvSeriesTimer(timerDefaults).then(function() {
                    loading.hide(), sendToast(globalize.translate("sharedcomponents#SeriesRecordingScheduled"))
                })
            }) : confirmTimerCancellation ? cancelTimerWithConfirmation(timerId, apiClient.serverId()) : cancelTimer(apiClient.serverId(), timerId, !0)
        })
    }

    function cancelTimerWithConfirmation(timerId, serverId) {
        return new Promise(function(resolve, reject) {
            require(["confirm"], function(confirm) {
                confirm({
                    text: globalize.translate("sharedcomponents#MessageConfirmRecordingCancellation"),
                    primary: "cancel",
                    confirmText: globalize.translate("sharedcomponents#HeaderCancelRecording"),
                    cancelText: globalize.translate("sharedcomponents#HeaderKeepRecording")
                }).then(function() {
                    loading.show(), cancelTimer(connectionManager.getApiClient(serverId), timerId, !0).then(resolve, reject)
                }, reject)
            })
        })
    }

    function cancelSeriesTimerWithConfirmation(timerId, serverId) {
        return new Promise(function(resolve, reject) {
            require(["confirm"], function(confirm) {
                confirm({
                    text: globalize.translate("sharedcomponents#MessageConfirmRecordingCancellation"),
                    primary: "cancel",
                    confirmText: globalize.translate("sharedcomponents#HeaderCancelSeries"),
                    cancelText: globalize.translate("sharedcomponents#HeaderKeepSeries")
                }).then(function() {
                    loading.show(), connectionManager.getApiClient(serverId).cancelLiveTvSeriesTimer(timerId).then(function() {
                        require(["toast"], function(toast) {
                            toast(globalize.translate("sharedcomponents#SeriesCancelled"))
                        }), loading.hide(), resolve()
                    }, reject)
                }, reject)
            })
        })
    }

    function cancelTimer(apiClient, timerId, hideLoading) {
        return loading.show(), apiClient.cancelLiveTvTimer(timerId).then(function() {
            !1 !== hideLoading && (loading.hide(), sendToast(globalize.translate("sharedcomponents#RecordingCancelled")))
        })
    }

    function createRecording(apiClient, programId, isSeries) {
        return loading.show(), apiClient.getNewLiveTvTimerDefaults({
            programId: programId
        }).then(function(item) {
            return (isSeries ? apiClient.createLiveTvSeriesTimer(item) : apiClient.createLiveTvTimer(item)).then(function() {
                loading.hide(), sendToast(globalize.translate("sharedcomponents#RecordingScheduled"))
            })
        })
    }

    function sendToast(msg) {
        require(["toast"], function(toast) {
            toast(msg)
        })
    }

    function showMultiCancellationPrompt(serverId, programId, timerId, timerStatus, seriesTimerId) {
        return new Promise(function(resolve, reject) {
            require(["dialog"], function(dialog) {
                var items = [];
                items.push({
                    name: globalize.translate("sharedcomponents#HeaderKeepRecording"),
                    id: "cancel",
                    type: "submit"
                }), "InProgress" === timerStatus ? items.push({
                    name: globalize.translate("sharedcomponents#HeaderStopRecording"),
                    id: "canceltimer",
                    type: "cancel"
                }) : items.push({
                    name: globalize.translate("sharedcomponents#HeaderCancelRecording"),
                    id: "canceltimer",
                    type: "cancel"
                }), items.push({
                    name: globalize.translate("sharedcomponents#HeaderCancelSeries"),
                    id: "cancelseriestimer",
                    type: "cancel"
                }), dialog({
                    text: globalize.translate("sharedcomponents#MessageConfirmRecordingCancellation"),
                    buttons: items
                }).then(function(result) {
                    var apiClient = connectionManager.getApiClient(serverId);
                    "canceltimer" === result ? (loading.show(), cancelTimer(apiClient, timerId, !0).then(resolve, reject)) : "cancelseriestimer" === result ? (loading.show(), apiClient.cancelLiveTvSeriesTimer(seriesTimerId).then(function() {
                        require(["toast"], function(toast) {
                            toast(globalize.translate("sharedcomponents#SeriesCancelled"))
                        }), loading.hide(), resolve()
                    }, reject)) : resolve()
                }, reject)
            })
        })
    }

    function toggleRecording(serverId, programId, timerId, timerStatus, seriesTimerId) {
        return registrationServices.validateFeature("dvr").then(function() {
            var apiClient = connectionManager.getApiClient(serverId),
                hasTimer = timerId && "Cancelled" !== timerStatus;
            return seriesTimerId && hasTimer ? showMultiCancellationPrompt(serverId, programId, timerId, timerStatus, seriesTimerId) : hasTimer && programId ? changeRecordingToSeries(apiClient, timerId, programId, !0) : programId ? createRecording(apiClient, programId) : Promise.reject()
        })
    }
    return {
        cancelTimer: cancelTimer,
        createRecording: createRecording,
        changeRecordingToSeries: changeRecordingToSeries,
        toggleRecording: toggleRecording,
        cancelTimerWithConfirmation: cancelTimerWithConfirmation,
        cancelSeriesTimerWithConfirmation: cancelSeriesTimerWithConfirmation
    }
});