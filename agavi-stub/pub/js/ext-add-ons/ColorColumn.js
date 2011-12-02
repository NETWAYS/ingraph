Ext.grid.ColorColumn = Ext.extend(Ext.grid.TemplateColumn, {
    tpl: new Ext.XTemplate(
        '<tpl if="values.color">',
            '<span style="background:{color}; float:left;' +
                         'display: block; height: 10px;' +
                         'line-height: 10px; width: 10px;' +
                         'border: 1px solid #666;"' +
                  'unselectable="on">&#160;</span>' +
            '<span style="padding:2px;">{color}</span>' +
        '</tpl>',
        {compiled: true})
});
Ext.grid.Column.types.colorcolumn = Ext.grid.ColorColumn;