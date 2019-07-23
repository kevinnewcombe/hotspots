// base
let scene = new THREE.Scene();
let renderer, camera, aspectRatio;
let controls, canvas;
let screenWidth, screenHeight;
let pixelRatio = 1.5;

let useDynamicShadows = true;

// geometry
let assetsDir = 'assets/';
let modelName = 'lespaul';

// preloader
const preloader = document.getElementById('preloader');
const dial = document.getElementById('dial');
THREE.ImageUtils.crossOrigin = "";

// markers
let markerHelper;
const geometryContainer = new THREE.Object3D();
const tooltipContainer = document.getElementById('tooltip');
let activeMarker = null; // the marker that is currently open
const markers = []; // all markers

// raycasting
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

// testing
var sceneVariables = {}

// reference: http://www.gibson.com/Products/Electric-Guitars/2018/Custom/50th-Anniversary-1968-Les-Paul-Custom.aspx
 
const markerData = [
  {
    position : [-15.8,0,1.4],
    headline : 'Tailpiece',
    description : 'Lightweight Aluminum Stopbar'
  },
  {
    position : [-13.52,0,1.4],
    headline : 'Bridge',
    description : 'ABR-1 Tune-o-matic w/ Nylon Saddles'
  },
  {
    position: [-6.96,1.78,1.4],
    headline : 'Neck Pickup',
    description : '68 Custom Humbucker'
  },
  {
    position: [-20.47,4.65,1.4],
    headline : 'Body',
    description : '2-Piece Maple Top, 1-Piece Mahogany Back, Nitrocellulose Lacquer Finish'
  },
	{
		position: [6.66,0.02,1],
		headline: 'Neck',
	  description: 'Solid Mahogany, Long Tenon, Hide Glue Fit, 14 Degree Peghead Angle'
	},
	{
		position: [13.56,0,1.4],
		headline: 'Inlays',
		description: 'Pearl Block'
	},
	{
		position: [9.27,-1.1,1.4],
		headline: 'Fingerboard Material',
		description: 'Solid Ebony, Hide Glue Fit'
	},
	{
		position: [0.85,-1.25,1.4],
		headline: 'Fingerboard Radius',
		description: '12"'
	},
	{
		position: [17.92,-0.05,1.4],
		headline: 'Nut Material',
		description: 'Nylon'
	},
	{
		position: [7.33,0,-0.8],
		headline: 'Neck Profile',
		description: 'Medium-Chunky C-Shape, scanned from original.'
	},
	{
		position: [-3.26,0.02,-2.1],
		headline: 'Truss Rod',
		description: 'Tubeless'
	},
	{
		position: [-17.99,-3.73,0.8],
		headline: 'Controls',
		description: '2 500K CTS Volume Pots, 2 500K CTS Tone Pots, Hand-Wired Harness with Black Beauty Capacitors, Switchcraft Toggle Switch.<br />Black Witch Hat Control Knobs w/ Gold Reflectors'
	},
	{
		position: [-9.2,-2.95,0.6],
		headline: 'Pick Guard',
		description: 'Replica Multi-ply Acrylic'
	},
	{
		position: [-3.92,3.32,1.4],
		headline: 'Switch',
		description: 'Cream Tip with Molded Black'
	}
];

function init() {
  scene.add(geometryContainer);
  screenWidth = window.innerWidth;
  screenHeight = window.innerHeight;
  aspectRatio = screenWidth/screenHeight;
  
  
  // set up the renderer and window events
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(screenWidth, screenHeight);
  renderer.setPixelRatio(1.5);
  renderer.setClearColor(0xffffff);
  renderer.shadowMap.enabled = true; 
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);
  window.addEventListener( 'resize', onWindowResize, false );
  window.addEventListener( 'mousemove', onMouseMove, false );
	
  addLights();
 
  // camera
  camera = new THREE.PerspectiveCamera(10, aspectRatio, 0.1, 200000);
  camera.position.set(0, 0, 200 );
  scene.add(camera);
  camera.lookAt(new THREE.Vector3(0,0,0));
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.minPolarAngle = controls.maxPolarAngle = Math.PI/2;
  controls.addEventListener( 'change', onCameraUpdate );
  canvas = document.getElementsByTagName('canvas');
  canvas = canvas[0];
  canvas.addEventListener('click', onCanvasClick);


	 var material = new THREE.MeshPhongMaterial({
		color: 0xffffff, 
		side: THREE.DoubleSide,
		emissive: 0xaaaaaa
	 });
	 var geometry = new THREE.PlaneGeometry(70, 50, 1);

  
  setGeometryOrientation();
	loadMarkers();
  loadMarkerHelper();
  loadGuitar();
  animate();
}


function addLights(){
  frontLight = new THREE.SpotLight(0xffffff);
  backLight = new THREE.SpotLight(0xffffff);
  topLight = new THREE.SpotLight(0xffffff);
  
  const lights = [
    {
      light : frontLight,
      x : 0,
      y : 10,
      z : 450,
      intensity :0.5
    }
    ,
    {
      light : topLight,
      x : 0,
      y : 50,
      z : 0,
      intensity: 0.5
    }
    ,
    {
      light : backLight,
      x : 0,
      y : 10,
      z : -450,
      intensity :0.25
    }
  ];


  lights.forEach(function (lightObj) {
    light = lightObj.light;
    light.intensity = lightObj.intensity
    light.position.set(lightObj.x,lightObj.y,lightObj.z);
    light.castShadow = true;   
    scene.add( light );
  });
}



function loadGuitar(){
  var manager = new THREE.LoadingManager();
  var texture = new THREE.Texture();
  var onProgress = function ( xhr ) {
    if ( xhr.lengthComputable ) {
      console.clear();
      console.log('loading: '+Math.round((xhr.loaded / xhr.total) * 100)+'%');
    }
  };

  var mtlLoader = new THREE.MTLLoader();
  mtlLoader.setMaterialOptions( { side: THREE.DoubleSide } );
  mtlLoader.setPath( assetsDir );
  mtlLoader.crossOrigin = '';
  mtlLoader.load( 'lespaul.mtl', function( materials ) {
    materials.preload();
    var objLoader = new THREE.OBJLoader();
    objLoader.setMaterials( materials );
    objLoader.setPath( assetsDir );
    objLoader.load( 'lespaul.obj', function ( object ) {
      guitarMesh = object;
      guitarMesh.traverse(function (child) {
        if (child instanceof THREE.Mesh && useDynamicShadows) {
          child.castShadow = true;
        }
      });
      geometryContainer.add(guitarMesh);
    }, onProgress);
  });
}

function loadMarkerHelper(){
  /*
    For testing only 
    use dat.gui to get the intended coordinates of a marker
  */  
  var options = {
    copyPosition : function(){
      var string = ',\n';
      string = string+'\t{\n';
      string = string+'\t\tposition: ['+markerHelper.position.x+','+markerHelper.position.y+','+markerHelper.position.z+'],\n';
      string = string+'\t\theadline: \'\',\n';
      string = string+'\t\tdescription: \'\'\n';
      string = string+'\t}\n';

      navigator.clipboard.writeText(string).then(function() {
        alert('Position copied to clipboad');
      }, function(err) {
        alert('Could not copy position: ', err);
      });
    }
  };
  
  var geometry = new THREE.SphereGeometry( 0.5, 32, 32 );
  var material = new THREE.MeshBasicMaterial({ color: 0xFF0000 , side: THREE.DoubleSide});
  markerHelper = new THREE.Mesh( geometry, material );
  markerHelper.position.set(0,0,1.4);
  scene.add( markerHelper );
  
  var gui = new dat.GUI();
  var markerGUI = gui.addFolder('Marker')
  markerGUI.add(markerHelper.position, 'x', -30, 30).step(0.001).listen();
  markerGUI.add(markerHelper.position, 'y', -10, 10).step(0.001).listen();
  markerGUI.add(markerHelper.position, 'z', -5, 5).step(0.001).listen();

  markerGUI.add(options, 'copyPosition');
  markerGUI.open();
}

function loadMarkers(){
  Object.keys(markerData).forEach(function(key) {
    marker = markerData[key];
    var markerContainer = new THREE.Object3D();

    var geometry = new THREE.TorusGeometry( 0.35, 0.05, 2, 100 );
    var material = new THREE.MeshBasicMaterial({ color: 0xcccccc });
    var torus = new THREE.Mesh( geometry, material );
    markerContainer.add( torus );

    var geometry = new THREE.CircleGeometry( 0.3, 32 );
    let markerInteriorMaterialDefault = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent:true, opacity:0.2 });
    markerMesh = new THREE.Mesh( geometry, markerInteriorMaterialDefault );
    markerMesh.meshType = 'innercircle';
    markerMesh.markerName = key;
    markerContainer.add(markerMesh);

    markerContainer.position.set(marker.position[0], marker.position[1],marker.position[2]);

    markers.push(markerContainer);
    geometryContainer.add( markerContainer );
  });
}

function onCameraUpdate(){
  // have the markers always face the camera
  let cameraAngle = controls.getAzimuthalAngle();
  markers.forEach(function (marker) {
    marker.rotation.set(0, cameraAngle, 0);
  });
  if(activeMarker){
    positionMarker();
  }
}

function positionMarker(){
  let position = toScreenPosition(activeMarker, camera);
  if(position.x < 0){
    tooltipContainer.style.left = 0;
  }else if((position.x + tooltipContainer.offsetWidth) < screenWidth){
    tooltipContainer.style.left = (position.x)+'px';
  }else{
    tooltipContainer.style.left = (screenWidth - tooltipContainer.offsetWidth)+'px';
  }
  tooltipContainer.style.top = (position.y)+'px';
}

// raycasting
function onMouseMove( event ) {
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  
  // rollovers
  raycaster.setFromCamera( mouse, camera );
  let intersects = raycaster.intersectObjects( scene.children, true );
  let currentMarker = null;
  
  if(intersects.length){
    if(intersects[0].object.meshType){
      currentMarker = intersects[0].object.markerName;
      if(intersects[0].object.meshType == 'innercircle'){
        TweenLite.to(intersects[0].object.material, 0.25, { 
          opacity : 1, 
          ease: Power1.easeInOut
        });
      }
    }
  }

  markers.forEach(function (markerParent) {
    markerParent.children.forEach(function (marker) {
      if(marker.meshType == 'innercircle' && marker.markerName != currentMarker){
        TweenLite.to(marker.material, 0.25, { 
          opacity : 0.2, 
          ease: Power1.easeInOut
        });
      }
    });
  });
  if(currentMarker){
    canvas.classList.add('marker-hover');
  }else{
    canvas.classList.remove('marker-hover');
  }
}

function toScreenPosition(obj, camera){
  var vector = new THREE.Vector3();

  var widthHalf = 0.5*renderer.context.canvas.width;
  var heightHalf = 0.5*renderer.context.canvas.height;

  obj.updateMatrixWorld();
  vector.setFromMatrixPosition(obj.matrixWorld);
  vector.project(camera);

  vector.x = ( vector.x * widthHalf ) + widthHalf;
  vector.y = - ( vector.y * heightHalf ) + heightHalf;

  return { 
    x: vector.x / pixelRatio,
    y: vector.y / pixelRatio
  };
};

function onCanvasClick(){
	raycaster.setFromCamera( mouse, camera );
  let intersects = raycaster.intersectObjects( scene.children, true );
  let marker = null;
  let markerName = null;
  if(intersects.length){
    if(intersects[0].object.markerName){
      marker = intersects[0].object;
      markerName = marker.markerName;
      tooltipContainer.innerHTML = '<h5>'+markerData[markerName].headline+'</h5><p>'+markerData[markerName].description+'</p>';
    }
  }
  if(markerName){
    activeMarker = marker;
    tooltipContainer.classList.add('is-visible');
    positionMarker();
  }else{
    activeMarker = null;
    tooltipContainer.classList.remove('is-visible');
  }
}

function setGeometryOrientation(){
  // rotate the markers to always face the camera
  let cameraAngle = controls.getAzimuthalAngle();
  console.log('cameraAngle: '+cameraAngle);
  markers.forEach(function (marker) {
    marker.rotation.set(0, cameraAngle, 0);
  });
}

function onWindowResize( event ) {
  if(activeMarker){
    positionMarker();
  }

  screenWidth = window.innerWidth;
  screenHeight  = window.innerHeight;
  aspectRatio = screenWidth / screenHeight;
  renderer.setSize( screenWidth, screenHeight );
  camera.aspect = aspectRatio;
  camera.updateProjectionMatrix();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

init(); // light this candle