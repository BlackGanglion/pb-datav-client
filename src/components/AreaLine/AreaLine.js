import React, { PureComponent, PropTypes } from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';
import { actions } from './AreaLineRedux';
import setRafTimeout, { clearRafTimeout } from 'setRafTimeout';
import AreaLineMain from './AreaLineMain';
import moment from 'moment';

import './AreaLine.scss';

const duration = 8000;

@connect((state, ownProps) => {
  return {
    ...state.portal.areaLine,
  };
}, {
  ...actions,
})
class AreaLine extends PureComponent {
  componentWillReceiveProps(nextProps) {
    if (this.props.isRender && nextProps.isRender) {
      const { cluster, startSelectedDate, startSelectedHour,
        endSelectedDate, endSelectedHour,
        width, height, forceUpdate } = nextProps;

      // 更新聚类后重新计算点坐标
      const isClusterUpdate = !_.isEqual(cluster, this.props.cluster) && !_.isEmpty(cluster);

      if (isClusterUpdate) {
        // 先暂停当前动画
        if(this.timer) clearRafTimeout(this.timer);

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
          duration,
        });

        this.shoot = shoot;

        // 更新点坐标
        this.props.updateNodeList(nodeList);
      }

      // 更新周期，重新请求参数
      if (isClusterUpdate
        || !_.isEqual(startSelectedDate, this.props.startSelectedDate)
        || !_.isEqual(startSelectedHour, this.props.startSelectedHour)
        || !_.isEqual(endSelectedDate, this.props.endSelectedDate)
        || !_.isEqual(endSelectedHour, this.props.endSelectedHour)
        || forceUpdate !== this.props.forceUpdate) {

        // 初始化
        this.props.initAreaLine();

        if (this.shoot) this.shoot.stopAnimate();
        if (this.timer) clearRafTimeout(this.timer);

        setTimeout(() => {
          this.requestNextData({
            ...nextProps,
            curDate: null,
            curHour: null,
          });
        }, 0);
      }

      // 更新数据，将数据加入飞线池
      if (!_.isEqual(nextProps.data, this.props.data)) {
        this.shoot.render(nextProps.data);
      }
    }
  }

  // 请求数据
  requestNextData(props) {
    const { curDate, curHour, cluster,
      startSelectedDate, startSelectedHour,
      endSelectedDate, endSelectedHour } = props;

    let nextDate;
    let nextHour;
    // 第一次请求
    if (curDate === null && curHour === null) {
      nextDate = startSelectedDate;
      nextHour = startSelectedHour;
    } else {
      // 累加一个小时
      if (curHour === '23') {
        nextHour = '00';
        nextDate = moment(curDate).add(1, 'days').format('YYYY-MM-DD');
      } else {
        nextDate = curDate;
        nextHour = 1 + Number(curHour);
        if (nextHour < 10) {
          nextHour = '0' + String(nextHour);
        }
        nextHour = String(nextHour);
      }
    }

    this.props.requestAreaLineData(cluster, nextDate, nextHour);

    // 判断是否和结束时间相等
    if (!(endSelectedDate === nextDate && endSelectedHour === nextHour)) {
      console.log(nextDate, nextHour);
      this.timer = setRafTimeout(() => {
        this.requestNextData({
          ...props,
          curDate: nextDate,
          curHour: nextHour
        });
      }, duration);
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

  renderTime() {
    const { curDate, curHour, count, isStart } = this.props;

    if (curHour === null || curDate === null) {
      if (isStart) {
        return (
          <div className="area-line-time">
            <span>请求数据与计算中...</span>
          </div>
        );
      }
      return null;
    }
    return (
      <div className="area-line-time">
        <span>当前时间:</span>
        <span>{curDate}</span>
        <span>{`${curHour}点`}</span>
        <span>{`(当时段车流量: ${count})`}</span>
      </div>
    );
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
          {this.renderTime()}
          {nodes}
          {this.props.isShowtexts ? texts : null}
        </div>
      </div>
    );
  }
}

export default AreaLine;
