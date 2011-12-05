<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
		<base href="<?php echo $ro->getBaseHref(); ?>" />
		<title><?php if(isset($t['_title'])) echo htmlspecialchars($t['_title']) . ' - '; echo AgaviConfig::get('core.app_name'); ?></title>
		<style type="text/css">
		<!--
			@import url("styles/inGraph-all.css");
			@import url("js/ext/resources/css/ext-all.css");
            @import url("js/ext/resources/css/xtheme-gray.css");
		-->
		</style>
		
		<script type="text/javascript" src="js/ext/adapter/ext/ext-base.js"></script>
        <script type="text/javascript" src="js/ext/ext-all-debug.js"></script>
        
        <script type="text/javascript" src="js/ext/examples/ux/TabScrollerMenu.js"></script>
        <script type="text/javascript" src="js/ext/examples/ux/CheckColumn.js"></script>
        <script type="text/javascript" src="js/ext/examples/ux/Spinner.js"></script>
        <script type="text/javascript" src="js/ext/examples/ux/SpinnerField.js"></script>
        
        <script type="text/javascript" src="js/ext-overrides/DateField.parseDate.js"></script>
        <script type="text/javascript" src="js/ext-overrides/String.js"></script>
        
        <script type="text/javascript" src="js/ext-add-ons/ColorColumn.js"></script>
        <script type="text/javascript" src="js/ext-add-ons/DateTime.js"></script>
        <script type="text/javascript" src="js/ext-add-ons/ColorField.js"></script>
        
        <script type="text/javascript" src="js/ext-plugins/ComboController.js"></script>
        <script type="text/javascript" src="js/ext-plugins/ComboDependency.js"></script>
        
        <script type="text/javascript" src="js/Ext.ux.AutoComboBox.js"></script>
        
        
        <script type="text/javascript" src="js/jquery/jquery-1.5.2.min.js"></script>
        
        <script type="text/javascript" src="js/flot/jquery.flot.js"></script>
        <script type="text/javascript" src="js/flot/jquery.flot.text.js"></script>
        <script type="text/javascript" src="js/flot/jquery.flot.selection.js"></script>
        <script type="text/javascript" src="js/flot/jquery.flot.stack.js"></script>
        <script type="text/javascript" src="js/flot/jquery.flot.fillbetween.js"></script>
        <script type="text/javascript" src="js/flot/jquery.flot.threshold.js"></script>
        <script type="text/javascript" src="js/flot/jquery.flot.resize.js"></script>
        <script type="text/javascript" src="js/flot/jquery.flot.spline.js"></script>
        <script type="text/javascript" src="js/flot/jquery.flot.highlight.js"></script>
        <script type="text/javascript" src="js/flot/jquery.flot.sort.js"></script>
        
        <script type="text/javascript" src="js/excanvas/excanvas.js"></script>
        
        <script type="text/javascript" src="js/strtotime.js"></script>
        
        <script type="text/javascript" src="js/inGraph.js"></script>
        
        <script type="text/javascript" src="js/Ext.ux.Toast.js"></script>
        <script type="text/javascript" src="js/extra.js"></script>
        
        <script type="text/javascript" src="js/ext-inGraph/Panels.js"></script>
        <script type="text/javascript" src="js/ext-inGraph/Comment.js"></script>
        <script type="text/javascript" src="js/ext-inGraph/Template.js"></script>
        <script type="text/javascript" src="js/ext-inGraph/TimeFrames.js"></script>
        <script type="text/javascript" src="js/ext-inGraph/View.js"></script>
        <script type="text/javascript" src="js/ext-inGraph/Settings.js"></script>
        <script type="text/javascript" src="js/ext-inGraph/Util.js"></script>
        <script type="text/javascript" src="js/ext-inGraph/flot/Toolbar.js"></script>
        <script type="text/javascript" src="js/ext-inGraph/flot/Fields.js"></script>
        <script type="text/javascript" src="js/ext-inGraph/flot/Options.js"></script>
        <script type="text/javascript" src="js/ext-inGraph/flot/Panel.js"></script>
        <script type="text/javascript" src="js/ext-inGraph/flot/JsonReader.js"></script>
        <script type="text/javascript" src="js/ext-inGraph/flot/JsonStore.js"></script>
        <script type="text/javascript" src="js/ext-inGraph/Flot.js"></script>
        <script type="text/javascript" src="js/ext-inGraph/Urls.js"></script>
        <script type="text/javascript" src="js/ext-inGraph/AddPlot.js"></script>
        <script type="text/javascript" src="js/ext-inGraph/CommentMgr.js"></script>
        <script type="text/javascript" src="js/ext-inGraph/HostSummary.js"></script>
        <script type="text/javascript" src="js/ext-inGraph/AutoComboBox.js"></script>
        <script type="text/javascript" src="js/ext-inGraph/Menu.js"></script>
	</head>
	<body id="main">
		<div id="content" class="x-hidden">
		<?php echo $inner; ?>
		</div>
	</body>
</html>
