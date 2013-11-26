<?php
$schematic = $_GET['schematic'];
header("Content-type:application/json; charset=utf-8");
header("Content-Disposition: attachment; filename=schematic.json");
echo $schematic;