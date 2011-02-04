<?php
echo <<<HTML
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd"> 
<html> 
 <head> 
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"> 
    <title>plot-client</title> 
    <!--[if IE]><script language="javascript" type="text/javascript" src="flot/excanvas.min.js"></script><![endif]--> 
    <script language="javascript" type="text/javascript" src="flot/jquery.js"></script> 
    <script language="javascript" type="text/javascript" src="flot/jquery.flot.js"></script> 
    <script language="javascript" type="text/javascript" src="values.php?host={$_GET['host']}&parent_service={$_GET['parent_service']}&service={$_GET['service']}&plot={$_GET['plot']}"></script> 
 </head> 
 <body> 
    <div id="placeholder" style="width:1200px;height:800px;"></div> 
 
<script id="source" language="javascript" type="text/javascript"> 
$(function () {
//    $.plot($("#placeholder"), data, { xaxis: { mode: "time" }, series: { lines: { show: true }, points: { show: true } } });
    $.plot($("#placeholder"), data, { xaxis: { mode: "time" }, series: { lines: { show: true, fill: true } } });
});
</script> 
 
 </body> 
</html>
HTML;
?>
