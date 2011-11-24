<script type="text/javascript">

Cronk.util.initEnvironment(<?php CronksRequestUtil::echoJsonString($rd); ?>, function() {
    if(!Ext.iG.Urls.available) {
        var urls = {
            provider: {
                hosts: "<?php echo $ro->gen('modules.ingraph.provider.hosts'); ?>",
                services: "<?php echo $ro->gen(
                    'modules.ingraph.provider.services'); ?>",
                views: "<?php echo $ro->gen('modules.ingraph.provider.views'); ?>",
                plots: "<?php echo $ro->gen('modules.ingraph.provider.plots'); ?>",
                template: "<?php echo $ro->gen(
                    'modules.ingraph.provider.template'); ?>",
                values: "<?php echo $ro->gen(
                    'modules.ingraph.provider.values'); ?>",
                view: "<?php echo $ro->gen('modules.ingraph.provider.view'); ?>"
            },
            comments: {
                add: "<?php echo $ro->gen('modules.ingraph.comments.add'); ?>",
                edit: "<?php echo $ro->gen('modules.ingraph.comments.edit'); ?>",
                delete: "<?php echo $ro->gen(
                    'modules.ingraph.comments.delete'); ?>"
            }
        };
        Ext.iG.Urls.overwrite(urls);
    }

    var host = "<?php echo $rd->getParameter('host'); ?>",
        service = "<?php echo $rd->getParameter('service'); ?>",
        view = "<?php echo $rd->getParameter('view'); ?>";
    var state = Ext.state.Manager.getProvider().get(this.stateuid);
    if(!state) {
        if(!host && !service && !view) {
            var menu = new Ext.iG.Menu();
            var w = new Ext.Window({
                title: 'inGraph',
                modal: true,
                items: menu
            });
            menu.on('plot', function(cb, cfg) {
                cfg.stateId = this.stateuid;
                var p = new Ext.iG.View(cfg);
                p.on({
                    scope: this,
                    single: true,
                    __igpanel__complete: function(p) {
                    	Ext.iG.Cronk.setTitle.call(this, cfg);
                    	Ext.state.Manager.set(p.stateId, p.getState());
                    }
                });
                this.add(p);
                this.doLayout();
                w.destroy();
            }, this);
            w.on('close', function() {
                // Remove cronk
                this.getParent().destroy();
            }, this);
            w.show();
        } else {
            var cfg = {
                host: host,
                service: service,
                view: view,
                stateId: this.stateuid
            };
            var p = new Ext.iG.View(cfg);
            p.on({
                scope: this,
                single: true,
                __igpanel__complete: function(p) {
                	Ext.iG.Cronk.setTitle.call(this, p.title);
                	Ext.state.Manager.set(p.stateId, p.getState());
                }
            });
            this.add(p);
            this.doLayout();
        }
    } else {
        var cfg = {
            stateId: this.stateuid,
            stateEvents: []
        };
        var p = new Ext.iG.View(cfg);
        this.add(p);
        this.doLayout();
    }
});
</script>