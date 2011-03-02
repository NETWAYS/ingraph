<div class="grapher-plot-container">
    <div class="x-box-tl"><div class="x-box-tr"><div class="x-box-tc"></div></div></div>
    <div class="x-box-ml"><div class="x-box-mr"><div class="x-box-mc">
		<h3><?php echo $t['title']; ?></h3>
		<div class="grapher-plot" id="<?php echo "{$t['id']}"; ?>"></div>
    </div></div></div>
    <div class="x-box-bl"><div class="x-box-br"><div class="x-box-bc"></div></div></div>
</div>

<script type="text/javascript+protovis">
Ext.onReady(function(){
var data = <?php echo $t['values']; ?>;

data = data.filter(function(d) d.values.length > 0);

var h = <?php echo $t['height']; ?>,
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
    x = pv.Scale.linear(new Date(xmin), new Date(xmax)).range(0, w - legendWidth - yWidth - 10),
    y = pv.Scale.linear(ymin, ymax).range(0, h);

/* Root panel. */
var vis = new pv.Panel()
    .width(w)
    .height(h + 20)
    .bottom(10)
    .left(10)
    .right(10)
    .top(10);

var source = (function() {
    function render() {
        w = iG.width() - 20;
        x.range(0, w - legendWidth - yWidth - 10);
        vis.width(w);
        vis.canvas('<?php echo "{$t['id']}"; ?>').render();
    }

    return {
        render : function() {
            render();

            return this;
        }
    };
})();

var plot = vis.add(pv.Panel)
    .width(function() w - legendWidth - yWidth - 10)
    .left(yWidth)
    .top(0)
    .height(h)
    .event('mousemove', pv.Behavior.point());

/* Y-axis and ticks. */
plot.add(pv.Rule)
    .data(y.ticks())
    .bottom(y)
    .strokeStyle(function(d) d ? '#c7c7c7' : '#000')
  .anchor('left').add(pv.Label)
    .text(y.tickFormat);

/* X-axis ticks. */
plot.add(pv.Rule)
    .data(function() x.ticks())
    .left(x)
    .strokeStyle(function(d) d ? "#c7c7c7" : "#000")
  .add(pv.Rule)
    .bottom(-6)
    .height(5)
    .strokeStyle('#c7c7c7')
  .anchor('bottom').add(pv.Label)
    .text(x.tickFormat);

<?php if ( ! isset( $t['type'] ) || ! $t['type'] || $t['type'] == 'line' ) {
	echo 
<<<LAYOUT_LINE

/* Charts - line layout. */
plot.add(pv.Panel)
	.data(function() data)
   .add(pv.Line)
    .data(function(d) d.values)
    .left(x.by(fx))
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

source.render();

iG.RenderControl.on('updated', source.render);
});
</script>


