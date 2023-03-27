import   React , 
       { Suspense , 
         useEffect ,
         useRef }            from "react"
import   * as THREE          from 'three'
import { Canvas , 
         useLoader ,
         useFrame ,  
         useThree }          from "@react-three/fiber"
import { OrbitControls , 
         PerspectiveCamera ,
         Stats }             from "@react-three/drei"
import './App.css';

const Planet = () => {
  const radius     = 1
  const clouds_ref = useRef ()  

  useFrame ( () => {
    clouds_ref.current.rotation.y += .0001
  })

return <>
    {/* Lithosphere & hidrosphere */}
    <mesh>
        <sphereGeometry args   = { [ radius , 50 , 25 ] } />
        <shaderMaterial attach = 'material' 
                        args   = { [ {
                          uniforms : {
                            u_globe_texture : { value : useLoader ( THREE.TextureLoader , process.env.PUBLIC_URL + 'assets/globe.jpeg' ) }
                          } ,
                          vertexShader : `
                            varying vec2 v_uv     ;
                            varying vec3 v_normal ;

                            void main() {
                              v_uv        = uv ;
                              v_normal    = normalize ( normalMatrix * normal ) ;
                              gl_Position = projectionMatrix * modelViewMatrix * vec4 ( position , 1. ) ;
                            }` ,
                          fragmentShader : `
                            uniform sampler2D u_globe_texture ;
                            varying vec2      v_uv            ;
                            varying vec3      v_normal        ;

                            void main () {
                              float intensity = 1.05 - dot ( v_normal , vec3 ( 0.0 , 0.0 , 1.0 ) ) ;
                              vec3 atmosphere = vec3 ( 0.3 , 0.6 , 1.) * pow ( intensity , 1.5 ) ;
                              gl_FragColor    = vec4 ( atmosphere + texture2D ( u_globe_texture , v_uv ) . xyz , 1. ) ;
                            }` 
                        } ] }/>
    </mesh>

    {/* Clouds */}
    <mesh ref  = { clouds_ref }>
        <sphereGeometry    args        = {[ radius * 1.01 , 50 , 25 ]} />
        <meshBasicMaterial transparent = { true } 
                           depthWrite  = { false } 
                           map         = { useLoader ( THREE.TextureLoader , process.env.PUBLIC_URL + 'assets/earthCloud.png' ) } />
    </mesh>    

    {/* Atmosphere */}
    <mesh>
        <sphereGeometry args   = {[ radius * 1.05 , 50 , 25 ]} />
        <shaderMaterial attach = 'material' 
                        args   = {[{
                          vertexShader : `
                            varying vec3 vertexNormal;
              
                            void main() {
                            vertexNormal = normalize(normalMatrix * normal);
                              gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
                            }`,
                          fragmentShader : `
                            varying vec3 vertexNormal;
                            void main() {
                              float intensity = pow(0.95 - dot(vertexNormal, vec3(0, 0, 1.0
                              )), 2.0);
                              gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
                            }` ,
                          blending       : THREE.AdditiveBlending ,
                          side           : THREE.BackSide
                        }]}/>
    </mesh>

  </>
}

const Space_scene = () => {
  return <>
    <OrbitControls/>
    <Planet/>
  </>
}

export default function App() {
  return (
    <Suspense fallback = { null }>
      <Canvas>
        <Space_scene/>
      </Canvas>
    </Suspense>
  )
}
