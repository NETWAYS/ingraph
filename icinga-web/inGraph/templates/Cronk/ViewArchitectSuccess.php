<script type="text/javascript">
Cronk.util.initEnvironment(<?php CronksRequestUtil::echoJsonString($rd); ?>, function() {
    if (!Ext.ux.ingraph.Urls.available) {
        var urls = {
            provider: {
                hosts: "<?php echo $ro->gen('modules.ingraph.provider.hosts'); ?>",
                services: "<?php echo $ro->gen(
                    'modules.ingraph.provider.services'); ?>",
                views: "<?php echo $ro->gen('modules.ingraph.provider.views'); ?>",
                plots: "<?php echo $ro->gen('modules.ingraph.provider.plots'); ?>",
                template: "<?php echo $ro->gen(
                    'modules.ingraph.provider.template'); ?>",
                values: "<?php echo $ro->gen(
                    'modules.ingraph.provider.values'); ?>",
                view: "<?php echo $ro->gen('modules.ingraph.provider.view'); ?>"
            },
            comments: {
                create: "<?php echo $ro->gen('modules.ingraph.comments.create'); ?>",
                update: "<?php echo $ro->gen('modules.ingraph.comments.update'); ?>",
                remove: "<?php echo $ro->gen(
                    'modules.ingraph.comments.delete'); ?>"
            },
            templates: {
                create: "<?php echo $ro->gen('modules.ingraph.templates.create'); ?>",
                update: "<?php echo $ro->gen('modules.ingraph.templates.update'); ?>"
            },
            views: {
                create: "<?php echo $ro->gen('modules.ingraph.views.create'); ?>",
                update: "<?php echo $ro->gen('modules.ingraph.views.update'); ?>"
            }
        };
        Ext.ux.ingraph.Urls.overwrite(urls);
    }
    var viewarchitect = new Ext.ux.ingraph.ViewArchitect();
    this.add(viewarchitect);
    this.doLayout();
});
</script>
