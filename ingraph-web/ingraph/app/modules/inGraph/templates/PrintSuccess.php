<script type="text/javascript">
(function () {
    "use strict";

    Ext.ns('Ext.ux.ingraph');

    Ext.ux.ingraph.Viewport = (function () {
        var viewport = null;
        return {
            init: function() {
                var cfg = Ext.apply(<?php echo json_encode($t, true); ?>, {
                        tbarConfig: {
                            enable: false
                        },
                        baseCls: 'x-plain',
                        autoScroll: false,
                        panelConfig: {
                            tbarConfig: {
                                enable: false
                            },
                            baseCls: 'x-plain',
                            header: false,
                            showEmpty: true,
                            overview: false
                        }
                    }),
                    size = {
                        height: cfg.height || 200,
                        width: cfg.width || 600
                    };
                Ext.apply(cfg, size);
                Ext.apply(cfg.panelConfig, size);
                view = new Ext.ux.ingraph.View(cfg);
                viewport = new Ext.Viewport({
                    renderTo: 'content',
                    items: [view]
                });
                viewport.doLayout();
            }
        }
    }());

    Ext.onReady(Ext.ux.ingraph.Viewport.init, Ext.ux.ingraph.Viewport);
}());
</script>