<?php

$con = mysqli_connect("localhost", "root", "", "laccrion_db");

if (!$con) {
    die("Connection failed: " . mysqli_connect_error());
} else {
    echo "Connected sa db mga nigga";
}
