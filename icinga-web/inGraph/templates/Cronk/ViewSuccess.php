<script type="text/javascript">

Cronk.util.initEnvironment(<?php CronksRequestUtil::echoJsonString($rd); ?>, function() {
    var provider = {
        hosts: "<?php echo $ro->gen('modules.ingraph.provider.hosts'); ?>",
        services: "<?php echo $ro->gen('modules.ingraph.provider.services'); ?>",
        views: "<?php echo $ro->gen('modules.ingraph.provider.views'); ?>",
        plots: "<?php echo $ro->gen('modules.ingraph.provider.plots'); ?>",
        combined: "<?php echo $ro->gen('modules.ingraph.provider.combined'); ?>"
    };
    var menu = new Ext.iG.Menu({
        provider: provider
    });
    var w = new Ext.Window({
        title: 'inGraph',
        modal: true,
        items: menu
    });
    menu.on('plothostservice', function(cfg, timeFrames) {
        var p = new Ext.iG.Panel.hostService(cfg, timeFrames);
        this.add(p);
        this.doLayout();
        w.destroy();
    }, this);
    w.on('close', function() {
        this.getParent().destroy();
    }, this);
    w.show();
});
</script>