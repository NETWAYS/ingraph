<?php

//if(!ini_get('display_errors')) {
//    throw $e;
//}

if(!headers_sent()) {
	header('Content-Type: text/plain');
}

echo
<<<HTML
NOT FOUND :(
HTML;
