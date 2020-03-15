import React, {Component} from 'react'
import ReactDOM from 'react-dom'
import Header from './layout/Header'
// import ContentBody from './layout/ContentBody'
import { Container } from '@material-ui/core'
import { Grid } from '@material-ui/core'
import WordCloud from './keyWord/WordCloud'
import KeyWordContent from './keyWord/KeyWordContent'
import './css/App.css'
class App extends Component {
    render() {
        return (
            <div>
                <Header />
                <WordCloud/>
                <KeyWordContent/>
            </div>
        )
    }
}

ReactDOM.render(<App />, document.getElementById('app'))