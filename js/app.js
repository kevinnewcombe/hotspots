// base
let scene = new THREE.Scene();
let renderer, camera, aspectRatio;
let controls, canvas;
let screenWidth, screenHeight;

// geometry
let assetsDir = 'assets/';
// let assetsDir = 'https://s3.ca-central-1.amazonaws.com/kevinnewcombe/codepen/guitar/';
let modelName = 'lespaul';
THREE.ImageUtils.crossOrigin = "";


// preloader
const preloader = document.getElementById('preloader');

function init() {
  // create the renderer
  screenWidth = window.innerWidth, screenHeight = window.innerHeight, aspectRatio = screenWidth/screenHeight;
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(screenWidth, screenHeight);
  renderer.setPixelRatio(1.5);
  renderer.setClearColor(0xffffff);
  renderer.shadowMap.enabled = true; 
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);
  window.addEventListener( 'resize', onWindowResize, false );
 
  // add the camera and orbit controls
  camera = new THREE.PerspectiveCamera(10, aspectRatio, 0.1, 200000);
  camera.position.set(0, 0, 200 );
  scene.add(camera);
  camera.lookAt(new THREE.Vector3(0,0,0));
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.minPolarAngle = controls.maxPolarAngle = Math.PI/2;

  // add the ground
  let material = new THREE.MeshPhongMaterial({
    color: 0xffffff, 
    side: THREE.DoubleSide,
    emissive: 0xaaaaaa
  });
  let geometry = new THREE.PlaneGeometry(70, 50, 1);
  ground = new THREE.Mesh( geometry, material );
  ground.receiveShadow = true;
  ground.rotation.set(THREE.Math.degToRad(90), 0, 0 );
  ground.position.y = -10;
  scene.add( ground );

  /* ************** */
  /*     lights     */
  /* ************** */
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
    },{
      light : topLight,
      x : 0,
      y : 50,
      z : 0,
      intensity: 0.5
    },{
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

  /* *********************** */
  /*     load the guitar     */
  /* *********************** */

  let manager = new THREE.LoadingManager();
  let texture = new THREE.Texture();

  let onProgress = function ( xhr ) {
    if ( xhr.lengthComputable ) {
      preloader.innerHTML = Math.round((xhr.loaded/xhr.total)*100)+'%';
      if(xhr.loaded == xhr.total){
        preloader.classList.add('is-hidden');
        window.setTimeout(function(){
          preloader.parentNode.removeChild(preloader);
        }, 250);
      }
    }
  };

  let mtlLoader = new THREE.MTLLoader();
  mtlLoader.setMaterialOptions( { side: THREE.DoubleSide } );
  mtlLoader.setPath( assetsDir );
  mtlLoader.crossOrigin = '';
  mtlLoader.load( 'lespaul.mtl', function( materials ) {
    materials.preload();
    let objLoader = new THREE.OBJLoader();
    objLoader.setMaterials( materials );
    objLoader.setPath( assetsDir );
    objLoader.load( 'lespaul.obj', function ( object ) {
      guitarMesh = object;
      guitarMesh.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
        }
      });
      scene.add(guitarMesh);
    }, onProgress);
  });
  
  animate();
}

function onWindowResize( event ) {
  screenWidth = window.innerWidth;
  screenHeight  = window.innerHeight;
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
