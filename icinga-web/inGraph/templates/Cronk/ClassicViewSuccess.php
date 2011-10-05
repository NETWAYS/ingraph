<script type="text/javascript">

Cronk.util.initEnvironment(<?php CronksRequestUtil::echoJsonString($rd); ?>, function() {
    Ext.ux.TimeframeButtonGroup.prototype.frames = iG.timeFrames.getAll();
    
    var iv = new Ext.iG.Viewport({
        stateId : this.stateuid,
        provider : {
            hosts : "<?php echo $ro->gen('modules.ingraph.provider.hosts'); ?>",
            services : "<?php echo $ro->gen('modules.ingraph.provider.services'); ?>",
            views : "<?php echo $ro->gen('modules.ingraph.provider.views'); ?>",
            plots : "<?php echo $ro->gen('modules.ingraph.provider.plots'); ?>",
            combined : "<?php echo $ro->gen('modules.ingraph.provider.combined'); ?>"
        },
        timeFrames : iG.timeFrames.getAll().clone(),
        host : "<?php echo $rd->getParameter('host'); ?>",
        service : "<?php echo $rd->getParameter('service'); ?>"
    });
    
    this.add(iv);
    
    this.doLayout();
});
</script>