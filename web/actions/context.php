<div class="grapher-plot-container">
    <div class="x-box-tl"><div class="x-box-tr"><div class="x-box-tc"></div></div></div>
    <div class="x-box-ml"><div class="x-box-mr"><div class="x-box-mc">
		<h3><?php echo $t['title']; ?></h3>
		<div class="grapher-plot" id="<?php echo "{$t['id']}"; ?>"></div>
		<div class="grapher-legend" id="<?php echo "{$t['id']}-legend"; ?>"></div>
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
    s = pv.max(data.map(function(d) d.values.length)),
    ts = (xmax - xmin) / s,
    legendWidth = pv.max(data.map(function(d) iG.getTextWidth(d.label))),
    w = iG.width() - legendWidth - 200,
    x = pv.Scale.linear(new Date(xmin), new Date(xmax)).range(0, w),
	xf = pv.Scale.linear().range(0, w),
    y = pv.Scale.linear(ymin, ymax).range(0, h),
	y2 = pv.Scale.linear(ymin, ymax).range(0, h2),
	i = {x:200, dx:100};

function fnfocus() {
	var start = x.invert(i.x);
	var end = x.invert(i.x + i.dx);
	Ext.Ajax.request({
		url: 'actions/source_json.php',
		params: {
			host: '<?php echo $t['host']; ?>',
			service: '<?php echo $t['service']; ?>',
			start: Math.ceil(start.getTime()/1000),
			end: Math.ceil(end.getTime()/1000)
		},
		success: function(response, self) {
			data_ = Ext.decode(response.responseText);
			data_ = data_['<?php echo $t['host']; ?>']['<?php echo $t['service']; ?>'][0];
			focusdata = data_.data;
			xf.domain(new Date(self.params.start*1000), new Date(self.params.end*1000));
			render();
		},
		failure: function(response) {
			pv.error(response);
		}
	});
}

fnfocus();

try {

/* Root panel. */
var vis = new pv.Panel()
    .width(w)
    .height(h + 20 + h2)
    .bottom(20)
    .left(80)
    .right(10)
    .top(10)
    /*.events('all')
    .event('mousemove', pv.Behavior.point())*/;

var focus = vis.add(pv.Panel)
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
    .overflow('hidden')
	.data(function() focusdata)
   .add(pv.Line)
    .overflow('hidden')
    .data(function(d) d.values)
    .left(xf.by(fx))
    .bottom(y.by(fy))
    .lineWidth(2)
    .strokeStyle(function() pv.Colors.category20().range()[this.parent.index < 20 ? this.parent.index : this.parent.index - (Math.floor(this.parent.index/20)*20)].alpha(1.2))
    .fillStyle(null)/*
   .add(pv.Dot)
    .def('active', -1)
    .lineWidth(0)
    .size(0)
    .event('point', function() this.active(this.index).parent)
    .event('unpoint', function() this.active(-1).parent)
  .anchor('right').add(pv.Label)
    .visible(function() this.anchorTarget().active() == this.index)
    .textAlign('left')
    .textBaseline('middle')
    .text(function(d) '{0}: {1}'.format(data[this.parent.index].label, d.y))*/;
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
    .height(h2);

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
    .overflow('hidden')
    .data(function(d) d.values)
    .left(x.by(fx))
    .bottom(y2.by(fy))
    .lineWidth(2)
    .strokeStyle(function() pv.Colors.category20().range()[this.parent.index < 20 ? this.parent.index : this.parent.index - (Math.floor(this.parent.index/20)*20)].alpha(1.2))
    .fillStyle(null)

/* The selectable, draggable focus region. */
context.add(pv.Panel)
    .data([i])
    .cursor('crosshair')
    .events('all')
    .event('mousedown', pv.Behavior.select())
    .event('mouseup', fnfocus)
  .add(pv.Bar)
    .left(function(d) d.x)
    .width(function(d) d.dx)
    .fillStyle('rgba(255, 128, 128, .4)')
    .cursor('move')
    .event('mousedown', pv.Behavior.drag())
    .event('mouseup', fnfocus);

/* Legend. */
var legend = new pv.Panel()
    .width(legendWidth)
    .height(h)
    .bottom(30)
    .left(10)
    .right(10)
    .top(50);

legend.add(pv.Panel)
    .data(function() data)
   .add(pv.Dot)
    .top(function() this.parent.index * 12 + 10)
    .strokeStyle(null)
    .fillStyle(function() pv.Colors.category20().range()[this.parent.index < 20 ? this.parent.index : this.parent.index - (Math.floor(this.parent.index/20)*20)].alpha(0.8))
    .anchor("right").add(pv.Label)
    .text(function(d) d.label);

function render() {
    var w_ = iG.width() - legendWidth - 200;
    x.range(0, w_);
    vis.width(w_);
    vis.canvas('<?php echo "{$t['id']}"; ?>').render();
    legend.canvas('<?php echo "{$t['id']}-legend"; ?>').render();
}

iG.RenderControl.on('updated', render);

render();

} catch (e) {
	pv.error(e);
}
});
</script>


