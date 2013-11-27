<?php
/**
 * Load a file from a <input type="file"> submitted via a form.
 * Allows file uploading in IE9 without the use of the FileReader API.
 */
$extensions = explode(".", $_FILES["file"]["name"]);
$extension = $extensions[sizeof($extensions)-1];

// Check for errors
if ($_FILES["file"]["error"] > 0) {
  echo "Error: " . $_FILES["file"]["error"];
}
// Check that the file is of type json
else if ($extension != "json") {
	echo "file";
}
// Ensure that the file size is not too large
else if ($_FILES["file"]["size"] > 40000) {
	echo "size";
}
// Read the contents of the file
else
{
	$fp = fopen($_FILES['file']['tmp_name'], 'rb');
    while ( ($line = fgets($fp)) !== false) {
      echo $line;
    }
}