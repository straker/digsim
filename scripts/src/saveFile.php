<?php
/**
 * Save the contents of the JSON string to the users computer.
 * Allows file saving in IE9 without the use of the FileReader API.
 */
session_start();

// Use POST to be able to send large strings (GET sends the data as part of the URL string)
$schematic = $_POST['data'];

// Since we have to use post, we cannot just open the link directly to this script and pass the data as well.
// Therefore we have to post the data first, then open the link afterwards, using a SESSION variable to save the data.

if (empty($schematic) && !empty($_SESSION['schematic'])) {
	// Set download headers
	header('Content-Description: File Transfer');
	header('Content-Type: application/octet-stream');
	header("Content-Disposition: attachment; filename=schematic.digsim.json");
	header('Content-Transfer-Encoding: binary');

	echo $_SESSION['schematic'];
}
else {
	$_SESSION['schematic'] = $schematic;
}