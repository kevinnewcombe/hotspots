<?php 
  if($_SERVER['HTTP_HOST'] == 'localhost:8888'){
    $v = time();
  }else{
    $v = 2;
  }
?>
<!doctype html>
<head>
  <title>three / hotspots</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css?v=<?php echo $v; ?>" type="text/css" media="all" />
</head>
<body>
  <div id="tooltip"></div>

  <script type="text/javascript" src="js/dat.gui.min.js"></script>
  <script type="text/javascript" src="js/three/three.min.js"></script>
  <script type="text/javascript" src="js/three/OBJLoader.js"></script>
  <script type="text/javascript" src="js/three/MTLLoader.js"></script>
  <script type="text/javascript" src="js/three/OrbitControls.js"></script>
  <script type="text/javascript" src="js/app.js?v=<?php echo $v; ?>"></script>
</body>
</html>