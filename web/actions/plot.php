<h3><?php echo $t['title']; ?></h3>
<div id="<?php echo "{$t['id']}"; ?>"></div>
<div id="<?php echo "{$t['id']}-legend"; ?>"></div>

<script type="text/javascript+protovis">
Ext.onReady(function(){
var data = <?php echo $t['values']; ?>;

console.log(data);

var w = <?php echo $t['width']; ?>,
    h = <?php echo $t['height']; ?>,
    fy = function(d) d.y,
    fx = function(d) d.x * 1000,
    fl = function() data[this.parent.index].label,
    xmin = pv.min(data.map(function(d) d.values.length ? pv.min(d.values, fx) : <?php echo $t['start'] ?> * 1000)),
    xmax = pv.max(data.map(function(d) d.values.length ? pv.max(d.values, fx) : <?php echo $t['end'] ?> * 1000)),
    ymin = pv.min(data.map(function(d) d.values.length ? pv.min(d.values, fy) : 0)),
    ymax = pv.max(data.map(function(d) d.values.length ? pv.max(d.values, fy) : 0)),
    x = pv.Scale.linear(new Date(xmin), new Date(xmax)).range(0, w),
    y = pv.Scale.linear(ymin, ymax).range(0, h);


try {
	
var vis = new pv.Panel()
    .width(w)
    .height(h)
    .bottom(20)
    .left(100)
    .right(10)
    .top(50);

/* Y-axis and ticks. */
vis.add(pv.Rule)
    .data(y.ticks())
    .bottom(y)
    .strokeStyle(function(d) true ? '#eee' : '#000')
  .anchor('left').add(pv.Label)
    .text(y.tickFormat);

/* X-axis and ticks. */
vis.add(pv.Rule)
    .data(x.ticks())
    .left(x)
    .bottom(-5)
    .height(5)
  .anchor('bottom').add(pv.Label)
    .text(x.tickFormat);

<?php if ( ! isset( $t['type'] ) || ! $t['type'] || $t['type'] == 'line' ) {
	echo 
<<<LAYOUT_LINE
vis.add(pv.Panel)
	.data(function() data.filter(function(d) d.values.length > 0))
   .add(pv.Line)
    .data(function(d) d.values)
    .left(x.by(fx))
    .bottom(y.by(fy))
    .lineWidth(2)
    .strokeStyle(function() pv.Colors.category20().range()[this.parent.index < 20 ? this.parent.index : this.parent.index - (Math.floor(this.parent.index/20)*20)].alpha(0.6))
    .fillStyle(null);
    
LAYOUT_LINE;
	} elseif ( $t['type'] == 'stack' ) {
		echo
<<<LAYOUT_STACK
vis.add(pv.Layout.Stack)
    .layers(function() data)
    .values(function(d) d.values)
    .x(x.by(fx))
    .y(y.by(fy))
   .layer.add(pv.Area);
LAYOUT_STACK;
	}
?>

var legend = new pv.Panel()
    .width(200)
    .height(h)
    .bottom(30)
    .left(10)
    .right(10)
    .top(50);

legend.add(pv.Panel)
    .data(function() data.filter(function(d) d.values.length > 0))
   .add(pv.Dot)
    .visible(function(d) d.values.length > 0)
    .top(function() this.parent.index * 12 + 10)
    .strokeStyle(null)
    .fillStyle(function() pv.Colors.category20().range()[this.parent.index < 20 ? this.parent.index : this.parent.index - (Math.floor(this.parent.index/20)*20)].alpha(0.8))
    .anchor("right").add(pv.Label)
    .text(function(d) d.label);

vis.canvas('<?php echo "{$t['id']}"; ?>').render();
legend.canvas('<?php echo "{$t['id']}-legend"; ?>').render();

} catch (e) {
	pv.error(e);
}
});
</script>


