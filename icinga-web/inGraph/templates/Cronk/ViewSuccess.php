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
            'modules.ingraph.provider.values'); ?>"
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
                Ext.state.Manager.set(this.stateuid, p.getState());
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
            Ext.state.Manager.set(this.stateuid, p.getState());
        }
    } else {
        var cfg = {
            timeFrames: new Ext.iG.TimeFrames(),
            stateId: this.stateuid,
            stateEvents: []
        };
        var p = new Ext.iG.Panel(cfg);
        this.add(p);
        this.doLayout();
    }
});
</script>