import React             from 'react'
import * as THREE        from 'three'

const Globe = props => {
	const [ states, set_states ]    = React . useState ( [  ] )
	const container_ref             = React . useRef   ( null )	
	
	let renderer = null
	
	const create_scene              = args => {
		const  width       = props . width
		const  height      = props . height
		
		const Init_ThreeJS = args => {
			const radius                      = 500
			const cloud_height                = radius * 1.05 //   5000
			const billboard_height            = radius * 1.06 //   5000
			
			const Render                      = args => {
				renderer . render ( scene , camera )
			}
			const Tik                         = args => {
				cloud_mesh . rotation . y += .001
				
				Render ()
			}

			const scene                               = new THREE . Scene             ()
			const camera                              = new THREE . PerspectiveCamera ( 50 , width / height , .1 , radius * 8 )
			camera           . position . z           = radius * 4
			renderer                                  = new THREE . WebGLRenderer     ()
			renderer         . setPixelRatio                                          ( devicePixelRatio )
			renderer         . setSize                                                ( width , height )
			container_ref    . current  . appendChild                                 ( renderer . domElement )
			
			scene            . add                                                    ( new THREE . AmbientLight ( - 1 , .2 ) )
			const pointLight                          = new THREE . PointLight        ( 0xffffff , 0.9 )
			pointLight       . position . set                                         ( radius * 4 * 5 , radius * 4 * 5 , radius * 4 * 5 )
			scene            . add                                                    ( pointLight )

			const earth_mesh = new THREE . Mesh (
				new THREE . SphereGeometry    ( radius , 32 , 32 ) ,
				new THREE . MeshStandardMaterial ( {
					map       : new THREE . TextureLoader () . load ( './assets/earthmap1k.jpg' ) ,
					bumpMap   : new THREE . TextureLoader () . load ( './assets/earthbump.jpg' ) ,
					bumpScale : radius / 4 } ) )
			scene . add ( earth_mesh )

			const cloud_mesh = new THREE . Mesh (
				new THREE . SphereGeometry    ( cloud_height , 32 , 32 ) ,
				new THREE . MeshStandardMaterial ( {
					map         : new THREE . TextureLoader () . load ( './assets/earthCloud.png' ) ,
					transparent : true } ) )
			scene . add ( cloud_mesh )
			
			setInterval ( Tik , 1000 / 33 )			
		}

		Init_ThreeJS ()
	}
	const destroy_scene             = args => {
		//cancelAnimationFrame ( frameId )
		//container_ref . current . removeChild ( renderer . domElement )
	}
	React . useEffect ( () => {
		if ( ! renderer ) create_scene ()
		return destroy_scene
	}, [])	
	
	return <div ref = { container_ref } />
}

export default Globe
