// react lib
import React, { useState } from 'react'

import { makeStyles } from '@material-ui/core'

const useStyles = makeStyles({
    background: {
        display: 'grid',
        gridTemplateAreas:`
            '. date date        date  date       date  .'
            '. pos  keywordPos  line  keywordNeg neg   .'
            '. pos  keywordPos  line  keywordNeg neg   .'`,
        gridTemplateColumns: '50px 1fr 130px 20px 130px 1fr 50px',
        width: "100%",
        height: "fit-content",
        backgroundColor: "white",
        marginTop: '20px'
    },
    date: {
        display: 'flex',
        gridArea: 'date',
        alignSelf: 'center',
        justifySelf: 'center',
        fontSize: '20px',
        borderRadius: '5px',
        height: 'fit-content',
        width: 'fit-content',
        padding: '5px 15px',
        fontWeight: 'bold',
    },
    keyword: {
        display: 'flex',
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '18px',
        color: 'white',
        borderRadius: '5px',
        height: '30px',
        width: '80%',
        fontWeight: 'bold',
    },
    keywordPos: {
        gridArea: 'keywordPos',
        justifySelf: 'left',
        backgroundColor: '#679b9b',
    },
    keywordNeg: {
        gridArea: 'keywordNeg',
        justifySelf: 'right',
        backgroundColor: '#b21f66',
    },
    line: {
        display: 'flex',
        gridArea: 'line',
        height: '80%',
        width: '2px',
        alignSelf: 'center',
        justifySelf: 'center',
        backgroundColor: '#888888',
    },
    news: {
        display: 'block',
        boxSizing: 'border-box',
        borderRadius: '5px',
        padding: '20px 20px',
        width: '90%',
        marginRight: 'auto',
        marginLeft: 'auto',
    },
    newsPos: {
        border: '3px solid #aacfcf',
        backgroundColor: 'white',
        gridArea: 'pos',
    },
    newsNeg: {
        border: '3px solid #b21f66',
        backgroundColor: 'white',
        gridArea: 'neg',
    },
    link: {
        display: 'block',
        width: '100%',
        fontSize: '16px',
        fontWeight: 'bold',
        padding: '10px',
    }
})


export default function Timeline(props) {
    const classes = useStyles()
    const date = props.data.date
    const keyword = props.data.keyword

    const sentiment = (props.data.posLinks.length >= props.data.negLinks.length)? 'pos' : 'neg'

    const sentimentKeyword = (sentiment === "pos")? classes.keywordPos:classes.keywordNeg

    const posLinkDOM = props.data.posLinks.map((link)=> {
        return <p className={classes.link}>{link}</p>
    })

    const negLinkDOM = props.data.negLinks.map((link)=> {
        return <p className={classes.link}>{link}</p>
    })

    return (
        <section className={classes.background} data-aos='fade-down'>
            <time className={classes.date}>{date}</time>
            <h3   className={`${classes.keyword} ${sentimentKeyword}`}>{keyword}</h3>
            <figure className={classes.line}></figure>
            {
                props.data.posLinks.length > 0 &&
                <section className={`${classes.news} ${classes.newsPos}`} data-aos='fade-right'>
                    {posLinkDOM}
                </section>
            }
            {
                props.data.negLinks.length > 0 &&
                <section className={`${classes.news} ${classes.newsNeg}`} data-aos='fade-left'>
                    {negLinkDOM}
                </section>
            }
        </section>
    )
}