// react lib
import React, { useState } from 'react'
import ReactDOM from 'react-dom';
import Button from '@material-ui/core/Button';

import { makeStyles } from '@material-ui/core';
import ReviewFrame from './ReviewFrame';

const useStyle = makeStyles( {
    background: {
        marginTop: '50px',
        display: 'block',
        height: 'auto',
        width: '100%',
    },
    topic: {
        display: 'block',
        width: '80%',
        height: 'auto',
        marginLeft: 'auto',
        marginRight: 'auto',
        marginBottom: '50px',
        boxSizing: 'border-box',
        textAlign: 'right',
        fontSize:  "80px",
        fontWeight: 'bold',
        letterSpacing: '10px',
        color: "black",
    },
    frame: {
        height: 'auto',
        width: '80%',
        marginLeft: '100px',
        display: 'grid',
        boxSizing: 'border-box',
        borderRadius: '5px',
        border: '5px solid #5eb7b7',
        gridTemplateAreas:`
            'num     keyword'
            'content content'`,
        gridTemplateColumns: '100px 1fr',
        gridTemplateRows: '80px auto',
    },
    frameNum: {
        gridArea: 'num',
        display: 'flex',
        alignSelf: 'center',
        justifyContent: 'center',
        color: '#5eb7b7',
        fontSize: '32px',
        fontWeight: 'bold',
    },
    frameKeyword: {
        gridArea: 'keyword',
        display: 'flex',
        alignSelf: 'center',
        color: '#5eb7b7',
        fontSize: '32px',
        fontWeight: 'bold',
    }
} )

const reviewContent = [
    {
        keyword: '武漢肺炎',
    },{
        keyword: '美國',
    },{
        keyword: '義大利',
    },{
        keyword: '中國',
    },{
        keyword: '蔡英文',
    },{
        keyword: '香港',
    },
]


export default function Review(props) {

    const classes = useStyle()
    const colorReview = ['#39375b', '#745c97', '#4b8e8d', '#396362'];
    const widthReview = ['60%', '66%', '71%', '76%', '80%', '75%', '70%', '65%'];

    const content = reviewContent.map((obj, index)=>{
        return  <ReviewFrame
                    color= {colorReview[index%4]}
                    num= {index + 1}
                    keyword= {obj.keyword}
                    width= {widthReview[index%6]}>
                </ReviewFrame>
    })

    return (
        <section className={classes.background}>
            <h1
                className={classes.topic}
                data-aos='fade-left'
            >
                新聞回憶錄
            </h1>
            {content}
        </section>
    )
}