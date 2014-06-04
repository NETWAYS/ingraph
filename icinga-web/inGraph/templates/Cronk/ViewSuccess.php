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
                view: "<?php echo $ro->gen('modules.ingraph.provider.view'); ?>",
                intervals: "<?php echo $ro->gen('modules.ingraph.provider.intervals'); ?>"
            },
            comments: {
                create: "<?php echo $ro->gen('modules.ingraph.comments.create'); ?>",
                update: "<?php echo $ro->gen('modules.ingraph.comments.update'); ?>",
                remove: "<?php echo $ro->gen(
                    'modules.ingraph.comments.delete'); ?>"
            },
            views: {
                create: "<?php echo $ro->gen('modules.ingraph.views.create'); ?>",
                update: "<?php echo $ro->gen('modules.ingraph.views.update'); ?>"
            }
        };
        Ext.ux.ingraph.Urls.overwrite(urls);
    }

    var host = "<?php echo $rd->getParameter('host'); ?>",
        service = "<?php echo $rd->getParameter('service'); ?>",
        view = "<?php echo $rd->getParameter('view'); ?>",
        extState = Ext.state.Manager.getProvider().get(this.stateuid),
        cronkState = this.state,
        credentials = JSON.parse('<?php echo json_encode($t['credentials']); ?>');

    var addView = function (cfg) {
        cfg = cfg || {};
        Ext.apply(cfg, {
            stateful: true,
            stateEvents: [],
            stateId: this.stateuid,
            credentials: credentials
        });

        var view = new Ext.ux.ingraph.View(cfg);

        view.on({
            scope: this,
            single: true,
            ready: function(view) {
                // Replace tab title and tooltip
                Ext.ux.ingraph.icingaweb.Cronk.setTitle.call(this, cfg);

                // Manual handling of ext state
                Ext.state.Manager.getProvider().set(view.stateId, view.getState());

                this.getParent().on('removed', function () {
                    Ext.state.Manager.getProvider().clear(view.stateId);
                });
            }
        });

        // Add view to this cronk
        this.add(view);
        this.doLayout();

        // Cronk state
        this.setStatefulObject(view);

        return view;
    };

    if (!extState && !cronkState) {
        if (!host && !service && !view) {
            // Show inGraph menu in case this cronk is not preconfigured
            var menu = new Ext.ux.ingraph.Menu();

            var menuWindow = new Ext.Window({
                title: 'inGraph',
                modal: true,
                items: menu
            });

            menu.on('plot', function(cb, cfg) {
                addView.call(this, cfg);

                menuWindow.destroy();
            }, this);

            menuWindow.on('close', function() {
                // Remove cronk
                this.getParent().destroy();
            }, this);

            menuWindow.show();
        } // Eof no config
        else {
            // Host, service or view preconfigured
            // View decides what to do
            var cfg = {
                host: host,
                service: service,
                view: view,
                stateId: this.stateuid
            };

            addView.call(this, cfg);
        } // Eof host or service or view
    } // Eof no state
    else {
        var view = addView.call(this, cfg);

        if ( ! extState) {
            view.applyState(cronkState);
        }
    } // Eof has state
}); // Eof initEnvironment
</script>
