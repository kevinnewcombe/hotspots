var scene = new THREE.Scene();
var renderer, camera;
var width, height, aspectRatio, loader, textures;

// lights
var frontLight, leftLight, rightLight;

// geometry
var bodytextMaterial = new THREE.MeshPhongMaterial({
  emissive : 0x999999,
  shininess : 10
}); 
var lineThickness = 0.5;
var sceneContainer = new THREE.Object3D();
var cubeContainer = new THREE.Object3D();
var cubeSize = 100;
var cubeGeometry,cubeMesh,downArrowMesh;
var gibsonTextMesh,gibsonTextOriginalSize;
var lesPaulTextMesh,lesPaulTextOriginalSize = {};
var specTextMesh,specTextOriginalSize = {};
var guitarMesh, guitarMeshOriginalSize = {};
// var assetsDir = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/67732/';
var assetsDir = 'assets/';
var guitarIsLoaded = 0, fontsAreLoaded = 0;

var fontsData = [
  {
    name : 'RalewayBlack',
    filename : 'Raleway_Black_Regular'
  },
  {
    name : 'bodyCopy',
    filename : 'Raleway_ExtraBold_Regular'
  }
];
var fonts = [];
THREE.ImageUtils.crossOrigin = "";
var loadingProgressContainer = document.getElementById('loading');
// animation variables
var navIsOpen = false;
var animationDuration = 1000;



// nav
var hamburgerNav = document.getElementById('hamburger-nav');

function init() {
  width = window.innerWidth, height = window.innerHeight, aspectRatio = width/height;
  console.log(width,height,aspectRatio);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(1.5);
  renderer.setClearColor(0xada594);

  renderer.shadowMap.enabled = true; 
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  document.body.appendChild(renderer.domElement);
  window.addEventListener( 'resize', onWindowResize, false );

  scene.add( sceneContainer );

  addLights();

  // camera
  camera = new THREE.PerspectiveCamera(10, aspectRatio, 0.1, 200000);
  camera.position.set(0, 0, 580 );
  scene.add(camera);
  camera.lookAt(new THREE.Vector3(0,0,0));

  loadGeometry();
}


function addLights(){
  topLight = new THREE.SpotLight(0xffffff);
  frontLight = new THREE.SpotLight(0xffffff);
  rightLight = new THREE.SpotLight(0xffffff);
  
  const lights = [
    {
      light : frontLight,
      x : 0,
      y : 0,
      z : 450,
      intensity :0.5
    }
    ,{
      light : topLight,
      x : 0,
      y : 40,
      z : 10,
      intensity : 0.2
    }
    ,{
      light : rightLight,
      x : cubeSize * aspectRatio * 5,
      y : 0,
      z : 100,
      intensity : 0.2
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

function scaleScene(){  // Responsive functionality
  if(aspectRatio > 1.5){
    modifier = aspectRatio/3;
    modifier = 0.9;
    console.log(aspectRatio+"/"+modifier)
  }if(aspectRatio > 2.5){
    modifier = aspectRatio/3;
    modifier = 0.8;
    console.log(aspectRatio+"/"+modifier)
  }else{
    modifier = 1;
  }
  // Cube
  var cubeWidth = cubeSize * aspectRatio;
  var cubeHeight = cubeSize;
  var cubeDepth = cubeWidth * 0.75;

  cubeMesh.scale.x = cubeSize * aspectRatio; 
  cubeMesh.scale.y = cubeSize; 
  cubeMesh.scale.z = cubeWidth * 0.75; 
  cubeContainer.position.set(0, 0, cubeDepth * -0.2);
  if(fontsAreLoaded){
    // Gibson Text
    var gibsonTextScale = cubeHeight/gibsonTextOriginalSize * 0.5;
    gibsonTextMesh.scale.x = gibsonTextScale;
    gibsonTextMesh.scale.y = gibsonTextScale;
    gibsonTextMesh.scale.z = gibsonTextScale;
    gibsonTextBoundingBox = new THREE.Box3().setFromObject(gibsonTextMesh);
    gibsonTextSize = Math.abs(gibsonTextBoundingBox.max.y) + Math.abs(gibsonTextBoundingBox.min.y)
    gibsonTextMesh.position.set(cubeWidth * -0.45 * modifier, 0.9*cubeHeight-gibsonTextSize, cubeDepth * 0.5);

    // strat text
    var lesPaulTextScale = cubeWidth/lesPaulTextOriginalSize.width * 0.45;
    if(lesPaulTextScale > 0.07){
      lesPaulTextScale = 0.07;
    }
    lesPaulTextMesh.scale.x = lesPaulTextScale;
    lesPaulTextMesh.scale.y = lesPaulTextScale;
    lesPaulTextMesh.scale.z = lesPaulTextScale;
    lesPaulTextBoundingBox = new THREE.Box3().setFromObject(lesPaulTextMesh);
    lesPaulTextHeight = Math.abs(lesPaulTextBoundingBox.max.y - lesPaulTextBoundingBox.min.y);
    lesPaulTextMesh.position.set(cubeWidth * -0.45 * modifier, (cubeHeight*-0.45) + (lesPaulTextHeight * 0.86), cubeDepth * 0.6);

    // down arrow
    downArrowMesh.position.set(cubeWidth * 0.45 - lineThickness*4, (cubeHeight*-0.45) + lineThickness*5.5, cubeDepth * 0.7);
    
    // spec text
    specTextMesh.position.set(cubeWidth * 0.45 - (specTextOriginalSize.width + lineThickness*5), (cubeHeight*-0.45) + specTextOriginalSize.height, cubeDepth * 0.7);
  }

  // guitar
  if(guitarIsLoaded){
    var guitarMeshScale = cubeHeight / guitarMeshOriginalSize.height * 0.7;
    guitarMesh.scale.x = guitarMeshScale;
    guitarMesh.scale.y = guitarMeshScale;
    guitarMesh.scale.z = guitarMeshScale;
    guitarMeshBoundingBox = new THREE.Box3().setFromObject(guitarMesh);
    guitarMeshWidth = Math.abs(guitarMeshBoundingBox.max.x - guitarMeshBoundingBox.min.x);
    guitarMeshHeight = Math.abs(guitarMeshBoundingBox.max.y - guitarMeshBoundingBox.min.y);
    guitarMesh.position.set(guitarMeshWidth/1.5, 0 - guitarMeshHeight/8, cubeDepth * 0.55);
    frontLight.target = guitarMesh;
  }
}



function loadGeometry(){

  var material = new THREE.MeshPhongMaterial({
    color: 0xefdece, 
    shininess : 30,

    wireframe: false
  });
  /* load the background */
  cubeGeometry = new THREE.BoxGeometry( 1, 1, 1);
  cubeGeometry.receiveShadow = true;
  cubeGeometry.normalsNeedUpdate = true;
  cubeGeometry.computeFaceNormals();
  cubeMesh = new THREE.Mesh( cubeGeometry, material );
  cubeMesh.receiveShadow = true;   

  cubeContainer.add(cubeMesh);
  
  sceneContainer.add(cubeContainer);
  var loader = new THREE.FontLoader();
  var numOfLoadedFonts = 0;
  fontsData.forEach(function (fontData) {
    loader.load( assetsDir+fontData.filename+'.json', function ( font ) {
      fonts[fontData.name] = font;
      numOfLoadedFonts++;
      if(numOfLoadedFonts == fontsData.length){
        fontsAreLoaded = true;
        loadTextMeshes();
      }
    });
  });

  var x = 0, y = 0;

  var downArrowShape = new THREE.Shape();

  downArrowShape.lineTo( x+lineThickness, y );
  downArrowShape.lineTo( x+lineThickness*2, y-lineThickness );
  downArrowShape.lineTo( x+lineThickness*3, y );
  downArrowShape.lineTo( x+lineThickness*4, y );
  downArrowShape.lineTo( x+lineThickness*2, y-lineThickness*2 );
  downArrowShape.lineTo( x+lineThickness*2, y-lineThickness*2 );

  geometry = new THREE.ShapeGeometry( downArrowShape );
  downArrowMesh = new THREE.Mesh( geometry, bodytextMaterial ) ;
  cubeContainer.add( downArrowMesh );
  
  loadGuitar();
}

function loadGuitar(){
  var manager = new THREE.LoadingManager();
  var texture = new THREE.Texture();
  var lastPercent = 0;
  var onProgress = function ( xhr) {
    if ( xhr.lengthComputable ) {
      var percentComplete = Math.round(xhr.loaded / xhr.total * 100);
      if(percentComplete!=lastPercent){
        loadingProgressContainer.innerHTML = 'LOADING: '+percentComplete+'%';
        lastPercent = percentComplete;
      }
      if(xhr.loaded == xhr.total){
        loadingProgressContainer.classList.add('loaded');
      }
    }
  };

  var mtlLoader = new THREE.MTLLoader();
  mtlLoader.setMaterialOptions( { side: THREE.DoubleSide } );
  mtlLoader.setPath( assetsDir );
  mtlLoader.crossOrigin = '';
  mtlLoader.load( 'guitar.mtl', function( materials ) {
    materials.preload();

    var objLoader = new THREE.OBJLoader();
    objLoader.setMaterials( materials );
    objLoader.setPath( 'assets/' );
    objLoader.load( 'guitar.obj', function ( object ) {
      object.rotation.set(0, 0,  THREE.Math.degToRad(85) );
      object.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
          child.material.shininess = 0;
          child.castShadow = true;
          child.receiveShadow = false;
        }
      });

      guitarMesh = object;
      var guitarMeshBoundingBox = new THREE.Box3().setFromObject(guitarMesh);
      guitarMeshOriginalSize.width = Math.abs(guitarMeshBoundingBox.max.x - guitarMeshBoundingBox.min.x);
      guitarMeshOriginalSize.height = Math.abs(guitarMeshBoundingBox.max.y - guitarMeshBoundingBox.min.y);

      cubeContainer.add(guitarMesh);
      guitarIsLoaded = true;
      scaleScene();
      animate();
    }, onProgress);
  });
}

function loadTextMeshes(){
  /* ************** */
  /*     GIBSON     */
  /* ************** */
  let geometry = new THREE.TextGeometry( 'GIBSON', {
    font: fonts.RalewayBlack,
    height: 5
  });

  const gibsonTextMaterial = new THREE.MeshPhongMaterial({
    color: 0xc6bdb5, 
    shininess : 10
  }); 
  gibsonTextMesh = new THREE.Mesh(geometry, gibsonTextMaterial );
  gibsonTextMesh.rotation.set(0, 0, THREE.Math.degToRad(-90) );

  const gibsonTextBoundingBox = new THREE.Box3().setFromObject(gibsonTextMesh);
  gibsonTextOriginalSize = Math.abs(gibsonTextBoundingBox.max.y) + Math.abs(gibsonTextBoundingBox.min.y);
  cubeContainer.add(gibsonTextMesh);
  

  /* ****************************** */
  /*     Gibson Les Paul Custom     */
  /* ****************************** */
  geometry = new THREE.TextGeometry( 'GIBSON\nLES PAUL\nCUSTOM', {
    font: fonts.bodyCopy,
    height: 0
  });

  lesPaulTextMesh = new THREE.Mesh(geometry, bodytextMaterial );
  var lesPaulTextBoundingBox = new THREE.Box3().setFromObject(lesPaulTextMesh);
  lesPaulTextOriginalSize.width = Math.abs(lesPaulTextBoundingBox.max.x - lesPaulTextBoundingBox.min.x);
  lesPaulTextOriginalSize.height = Math.abs(lesPaulTextBoundingBox.max.y - lesPaulTextBoundingBox.min.y);
  cubeContainer.add(lesPaulTextMesh);


  /* ************ */
  /*     SPEC     */
  /* ************ */
  geometry = new THREE.TextGeometry( 'SPEC', {
    font: fonts.bodyCopy,
    height: 0,
    size: 1.5
  });

  specTextMesh = new THREE.Mesh(geometry, bodytextMaterial );

  var specTextBoundingBox = new THREE.Box3().setFromObject(specTextMesh);
  specTextOriginalSize.width = Math.abs(specTextBoundingBox.max.x - specTextBoundingBox.min.x);
  specTextOriginalSize.height = Math.abs(specTextBoundingBox.max.y - specTextBoundingBox.min.y);
  cubeContainer.add(specTextMesh);

  scaleScene();
  animate();
}

function onWindowResize( event ) {
  width = window.innerWidth;
  height  = window.innerHeight;

  aspectRatio = width / height;
  renderer.setSize( width, height );
  scaleScene();
  camera.aspect = aspectRatio;
  camera.updateProjectionMatrix();
}

// nav
document.getElementById('toggle-nav').addEventListener("click", function(){
  navIsAnimating = true;
  if(navIsOpen){ // close the nav
    hamburgerNav.classList.remove('open');
    TweenLite.to(sceneContainer.rotation, 0.5, { 
      y: THREE.Math.degToRad(0), 
      ease: Power1.easeInOut
    });
    navIsOpen = false;
  }else{ // open the nav
    hamburgerNav.classList.add('open');
    TweenLite.to(sceneContainer.rotation, 0.5, { 
      y: THREE.Math.degToRad(90), 
      ease: Power1.easeInOut
    });
    navIsOpen = true;
  }
});


function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}



init(); // light this candle
