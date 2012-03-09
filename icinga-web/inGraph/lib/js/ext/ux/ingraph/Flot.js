/*
 * Rebuild query sent to the plot values provider on adding and removing
 * series. Reloads the store.
 */

(function () {
    "use strict";

    var rebuildQuery = function () {
        // rebuild query based on template's series
        var series = Ext.pluck(this.template.getRange(), 'json'),
            query = Ext.encode(Ext.ux.ingraph.Util.buildQuery(series));

        this.store.setBaseParam('query', query);

        this.store.reload();
    };

    Ext.override(Ext.ux.flot.Flot, {
        // private
        onTemplateadd: rebuildQuery,

        // private
        onTemplateremove: rebuildQuery
    });
}());
