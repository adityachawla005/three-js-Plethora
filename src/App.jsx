import React, { Suspense, useRef, useEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Sky } from "@react-three/drei";
import * as THREE from "three";

function Environment({ onModelLoaded }) {
  const { scene } = useGLTF("/env.glb");

  useEffect(() => {
    if (!scene) return;

    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    scene.position.x -= center.x;
    scene.position.y -= center.y;
    scene.position.z -= center.z;

    const newBox = new THREE.Box3().setFromObject(scene);

    if (onModelLoaded) {
      onModelLoaded(newBox);
    }
  }, [scene, onModelLoaded]);

  return <primitive object={scene} scale={1} />;
}

// New component to spawn 1.glb model somewhere on the ground inside environment bounds
function SpawnedModel({ boundingBox }) {
  const { scene } = useGLTF("/1.glb");
  const modelRef = useRef();

  useEffect(() => {
    if (!scene || !boundingBox) return;

    // Get bounding box info
    const size = boundingBox.getSize(new THREE.Vector3());
    const center = boundingBox.getCenter(new THREE.Vector3());

    // Random position inside bounding box footprint (x and z)
    const x = center.x + (Math.random() - 0.5) * size.x;
    const z = center.z + (Math.random() - 0.5) * size.z;

    // Assume ground roughly at y = 0 after environment centering
    // Adjust y if your model has a different origin
    const y = center.y - size.y / 2;

    scene.position.set(x, y, z);

    if (modelRef.current) {
      modelRef.current.add(scene);
    }
  }, [scene, boundingBox]);

  return <group ref={modelRef} />;
}

function CameraController({ boundingBox, controlsRef }) {
  const { camera } = useThree();

  useEffect(() => {
    if (!boundingBox || !controlsRef.current) return;

    const center = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());

    camera.position.set(center.x, center.y + size.y * 2, center.z + size.z * 3);
    camera.lookAt(center);

    controlsRef.current.target.copy(center);
    controlsRef.current.update();
  }, [boundingBox, camera, controlsRef]);

  return null;
}

export default function App() {
  const [boundingBox, setBoundingBox] = useState(null);
  const controlsRef = useRef();

  const fixedDistance = 20;

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas camera={{ position: [0, 10, 15], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={1.5} />

        <Sky distance={450000} sunPosition={[1, 1, 0]} inclination={0} azimuth={0.25} turbidity={10} />

        <Suspense fallback={null}>
          <Environment onModelLoaded={setBoundingBox} />
          {boundingBox && <SpawnedModel boundingBox={boundingBox} />}
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          minDistance={fixedDistance}
          maxDistance={fixedDistance}
          enableZoom={false}
          enablePan={true}
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN,
          }}
          panSpeed={7}
        />

        <CameraController boundingBox={boundingBox} controlsRef={controlsRef} />
      </Canvas>
    </div>
  );
}
