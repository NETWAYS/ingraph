<script type="text/javascript">
Cronk.util.initEnvironment(<?php CronksRequestUtil::echoJsonString($rd); ?>, function() {

	var panel = new InGraph.Application({
		providerHosts: '<?php echo $ro->gen("modules.ingraph.provider.hosts"); ?>',
		providerServices: '<?php echo $ro->gen("modules.ingraph.provider.services"); ?>'
	});
	
	this.add(panel);
	
	this.doLayout();
});
</script>