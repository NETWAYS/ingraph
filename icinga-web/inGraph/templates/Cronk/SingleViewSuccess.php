<script type="text/javascript">

Cronk.util.initEnvironment(<?php CronksRequestUtil::echoJsonString($rd); ?>, function() {
    Ext.ux.TimeframeButtonGroup.prototype.frames = iG.timeFrames.getAll();
    
    var p = new Ext.Window({
        title : 'inGraph',
        modal : true,
        items : new Ext.iG.Menu({
        	stateId : this.stateuid,
            provider : {
                hosts : "<?php echo $ro->gen('modules.ingraph.provider.hosts'); ?>",
                services : "<?php echo $ro->gen('modules.ingraph.provider.services'); ?>",
                views : "<?php echo $ro->gen('modules.ingraph.provider.views'); ?>",
                plots : "<?php echo $ro->gen('modules.ingraph.provider.plots'); ?>",
                combined : "<?php echo $ro->gen('modules.ingraph.provider.combined'); ?>"
            },
            plugins: [new Ext.iG.SingleLayout({
            	single : this
            })],
            timeFrames : (function() {
                var frames = iG.timeFrames.getAll().clone();

                frames.each(function(frame) {
                    if(!frame.overview) {
                        frame.show = false;
                    }
                });

                return frames;
            })()
        })
    });
    
    if(!Ext.state.Manager.getProvider().get(this.stateuid)) {
	    p.on('close', function() {
	        this.getParent().destroy();
	    }, this);
	
	    p.show();
    }
});
</script>