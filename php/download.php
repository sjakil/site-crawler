<?php

switch($_REQUEST['type']) {
	case 'screenshots'	:	$contentType = 'image/png';
					$contentExtension = 'png';
					break;
	default			:	$contentType = 'text/csv';
					$contentExtension = 'csv';
					break;
}

header('Content-type: ' . $contentType);
header('Content-Disposition: attachment; filename="' . $_REQUEST['type'] . '_' . $_REQUEST['id'] . '.' . $contentExtension . '"');

$outputDirs = glob('/tmp/site-crawler/job_' . $_REQUEST['id']. '/*' , GLOB_ONLYDIR);
$outputDir = end($outputDirs);

switch($_REQUEST['type']) {
	case 'screenshots':	echo file_get_contents($outputDir . '/screenshots/' . end(scandir($outputDir . '/screenshots/')));
				break;
	case 'libraries':	echo preg_replace('/^\h*\v+/m', '', file_get_contents($outputDir . '/libraries.txt'));
				break;
	case 'cookies':		echo preg_replace('/^\h*\v+/m', '', file_get_contents($outputDir . '/cookies.txt'));
				break;
	case 'resources':	echo preg_replace('/^\h*\v+/m', '', file_get_contents($outputDir . '/resources.txt'));
				break;
	case 'banners':		echo preg_replace('/^\h*\v+/m', '', file_get_contents($outputDir . '/banners.txt'));
				break;
	case 'errors':		echo preg_replace('/^\h*\v+/m', '', file_get_contents($outputDir . '/errors.txt'));
				break;
}

?>
