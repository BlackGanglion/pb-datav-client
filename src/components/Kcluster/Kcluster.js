import React, { Component, PropTypes } from 'react';
import * as d3 from 'd3';

import './Kcluster.scss';

var xPadding = 30;
var yPadding = 0;
var xAxisHeight = 480;
var xAxisWidth = 650;

class Kcluster extends Component {
  static propTypes = {
    data: PropTypes.array,
  }

  initMap(data) {
    const cluster = d3.select('.cluster');

    const xMin = d3.min(data, (d) => { return d.x; }) - 0.2;
    const xMax = 0.2 + parseFloat(d3.max(data, (d) => { return d.x; }));

    const yMin = d3.min(data, (d) => { return d.y; }) - 0.2;
    const yMax = 0.2 + parseFloat(d3.max(data, (d) => { return d.y; }));

    const xScale = d3.scaleLinear()
            .domain([xMin, xMax])
            .range([xPadding, xPadding + xAxisWidth]);

    const yScale = d3.scaleLinear()
            .domain([yMin, yMax])
            .range([xAxisHeight, yPadding]);

    const xAxis = d3.axisBottom(xScale);

    const yAxis = d3.axisLeft(yScale);

    cluster.append("g")
      .attr("transform", `translate(0, ${xAxisHeight})`)
      .call(xAxis);

    cluster.append("g")
      .attr("transform", `translate(${xPadding}, 0)`)
      .call(yAxis);
  }

  componentDidMount() {
    this.initMap(this.props.data);
  }

  componentWillReceiveProps(nextProps) {
    if (!this.props.data.length && nextProps.data.length) {
      this.initMap(nextProps.data);
    }
  }

  render() {
    return (
      <div className="portal-k-cluster">
        <svg className="cluster" style={{ width: 700, height:500 }} />
      </div>
    )
  }
}

export default Kcluster;
