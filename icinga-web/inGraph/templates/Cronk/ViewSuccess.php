<script type="text/javascript">

Cronk.util.initEnvironment(<?php CronksRequestUtil::echoJsonString($rd); ?>, function() {
    var provider = {
        hosts: "<?php echo $ro->gen('modules.ingraph.provider.hosts'); ?>",
        services: "<?php echo $ro->gen(
                             'modules.ingraph.provider.services'); ?>",
        views: "<?php echo $ro->gen('modules.ingraph.provider.views'); ?>",
        plots: "<?php echo $ro->gen('modules.ingraph.provider.plots'); ?>",
        combined: "<?php echo $ro->gen(
                             'modules.ingraph.provider.combined'); ?>"
    };
    var host = "<?php echo $rd->getParameter('host'); ?>",
        service = "<?php echo $rd->getParameter('service'); ?>",
        view = "<?php echo $rd->getParameter('view'); ?>";
    if(!Ext.state.Manager.getProvider().get(this.stateuid)) {
        if(!host && !service && !view) {
            var menu = new Ext.iG.Menu({
                provider: provider
            });
            var w = new Ext.Window({
                title: 'inGraph',
                modal: true,
                items: menu
            });
            menu.on('plot', function(cb, cfg, timeFrames) {
                cfg.provider = provider;
                cfg.timeFrames = timeFrames;
                cfg.stateId = this.stateuid;
                var p = new Ext.iG.Panel(cfg);
                this.getParent().setTitle(p.title);
                Ext.fly(this.getParent().tabEl).child(
                    'span.x-tab-strip-text', true).qtip = p.title;
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
            var p = new Ext.iG.Panel(cfg);
            this.getParent().setTitle(p.title);
            Ext.fly(this.getParent().tabEl).child(
                    'span.x-tab-strip-text', true).qtip = p.title;
            this.add(p);
            this.doLayout();
        }
    }
});
</script>