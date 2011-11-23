<script type="text/javascript">

Cronk.util.initEnvironment(<?php CronksRequestUtil::echoJsonString($rd); ?>, function() {
    var provider = {
        hosts: "<?php echo $ro->gen('modules.ingraph.provider.hosts'); ?>",
        services: "<?php echo $ro->gen(
            'modules.ingraph.provider.services'); ?>",
        views: "<?php echo $ro->gen('modules.ingraph.provider.views'); ?>",
        plots: "<?php echo $ro->gen('modules.ingraph.provider.plots'); ?>",
        combined: "<?php echo $ro->gen(
            'modules.ingraph.provider.combined'); ?>",
        template: "<?php echo $ro->gen(
            'modules.ingraph.provider.template'); ?>",
        values: "<?php echo $ro->gen(
            'modules.ingraph.provider.values'); ?>",
        view: "<?php echo $ro->gen('modules.ingraph.provider.view'); ?>"
    };
    var host = "<?php echo $rd->getParameter('host'); ?>",
        service = "<?php echo $rd->getParameter('service'); ?>",
        view = "<?php echo $rd->getParameter('view'); ?>";
    var state = Ext.state.Manager.getProvider().get(this.stateuid);
    if(!state) {
        if(!host && !service && !view) {
            var menu = new Ext.iG.Menu({
                provider: provider
            });
            var w = new Ext.Window({
                title: 'inGraph',
                modal: true,
                items: menu
            });
            menu.on('plot', function(cb, cfg) {
                cfg.provider = provider;
                cfg.stateId = this.stateuid;
                var p = new Ext.iG.View(cfg);
                p.on({
                    scope: this,
                    single: true,
                    __igpanel__complete: function(p) {
                    	Ext.iG.Cronk.setTitle.call(this, p.title);
                    	Ext.state.Manager.set(p.stateId, p.getState());
                    }
                })
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
                provider: provider,
                timeFrames: new Ext.iG.TimeFrames(),
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
            timeFrames: new Ext.iG.TimeFrames(),
            stateId: this.stateuid,
            stateEvents: []
        };
        var p = new Ext.iG.View(cfg);
        this.add(p);
        this.doLayout();
    }
});
</script>