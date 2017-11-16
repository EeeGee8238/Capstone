/* global BABYLON */

import React, { Component } from 'react';
import firebase from '../../fire';
import createScene1 from './Scene1';
import createScene2 from './Scene2';
import InfoScreen from './InfoScreen';
import ScoreTable from './ScoreTable';
import WinScreen from './WinScreen';
import MuteSound from './MuteSound';
import balls from './balls';
import control from './Control';

const database = firebase.database();
const auth = firebase.auth();

let sceneNum = 1;
let torus;
let winPos;
let zAcceleration = 0;
let xAcceleration = 0;
const yAcceleration = 0;
const changeScene = (num) => {
  sceneNum = num;
};

class Game extends Component {
  constructor(props) {
    super(props);
    this.state = {
      playersInGame: [],
      objects: [],
      info: {},
    };
  }
  componentDidMount() {
    audio0.play();
    const user = this.props.user.userId;
    const gameId = this.props.user.gameId;
    const canvas = this.refs.renderCanvas;
    const engine = new BABYLON.Engine(canvas, true);
    let num = sceneNum;
    let texture;
    let scene = createScene1(canvas, engine);

    database.ref('games/' + gameId + '/playersInGame').on('value', (players) => {
      const playersObj = players.val();
      for (const playerId in playersObj) {
        if (!this.state.playersInGame.includes(playerId) && playersObj[playerId].create && !playersObj[playerId].remove) {
          database.ref('users/' + playerId + '/ball').on('value', (playersTexture) => {
            texture = playersTexture.val();
          });
          const newPlayer = this.createPlayerOnConnect(scene, playerId, texture);
          if (newPlayer.id === user) {
            this.playerPosition(newPlayer);
            this.setTexture(newPlayer, texture, scene);
            this.setState({ info: { x: newPlayer.position.x, y: newPlayer.position.y, z: newPlayer.position.z, color: newPlayer.material.diffuseColor, gameId } });
            database.ref('playerPosition/' + newPlayer.id).set(this.state.info);
          } else {
            this.setTexture(newPlayer, texture, scene);
            database.ref('playerPosition/' + playerId).on('value', (playerInfo) => {
              if (playerInfo.val()) {
                const x = playerInfo.val().x;
                const y = playerInfo.val().y;
                const z = playerInfo.val().z;
                const color = playerInfo.val().color;
                this.setPosition(newPlayer, x, y, z);
              }
            });
          }
          const newState = this.state.objects.slice();
          const newPlayersState = this.state.playersInGame.slice();
          newState.push(newPlayer);
          newPlayersState.push(playerId);
          this.setState({ objects: newState });
          this.setState({ playersInGame: newPlayersState });
          const followCamera = new BABYLON.FollowCamera('followCam', new BABYLON.Vector3(0, 15, -45), scene);
          if (playerId === user) {
            const playerDummy = this.createCameraObj(scene, newPlayer);
            control(newPlayer, this.state.info, playersObj);
            followCamera.lockedTarget = playerDummy;
            scene.activeCamera = followCamera;
            followCamera.radius = 15; // how far from the object to follow
            followCamera.heightOffset = 7; // how high above the object to place the camera
            followCamera.rotationOffset = 180; // the viewing angle / 180
            followCamera.cameraAcceleration = 0.05; // how fast to move
            followCamera.maxCameraSpeed = 10; // speed limit / 0.05
            followCamera.attachControl(canvas, true);
          }
          database.ref(newPlayer.id).on('value', (otherPlayer) => {
            if (otherPlayer.val()) {
              if (!newPlayer.physicsImpostor.isDisposed) {
                newPlayer.physicsImpostor.setAngularVelocity(new BABYLON.Quaternion(otherPlayer.val().zAcceleration, 0, otherPlayer.val().xAcceleration, 0));
              }
            }
          });
        }
        for (let i = 0; i < this.state.objects.length; i++) {
          if (playersObj[this.state.playersInGame[i]]) {
            if (playersObj[this.state.playersInGame[i]].remove) {
              database.ref('playerPosition/' + this.state.playersInGame[i]).off();
              this.state.objects[i].dispose();
              const newState = this.state.playersInGame.filter(player => player !== this.state.objects[i].id);
              this.setState({ playersInGame: newState });
              this.setState({ objects: this.state.objects.filter((_, j) => j !== this.state.objects.indexOf(this.state.objects[i])) });
            }
          }
        }
      }
      const removeGame = Object.keys(playersObj).every(player => playersObj[player].remove);
      if (removeGame) {
        database.ref('games/' + gameId).remove();
      }
    });

    database.ref('games/' + gameId).update({ 'winPosition': { x: 10, z: 10 } });
    this.createWinPoint();
    database.ref('games/' + gameId + '/winPosition').on('value', (position) => {
      winPos = position.val();
    });

    database.ref('games/' + gameId + '/playersInGame/winner').on('value', (winner) => {
      if (winner.val()) {
        if (user === winner.val()) {
          database.ref('users/' + user + '/wins').transaction((wins) => {
            wins += 1;
            return wins;
          });
        } else {
          database.ref('users/' + user + '/losses').transaction((losses) => {
            losses += 1;
            return losses;
          });
        }

        const myScore = this.props.user.totalScore;
        this.props.changeScore(-myScore);
        database.ref('games/' + gameId + '/playersInGame/' + user).update({ 'score': 0 });
        database.ref('games/' + gameId + '/playersInGame/winner').remove();
      }
    });

    engine.runRenderLoop(() => {
      if (winPos) {
        if ((torus.position.x !== winPos.x) || (torus.position.z !== winPos.z)) {
          torus.position.x = winPos.x;
          torus.position.z = winPos.z;
        }
      }
      if (!scene || (sceneNum !== num)) {
        num = sceneNum;
        switch (num) {
        case 2:
          scene = createScene2(canvas, engine);
          break;
        default: scene = createScene1(canvas, engine);
        }
        setTimeout(scene.render(), 500);
      } else {
        const me = this.state.objects.filter(player => player.id === user)[0];
        if (me && me.absolutePosition.y < -25) {
          while (me.position.y < 0) {
            this.playerPosition(me);
          }
          database.ref(user).set({ 'xAcceleration': 0, 'zAcceleration': 0 });
          me.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0, 0, 0));
          xAcceleration = 0;
          zAcceleration = 0;
          database.ref('users/' + user + '/totalScore').transaction((score) => {
            score -= 1;
            return score;
          });
          database.ref('games/' + gameId + '/playersInGame/' + user + '/score').transaction((score) => {
            this.props.changeScore(-1);
            score -= 1;
            return score;
          });
        }
        if (winPos) {
          if (me && (Math.floor(me.absolutePosition.x) === winPos.x) && (Math.floor(me.absolutePosition.z) === winPos.z)) {
            database.ref('users/' + user + '/totalScore').transaction((score) => {
              score += 1;
              return score;
            });
            database.ref('games/' + gameId + '/playersInGame/' + user + '/score').transaction((score) => {
              this.props.changeScore(1);
              score += 1;
              if (score >= 10) {
                database.ref('games/' + gameId + '/playersInGame/').update({ 'winner': user });
                score = 0;
              }
              return score;
            });
            const x = Math.floor(Math.random() * 50 - 25);
            const z = Math.floor(Math.random() * 50 - 25);
            database.ref('games/' + gameId + '/winPosition').set({ 'x': x, 'z': z });
          }
        }
        scene.render();
      }
    });

    window.addEventListener('resize', () => {
      engine.resize();
    });
    window.addEventListener('beforeunload', () => {
      database.ref('games/' + gameId + '/playersInGame/' + user).update({ remove: true });
      database.ref('playerPosition/' + user).remove();
      database.ref(user).remove();
    });
  }

  componentWillUnmount() {
    const user = this.props.user.userId;
    const gameId = this.props.user.gameId;
    database.ref('games/' + gameId + '/playersInGame/' + user).update({ remove: true });
    database.ref('games/' + gameId + '/playersInGame').off();
    database.ref('games/' + gameId + '/playersInGame/' + user).remove().then(() => {
      database.ref('games/' + gameId).once('value').then(allPlayers => {
        allPlayers = allPlayers.val();
        (!allPlayers.playersInGame) && database.ref('games/' + gameId).remove();
      });
    });
    database.ref(user).remove();
    database.ref(user).off();
    database.ref('playerPosition/' + user).remove();
    database.ref('playerPosition/' + user).off();
    database.ref('games/' + gameId + '/winPosition').off();
    database.ref('games/' + gameId + '/playersInGame/winner').off();
    audio0.pause();
  }

  createPlayerOnConnect(sce, id, texture) {
    const player = BABYLON.Mesh.CreateSphere(id, 16, 2, sce); // Params: name, subdivs, size, scene
    player.checkCollisions = true;
    const ballMaterial = new BABYLON.StandardMaterial('material', sce);
    const ballTexture = new BABYLON.Texture([balls][texture], sce);
    player.material = ballMaterial;
    if (!player.physicsImpostor) {
      player.physicsImpostor = new BABYLON.PhysicsImpostor(player, BABYLON.PhysicsImpostor.SphereImpostor, {
        mass: 1,
        friction: 0.5,
        restitution: 0.7
      }, sce);
    }
    return player;
  }

  setPosition(sphere, x, y, z) {
    sphere.position.x = x;
    sphere.position.y = y;
    sphere.position.z = z;
  }

  setTexture(sphere, texture, scene) {
    sphere.material.diffuseTexture = new BABYLON.Texture(balls[texture - 1].img, scene);
  }

  playerPosition(player) {
    const randomPosition = (min) => Math.floor(Math.random() * min - min / 2);
    player.position.y = 5;
    player.position.x = randomPosition(40);
    player.position.z = randomPosition(40);
  }

  createCameraObj(scene, par) {
    const head = BABYLON.MeshBuilder.CreateSphere('camera', 16, scene);
    head.parent = par;
    return head;
  }

  createWinPoint(scene) {
    torus = BABYLON.Mesh.CreateTorus('torus', 2, 0.5, 10, scene);
    torus.position.x = 10;
    torus.position.z = 10;
  }

  render() {
    return (
      <div>
        <MuteSound />
        <WinScreen user={this.props.user} database={database} />
        <InfoScreen />
        <ScoreTable gameId={this.props.user.gameId} />
        <canvas className='gameDisplay ' ref="renderCanvas"></canvas>
      </div>
    );
  }
}

// /* -----------------    CONTAINER     ------------------ */

import { changeScore } from '../reducers/auth';
import { connect } from 'react-redux';
import store from '../store';

const mapStateToProps = (state, ownProps) => ({
  user: state.auth.user
});

const mapDispatch = ({ changeScore });

export default connect(mapStateToProps, mapDispatch)(Game);

// /* -----------------    CONTAINER     ------------------ */

export { changeScene };
