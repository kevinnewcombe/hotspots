// base
var scene = new THREE.Scene();
var renderer, camera;
var controls, canvas;
var pixelRatio = 1.5;
var screenWidth, screenHeight;

// geometry
var assetsDir = 'source/models/strat/';
var assetsName = 'fender_guitar_mod';
// var assetsDir = 'assets/';
// var assetsName = 'guitar';
THREE.ImageUtils.crossOrigin = "";

// markers
let markerHelper;
const markersContainer = new THREE.Object3D();
const markerData = {
  'bridge' : {
    position : [-8.6,0,0.9],
    description : 'This is some text about the bridge'
  }
};
const markerBorderMaterial = new THREE.MeshBasicMaterial( { color: 0x000000 } );
const markerInteriorMaterialDefault = new THREE.MeshBasicMaterial( { color: 0x666666 } );
const markerInteriorMaterialHover = new THREE.MeshBasicMaterial( { color: 0xd52b1e } );
const tooltipContainer = document.getElementById('tooltip');
let activeMarker = null;

const markers = [];

// raycasting
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();


function init() {
  screenWidth = window.innerWidth, screenHeight = window.innerHeight, aspectRatio = screenWidth/screenHeight;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(screenWidth, screenHeight);
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0xffffff);
  renderer.shadowMap.enabled = true; 
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);
  window.addEventListener( 'resize', onWindowResize, false );
  window.addEventListener( 'mousemove', onMouseMove, false );
  
  addLights();
 
  // camera
  camera = new THREE.PerspectiveCamera(10, aspectRatio, 0.1, 200000);
  camera.position.set(0, 0, 100 );
  scene.add(camera);
  camera.lookAt(new THREE.Vector3(0,0,0));
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.minPolarAngle = controls.maxPolarAngle = Math.PI/2;
  controls.addEventListener( 'change', onCameraUpdate );
  canvas = document.getElementsByTagName('canvas');
  canvas = canvas[0];
  canvas.addEventListener('click', onCanvasClick);

  loadMarkers();
  loadGuitar();
  // loadMarkerHelper();
  animate();
}


function addLights(){
  var light = new THREE.HemisphereLight( 0xffffff, 0x333333, 1 );
  scene.add( light );
}

function loadGuitar(){
  var manager = new THREE.LoadingManager();
  var texture = new THREE.Texture();
  var lastPercent = 0;
  var onProgress = function ( xhr ) {
    if ( xhr.lengthComputable ) {
      var percentComplete = Math.round(xhr.loaded / xhr.total * 100);
      if(xhr.loaded == xhr.total){
        console.log('loading finished!');
      }
    }
  };

  var mtlLoader = new THREE.MTLLoader();
  mtlLoader.setMaterialOptions( { side: THREE.DoubleSide } );
  mtlLoader.setPath( assetsDir );
  mtlLoader.crossOrigin = '';
  mtlLoader.load( assetsName+'.mtl', function( materials ) {
    materials.preload();

    var objLoader = new THREE.OBJLoader();
    objLoader.setMaterials( materials );
    objLoader.setPath( assetsDir );
    objLoader.load( assetsName+'.obj', function ( object ) {
      object.rotation.set(0, 0, 0 );
      object.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = false;
        }
      });
      scene.add(object);
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
      alert(markerHelper.position.x+','+markerHelper.position.y+','+markerHelper.position.z);
    }
  };
  
  var geometry = new THREE.CircleGeometry( 0.2, 32 );
  var material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  markerHelper = new THREE.Mesh( geometry, material );
  markerHelper.position.set(0,0,0.9);
  scene.add( markerHelper );
  
  var gui = new dat.GUI();
  var markerGUI = gui.addFolder('Marker');markerGUI
  markerGUI.add(markerHelper.position, 'x', -10, 10).step(0.1).listen();
  markerGUI.add(markerHelper.position, 'y', -10, 10).step(0.1).listen();
  markerGUI.add(markerHelper.position, 'z', -10, 10).step(0.1).listen();
  markerGUI.add(options, 'copyPosition');
  markerGUI.open();
}

function loadMarkers(){
  scene.add(markersContainer);
  Object.keys(markerData).forEach(function(key) {
    marker = markerData[key];
    var markerContainer = new THREE.Object3D();

    // var geometry = new THREE.CircleGeometry( 0.3, 32 );
    // markerMesh = new THREE.Mesh( geometry, markerBorderMaterial );
    // markerMesh.meshType = 'border';
    // markerMesh.markerName = key;
    // markerContainer.add(markerMesh);

    var geometry = new THREE.CircleGeometry( 0.2, 32 );
    markerMesh = new THREE.Mesh( geometry, markerInteriorMaterialDefault );
    markerMesh.meshType = 'innercircle';
    markerMesh.markerName = key;
    markerContainer.add(markerMesh);

    markerContainer.position.set(marker.position[0], marker.position[1],marker.position[2]);

    markers.push(markerContainer);
    markersContainer.add( markerContainer );
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
  if((position.x + tooltipContainer.offsetWidth) < screenWidth){
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
        intersects[0].object.material = markerInteriorMaterialHover;
      }
    }
  }

  markers.forEach(function (markerParent) {
    markerParent.children.forEach(function (marker) {
      if(marker.meshType == 'innercircle' && marker.markerName != currentMarker){
        marker.material = markerInteriorMaterialDefault;
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
      tooltipContainer.innerHTML = markerData[markerName].description;
    }
  }
  if(markerName){
    activeMarker = marker;
    tooltipContainer.classList.add('is-visible');
    positionMarker();
  }else{
    // tooltipContainer.classList.remove('is-visible');
  }
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
