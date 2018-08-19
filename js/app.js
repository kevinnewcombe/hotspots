var scene = new THREE.Scene();
var renderer, camera;
var width, height, aspectRatio, loader, textures, controls;

// lights
var frontLight, leftLight, rightLight;

var sceneContainer = new THREE.Object3D();
var cubeContainer = new THREE.Object3D();
var assetsDir = 'source/models/strat/';
var assetsName = 'fender_guitar_mod';
THREE.ImageUtils.crossOrigin = "";


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

  // camera
  camera = new THREE.PerspectiveCamera(10, aspectRatio, 0.1, 200000);
  camera.position.set(0, 0, 100 );
  scene.add(camera);
  camera.lookAt(new THREE.Vector3(0,0,0));
  controls = new THREE.OrbitControls(camera, renderer.domElement);

  addLights();

  loadGeometry();
}


function addLights(){
  frontLight = new THREE.SpotLight(0xffffff);
  
  const lights = [
    {
      light : frontLight,
      x : 10,
      y : 10,
      z : 450,
      intensity :0.2
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

function loadGeometry(){
  var manager = new THREE.LoadingManager();
  var texture = new THREE.Texture();
  var lastPercent = 0;
  var onProgress = function ( xhr) {
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


function onWindowResize( event ) {
  width = window.innerHeight;
  height  = window.innerWidth;
  renderer.setSize( width, height );
  camera.aspect = width / height;

  camera.updateProjectionMatrix();
}


function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}



init(); // light this candle
