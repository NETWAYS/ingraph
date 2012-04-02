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

    var extState = Ext.state.Manager.getProvider().get(this.stateuid);
    var cronkState = this.state;

    var addPortal = function(items) {
        var portal = new Ext.ux.ingraph.portal.Portal({
            xtype: 'xigportal',
            stateful: true,
            stateId: this.stateuid,
            stateEvents: ['add'],
            items: items || []
        });

        this.add(portal);
        this.doLayout();

        this.setStatefulObject(portal);

        return portal;
    };

    if ( ! extState && ! cronkState) {
        var builder = new Ext.ux.ingraph.portal.BuilderForm({
            baseCls: 'x-plain',
            bodyStyle: 'padding: 5px;'
        });

        var applyHandler = function (btn) {
            var items = [],
                formValues = builder.getForm().getValues(),
                columnDef = formValues.columns,
                rowHeightDef = formValues.rowHeight;

            if ( ! Ext.isArray(columnDef)) {
                columnDef = [columnDef];
            }

            if ( ! Ext.isArray(rowHeightDef)) {
                rowHeightDef = [rowHeightDef];
            }

            Ext.each(columnDef, function (str, rowIndex) {
                if (str.length < 1) {
                    // Skip
                    return true;
                }

                var separator = ',',
                    columns = str.split(separator);

                Ext.each(columns, function(column) {
                    if (column.length < 1) {
                        // Skip
                        return true;
                    }

                    var flex = parseInt(column),
                        rowHeight = rowHeightDef.hasOwnProperty(rowIndex) ? parseInt(rowHeightDef[rowIndex]) : 1;

                    items.push({
                        flex: flex,
                        row: rowIndex + 1,
                        rowHeight: rowHeight,
                        xtype: 'xigportalmenuitem'
                    });
                }); // Eof each columns
            }); // Eof each column def

            var portal = addPortal.call(this, items);

            // Save state manually
            Ext.state.Manager.set(portal.stateId, portal.getState());

            // Button -> Tbar -> Window
            var win = btn.ownerCt.ownerCt;

            win.destroy();
        };

        var builderWindow = new Ext.Window({
            title: 'inGraph-Portal',
            autoScroll: true,
            modal: true,
            width: 500,
            height: 200,
            items: builder,
            buttons: [
                {
                    text: _('Apply'),
                    scope: this,
                    handler: applyHandler
                }
            ]
        });

        builderWindow.on('close', function() {
            // Remove cronk
            this.getParent().destroy();
        }, this);

        builderWindow.show();
    } // Eof no state
    else {
        var portal = addPortal.call(this);

        if ( ! extState) {
            portal.applyState(cronkState);
            portal.doLayout();
        }
    } // Eof has state
}); // Eof initEnvironment
</script>