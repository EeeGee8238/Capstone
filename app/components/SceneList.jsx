import React from 'react';
import ReactDOM, { render } from 'react-dom';
import { Link, NavLink, Router } from 'react-router-dom'
import Firebase from 'firebase';

const games = [
  { name: 'Mount Death', description: 'Mountains and stuff', img: './assets/textures/grayball-choose.png' },
  { name: 'Elysium', description: "Travel to the future", img: './assets/textures/green_black_cubes.jpg' },
  { name: 'Adventure Island', description: "Sand and stuff", img: './assets/textures/netball-choose.png' },  
]

class ChooseGame extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
        sceneId: 0
    }
    this.sceneChoice = this.sceneChoice.bind(this)
  }

  sceneChoice(evt) {
    firebase.database().ref('games/' + this.props.gameId).update({ scene: +evt.target.id });        
    this.setState({ sceneId: +evt.target.id });
  }

  render() {

    return (
        <div className="content has-text-centered">
        <div className="notification">
          <h1><strong>Choose Your Battleground</strong></h1>
            <div className="columns is-multiline">
                {games && games.map((game, i) => (
                  <article key={i}
                    className="column is-one-third product-grid-item">
                    <div key={i} className="inner-product">
                      <br />
                      <figure className="image">
                        <img src={games.img} id={i} alt="Image" onClick={(evt) => this.sceneChoice(evt)}/>
                      </figure>
                      <p className="subtitle">{game.name}</p>
                      <p className="subtitle">{game.description}</p>
                        <button id={i} onClick={(evt) => this.sceneChoice(evt)}
                        className="button is-success is-outlined playnow">
                        { this.state.sceneId === i ? `Selected` : 'Select' }
                      </button>
                    </div>
                  </article>
                )
                )}
              </div>
          </div>
        <br></br>
        </div>
    );
  }
}

// /* -----------------    CONTAINER     ------------------ */

import { setUser, chooseGame } from '../reducers/auth'
import { connect } from 'react-redux'
import store from '../store';

const mapStateToProps = (state) => ({
  user: state.auth.user
})

const mapDispatch = ({ setUser, chooseGame })

export default connect(mapStateToProps, mapDispatch)(ChooseGame)
