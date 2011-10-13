<script type="text/javascript">
Ext.onReady(function() {
    
	Ext.QuickTips.init();

	Ext.ux.TimeframeButtonGroup.prototype.frames = iG.timeFrames.getAll();

    var start = '<?php echo $t['start']; ?>',
        end = '<?php echo $t['end']; ?>';//,
        width = <?php echo $t['width']; ?>,
        height = <?php echo $t['height']; ?>,
        host = '<?php echo $t['host']; ?>',
        service = '<?php echo $t['service']; ?>';

    if(start) {
        var t = strtotime(start);

    	if(t != false) {
    		t = Math.ceil(t*1000);
    		start = new Date(t);
    	}
    }

    if(end) {
        var t = strtotime(end);

        if(t != false) {
            t = Math.ceil(t*1000);
            end = new Date(t);
        }
    }
    
    var viewport = new Ext.Viewport();

    viewport.add({
        xtype : 'flot',
        width : width,
        height : height,
        store : new Ext.iG.FlotJsonStore({
            url : 'data/plots',
            baseParams : {
                host : host,
                service : service,
                start : start ? start/1000 : '',
                end : end ? end/1000 : Math.ceil((new Date()).getTime()/1000)
            }
        })
    });
    

    viewport.doLayout();
});
</script>

