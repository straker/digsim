<?php
/**
 * Save the contents of the JSON string to the users computer.
 * Allows file saving in IE9 without the use of the FileReader API.
 */
$schematic = $_GET['schematic'];
header("Content-type:application/json; charset=utf-8");
header("Content-Disposition: attachment; filename=schematic.digsim");
echo $schematic;