<script type="text/javascript">
Ext.ns('Ext.iG');

Ext.iG.Viewport = function() {
    var viewport = null;
    return {
        init: function() {
            var urls = {
                provider: {
                    template: "<?php echo $ro->gen(
                        'modules.ingraph.provider.template'); ?>",
                    values: "<?php echo $ro->gen(
                        'modules.ingraph.provider.values'); ?>"
                }
            };
            Ext.iG.Urls.overwrite(urls);
            var cfg = Ext.apply(<?php echo json_encode($t, true); ?>, {
                tbar: false,
                baseCls: 'x-plain',
                autoScroll: false,
                panelsCfg: {
                    tbar: false,
                    baseCls: 'x-plain',
                    header: false,
                    showEmpty: true,
                    overview: false
                }
            });
            var size = {
                    height: cfg.height || 200,
                    width: cfg.width || 600
            };
            Ext.apply(cfg, size);
            Ext.apply(cfg.panelsCfg, size);
            view = new Ext.iG.View(cfg);
            viewport = new Ext.Viewport({
                renderTo: 'content',
                items: [view]
            });
            viewport.doLayout();
        }
    }
}();

Ext.onReady(Ext.iG.Viewport.init, Ext.iG.Viewport);
</script>