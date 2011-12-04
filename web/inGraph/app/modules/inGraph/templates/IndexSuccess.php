<script type="text/javascript">
Ext.ns('Ext.iG');

Ext.iG.Viewport = function() {
    var viewport = null,
        titleTpl = new Ext.XTemplate(
            '<tpl if="values.view">{view}</tpl>',
            '<tpl if="!values.view">',
                '{host}', '<tpl if="values.service"> - {service}</tpl>',
            '</tpl>',
            {compiled: true});
    return {
        init: function() {
            Ext.QuickTips.init();

            var menu = new Ext.iG.Menu({
                region: 'north',
                height: 100,
            });

            var tabs = new Ext.TabPanel({
                region: 'center',
                plugins : [new Ext.ux.TabScrollerMenu()],
                enableTabScroll: true,
                defaults: {
                    closable: true
                }
            });

            var addTab = function(cfg) {
                cfg.title = titleTpl.apply(cfg);
                var t = tabs.add(new Ext.iG.View(cfg));
                tabs.setActiveTab(t);
                tabs.doLayout();
            };

            menu.on('plot', function(cb, cfg) {
                addTab(cfg);
            });
            
            viewport = new Ext.Viewport({
                layout: 'border',
                renderTo: 'content',
                items: [menu, tabs]
            });

            <?php if($t) { $cfg = json_encode($t, true);
echo <<<JS
var cfg = $cfg;
            addTab(cfg);
JS;
            } ?>

            viewport.render();
            viewport.doLayout();
        }
    }
}();

Ext.onReady(Ext.iG.Viewport.init, Ext.iG.Viewport);
</script>