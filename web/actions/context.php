<div class="iG-plot-container">
    <div class="x-box-tl"><div class="x-box-tr"><div class="x-box-tc"></div></div></div>
    <div class="x-box-ml"><div class="x-box-mr"><div class="x-box-mc">
		<h3><?php echo $t['title']; ?></h3>
		<div class="iG-plot" id="<?php echo "{$t['id']}"; ?>"></div>
    </div></div></div>
    <div class="x-box-bl"><div class="x-box-br"><div class="x-box-bc"></div></div></div>
</div>

<script type="text/javascript+protovis">
Ext.onReady(function(){
var data = <?php echo $t['values']; ?>;

data = data.filter(function(d) d.values.length > 0);

focusdata = [];

var h = <?php echo $t['height']; ?>,
	h2 = 30,
    fy = function(d) d.y,
    fx = function(d) d.x * 1000,
    fl = function() data[this.parent.index].label,
    xmin = pv.min(data.map(function(d) d.values.length ? pv.min(d.values, fx) : <?php echo $t['start'] ?> * 1000)),
    xmax = pv.max(data.map(function(d) d.values.length ? pv.max(d.values, fx) : <?php echo $t['end'] ?> * 1000)),
    ymin = pv.min(data.map(function(d) d.values.length ? pv.min(d.values, fy) : 0)),
    ymax = pv.max(data.map(function(d) d.values.length ? pv.max(d.values, fy) : 0)),
    legendWidth = pv.max(data.map(function(d) iG.getTextWidth(d.label))),
    yWidth = 80, /* TODO: Autocalc. */
    w = iG.width() - 20,
    x = pv.Scale.linear(new Date(xmin), new Date(xmax)).range(0, w),
	xf = pv.Scale.linear().range(0, w - legendWidth - yWidth - 10),
    y = pv.Scale.linear(ymin, ymax).range(0, h),
	y2 = pv.Scale.linear(ymin, ymax).range(0, h2),
	i = {x:200, dx:100};

/* Root panel. */
var vis = new pv.Panel()
    .width(w)
    .height(h + 20 + h2)
    .bottom(10)
    .left(10)
    .right(10)
    .top(10)
	.events('all')
	.event('mousemove', pv.Behavior.point(20));

var source = (function() {
    var start,
        end,
		loading = false,
        cursor = iG.cursor();

    function render() {
        w = iG.width() - 20;
        xf.range(0, w - legendWidth - yWidth - 10);
        vis.width(w);
        vis.canvas('<?php echo "{$t['id']}"; ?>').render();
    }

    return {
		isLoading : function() {
			return loading;
		},
        update : function() {
			loading = true;

            cursor.wait();

            start = Math.ceil((x.invert(i.x)).getTime()/1000);
            end = Math.ceil((x.invert(i.x + i.dx)).getTime()/1000);

			while (start == end) {
				i.dx += 10;
				end = Math.ceil((x.invert(i.x + i.dx)).getTime()/1000);
			}
            
            Ext.Ajax.request({
                url: 'actions/source_json.php',
                params: {
                    host: '<?php echo $t['host']; ?>',
                    service: '<?php echo $t['service']; ?>',
                    start: start,
                    end: end
                },
                success: function(response, request) {
                    data_ = Ext.decode(response.responseText);
                    data_ = data_[request.params.host][request.params.service][0];
                    focusdata = data_.data;
                    
                    xf.domain(new Date(request.params.start*1000), new Date(request.params.end*1000));
                    
                    render();
                    cursor.restore();

					loading = false;
                },
                failure: function(response) {
                },
                scope : this
            });

            return this;
        },
        render : function() {
            render();

            return this;
        }
    };
})();

var focus = vis.add(pv.Panel)
    .width(function() w - legendWidth - yWidth - 10)
    .left(yWidth)
    .top(0)
    .height(h);

/* Y-axis and ticks. */
focus.add(pv.Rule)
    .data(y.ticks())
    .bottom(y)
    .strokeStyle(function(d) d ? '#c7c7c7' : '#000')
  .anchor('left').add(pv.Label)
    .text(y.tickFormat);

/* X-axis ticks. */
focus.add(pv.Rule)
    .data(function() xf.ticks())
    .left(xf)
    .strokeStyle(function(d) d ? "#c7c7c7" : "#000")
  .add(pv.Rule)
    .bottom(-6)
    .height(5)
    .strokeStyle('#c7c7c7')
  .anchor('bottom').add(pv.Label)
    .text(xf.tickFormat);

<?php if ( ! isset( $t['type'] ) || ! $t['type'] || $t['type'] == 'line' ) {
	echo 
<<<LAYOUT_LINE

/* Charts - line layout. */
focus.add(pv.Panel)
	.data(function() focusdata)
   .add(pv.Line)
    .data(function(d) d.values)
    .left(xf.by(fx))
    .bottom(y.by(fy))
    .lineWidth(2)
    .strokeStyle(function() pv.Colors.category20().range()[this.parent.index < 20 ? this.parent.index : this.parent.index - (Math.floor(this.parent.index/20)*20)].alpha(1.2))
    .fillStyle(null)
   .add(pv.Dot)
    .def('label', fl)
    .def('tooltip', function() iG.tooltip({label : this.label()}))
    .lineWidth(0)
    .size(0)
    .event('point', function(d) this.tooltip().show(d, this))
    .event('unpoint', function() this.tooltip().hide());
LAYOUT_LINE;
	} elseif ( $t['type'] == 'stack' ) {
		echo
<<<LAYOUT_STACK
/* Charts - stack layout. */
vis.add(pv.Layout.Stack)
    .layers(function() data)
    .values(function(d) d.values)
    .x(x.by(fx))
    .y(y.by(fy))
   .layer.add(pv.Area);
LAYOUT_STACK;
	}
?>

/* Context panel (zoomed out). */
var context = vis.add(pv.Panel)
    .bottom(0)
    .height(h2)
    .width(function() w - 20);

/* X-axis ticks. */
context.add(pv.Rule)
    .data(x.ticks())
    .left(x)
    .strokeStyle('#eee')
  .anchor('bottom').add(pv.Label)
    .text(x.tickFormat);

/* Y-axis ticks. */
context.add(pv.Rule)
    .bottom(0);

/* Context area chart. */
context.add(pv.Panel)
    .overflow('hidden')
	.data(function() data)
   .add(pv.Line)
    .data(function(d) d.values)
    .left(x.by(fx))
    .bottom(y2.by(fy))
    .lineWidth(2)
    .strokeStyle(function() pv.Colors.category20().range()[this.parent.index < 20 ? this.parent.index : this.parent.index - (Math.floor(this.parent.index/20)*20)].alpha(1.2))
    .fillStyle(null)

/* The selectable, draggable focus region. */
var region = context.add(pv.Panel)
    .data([i])
    .events('all')
    .cursor(source.isLoading() ? iG.cursorStyle() : 'crosshair')
    .event('mousedown', pv.Behavior.select())
    .event('selectend', function() source.update());
region.add(pv.Bar)
    .left(function(d) d.x)
    .width(function(d) d.dx)
    .fillStyle('rgba(255, 128, 128, .4)')
    .cursor(source.isLoading() ? iG.cursorStyle() : 'move')
    .event('mousedown', pv.Behavior.drag())
    .event('mouseup', source.update);

/* Legend. */
var legend = vis.add(pv.Panel)
    .width(legendWidth)
    .height(h)
    .left(function() w - legendWidth + 10)
    .top(0);

legend.add(pv.Panel)
    .data(function() data)
   .add(pv.Dot)
    .top(function() this.parent.index * 12 + 10)
    .strokeStyle(null)
    .fillStyle(function() pv.Colors.category20().range()[this.parent.index < 20 ? this.parent.index : this.parent.index - (Math.floor(this.parent.index/20)*20)].alpha(0.8))
    .anchor('right').add(pv.Label)
    .text(function(d) d.label);

source.render().update();

iG.RenderControl.on('updated', source.render);
});
</script>