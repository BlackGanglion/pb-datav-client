import React, { Component, PropTypes } from 'react';
import * as d3 from 'd3';

import { getRandomNum, contains, randomColor } from 'utils/utils';

import { Progress, message } from 'antd';

import './Kcluster.scss';

const width = 870;
const height = 550;

const xPadding = 50;
const yPadding = 0;
const xAxisHeight = 500;
const xAxisWidth = 800;

const edge = 15;
const delayTime = 5;

class Kcluster extends Component {
  static propTypes = {
    data: PropTypes.array,
    // 区域个数
    count: PropTypes.number,
    isZoom: PropTypes.bool,
    changeIsZoom: PropTypes.func,
    kSelectedNode: PropTypes.object,
    kSelectedNodeFn: PropTypes.func,
    status: PropTypes.string,
    changeStatus: PropTypes.func,
    updateClusters: PropTypes.func,
    setProgress: PropTypes.func,
    isRender: PropTypes.bool,
    calClustersDis: PropTypes.func,
  }

  constructor(props) {
    super(props);

    this.delay = 0;
  }

  initAxis(data) {
    this.cluster = d3.select('.cluster');

    const xMin = d3.min(data, (d) => { return d.x; }) - 0.01;
    const xMax = 0.01 + d3.max(data, (d) => { return d.x; });

    const yMin = d3.min(data, (d) => { return d.y; }) - 0.01;
    const yMax = 0.01 + d3.max(data, (d) => { return d.y; });

    this.xScale = d3.scaleLinear()
            .domain([xMin, xMax])
            .range([xPadding, xPadding + xAxisWidth]);

    this.yScale = d3.scaleLinear()
            .domain([yMin, yMax])
            .range([xAxisHeight, yPadding]);

    this.xAxis = d3.axisBottom(this.xScale);

    this.yAxis = d3.axisLeft(this.yScale);

    this.gX = this.cluster.append("g")
      .attr("transform", `translate(0, ${xAxisHeight})`)
      .call(this.xAxis);

    this.gY = this.cluster.append("g")
      .attr("transform", `translate(${xPadding}, 0)`)
      .call(this.yAxis);
  }

  initNode() {
    this.cluster.selectAll("circle").remove();
    this.cluster.selectAll("rect").remove();

    const { data } = this.props;

    const kSelectedNodeFn = this.props.kSelectedNodeFn;
    this.viewNode = this.cluster
      .selectAll(".circle")
      .data(data)
      .enter()
      .append('circle')
      .attr("class", function(d, i) {
        return `node${data[i].id}`
      })
      .attr("cx", (d) => {
        return this.xScale(d.x);
      })
      .attr("cy", (d) => {
        return this.yScale(d.y);
      })
      .attr("r", function(d) {
        return 1;
      })
      .on('mouseover', function(d) {
        const selectedId = d.id;
        kSelectedNodeFn(selectedId);
        d3.select(this)
          .attr("r", function(node) {
            const { id } = node;
            if (id === selectedId) {
              return 5;
            }
            return 1;
          });
      })
      .on('mouseout', function () {
        d3.select(this)
          .attr("r", 1);
      });
  }

  initCenter() {
    this.cluster.selectAll("rect").remove();

    const { data, count: k } = this.props;

    // 随机出K个点
    this.centroids = new Array();
    const indices = [];
    let i = 0;
    while(i < k) {
      const index = getRandomNum(0, data.length);
      if (contains(indices, index)) {
        continue;
      } else {
        indices.push(index);
        i++;
        this.centroids.push({
          ...data[index],
          color: randomColor(),
        });
      }
    }

    this.viewCenter = this.cluster
      .selectAll(".circle")
      .data(this.centroids)
      .enter()
      .append('rect')
      .attr("class", function(d, i) {
        return `cluster${i}`;
      })
      .attr("fill", function(d, i) { return d.color; })
      .attr("x", (d) => {
        return this.xScale(d.x) - (edge / 2);
      })
      .attr("y", (d) => {
        return this.yScale(d.y) - (edge / 2);
      })
      .attr("width", function(d) {
        return edge;
      })
      .attr("height", function(d) {
        return edge;
      });
  }

  euclDistance(vector1, vector2) {
    const dx = vector1.x - vector2.x;
    const dy = vector1.y - vector2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  changeCluster(nodeId, clusterId) {
    this.cluster.select(`.node${nodeId}`)
      .transition()
      .duration(100)
      .delay(this.delay)
      .attr("fill", this.centroids[clusterId].color);
    this.delay += delayTime;
  }

  changeCentroid(centroids, i) {
    this.cluster.select(`.cluster${i}`)
      .transition()
      .duration(1000)
      .delay(this.delay)
      .attr("x", () => {
        return this.xScale(centroids[i].x) - edge / 2;
      })
      .attr("y", () => {
        return this.yScale(centroids[i].y) - edge / 2;
      });
    this.delay += delayTime;
  }

  kmeans() {
    const { count: k, data } = this.props;

    let clusters = [];
    let clusterAssment = [];

    let clusterChanged = true;

    for (let i = 0; i < data.length; i++) {
      clusterAssment.push(-1);
    }

    while(clusterChanged) {
      clusters = [];
      for (let i = 0; i < k; i++) {
        clusters.push(new Array());
      }
      clusterChanged = false;

      // 节点的聚点归属
      for (let i = 0; i < data.length; i++) {
        let minDistance = 1000000;
        let maxDistance = -1000000;
        let cluster = -1;
        for(let j = 0; j < k; j++) {
          const distance = this.euclDistance(this.centroids[j], data[i]);
          if (distance < minDistance) {
            minDistance = distance;
            cluster = j;
          }
        }
        if(cluster != clusterAssment[i]) {
          clusterChanged = true;
          clusterAssment[i] = cluster;
          this.changeCluster(data[i].id, cluster);
        }
      }

      // 调整区域中心
      for (let i = 0; i < data.length; i++) {
        clusters[clusterAssment[i]].push(data[i]);
      }
      for (let i = 0; i < k; i++) {
        let sumX = 0;
        let sumY = 0;
        const len = clusters[i].length;
        for(let j = 0; j < len; j++) {
          sumX += clusters[i][j].x;
          sumY += clusters[i][j].y;
        }
        this.centroids[i].x = sumX / len;
        this.centroids[i].y = sumY / len;
        this.changeCentroid(this.centroids, i);
      }
    }

    return clusters.map((cluster, i) => {
      return {
        nodeList: cluster,
        color: this.centroids[i].color,
      };
    });
  }

  zoomed() {
    if (!this.props.isZoom) {
      this.props.changeIsZoom(true);
    }
    this.viewNode && this.viewNode.attr("transform", d3.event.transform);
    this.viewCenter && this.viewCenter.attr("transform", d3.event.transform);
    this.gX.call(this.xAxis.scale(d3.event.transform.rescaleX(this.xScale)));
    this.gY.call(this.yAxis.scale(d3.event.transform.rescaleY(this.yScale)));
  }

  resetZoom() {
    this.cluster.transition()
      .duration(750)
      .call(this.zoom.transform, d3.zoomIdentity);
  }

  handleZoom() {
    this.zoom = d3.zoom()
      .scaleExtent([1, 40])
      .translateExtent([[-100, -100], [width + 90, height + 100]])
      .on("zoom", this.zoomed.bind(this));

    this.cluster.call(this.zoom);
  }

  componentWillUnMount() {
    this.cluster = null;
    this.xScale = null;
    this.yScale = null;
    this.xAxis = null;
    this.yAxis = null;
    this.gX = null;
    this.gY = null;
    this.viewNode = null;
    this.viewCenter = null;
    this.zoom = null;
    this.centroids = null;
    this.delay = null;
  }

  componentWillReceiveProps(nextProps) {
    if (!this.props.isRender && nextProps.isRender) {
      if (!this.cluster) {
        this.initAxis(this.props.data);
        this.initNode(this.props.data);
        this.handleZoom();
      }
    }
    if (this.props.isZoom && !nextProps.isZoom) {
      this.resetZoom();
    }
    if (this.props.status === 'success'
      && nextProps.status === 'loading') {
      this.initNode();
      this.initCenter();
      this.handleZoom();
      const clusters = this.kmeans();

      const nodeMap = [];
      for(let i = 0; i < clusters.length; i++) {
        const { nodeList } = clusters[i];
        for(let j = 0; j < nodeList.length; j++) {
          const { id } = nodeList[j];
          nodeMap.push({
            id,
            clusterId: i,
          });
        }
      }

      const clustersInfo = {
        count: clusters.length,
        nodeMap,
      }

      // 计算聚类与聚类之间的关系
      this.props.calClustersDis(clustersInfo);

      this.props.setProgress(this.delay);

      setTimeout(() => {
        this.props.changeStatus('success');
        this.props.updateClusters(clusters);
      }, this.delay + 1000);
    }
  }

  render() {
    const { children, isRender } = this.props;
    return (
      <div className="portal-k-cluster" style={{
        display: isRender ? 'block' : 'none',
      }}>
        <svg className="cluster" style={{ width, height, }} />
        {children}
      </div>
    )
  }
}

export default Kcluster;
