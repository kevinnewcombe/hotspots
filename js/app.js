var scene = new THREE.Scene();
var renderer, camera;
var controls;

// geometry
var assetsDir = 'source/models/strat/';
var assetsName = 'fender_guitar_mod';
THREE.ImageUtils.crossOrigin = "";

// markers
let markerHelper;
const markerData = [
  {
    position : [-8.6,0,0.9],
    name : 'bridge'
  }
];
const markers = [];



function init() {
  width = window.innerWidth, height = window.innerHeight, aspectRatio = width/height;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(1.5);
  renderer.setClearColor(0xffffff);
  renderer.shadowMap.enabled = true; 
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);
  window.addEventListener( 'resize', onWindowResize, false );
  
  addLights();
 
  // camera
  camera = new THREE.PerspectiveCamera(10, aspectRatio, 0.1, 200000);
  camera.position.set(0, 0, 100 );
  scene.add(camera);
  camera.lookAt(new THREE.Vector3(0,0,0));
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.minPolarAngle = controls.maxPolarAngle = Math.PI/2;
  controls.addEventListener( 'change', onCameraUpdate );
  loadGeometry();
  loadMarkers();
  loadMarkerHelper();
}


function addLights(){
  var light = new THREE.HemisphereLight( 0xffffff, 0x333333, 1.2 );
  scene.add( light );
}

function loadGeometry(){
  var manager = new THREE.LoadingManager();
  var texture = new THREE.Texture();
  var lastPercent = 0;
  var onProgress = function ( xhr ) {
    console.clear();
    if ( xhr.lengthComputable ) {
      var percentComplete = Math.round(xhr.loaded / xhr.total * 100);
      console.log(percentComplete);
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
      animate();
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
  var material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
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
  markerData.forEach(function (marker) {
    var markerContainer = new THREE.Object3D();

    var geometry = new THREE.CircleGeometry( 0.3, 32 );
    var material = new THREE.MeshBasicMaterial( { color: 0x000000 } );
    markerMesh = new THREE.Mesh( geometry, material );
    markerContainer.add(markerMesh);

    var geometry = new THREE.CircleGeometry( 0.2, 32 );
    var material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
    markerMesh = new THREE.Mesh( geometry, material );
    markerContainer.add(markerMesh);

    markerContainer.position.set(marker.position[0], marker.position[1],marker.position[2]);
    markerContainer.targetName = marker.name;

    markers.push(markerContainer);
    scene.add( markerContainer );
  });
}

function onCameraUpdate(){
  // have the markers always face the camera
  let cameraAngle = controls.getAzimuthalAngle();
  markers.forEach(function (marker) {
    marker.rotation.set(0, cameraAngle, 0);
  });
}
function onWindowResize( event ) {
  width = window.innerWidth;
  height  = window.innerHeight;
  aspectRatio = width / height;
  renderer.setSize( width, height );
  camera.aspect = aspectRatio;
  camera.updateProjectionMatrix();
}


function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}



init(); // light this candle
