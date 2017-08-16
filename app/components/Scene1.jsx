import React from 'react'
import game, {createScene, getScene} from '../reducers'
import createScene2 from './Scene2'
import {changeScene} from './Game'
/* global BABYLON */
const createScene1 = (canvas, engine) => {
  var sceneval=game.action
  console.log('creating scene 1')
  const scene = new BABYLON.Scene(engine) // creates a basic Babylon scene object
  scene.enablePhysics()
  scene.collisionsEnabled = true
  const light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene)
  light.intensity = 0.7 // default is 1, so this is slightly dimmed

  // ---- SHAPES ----

  let sphere1 = BABYLON.Mesh.CreateSphere('sphere1', 16, 2, scene) // Params: name, subdivs, size, scene
  sphere1.position.y = 3
  sphere1.position.x= 4
  sphere1.checkCollisions = true

  let sphere2 = BABYLON.Mesh.CreateSphere('sphere2', 32, 2, scene)
  sphere2.position.y = 3
  sphere2.position.x = -4
  sphere2.checkCollisions = true

  const head = BABYLON.MeshBuilder.CreateBox('box', 1, scene)
  head.position.x = 0
  head.position.y = 0

  head.parent = sphere1

  const torus = BABYLON.Mesh.CreateTorus('torus', 2, 0.5, 10, scene)
  torus.position.z = -19
  torus.position.x = -10

  // ---- GROUND ----

  const ground = BABYLON.Mesh.CreateGround('ground1', 50, 50, 2, scene)
  ground.checkCollisions = true

  // ---- CURVE POINTS ----

  const curvePoints = (l, t) => {
    const path = []
    const step = l / t
    const a = 5
    for (let i = -l / 2; i < l / 2; i += step) {
      path.push(new BABYLON.Vector3(5 * Math.sin(i * t / 400), i, 5 * Math.cos(i * t / 400)))
    }
    return path
  }
  const curve = curvePoints(40, 100)

  // ---- PHYSICS ----

  sphere1.physicsImpostor = new BABYLON.PhysicsImpostor(sphere1, BABYLON.PhysicsImpostor.SphereImpostor, {
    mass: 0.01,
    friction: 0.5,
    restitution: 0.7
  }, scene)
  ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, {
    mass: 0,
    restitution: 0.9
  }, scene)
  sphere2.physicsImpostor = new BABYLON.PhysicsImpostor(sphere2, BABYLON.PhysicsImpostor.SphereImpostor, {
    mass: 0.01,
    friction: 0.5,
    restitution: 0.7
  }, scene)

  // ---- Keys ----

  let zAxis = 0
  let xAxis = 0
  let yAxis = 0

  const keyState = {}

  window.addEventListener('keydown', function(e) {
    keyState[e.keyCode || e.which] = true
  }, true)
  window.addEventListener('keyup', function(e) {
    keyState[e.keyCode || e.which] = false
  }, true)

  function gameLoop() {
    if (keyState[37]||keyState[65]) {
      if (xAxis < 5) {
        xAxis += 0.5
      }
    }
    if (keyState[39]||keyState[68]) {
      if (xAxis > -5) {
        xAxis -= 0.5
      }
    }
    if (keyState[38]||keyState[87]) {
      if (yAxis < 5) {
        yAxis += 0.5
      }
    }
    if (keyState[40]||keyState[83]) {
      if (yAxis > -5) {
        yAxis -= 0.5
      }
    }
    if ((Math.round(sphere1.position.x) === torus.position.x) && (Math.round(sphere1.position.y - 1) === torus.position.y) && (Math.round(sphere1.position.z) === torus.position.z)) {
      if (window.confirm('You Won!\nNext Level?') === true) {
        // sphere1.dispose()
        changeScene()
        return
      } else {
        sphere1.dispose()
        sphere1 = BABYLON.Mesh.CreateSphere('sphere1', 16, 2, scene) // Params: name, subdivs, size, scene
        sphere1.position.y = 3
        sphere1.physicsImpostor = new BABYLON.PhysicsImpostor(sphere1, BABYLON.PhysicsImpostor.SphereImpostor, {
          mass: 0.01,
          friction: 0.5,
          restitution: 0.7
        }, scene)
        head.parent = sphere1
        zAxis = 0
        xAxis = 0
        yAxis = 0
        sphere1.material = ballMaterial
        sphere2.dispose()
        sphere2 = BABYLON.Mesh.CreateSphere('sphere2', 32, 2, scene)
        sphere2.position.y = 3
        sphere2.position.x = -4
        sphere2.physicsImpostor = new BABYLON.PhysicsImpostor(sphere2, BABYLON.PhysicsImpostor.SphereImpostor, {
          mass: 0.01,
          friction: 0.5,
          restitution: 0.7
        }, scene)
        sphere2.material = tubeMaterial
      }
    }
    if (sphere1.position.y<-20) {
      if (window.confirm('You Lose :(\nTry Again?') === true) {
        sphere1 = BABYLON.Mesh.CreateSphere('sphere1', 16, 2, scene) // Params: name, subdivs, size, scene
        sphere1.position.y = 3
        sphere1.physicsImpostor = new BABYLON.PhysicsImpostor(sphere1, BABYLON.PhysicsImpostor.SphereImpostor, {
          mass: 0.01,
          friction: 0.5,
          restitution: 0.7
        }, scene)
        head.parent = sphere1
        zAxis = 0
        xAxis = 0
        yAxis = 0
        sphere1.material = ballMaterial
        sphere2.dispose()
        sphere2 = BABYLON.Mesh.CreateSphere('sphere2', 32, 2, scene)
        sphere2.position.y = 3
        sphere2.position.x = -4
        sphere2.physicsImpostor = new BABYLON.PhysicsImpostor(sphere2, BABYLON.PhysicsImpostor.SphereImpostor, {
          mass: 0.01,
          friction: 0.5,
          restitution: 0.7
        }, scene)
        sphere2.material = tubeMaterial
      } else {
        // scene = createScene()
      }
    } else { sphere1.physicsImpostor.setAngularVelocity(new BABYLON.Quaternion(yAxis, 0, xAxis, 0)) };

    setTimeout(gameLoop, 30)
  }
  gameLoop()

  // ---- CAMERA ----

  // var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 20, -40), scene);
  // camera.setTarget(BABYLON.Vector3.Zero());
  // camera.attachControl(canvas, false);

  const followCamera = new BABYLON.FollowCamera('followCam', new BABYLON.Vector3(0, 15, -45), scene)
  followCamera.radius = 10 // how far from the object to follow
  followCamera.heightOffset = 7 // how high above the object to place the camera
  followCamera.rotationOffset = 180 // the viewing angle / 180
  followCamera.cameraAcceleration = 0.05 // how fast to move
  followCamera.maxCameraSpeed = 10 // speed limit / 0.05
  followCamera.attachControl(canvas, true)
  scene.activeCamera = followCamera
  followCamera.lockedTarget = head

  // camera
  // var camera = new BABYLON.TargetCamera("targetCam", BABYLON.Vector3.Zero(), scene);
  // var camera = new BABYLON.ArcRotateCamera("camera1",  0, 0, 0, new BABYLON.Vector3(0, 0, -0), scene);
  // camera.setPosition(new BABYLON.Vector3(0, 50, -200));
  // camera.attachControl(canvas, true);

  // Follow Cam
  // var followCam = new BABYLON.FollowCamera("fcam", new BABYLON.Vector3(0, 15, -45), scene);
  // followCam.setTarget = sphere1;
  // followCam.radius = 10;

  // scene.activeCamera = followCam;

  // var targetCam = new BABYLON.TargetCamera("tcam", new BABYLON.Vector3(0, 15, -45), scene);
  // targetCam.setTarget(sphere1.position);
  // scene.activeCamera = targetCam;
  // var target = BABYLON.Vector3.Zero();

  // ---- MATERIAL ----

  var ballMaterial = new BABYLON.StandardMaterial('material', scene)
  var tubeMaterial = new BABYLON.StandardMaterial('material', scene)
  var textureTube = new BABYLON.Texture('marblept.png', scene)
  var textureBall = new BABYLON.Texture('woodpt.png', scene)
  ballMaterial.diffuseColor = new BABYLON.Color3(2.0, 1, 0.7)
  ballMaterial.diffuseTexture = textureBall
  ballMaterial.diffuseTexture.hasAlpha = true
  sphere1.material = ballMaterial
  tubeMaterial.diffuseTexture = textureTube
  tubeMaterial.diffuseTexture.hasAlpha = true
  sphere2.material = tubeMaterial
  torus.material = tubeMaterial
  var groundMaterial = new BABYLON.StandardMaterial('material', scene)
  var textureGrass = new BABYLON.Texture('marblept.png', scene)
  groundMaterial.diffuseTexture = textureGrass
  ground.material = groundMaterial

  // ---- RETURN SCENE ----

  return scene
}
export default createScene1
