<?php
/**
 * Save the contents of the JSON string to the users computer.
 * Allows file saving in IE9 without the use of the FileReader API.
 */
session_start();

// Use POST to be able to send longer string lengths as a payload instead of GET part of the URL
$schematic = $_POST['data'];

// Since we have to use post, we cannot just open the iframe directly to this script and pass the data as well.
// Therefore we have to post the data first, then open the iframe afterwards.
// So we need to save the data between calls using a session.

if (empty($schematic) && !empty($_SESSION['schematic'])) {
	header("Content-type:application/json; charset=utf-8");
	header("Content-Disposition: attachment; filename=schematic.digsim.json");
	echo $_SESSION['schematic'];
}
else {
	$_SESSION['schematic'] = $schematic;
}