<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
        <base href="<?php echo $ro->getBaseHref(); ?>" />
        <title><?php if(isset($t['_title'])) echo htmlspecialchars($t['_title']) . ' - '; echo AgaviConfig::get('core.app_name'); ?></title>

        <style type="text/css">
            @import url("js/ext/resources/css/ext-all.css");
            @import url("js/ext/resources/css/xtheme-gray.css");

            @import url("styles/ingraph.css");
            @import url("styles/ingraphlogo.css");
            @import url("styles/x-flot.css");
            @import url("styles/x-flot-icons.css");
            @import url("styles/x-ingraph.css");
        </style>

        <script type="text/javascript" src="js/ext/adapter/ext/ext-base.js"></script>
        <script type="text/javascript" src="js/ext/ext-all.js"></script>
        <!-- for debugging, comment ext-all.js and uncomment this one -->
        <!-- <script type="text/javascript" src="js/ext/ext-all-debug-w-comments.js"></script> -->

        <script type="text/javascript" src="js/ext/examples/ux/TabScrollerMenu.js"></script>
        <script type="text/javascript" src="js/ext/examples/ux/CheckColumn.js"></script>
        <script type="text/javascript" src="js/ext/examples/ux/Spinner.js"></script>
        <script type="text/javascript" src="js/ext/examples/ux/SpinnerField.js"></script>

        <script type="text/javascript" src="js/jquery/jquery-1.8.3.min.js"></script>

        <script type="text/javascript" src="js/inGraph.js"></script>

        <script type="text/javascript" src="js/excanvas/excanvas.js"></script>

        <script type="text/javascript" src="js/flot/jquery.flot.js"></script>
        <script type="text/javascript" src="js/flot/jquery.flot.time.js"></script>
        <script type="text/javascript" src="js/flot/jquery.flot.selection.js"></script>
        <script type="text/javascript" src="js/flot/jquery.flot.stack.js"></script>
        <script type="text/javascript" src="js/flot/jquery.flot.fillbetween.js"></script>
        <script type="text/javascript" src="js/flot/jquery.flot.highlight.js"></script>

        <script type="text/javascript" src="js/AppKit.js"></script>
        <script type="text/javascript" src="js/gettext.js"></script>
        <script type="text/javascript" src="js/Messages.js"></script>

        <script type="text/javascript" src="js/Array.js"></script>
        <script type="text/javascript" src="js/strtotime.js"></script>

        <script type="text/javascript" src="js/ext/DateField.js"></script>
        <script type="text/javascript" src="js/ext/String.js"></script>

        <script type="text/javascript" src="js/ext/ux/ColorColumn.js"></script>
        <script type="text/javascript" src="js/ext/ux/ColorField.js"></script>
        <script type="text/javascript" src="js/ext/ux/ComboController.js"></script>
        <script type="text/javascript" src="js/ext/ux/ComboDependency.js"></script>
        <script type="text/javascript" src="js/ext/ux/DateTime.js"></script>

        <script type="text/javascript" src="js/ext/ux/flot/AbstractStyleForm.js"></script>
        <script type="text/javascript" src="js/ext/ux/flot/FormWindow.js"></script>

        <script type="text/javascript" src="js/ext/ux/flot/NumberField.js"></script>
        <script type="text/javascript" src="js/ext/ux/flot/AxesConfiguration.js"></script>
        <script type="text/javascript" src="js/ext/ux/flot/AxisStyleForm.js"></script>
        <script type="text/javascript" src="js/ext/ux/flot/Fields.js"></script>
        <script type="text/javascript" src="js/ext/ux/flot/FlotConfiguration.js"></script>
        <script type="text/javascript" src="js/ext/ux/flot/Flot.js"></script>
        <script type="text/javascript" src="js/ext/ux/flot/PanelConfiguration.js"></script>
        <script type="text/javascript" src="js/ext/ux/flot/Panel.js"></script>
        <script type="text/javascript" src="js/ext/ux/flot/PanelSettingsWindow.js"></script>
        <script type="text/javascript" src="js/ext/ux/flot/SeriesConfiguration.js"></script>
        <script type="text/javascript" src="js/ext/ux/flot/SeriesStyleForm.js"></script>
        <script type="text/javascript" src="js/ext/ux/flot/Store.js"></script>
        <script type="text/javascript" src="js/ext/ux/flot/Tbar.js"></script>
        <script type="text/javascript" src="js/ext/ux/flot/Template.js"></script>

        <script type="text/javascript" src="js/ext/ux/ingraph/View.js"></script>

        <script type="text/javascript" src="js/ext/ux/ingraph/AddPlotWindow.js"></script>
        <script type="text/javascript" src="js/ext/ux/ingraph/AutoComboBox.js"></script>
        <script type="text/javascript" src="js/ext/ux/ingraph/Comments.js"></script>
        <script type="text/javascript" src="js/ext/ux/ingraph/Flot.js"></script>
        <script type="text/javascript" src="js/ext/ux/ingraph/Menu.js"></script>
        <script type="text/javascript" src="js/ext/ux/ingraph/SeriesConfiguration.js"></script>
        <script type="text/javascript" src="js/ext/ux/ingraph/Store.js"></script>
        <script type="text/javascript" src="js/ext/ux/ingraph/Tbar.js"></script>
        <script type="text/javascript" src="js/ext/ux/ingraph/Urls.js"></script>
        <script type="text/javascript" src="js/ext/ux/ingraph/View.js"></script>
    </head>

    <body id="main">
        <div id="content" class="x-hidden">
            <?php echo $inner; ?>
        </div>
    </body>
</html>
