<script type="text/javascript">
Ext.onReady(function() {
    
	Ext.QuickTips.init();

	Ext.ux.TimeframeButtonGroup.prototype.frames = iG.timeFrames.getAll();

    var viewport = new Ext.iG.Viewport({
        host : '<?php echo $t['host']; ?>',
        service : '<?php echo $t['service']; ?>',
        provider : {
            hosts : 'data/hosts',
            services : 'data/services',
            views : 'data/combined',
            plots : 'data/plots'
        }
    });
    

    viewport.doLayout();
    
});
</script>
