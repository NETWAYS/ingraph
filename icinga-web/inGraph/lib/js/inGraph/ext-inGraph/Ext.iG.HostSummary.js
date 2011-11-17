Ext.ns('Ext.iG');
/**
 * @class Ext.iG.HostSummary
 * @extends Ext.Panel
 */
Ext.iG.HostSummary = Ext.extend(Ext.Panel, {
    limit: 20,
    header: false,
    border: false,
    
    initComponent: function() {
        var cfg = {};
        if(!this.store) {
            this.store = new Ext.data.ArrayStore({
                autoLoad: true,
                autoDestroy: true,
                url: this.provider.services,
                root: 'results',
                fields: ['service'],
                totalProperty: 'total',
                paramNames: {
                    start: 'offset'
                },
                baseParams: {
                    host: this.host,
                    offset: 0,
                    limit: this.limit
                },
                idProperty: 'service'
            });
        }
        cfg.items = new Ext.DataView({
            tpl: new Ext.XTemplate(
                '<tpl for=".">',
                    '<div class="iG-service-preview" id="{service}">',
                        '<div class="thumb">',
                            '<img src="images/cronks/Stats2.png"',
                                  'title="{service}">',
                        '</div>',
                        '<span class="x-editable" qtip="{service}">',
                            '{service:ellipsis(13)}',
                        '</span>',
                    '</div>',
                '</tpl>',
                '<div class="x-clear"></div>'
            ),
            overClass: 'x-view-over',
            itemSelector: 'div.iG-service-preview',
            emptyText: _('No Services.'),
            store: this.store,
            listeners: {
                scope: this,
                click: this.onClick
            }
        });
        cfg.bbar = new Ext.PagingToolbar({
            store: this.store,
            pageSize: this.limit,
            displayInfo: true
        });
        Ext.apply(this, Ext.apply(this.initialConfig, cfg));
        Ext.iG.HostSummary.superclass.initComponent.call(this);
    },
    
    onClick: function(hs, index, node) {
        var service = hs.getRecord(node).get('service');
        Ext.iG.Cronk.open({
            title: 'inGraph: ' + this.host + ' - ' + service,
            host: this.host,
            service: service
        });
    },
    
    getState: function() {
        return {
            host: this.host,
            provider: {
                services: this.provider.services
            },
            xtype: 'hostsummary'
        };
    }
});
Ext.reg('hostsummary', Ext.iG.HostSummary);
