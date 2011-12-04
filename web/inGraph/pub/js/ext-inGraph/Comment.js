Ext.ns('Ext.iG');
/**
 * @class Ext.iG.Comment
 * @extends Ext.form.FormPanel
 */
Ext.iG.Comment = Ext.extend(Ext.form.FormPanel, {
    baseCls: 'x-plain',
    labelWidth: 55,
    waitMsg: _('Saving...'),
    layout: 'form',
    monitorValid: true,
    defaults: {
        xtype: 'combo',
        width: 210
    },
    
    initComponent: function() {
        var cfg = {};
        this.buildItems(cfg);
        this.buildButtons(cfg);
        Ext.apply(this, Ext.apply(this.initialConfig, cfg));
        Ext.iG.Comment.superclass.initComponent.call(this);
    },
    
    initEvents: function() {
        Ext.iG.Comment.superclass.initEvents.call(this);
        this.addEvents('addcomment', 'editcomment', 'deletecomment', 'cancel');
    },
    
    buildItems: function(cfg) {
        cfg.items = [{
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
    },
    
    buildButtons: function(cfg) {
        cfg.buttons = [{
            text: _('Save'),
            iconCls: 'ingraph-icon-save',
            formBind: true,
            scope: this,
            handler: this.doAdd
        }, {
            text: _('Cancel'),
            iconCls: 'ingraph-icon-cancel',
            scope: this,
            handler: this.doCancel
        }];
        if(this.comment_id !== undefined) {
            cfg.buttons[0].handler = this.doEdit;
            cfg.buttons.splice(1, 0, {
                text: _('Delete'),
                iconCls: 'ingraph-icon-delete',
                scope: this,
                handler: this.doDelete
                
            });
        }
    },
    
    onLayout: function() {
        Ext.iG.Comment.superclass.onLayout.apply(this, arguments);
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
             url: Ext.iG.Urls.comments.add,
             scope: this,
             success: this.onAddSuccess,
             failure: this.onFailure,
             params: {
                 timestamp: Math.floor(this.dateCmp.getValue().getTime()/1000)
             },
             waitMsg: this.waitMsg
        });
    },
    
    doEdit: function() {
        this.dateCmp.updateDate();
        this.dateCmp.updateTime();
        this.getForm().submit({
             url: Ext.iG.Urls.comments.edit,
             scope: this,
             success: this.onEditSuccess,
             failure: this.onFailure,
             params: {
                 id: this.comment_id,
                 timestamp: Math.floor(this.dateCmp.getValue().getTime()/1000)
             },
             waitMsg: this.waitMsg
        });
    },
    
    doDelete: function() {
        Ext.Ajax.request({
             url: Ext.iG.Urls.comments.delete,
             scope: this,
             success: this.onDeleteSuccess,
             failure: this.onFailure,
             params: {
                 id: this.comment_id
             }
        });
    },
    
    onAddSuccess: function(self, action) {
        this.fireEvent('addcomment', this);
    },
    
    onEditSuccess: function(self, action) {
        this.fireEvent('editcomment', this);
    },
    
    onDeleteSuccess: function(self, action) {
        this.fireEvent('deletecomment', this);
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
    
    doCancel: function() {
        this.getForm().reset();
        this.fireEvent('cancel', this);
    }
});
Ext.reg('igcomment', Ext.iG.Comment);