import   React , 
       { Suspense , 
         useEffect ,
         useRef }        from "react"
import   ReactDOM        from "react-dom"
import   * as THREE      from 'three'
import { Canvas , 
         useLoader ,
         useFrame,  
         useThree}     from "react-three-fiber";
import { OrbitControls , 
         PerspectiveCamera ,
         Stats }         from "@react-three/drei";
import   Tunnel          from './Tunnel'
import "./styles.css"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

let   tunnel               = null
let   render_target        = null
const uniforms             = { u_texture : { value : null }}
let   frame_mesh           = null
let   perspective_camera   = null
let   heighliner           = null

const Window      = () => {
  let   scene    = null
  let   camera   = null
  const uniforms = { u_texture : { value : null }}
  let   window_render_target = null

  useEffect ( () => { 
    scene                = new THREE.Scene             ()
    camera               = new THREE.PerspectiveCamera ( 50 , window.innerWidth / window.innerHeight , .01 , 10000 )
    window_render_target = new THREE.WebGLRenderTarget ( window.innerWidth , window.innerHeight )
    scene                . add                         ( new THREE . AmbientLight () )
    const point_light    = new THREE.PointLight        ( - 1 , 1 , 0 , 1 )
    point_light          . position.set                ( 0 , 0 , 10 )
    scene                . add                         ( point_light )

    const loader         = new GLTFLoader ()
    loader . load ( 'assets/frame v3.glb' , gltf => {
      frame_mesh              = gltf.scene
      frame_mesh.rotation.y   = Math.PI
      frame_mesh.position.set ( 0 , .01 , - .2 )
      scene.add               ( frame_mesh )
    })} , [])
  
  useFrame ( state => {
    if ( ! scene || ! camera ) return

    const d = perspective_camera . position . length ()

    if ( frame_mesh ) frame_mesh . position . set ( 0 , 0.0015 , d < 300 ? 1000 : - d / 5000 )

    state.gl.setRenderTarget    ( window_render_target )
    state.gl.render             ( scene , camera )
    state.gl.setRenderTarget    ( null )

    uniforms.u_texture.value = window_render_target.texture
  })
  
  return (
    <mesh geometry = { new THREE.PlaneGeometry ( 2 , 2 ) }> 
      <shaderMaterial depthWrite     = { false }
                      transparent    = { true }
                      uniforms       = { uniforms }
                      vertexShader   = {`
                        varying vec2 v_uv ;
                        
                        void main() {
                          v_uv        = uv ;
                          
                          gl_Position = vec4 ( position , 1. ) ;
                        }`} 
                      fragmentShader = {`
                        uniform sampler2D u_texture ;
                        varying vec2      v_uv      ;
                            
                        void main () {
                          gl_FragColor = texture2D ( u_texture , v_uv ) ;
                        }`}/>
    </mesh>
  )  
}

const Heighliner      = () => {
  let   scene    = null
  let   camera   = null
  const uniforms = { u_texture : { value : null }}
  let   window_render_target = null

  useEffect ( () => {
    scene                = new THREE.Scene             ()
    camera               = new THREE.PerspectiveCamera ( 50 , window.innerWidth / window.innerHeight , .01 , 10000 )
    window_render_target = new THREE.WebGLRenderTarget ( window.innerWidth , window.innerHeight )
    scene                . add                         ( new THREE . AmbientLight () )
    const point_light    = new THREE . PointLight      ( - 1 , 1 , 0 , 1 )
    point_light.position . set                         ( 0 , 0 , 10 )
    scene                . add                         ( point_light )

    const gltf_loader    = new GLTFLoader ()
    //gltf_loader.setCrossOrigin ( 'anonymous' )
    //const dracoLoader = new THREE . DRACOLoader () . setDecoderPath ( 'https://unpkg.com/three@0.132.2/examples/js/libs/draco/gltf/' )
    //gltf_loader . setDRACOLoader ( dracoLoader )
    gltf_loader . load ( 'assets/Heighliner.glb' , ( gltf ) => {
      heighliner = gltf . scene
      heighliner . x_angle = 0
      heighliner . y_angle = 90
      heighliner . rotation . set ( heighliner . x_angle , heighliner . y_angle , 0 )

      scene      . add            ( heighliner )
    })
  } , [])

  useFrame ( ( state , delta ) => {
    if ( ! scene || ! camera ) return

    const d = perspective_camera . position . length ()
    if ( heighliner ) heighliner . position . set ( 0 , 10 , d <  50 ? 1000 : - d / 3 )
    state.gl.setRenderTarget    ( window_render_target )
    state.gl.render             ( scene , camera )
    state.gl.setRenderTarget    ( null )
    uniforms.u_texture.value = window_render_target.texture
  } )  

  return (
    <mesh geometry = { new THREE.PlaneGeometry ( 2 , 2 ) }> 
      <shaderMaterial depthWrite     = { false }
                      transparent    = { true }
                      uniforms       = { uniforms }
                      vertexShader   = {`
                        varying vec2 v_uv ;
                        
                        void main() {
                          v_uv        = uv ;
                          
                          gl_Position = vec4 ( position , 1. ) ;
                        }`} 
                      fragmentShader = {`
                        uniform sampler2D u_texture ;
                        varying vec2      v_uv      ;
                            
                        void main () {
                          gl_FragColor = texture2D ( u_texture , v_uv ) ;
                        }`}/>
    </mesh>
  )  
}

const Planet      = () => {
  const radius        = 5 ;
  const clouds_ref    = useRef ()
  const uniforms      = { u_globe_texture : { value : null }}
  let   cloud_texture

  class Marker {
    static Size           = .25
    static Start          = new Date() . getTime ()
    static Rain           = {
      start         : 0,
      origin        : new THREE.Vector3 (),
      delay         : 1 * 1000,
      duration      : 3 * 1000,
      curvature     : 2,
      direction     : { x: 0, y: 1, z: 1 },
      distance      : radius * 3,
      control_point : new THREE.Vector3 ()
    }
    
    static Instances      = []
    static Group          = new THREE.Group ()
    static ShaderMaterial = new THREE.ShaderMaterial ({
      depthTest    : false ,
      transparent  : true ,
      vertexShader : `
        varying vec2 UV ;
        void main() {
          UV = uv ;
          gl_Position = projectionMatrix * modelViewMatrix * vec4 ( position , 1.0 ) ;
        }` ,
      fragmentShader : `
        uniform float u_intensity ;
        uniform float u_time ;
        uniform vec2  u_resolution ;
        
        varying vec2  UV ;
          
        #define r(x)     fract(1e4*sin((x)*541.17))      // rand, signed rand   in 1, 2, 3D.
        #define sr2(x)   ( r(vec2(x,x+.1)) *2.-1. )
        #define sr3(x)   ( r(vec4(x,x+.1,x+.2,0)) *2.-1. )
        float flare( vec2 U ) {	
          vec2 A = sin(vec2(0, 1.57) + u_time);
          U = abs( U * mat2(A, -A.y, A.x) ) * mat2(2,0,1,1.7); 
          return .2/max(U.x,U.y);                      // glowing-spiky approx of step(max,.2)
        }
        void main() {        
          float f = 1./2.; //  NB: 1./2. crash WebGL driver on Linux/chrome ! 
          vec2  U = UV / 4. ;
          U = abs(U+U - (gl_FragColor.xy=u_resolution.xy)) / gl_FragColor.y;
          gl_FragColor += flare ( U ) + 1. - 2.*pow((  pow(2.*U.x, f) + pow(U.x + U.y*1.7, f) + pow(abs(U.x - U.y*1.7), f) )/3., 1./f) -gl_FragColor;
          float i = ( gl_FragColor . r + gl_FragColor . g + gl_FragColor . b ) / 3. ;
          i *= u_intensity ;
          gl_FragColor = vec4 ( i , i , 0 , i ) ;
        }								
      ` ,
    } )

    static Lat_lon_to_cartesian         = args => {
      const latitude  = (args . lat / 180) * Math.PI
      const longitude = (args . lon / 180) * Math.PI
      return {
        x: radius * Math.cos ( latitude ) * Math.sin ( longitude ) ,
        y: radius * Math.sin ( latitude ) ,
        z: radius * Math.cos ( latitude ) * Math.cos ( longitude )
      }
		}

    static Quadratic_bezier_at          = args => {
      let t = args.t
      let one_minus_t = 1 - t
      let one_minus_t_2 = one_minus_t * one_minus_t

      return new THREE.Vector3 (
        one_minus_t_2 * args.p0.x + 2 * one_minus_t * t * args.c.x + t * t * args.p1.x,
        one_minus_t_2 * args.p0.y + 2 * one_minus_t * t * args.c.y + t * t * args.p1.y,
        one_minus_t_2 * args.p0.z + 2 * one_minus_t * t * args.c.z + t * t * args.p1.z)
    }			

    static Animate = args => {
      let tile_vector        = new THREE . Vector3  ()
      let nt                 = 0
      let rain_time_elapsed  = new Date() . getTime () - Marker.Start
      
      for ( let [ index , marker ] of Marker . Instances . entries () ) { 
        marker . intensity += marker . intensity_step
        if ( marker . intensity > 1 ) {
          marker . intensity = 1
          marker . intensity_step = - marker . intensity_step
        }
        if ( marker . intensity < .5 ) {
          marker . intensity = .5
          marker . intensity_step = - marker . intensity_step
        }
        marker . mesh . rotation . z += .005
        marker . mesh . scale . x = 2 * marker . intensity
        marker . mesh . scale . y = 2 * marker . intensity
        
        Marker.ShaderMaterial.uniforms [ 'u_intensity'  ] = { value : marker . intensity }
        Marker.ShaderMaterial.uniforms [ 'u_time'       ] = { value : performance . now () / 10000 }
        Marker.ShaderMaterial.uniforms [ 'u_resolution' ] = { value : new THREE . Vector2 ( Marker . Size , Marker . Size ) }
        
        const cartesian = Marker.Lat_lon_to_cartesian ( { lat : marker . lat , lon : marker . lon } )
        tile_vector . set ( cartesian . x , cartesian . y , cartesian . z )

        if ( marker.mode.raining == marker.mode.mode ) {
          let t = rain_time_elapsed / marker.t
          if ( t > 1  ) t = 1
          if ( t != 1 ) nt++
          Marker.Rain . control_point . copy           ( tile_vector )
          Marker.Rain . control_point . multiplyScalar ( Marker.Rain.curvature )
          let position = Marker.Quadratic_bezier_at    ( { t  : t , 
                                                           c  : Marker.Rain.control_point , 
                                                           p0 : Marker.Rain.origin , 
                                                           p1 : tile_vector } )
          //marker . mesh . position . copy ( position )
        }
      }
/*
      if ( marker.mode.raining == marker_mode.mode )
        if ( nt == 0 ) 
          marker.mode = marker.mode.normal
*/
  }

    constructor ( args ) {
      this . mode = {
        raining : 0 ,
        normal  : 1 ,
        mode    : 0
      }

      this.lat = args.lat
      this.lon = args.lon

      const p               = performance.now ()
      this . intensity      = Math.random () //p - Math . floor ( p )
      this . intensity_step = 0.005
      
      this . t = Math . random () * ( Marker.Rain_duration - 1000 ) + 1000

      this.mesh = new THREE.Mesh (
        new THREE.PlaneGeometry ( Marker.Size , Marker.Size ) ,
        Marker.ShaderMaterial
      )

      const cartesian          = Marker.Lat_lon_to_cartesian ( { lat : this.lat , lon : this.lon } )
      this.mesh.lookAt         ( cartesian.x , cartesian.y , cartesian.z ) 
      this.mesh.position . set ( cartesian.x , cartesian.y , cartesian.z )
      this.mesh.rotation . z   = Math.random () * Math.PI * 2      

      Marker.Group.add         ( this.mesh )
      Marker.Instances.push    ( this )
    }
  }

  useEffect ( () => {
    fetch ( '/assets/countries.json' ).then ( response => response.json ()).then ( json => {
      for ( const country of json ) {
        new Marker ({
          description : country.name ,
          lat         : country.latlng [ 0 ] ,
					lon         : country.latlng [ 1 ]
        })
      }
    })

    const earth_image = new Image ()
    earth_image.onload = event => { 
      uniforms . u_globe_texture.value = new THREE.CanvasTexture ( earth_image ) 
    }
    earth_image . src = 'assets/globe.jpeg'

    const clouds_image = new Image ()
    clouds_image.onload = event => { 
      clouds_ref.current.material.map = new THREE.CanvasTexture ( clouds_image ) 
      clouds_ref.current.material.needsUpdate = true
    }
    clouds_image . src = 'assets/earthCloud.png'
  } , [] )  

  useFrame ( ( state , delta ) => {
    clouds_ref.current.rotation.y -= 0.0001    
    Marker.Animate ()
  } )  

  return (
    <>
      {/* hydrosphere + lithosphere */}
      <mesh             geometry       = { new THREE.SphereGeometry ( radius , 50 , 25 ) } 
                        rotation-y     = { -Math.PI / 2 }>
        <shaderMaterial vertexShader   = { `
                          varying vec2 v_uv     ;
                          varying vec3 v_normal ;

                          void main () {
                            v_uv        = uv ;
                            v_normal    = normalize ( normalMatrix * normal ) ;
                            gl_Position = projectionMatrix * modelViewMatrix * vec4 ( position , 1. ) ;
                          }` }
                        fragmentShader = { `
                          uniform sampler2D u_globe_texture ;
                          varying vec2      v_uv            ;
                          varying vec3      v_normal        ;
                      
                          void main () {
                            float intensity = 1.05 - dot ( v_normal , vec3 ( 0.0 , 0.0 , 1.0 ) ) ;
                            vec3 atmosphere = vec3 ( 0.3 , 0.6 , 1.) * pow ( intensity , 1.5 ) ;
                            gl_FragColor    = vec4 ( atmosphere + texture2D ( u_globe_texture , v_uv ) . xyz , 1. ) ;
                          }` }
                        uniforms = { uniforms }/>
      </mesh>

      {/* clouds */}
      <mesh ref  = { clouds_ref }>
        <sphereGeometry    args = { [ radius + .1 , 50 , 25 ] } />
        <meshBasicMaterial transparent = { true } 
                           depthWrite  = { false }/>
      </mesh>

      {/* atmosphere */}
      <mesh> 
        <sphereGeometry args   = { [ radius + .5 , 50 , 25 ] } />
        <shaderMaterial attach = 'material' 
                        args   = { [ {
                          vertexShader: `
                          varying vec3 vertexNormal;
            
                          void main() {
                          vertexNormal = normalize(normalMatrix * normal);
                            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
                          }						
                        `,
                        fragmentShader: `
                          varying vec3 vertexNormal;
                          void main() {
                            float intensity = pow(0.95 - dot(vertexNormal, vec3(0, 0, 1.0
                            )), 2.0);
                            gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
                          }						
                        ` ,
                        blending : THREE.AdditiveBlending,
                        side     : THREE.BackSide
                        } ] }/>
      </mesh>

      {/* markers */}
      <primitive object = { Marker.Group }/>
    </>
  )
}

const Background  = () => {

  useEffect ( () => { 
    tunnel        = new Tunnel ()
    render_target = new THREE.WebGLRenderTarget ( 1024 , 1024 )
  }, [])

  useFrame((state) => {
    state.gl.setRenderTarget    ( render_target )
    if ( tunnel ) tunnel.update ( )
    state.gl.render             ( tunnel.scene , tunnel.camera )
    state.gl.setRenderTarget    ( null )
    uniforms.u_texture.value = render_target.texture
  })

  return (
      <mesh geometry = { new THREE.PlaneGeometry ( 2 , 2 ) }> 
        <shaderMaterial depthWrite     = { false }
                        uniforms       = { uniforms }
                        vertexShader   = {`
                          varying vec2 v_uv ;
                          
                          void main() {
                            v_uv        = uv ;
                            
                            gl_Position = vec4 ( position , 1. ) ;
                          }`} 
                        fragmentShader = {`
                          uniform sampler2D u_texture ;
                          varying vec2      v_uv      ;
                              
                          void main () {
                            gl_FragColor = vec4 ( texture2D ( u_texture , v_uv ) . rgb , 1. ) ;
                          }`}/>
      </mesh>
  )
}

const Space_scene = () => {
  const { camera }  = useThree ()
  perspective_camera = camera

  useEffect ( () => { 
    perspective_camera.position.z = 500
  } , [])

  useFrame (() => {
    perspective_camera.rotation.z += .1
  })
  
  return (
    <>
      <OrbitControls minDistance = {  12 } 
                     maxDistance = { 500 }/>
      <Background/>
      <Planet/>
      <Heighliner/>
      <Window/>
      <Stats/>
    </>
  )
}

const App         = () => {
	return (
    <Suspense callback = { null }>
			<Canvas>
				<Space_scene/>
			</Canvas>
    </Suspense>
	)
}

ReactDOM.render ( <App /> , document.getElementById ( "root" ))
