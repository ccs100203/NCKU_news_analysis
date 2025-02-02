import React, { useEffect } from 'react'
import * as d3 from 'd3'
import cloud from 'd3-cloud'
import { CircularProgress } from '@material-ui/core'
import { makeStyles } from '@material-ui/core'

const useStyles = makeStyles({
    margin: {
        margin: 'auto',
    }
})

const normalize = (size) => {
    return 40 * 1/(1+Math.exp(-size) );
}

const circleRender = (data, nodeId, treshold) => {
    let width = window.innerWidth*0.5, height = 300, sizeDivisor = 0.4, nodePadding = 2.5;
    let fill = d3.scaleOrdinal(d3.schemeCategory10);
    cloud().size([width, height])
            .words(data)
            .padding(2)
            .rotate(function () {
                return ~~(Math.random() * 2) * 90;
            })
            .rotate(function () {
                return 0;
            })
            .fontSize(function (d) {
                return normalize(d.size);
            })
            .padding(function (d) {
                console.log(d.text.length)
                return d.text.length + 2
            })
            .on('end', draw)
            .start();

    function draw(words) {
        d3.select(`#${nodeId}`).select('svg').remove()
        d3.select(`#${nodeId}`).append('svg')
                .attr('width', width)
                .attr('height', height)
                .append('g')
                .attr('transform', 'translate(' + width * 1.2 / 2 + ',' + height * 1 / 2 + ')')
                .selectAll('text')
                .data(words)
                .enter()
                    .append('text')
                    .style('font-size', function (d) {
                        return normalize(d.size) + 'px';
                    })
                    .style('font-family', 'Microsoft JhengHei')
                    .style('cursor', 'pointer')
                    .style('fill', function (d, i) {
                        return fill(i);
                    })
                    .attr('text-anchor', 'middle')
                    .attr('transform', function (d) {
                        return 'translate(' + [d.x, d.y] + ')rotate(' + d.rotate + ')';
                    })
                    .text(function (d) {
                        return d.text;
                    })
                    .on('click', function (d) {
                        window.open('https://www.google.com/search?q=' + d.text, '_blank');
                    });
    }
}


export default function (props) {

    const classes = useStyles()

    useEffect(() => {
        if(props.data){
            let preData = []
            Object.keys(props.data).map( index => {
                preData.push({
                    'text': props.data[index]['text'],
                    'size': props.data[index]['size'],
                })
            })
            circleRender(preData, props.id, 0)
        }
    }, [props.data])

    if(props.ready){
        return (
            <div>
                <div data-aos='fade-right' data-aos-delay='2000' data-aos-duration='1500' id={props.id}></div>
            </div>
        )
    }else{
        return (
            <div>
                <h1> Wait a min! </h1>
                <CircularProgress className={classes.margin}/>
            </div>
        )
    }
}
