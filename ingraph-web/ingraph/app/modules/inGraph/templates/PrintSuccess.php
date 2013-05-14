<script type="text/javascript">
if (!Ext.ux.ingraph.Urls.available) {
    var urls = {
        provider: {
            hosts: "<?php echo $ro->gen('ingraph.provider.hosts'); ?>",
            services: "<?php echo $ro->gen(
                'ingraph.provider.services'); ?>",
            views: "<?php echo $ro->gen('ingraph.provider.views'); ?>",
            plots: "<?php echo $ro->gen('ingraph.provider.plots'); ?>",
            template: "<?php echo $ro->gen(
                'ingraph.provider.template'); ?>",
            values: "<?php echo $ro->gen(
                'ingraph.provider.values'); ?>",
            view: "<?php echo $ro->gen('ingraph.provider.view'); ?>"
        },
        comments: {
            create: "<?php echo $ro->gen('ingraph.comments.create'); ?>",
            update: "<?php echo $ro->gen('ingraph.comments.update'); ?>",
            remove: "<?php echo $ro->gen(
                'ingraph.comments.delete'); ?>"
        },
        templates: {
            create: "<?php echo $ro->gen('ingraph.templates.create'); ?>",
            update: "<?php echo $ro->gen('ingraph.templates.update'); ?>"
        },
        views: {
            create: "<?php echo $ro->gen('ingraph.views.create'); ?>",
            update: "<?php echo $ro->gen('ingraph.views.update'); ?>"
        }
    };
    Ext.ux.ingraph.Urls.overwrite(urls);
}
(function () {
    "use strict";

    Ext.ns('Ext.ux.ingraph');

    Ext.ux.ingraph.Viewport = (function () {
        var viewport = null,
            view = null;
        return {
            init: function() {
                var cfg = Ext.apply(<?php echo json_encode($t); ?>, {
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
