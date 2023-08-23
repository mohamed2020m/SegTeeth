/* eslint-disable react/no-unknown-property */
import { useEffect, useState} from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'; // For loading .obj files
// import { STLLoader } from 'three/examples/jsm/loaders/STLLoader'; // For loading .stl files
// import { useLoader } from '@react-three/fiber';


// eslint-disable-next-line react/prop-types
const ThreeDRenderer = ({file}) => {
    const [objModel, setObjModel] = useState(null);
    // const objModel = useLoader(OBJLoader, "teethsObj.obj"); 
    
    useEffect(() => {
        // const loadObjModel = async () => {
        //   try {
        //     // eslint-disable-next-line react-hooks/rules-of-hooks
        //     // const loadedModel = await useLoader(OBJLoader, '/teethsObj.obj');
        //     const loader = new OBJLoader();
        //     const loadedModel = await loader.loadAsync('/teethsObj.obj')
        //     // console.log(await loadObjModel)
        //     setObjModel(loadedModel);
        //   } catch (error) {
        //     console.error('Error loading OBJ model:', error);
        //   }
        // };
        
        // loadObjModel();

        if (file) {
            const loader = new OBJLoader();
            loader.load(URL.createObjectURL(file), (loadedModel) => {
              setObjModel(loadedModel);
            });
        }
    }, []);

    return (
        <Canvas dpr={[1,2]} shadowscamera={{ fov: 15 }} 
        style={{
            backgroundColor:"transparent",
            height: "50vh"
        }}
        >
        <ambientLight intensity={0.9} />
        <pointLight position={[10, 10, 10]} intensity={1.2} />
        <pointLight position={[-10, -10, -10]} intensity={0.8} />
        <pointLight position={[0, 0, -20]} intensity={0.5} color={0xffffff} />
        <OrbitControls />

        {objModel && (
            <mesh scale={[0.1, 0.1, 0.1]}>
                <primitive object={objModel}>
                    <meshStandardMaterial color={0xffffff} transparent opacity={0.8}  metalness={0.2} roughness={0.2} />
                </primitive>
            </mesh>
        )}
        </Canvas>
    );
  };
  
  export default ThreeDRenderer;
  