import './style.css'
import * as THREE from 'three'
import gsap from 'gsap'
import countries from './countries.json'
import vertexShader from './src/shaders/vertex.glsl'
import fragmentShader from './src/shaders/fragment.glsl'
import atmosphereVertexShader from './src/shaders/atmosphereVertex.glsl'
import atmosphereFragmentShader from './src/shaders/atmosphereFragment.glsl'
import globe from './src/img/globe.jpeg?url'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


const canvasContainer = document.
  querySelector('#canvasContainer')
  
//new scene
const scene = new THREE.Scene()
let camera = new THREE.
  PerspectiveCamera(
  75, 
  canvasContainer.offsetWidth / 
    canvasContainer.offsetHeight,
  0.1,
  1000
)


//new renderer
const renderer = new THREE.WebGLRenderer(
  {
    canvas: document.querySelector('canvas')
})
renderer.setSize(canvasContainer.offsetWidth, canvasContainer.offsetHeight)
renderer.setPixelRatio(window.devicePixelRatio)

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;


// create a sphere
const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(5, 50, 50),
  new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      globeTexture: {
        value: new THREE.TextureLoader().load(globe)
      }
    }
  })
)
scene.add(sphere)

// create atmosphere
const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(5, 50, 50),
  new THREE.ShaderMaterial({
    vertexShader: atmosphereVertexShader,
    fragmentShader: atmosphereFragmentShader,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
  })
)

atmosphere.scale.set(1.1, 1.1, 1.1)

scene.add(atmosphere)

const group = new THREE.Group()
group.add(sphere)
scene.add(group)

//create stars
const starGeometry = new THREE.BufferGeometry()
const starMaterial = new THREE.PointsMaterial ({
  color: 0xffffff
})

const starVertices = []
  for (let i = 0; i < 10000; i++) {
    const x = (Math.random() - 0.5) * 1000
    const y = (Math.random() - 0.5) * 1000
    const z = -Math.random() * 10000
    starVertices.push(x, y, z)
}

starGeometry.setAttribute('position', 
  new THREE.Float32BufferAttribute(
  starVertices, 3))

  const stars = new THREE.Points(
    starGeometry, starMaterial)
scene.add(stars)

camera.position.z = 10

function createBoxes(countries){
  countries.forEach(country => {
    const scale = country.population / 1000000000
    const lat = country.latlng[0]
    const lng = country.latlng[1]
    const zScale = 0.8 * scale

  const box = new THREE.Mesh(
  new THREE.BoxGeometry(
    Math.max(0.1, 0.1 * scale), 
    Math.max(0.1, 0.1 * scale), 
    Math.max(zScale, 0.8 * Math.random())
  ),
  new THREE.MeshBasicMaterial({
    color: '#3BF7FF',
    opacity: 0.4,
    transparent: true
  })
  )

  const latitude = (lat / 180) * Math.PI
  const longitude = (lng / 180) * Math.PI
  const radius = 5

  const x = radius * Math.cos(latitude) * Math.sin(longitude)
  const y = radius * Math.sin(latitude)
  const z = radius * Math.cos(latitude) * Math.cos(longitude)

  box.position.x = x
  box.position.y = y
  box.position.z = z

  box.lookAt(0, 0, 0)
  box.geometry.applyMatrix4(new THREE.
    Matrix4().makeTranslation(0, 0, -zScale / 2))

  group.add(box)

//animation box scale
  // gsap.to(box.scale, {
  //   z: 1.4,
  //   duration: 2,
  //   yoyo: true,
  //   repeat: -1,
  //   ease: 'linear',
  //   delay: Math.random()
  // })

  box.country = country.name //change this later
  box.population = new Intl.
    NumberFormat().format(country.population)//change this later

  })

}

createBoxes(countries)

sphere.rotation.y = -Math.PI / 2
group.rotation.offset = {
  x: 0,
  y: 0
}

const mouse = {
  x: undefined,
  y: undefined,
  down: false,
  xPrev: undefined,
  yPrev: undefined
}

const raycaster = new THREE.Raycaster();
const popUpEl = document.querySelector('#popUpEl')
const populationEl = document.querySelector('#populationEl') //change
const populationValueEl = document.querySelector('#populationValueEl') //change

function animate() {


  requestAnimationFrame(animate)
  renderer.render(scene, camera)
  //group.rotation.y += 0.001


  // update the picking ray with the camera and pointer position
  raycaster.setFromCamera(mouse, camera);

  // calculate objects intersecting the picking ray
  const intersects = raycaster.intersectObjects(group.
    children.filter((mesh) => {
      return mesh.geometry.type === 'BoxGeometry'
    })
  )

  group.children.forEach((mesh) => {
    mesh.material.opacity = 0.4
  })

  gsap.set(popUpEl, {
    display: 'none'
  })

  for ( let i = 0; i < intersects.length; i ++ ) {
    const box = intersects[i].object
    box.material.opacity = 1

    gsap.set(popUpEl, {
    display: 'block'
  })
    populationEl.innerHTML = box.country //change
    populationValueEl.innerHTML = box.population //change
}
  controls.update();
  renderer.render(scene, camera);

}
animate()

canvasContainer.addEventListener('mousedown', ({clientX, clientY}) => {
  mouse.down = true
  mouse.xPrev = clientX
  mouse.yPrev = clientY
})

addEventListener('mousemove', (event) => {
if (innerWidth >= 1280) {
  mouse.x = (event.clientX / innerWidth)
    * 2 - 1
  mouse.y = -(event.clientY / innerHeight)
    * 2 + 1
} else {
  const offset = canvasContainer.getBoundingClientRect().top
  mouse.x = (event.clientX / innerWidth)
    * 2 - 1
  mouse.y = -((event.clientY - offset)/ innerHeight)
    * 2 + 1
}
    
gsap.set(popUpEl, {
  x: event.clientX,
  y: event.clientY
})

  if (mouse.down) {
    mouse.xPrev = event.clientX
    mouse.yPrev = event.clientY
    event.preventDefault()
  }
})

addEventListener('mouseup', (event) => {
  mouse.down = false
})


addEventListener("resize", onWindowResize, false);

function onWindowResize() {
  camera.aspect = canvasContainer.offsetWidth / canvasContainer.offsetHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
}


//mobile resonsiveness
addEventListener('touchstart', (event) => {
  event.clientX = event.touches[0].clientX
  event.clientY = event.touches[0].clientY

    const doesIntersect = raycaster.intersectObject(sphere)

    if (doesIntersect.length > 0) mouse.down = true

    if (mouse.down) {

      const offset = canvasContainer.getBoundingClientRect().top

      mouse.x = (event.clientX / innerWidth)
        * 2 - 1
      mouse.y = -((event.clientY - offset) / innerHeight)
        * 2 + 1

      gsap.set(popUpEl, {
        x: event.clientX,
        y: event.clientY
      })
      event.preventDefault()

      mouse.xPrev = event.clientX
      mouse.yPrev = event.clientY
    }
  }, 
  { passive: false }
)

addEventListener('touchend', (event) => {
  mouse.down = false
})