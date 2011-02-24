<script type="text/javascript">
Cronk.util.initEnvironment(<?php CronksRequestUtil::echoJsonString($rd); ?>, function() {

	var panel = new InGraph.Application();
	
	this.add(panel);
	
	this.doLayout();
});
</script>