<?php

if(isset($_FILES['fisupload'])) {
    $destination = realpath('/uploads/'); //define folder
    foreach ($_FILES["fisupload"]["error"] as $key => $error) {
        if ($error == UPLOAD_ERR_OK) {
            $tmp_name = $_FILES["fisupload"]["tmp_name"][$key];
            // basename() kann Directory Traversal Angriffe verhindern; weitere
            // Gültigkeitsprüfung/Bereinigung des Dateinamens kann angebracht sein
            $name = $destination.$_FILES["fisupload"]["name"];
            move_uploaded_file($tmp_name, "data/$name");
        }
    }    
/*     $file = $_FILES['fisupload']; //getting a file object
    echo $file;
    //$file['name']; //name of the uploaded file 
    //$file['tmp_name']; //name of the file in the temporary storage
    $destination = realpath('/uploads/'); //define folder
    $filename = $destination."/".preg_replace("|[\\\/]|", "", $file["name"]); //set destination
    move_uploaded_file($file["tmp_name"], $filename); //move files    */
 }
?>