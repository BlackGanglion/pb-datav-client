import React, { PureComponent, PropTypes } from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';
import { actions } from './AreaLineRedux';
import setRafTimeout, { clearRafTimeout } from 'setRafTimeout';
import AreaLineMain from './AreaLineMain';

import './AreaLine.scss';

@connect((state, ownProps) => {
  return {
    ...state.portal.areaLine,
  };
}, {
  ...actions,
})
class AreaLine extends PureComponent {
  componentWillReceiveProps(nextProps) {
    /*
    if (!this.props.isRender && nextProps.isRender) {
      if (!_.isEmpty(nextProps.cluster)
        && !_.isEqual(this.props.cluster, nextProps.cluster)) {
        const nodeList = this.initPos(nextProps.cluster);
        console.log(nodeList);
        this.props.updateNodeList(nodeList);
        const container = this.refs.container;
        const shoot = new AreaLineMain(container, {
          width: 900,
          height: 600,
          nodeList,
        });

        this.shoot = shoot;
      }
    }
      this.shoot.render([{
        source: 5470,
        target: 5510,
      }]);
    */

    if (this.props.isRender && nextProps.isRender) {
      const { cluster, startSelectedDate, startSelectedHour,
        endSelectedDate, endSelectedHour, width, height } = nextProps;
      // 更新聚类后重新计算点坐标
      if (!_.isEqual(cluster, this.props.cluster) && !_.isEmpty(cluster)) {
        const nodeList = this.initPos(nextProps.cluster);

        if (this.shoot) {
          this.shoot.destory();
          this.shoot = null;
        }

        const container = this.refs.container;
        const shoot = new AreaLineMain(container, {
          width,
          height,
          nodeList,
        });

        this.shoot = shoot;

        // 更新点坐标
        this.props.updateNodeList(nodeList);
      }

      // 更新坐标后，重新绘制点的坐标底图，初始化飞线图，请求数据
      if (!_.isEqual(nextProps.nodeList, this.props.nodeList)) {
        // this.renderNodeMap();
        // this.shoot = this.renderAreaLine();

        // this.timer =

        /*
        || !_.isEqual(startSelectedDate, this.props.startSelectedDate)
        || !_.isEqual(startSelectedHour, this.props.startSelectedHour)
        || !_.isEqual(endSelectedDate, this.props.endSelectedDate)
        || !_.isEqual(endSelectedHour, this.props.endSelectedHour)
        */
      }

      // 更新数据，将数据加入飞线池

    }
  }

  // 将地理坐标映射
  initPos(cluster) {
    const { width, height } = this.props;
    const { nodeList } = cluster;

    // (50, 50) -> (width - 50, height - 50)
    // (xMin, yMax) -> (xMax, yMin)

    let xMin = 100000;
    let yMin = 100000;
    let xMax = -1;
    let yMax = -1;
    nodeList.forEach((node, i) => {
      const { x, y } = node;

      if (x > xMax) xMax = x;
      if (y > yMax) yMax = y;
      if (x < xMin) xMin = x;
      if (y < yMin) yMin = y;
    });

    return nodeList.map((node) => {
      const { x, y } = node;

      const xPos =  (width - 100) / (xMax - xMin)  * x +
        50 - xMin * (width - 100) / (xMax - xMin);
      const yPos = (height - 100) / (yMin - yMax) * y +
        50 - yMax * (height - 100) / (yMin - yMax);

      return {
        ...node,
        xPos,
        yPos,
      }
    });
  }

  render() {
    const { nodeList } = this.props;

    const texts = [];
    const nodes = nodeList.map((node, i) => {
      const { xPos, yPos, id, name } = node;
      texts.push(
        <div
          className="icon-text"
          key={`node-${i}`}
          style={{
            left: xPos + 16,
            top: yPos - 6,
          }}
        >{`${id}-${name}`}</div>
      );
      return (
        <i
          className="icon icon-node"
          style={{
            left: xPos - 8,
            top: yPos - 8,
          }}
          key={i}
        />
      );
    });

    return (
      <div className="area-line" ref="container" style={{
        display: this.props.isRender ? 'block' : 'none',
      }}>
        <div className="area-line-node">
          {nodes}
          {this.props.isShowtexts ? texts : null}
        </div>
      </div>
    );
  }
}

export default AreaLine;
