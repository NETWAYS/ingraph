<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
		<base href="<?php echo $ro->getBaseHref(); ?>" />
		<title><?php if(isset($t['_title'])) echo htmlspecialchars($t['_title']) . ' - '; echo AgaviConfig::get('core.app_name'); ?></title>
		<style type="text/css">
		<!--
			@import url("styles/default.css");
			@import url("js/ext/resources/css/ext-all.css");
		-->
		</style>
		
		<script type="text/javascript" src="js/ext/adapter/ext/ext-base.js"></script>
        <script type="text/javascript" src="js/ext/ext-all-debug.js"></script>
        <script type="text/javascript" src="js/startup.js"></script>
	</head>
	<body id="main">
		<div id="content" class="x-hidden">
		<?php echo $inner; ?>
		</div>
	</body>
</html>
