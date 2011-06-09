<script type="text/javascript">
Ext.onReady(function() {
	Ext.QuickTips.init();

	Ext.ux.TimeframeButtonGroup.prototype.frames = iG.timeFrames.getAll();

    var viewport = new Ext.iG.Interface.Viewport({
        host : '<?php echo $t['host']; ?>',
        service : '<?php echo $t['service']; ?>',
    });

    viewport.doLayout();
});
</script>
