define(["loading", "events", "libraryBrowser", "imageLoader", "listView", "cardBuilder", "emby-itemscontainer"], function(loading, events, libraryBrowser, imageLoader, listView, cardBuilder) {
    "use strict";
    return function(view, params, tabContent) {
        function getPageData(context) {
            var key = getSavedQueryKey(context),
                pageData = data[key];
            return pageData || (pageData = data[key] = {
                query: {
                    SortBy: "SeriesSortName,SortName",
                    SortOrder: "Ascending",
                    IncludeItemTypes: "Episode",
                    Recursive: !0,
                    Fields: "PrimaryImageAspectRatio,MediaSourceCount,UserData",
                    IsMissing: !1,
                    ImageTypeLimit: 1,
                    EnableImageTypes: "Primary,Backdrop,Thumb",
                    StartIndex: 0,
                    Limit: pageSize
                },
                view: libraryBrowser.getSavedView(key) || "Poster"
            }, pageData.query.ParentId = params.topParentId, libraryBrowser.loadSavedQueryValues(key, pageData.query)), pageData
        }

        function getQuery(context) {
            return getPageData(context).query
        }

        function getSavedQueryKey(context) {
            return context.savedQueryKey || (context.savedQueryKey = libraryBrowser.getSavedQueryKey("episodes")), context.savedQueryKey
        }

        function onViewStyleChange() {
            var viewStyle = self.getCurrentViewStyle(),
                itemsContainer = tabContent.querySelector(".itemsContainer");
            "List" == viewStyle ? (itemsContainer.classList.add("vertical-list"), itemsContainer.classList.remove("vertical-wrap")) : (itemsContainer.classList.remove("vertical-list"), itemsContainer.classList.add("vertical-wrap")), itemsContainer.innerHTML = ""
        }

        function reloadItems(page) {
            loading.show();
            var query = getQuery(page);
            ApiClient.getItems(Dashboard.getCurrentUserId(), query).then(function(result) {
                function onNextPageClick() {
                    query.StartIndex += query.Limit, reloadItems(tabContent)
                }

                function onPreviousPageClick() {
                    query.StartIndex -= query.Limit, reloadItems(tabContent)
                }
                window.scrollTo(0, 0);
                var html, pagingHtml = libraryBrowser.getQueryPagingHtml({
                        startIndex: query.StartIndex,
                        limit: query.Limit,
                        totalRecordCount: result.TotalRecordCount,
                        showLimit: !1,
                        updatePageSizeSetting: !1,
                        addLayoutButton: !1,
                        sortButton: !1,
                        filterButton: !1
                    }),
                    viewStyle = self.getCurrentViewStyle(),
                    itemsContainer = tabContent.querySelector(".itemsContainer");
                html = "List" == viewStyle ? listView.getListViewHtml({
                    items: result.Items,
                    sortBy: query.SortBy,
                    showParentTitle: !0
                }) : "PosterCard" == viewStyle ? cardBuilder.getCardsHtml({
                    items: result.Items,
                    shape: "backdrop",
                    showTitle: !0,
                    showParentTitle: !0,
                    scalable: !0,
                    cardLayout: !0
                }) : cardBuilder.getCardsHtml({
                    items: result.Items,
                    shape: "backdrop",
                    showTitle: !0,
                    showParentTitle: !0,
                    overlayText: !1,
                    centerText: !0,
                    scalable: !0,
                    overlayPlayButton: !0
                });
                var i, length, elems = tabContent.querySelectorAll(".paging");
                for (i = 0, length = elems.length; i < length; i++) elems[i].innerHTML = pagingHtml;
                for (elems = tabContent.querySelectorAll(".btnNextPage"), i = 0, length = elems.length; i < length; i++) elems[i].addEventListener("click", onNextPageClick);
                for (elems = tabContent.querySelectorAll(".btnPreviousPage"), i = 0, length = elems.length; i < length; i++) elems[i].addEventListener("click", onPreviousPageClick);
                itemsContainer.innerHTML = html, imageLoader.lazyChildren(itemsContainer), libraryBrowser.saveQueryValues(getSavedQueryKey(page), query), loading.hide()
            })
        }
        var self = this,
            pageSize = 100,
            data = {};
        self.showFilterMenu = function() {
                require(["components/filterdialog/filterdialog"], function(filterDialogFactory) {
                    var filterDialog = new filterDialogFactory({
                        query: getQuery(tabContent),
                        mode: "episodes",
                        serverId: ApiClient.serverId()
                    });
                    events.on(filterDialog, "filterchange", function() {
                        reloadItems(tabContent)
                    }), filterDialog.show()
                })
            }, self.getCurrentViewStyle = function() {
                return getPageData(tabContent).view
            },
            function(tabContent) {
                tabContent.querySelector(".btnFilter").addEventListener("click", function() {
                    self.showFilterMenu()
                }), tabContent.querySelector(".btnSort").addEventListener("click", function(e) {
                    libraryBrowser.showSortMenu({
                        items: [{
                            name: Globalize.translate("OptionNameSort"),
                            id: "SeriesSortName,SortName"
                        }, {
                            name: Globalize.translate("OptionTvdbRating"),
                            id: "CommunityRating,SeriesSortName,SortName"
                        }, {
                            name: Globalize.translate("OptionDateAdded"),
                            id: "DateCreated,SeriesSortName,SortName"
                        }, {
                            name: Globalize.translate("OptionPremiereDate"),
                            id: "PremiereDate,SeriesSortName,SortName"
                        }, {
                            name: Globalize.translate("OptionDatePlayed"),
                            id: "DatePlayed,SeriesSortName,SortName"
                        }, {
                            name: Globalize.translate("OptionParentalRating"),
                            id: "OfficialRating,SeriesSortName,SortName"
                        }, {
                            name: Globalize.translate("OptionPlayCount"),
                            id: "PlayCount,SeriesSortName,SortName"
                        }, {
                            name: Globalize.translate("OptionRuntime"),
                            id: "Runtime,SeriesSortName,SortName"
                        }],
                        callback: function() {
                            reloadItems(tabContent)
                        },
                        query: getQuery(tabContent),
                        button: e.target
                    })
                });
                var btnSelectView = tabContent.querySelector(".btnSelectView");
                btnSelectView.addEventListener("click", function(e) {
                    libraryBrowser.showLayoutMenu(e.target, self.getCurrentViewStyle(), "List,Poster,PosterCard".split(","))
                }), btnSelectView.addEventListener("layoutchange", function(e) {
                    var viewStyle = e.detail.viewStyle;
                    getPageData(tabContent).view = viewStyle, libraryBrowser.saveViewSetting(getSavedQueryKey(tabContent), viewStyle), onViewStyleChange(), reloadItems(tabContent)
                })
            }(tabContent), onViewStyleChange(), self.renderTab = function() {
                reloadItems(tabContent)
            }, self.destroy = function() {}
    }
});