Ext.ns('Ext.iG');
/**
 * @class Ext.iG.CommentForm
 * @extends Ext.form.FormPanel
 */
Ext.iG.CommentForm = Ext.extend(Ext.form.FormPanel, {
    baseCls: 'x-plain',
    labelWidth: 55,
    urls: {
        add: AppKit.util.Config.getBaseUrl() + '/modules/ingraph/comments/add',
        edit: AppKit.util.Config.getBaseUrl() +
              '/modules/ingraph/comments/edit',
        remove: AppKit.util.Config.getBaseUrl() +
                '/modules/ingraph/comments/delete'
    },
    layout: 'form',
    monitorValid: true,
    defaults: {
        xtype: 'combo',
        width: 210
    },
    
    initComponent: function() {
        var items = [{
            xtype: 'xdatetime',
            fieldLabel: _('Date'),
            dateConfig: {
                value: new Date(this.comment_timestamp),
                minValue: this.minDate,
                maxValue: this.maxDate
            },
            timeConfig: {
                value: new Date(this.comment_timestamp),
                minValue: this.minDate,
                maxValue: this.maxDate
            },
            ref: 'dateCmp',
            submitValue: false
        }, {
            fieldLabel: _('Host'),
            store: this.hosts,
            value: this.comment_host,
            name: 'host',
            ref: 'hostCmp'
        },{
            fieldLabel: _('Service'),
            store: this.services,
            value: this.comment_service,
            name: 'service',
            ref: 'serviceCmp'
        }, {
            xtype: 'textarea',
            fieldLabel: _('Comment'),
            name: 'comment',
            value: this.comment_text,
            allowBlank: false,
            height: 70,
            ref: 'commentCmp'
        }];
        var buttons = [{
            text: _('Save'),
            iconCls: 'icinga-icon-accept',
            formBind: true,
            scope: this,
            handler: this.doAdd
        }, {
            text: _('Cancel'),
            iconCls: 'icinga-icon-cancel',
            scope: this,
            handler: this.cancel
        }];
        if(this.comment_id !== undefined) {
            buttons[0].handler = this.doEdit;
            buttons.splice(1, 0, {
                text: _('Delete'),
                iconCls: 'icinga-icon-delete',
                scope: this,
                handler: this.doDelete
                
            });
        }
        Ext.apply(this, Ext.apply(this.initialConfig,
                                  { items: items, buttons: buttons}));
        Ext.iG.CommentForm.superclass.initComponent.call(this);
    },
    
    initEvents: function() {
        Ext.iG.CommentForm.superclass.initEvents.call(this);
        this.addEvents('__igcomment__');
    },
    
    onLayout: function() {
        Ext.iG.CommentForm.superclass.onLayout.apply(this, arguments);
        // Fix missing 'submitValue' config option
        // of saki's DateTime extension.
        if(this.dateCmp.submitValue === false) {
            this.dateCmp.el.dom.removeAttribute('name');
        }
    },
    
    doAdd: function() {
        this.dateCmp.updateDate();
        this.dateCmp.updateTime();
        this.getForm().submit({
             url: this.urls.add,
             scope: this,
             success: this.onSuccess,
             failure: this.onFailure,
             params: {
                 timestamp: Math.floor(this.dateCmp.getValue().getTime()/1000)
             },
             waitMsg: 'Saving...'
        });
    },
    
    doEdit: function() {
        this.dateCmp.updateDate();
        this.dateCmp.updateTime();
        this.getForm().submit({
             url: this.urls.edit,
             scope: this,
             success: this.onSuccess,
             failure: this.onFailure,
             params: {
                 id: this.comment_id,
                 timestamp: Math.floor(this.dateCmp.getValue().getTime()/1000)
             },
             waitMsg: 'Saving...'
        });
    },
    
    doDelete: function() {
        Ext.Ajax.request({
             url: this.urls.remove,
             scope: this,
             success: this.onSuccess,
             failure: this.onFailure,
             params: {
                 id: this.comment_id
             }
        });
    },
    
    onSuccess: function(self, action) {
        this.fireEvent('__igcomment__', this);
        this.destroy();
//        Ext.Msg.show({
//             title: _('Success'),
//             msg: _('Success'),
//             modal: true,
//             icon: Ext.Msg.INFO,
//             buttons: Ext.Msg.OK
//        });
    },

    onFailure: function(self, action) {
        var error = action.response.status + ' - ' +
                    action.response.statusText;
        Ext.Msg.show({
             title: _('Error'),
             msg: error,
             modal: true,
             icon: Ext.Msg.ERROR,
             buttons: Ext.Msg.OK
        });
    },
    
    cancel: function() {
        this.destroy();
    },
    
    windowed: function() {
        if(!this.window) {
            this.window = new Ext.Window({
                title: _('Comment'),
                collapsible: true,
                width: 300,
                height: 255,
                layout: 'fit',
                plain: true,
                bodyStyle: 'padding:5px;',
                buttonAlign: 'center',
                items: this,
                listeners: {
                    scope: this,
                    close: function() {
                        this.destroy();
                    }
                }
            });
        }
        return this.window;
    },
    
    onDestroy: function() {
        if(this.window) {
            this.window.destroy();
            this.window = null;
        }
        Ext.iG.CommentForm.superclass.onDestroy.call(this);
    }
});