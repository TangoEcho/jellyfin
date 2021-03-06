define(["dialog", "globalize"], function(dialog, globalize) {
    "use strict";
    return function(text, title) {
        var options;
        options = "string" == typeof text ? {
            title: title,
            text: text
        } : text;
        var items = [];
        return items.push({
            name: options.cancelText || globalize.translate("sharedcomponents#ButtonCancel"),
            id: "cancel",
            type: "cancel" === options.primary ? "submit" : "cancel"
        }), items.push({
            name: options.confirmText || globalize.translate("sharedcomponents#ButtonOk"),
            id: "ok",
            type: "cancel" === options.primary ? "cancel" : "submit"
        }), options.buttons = items, dialog(options).then(function(result) {
            return "ok" === result ? Promise.resolve() : Promise.reject()
        })
    }
});