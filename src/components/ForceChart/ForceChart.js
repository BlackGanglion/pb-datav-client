import React, { PureComponent, PropTypes } from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';

import calculateForceChart from './calculateForceChart';
import { actions } from './ForceRedux';

import { Input, Button, Radio } from 'antd';
const RadioGroup = Radio.Group;

import ForceChartSVG from './ForceChartSVG';

import './ForceChart.scss';

const width = 910;
const height = 595;

@connect((state, ownProps) => {
  return {
    ...state.portal.force,
    allNodesList: state.portal.page.allNodesList,
  };
}, {
  ...actions,
})
class ForceChart extends PureComponent {
  static propTypes = {
    tabModelKey: PropTypes.string,
    data: PropTypes.object,
    date: PropTypes.string,
    hour: PropTypes.string,
    isRender: PropTypes.bool,
    requestData: PropTypes.func,
    updateForceChartConfig: PropTypes.func,
    updateClusters: PropTypes.func,
    updateSelectedLink: PropTypes.func,
    changeMapLink: PropTypes.func,
  }

  constructor(props) {
    super(props);

    this.state = {
      svgKey: Math.random(),
      isConfigOpen: false,
      // 渲染面板显示/隐藏
      // renderAreaOpen: true,

      config: {
        count: props.count,
        temperature: props.temperature,
        temperatureMin: props.temperatureMin,
        cr: props.cr,
        ca: props.ca,
        lastTime: props.lastTime,
        isUseClub: props.isUseClub,
        clubNumber: props.clubNumber,
        g: props.g,
        gc: props.gc,
      }
    };
  }

  checkConfigProps(next, cur) {
    const checkList = [
      'count', 'temperature', 'temperatureMin',
      'cr', 'ca', 'lastTime', 'isUseClub',
      'clubNumber', 'g', 'gc',
    ];

    for (let i = 0; i < checkList.length; i++) {
      if (!_.isEqual(next[checkList[i]], cur[checkList[i]])) {
        return true;
      }
    }

    return false;
  }

  componentWillReceiveProps(nextProps) {
    const { data, date, hour, cluster, tabModelKey } = nextProps;

    // 渲染卡片，如果数据不为空，更新图
    /*
    if (!this.props.isRender
      && nextProps.isRender
      && !_.isEmpty(nextProps.data)) {
      if (!_.isEqual(data, this.props.data)) {
        this.clubNodes = calculateForceChart(width, height, nextProps);
        this.setState({
          svgKey: Math.random(),
        });
      }
    }
    */

    if (nextProps.isRender && this.props.isRender) {
      // 更新数据或配置时，更新图
      if ((!_.isEqual(data, this.props.data) && !_.isEmpty(data))
        || this.checkConfigProps(nextProps, this.props)) {
        this.clubNodes = calculateForceChart(width, height, nextProps);
        this.setState({
          svgKey: Math.random(),
        });
      }

      // 更新时间或区域时，更新数据
      if (!_.isEqual(date, this.props.date)
        || !_.isEqual(hour, this.props.hour)
        || !_.isEqual(cluster, this.props.cluster)) {
        if (!_.isEmpty(cluster) && !_.isEmpty(date) && !_.isEmpty(hour)) {
          if (tabModelKey === "1") {
            this.props.requestData(cluster, date, hour, width, height);
          } else {
            // 数据处理一下

            console.log(cluster);

            const nodeMap = [];
            const clusters = cluster;
            const colorList = [];
            for(let i = 0; i < clusters.length; i++) {
              const { nodeList, id: cid, color } = clusters[i];
              colorList.push(color);

              for(let j = 0; j < nodeList.length; j++) {
                const { id } = nodeList[j];
                nodeMap.push({
                  id,
                  // K聚类没有id编号，上方聚类区有相应编号
                  clusterId: cid || i,
                });
              }
            }

            const clustersInfo = {
              count: clusters.length,
              nodeMap,
            }

            this.props.requestData(clustersInfo, colorList, date, hour);
          }
        }
      }
    }
  }

  changeConfig(name, e) {
    const value = e.target.value;

    this.setState({
      config: {
        ...this.state.config,
        [name]: value,
      }
    });
  }

  render() {
    const { data, cluster, date, hour, isRender,
      lastTime, kSelectedNodeFn, clubNodes,
      allNodesList, updateClusters, updateSelectedLink,
      changeMapLink, tabModelKey, kSelectedArea, kSelectedAreaLink } = this.props;

    const { renderAreaOpen } = this.state;

    let tip = '';
    if (_.isEmpty(data)) {
      tip = '计算中...';
    }
    if (_.isEmpty(date)) {
      tip = '请选择左侧日期';
    }
    if (_.isEmpty(hour)) {
      tip = '请选择左侧小时';
    }
    if (_.isEmpty(cluster)) {
      tip = (tabModelKey === "1" ? '请从左侧列表选取区域，与上方区域有对应关系' : '请从左侧两种方式中选择');
    }

    if (_.isEmpty(cluster) || _.isEmpty(date) || _.isEmpty(hour) || _.isEmpty(data)) {
      return (
        <div
          className="force-chart-empty"
          style={{ display: isRender ? 'block' : 'none' }}
        >
          {tip}
        </div>
      );
    }
    return (
      <div
        className="force-chart"
        style={{
          display: isRender ? 'block' : 'none'
        }}
      >
        <ForceChartSVG
          tabModelKey={tabModelKey}
          data={data}
          width={width}
          height={height}
          svgKey={this.state.svgKey}
          clubNodes={this.clubNodes}
          lastTime={lastTime}
          kSelectedNodeFn={kSelectedNodeFn}
          allNodesList={allNodesList}
          updateClusters={updateClusters}
          updateSelectedLink={updateSelectedLink}
          changeMapLink={changeMapLink}
          kSelectedArea={kSelectedArea}
          kSelectedAreaLink={kSelectedAreaLink}
        />
        {this.state.isConfigOpen ? (
          <div className="right-config-open">
           <i
            className="icon icon-pull-right"
            onClick={() => { this.setState({ isConfigOpen: false }); }}
           />
           <div className="right-config-open-item">
              <span>迭代次数:</span>
              <Input
                value={this.state.config.count}
                placeholder="默认200"
                onChange={this.changeConfig.bind(this, 'count')}
               />
            </div>
            <div className="right-config-open-item">
              <span>初始温度:</span>
              <Input
                value={this.state.config.temperature}
                placeholder="默认100"
                onChange={this.changeConfig.bind(this, 'temperature')}
              />
            </div>
            <div className="right-config-open-item">
              <span>阈值温度:</span>
              <Input
                value={this.state.config.temperatureMin}
                placeholder="默认0.01"
                onChange={this.changeConfig.bind(this, 'temperatureMin')}
               />
            </div>
            <div className="right-config-open-item tip">
              (大于阈值温度，每次迭代温度下降2，小于下降0.01，直至0)
            </div>
            <div className="right-config-open-item">
              <span>斥力系数:</span>
              <Input
                value={this.state.config.cr}
                placeholder="默认1"
                onChange={this.changeConfig.bind(this, 'cr')}
              />
            </div>
            <div className="right-config-open-item">
              <span>引力系数:</span>
              <Input
                value={this.state.config.ca}
                placeholder="默认1"
                onChange={this.changeConfig.bind(this, 'ca')}
               />
            </div>
            <div className="right-config-open-item">
              <span>持续时间:</span>
              <Input
                value={this.state.config.lastTime}
                placeholder="默认20s"
                onChange={this.changeConfig.bind(this, 'lastTime')}
              />
            </div>
            <div className="right-config-open-item tip">
              (时间单位为s)
            </div>
            <div className="right-config-open-item">
              <RadioGroup
                onChange={this.changeConfig.bind(this, 'isUseClub')}
                value={this.state.config.isUseClub}
              >
                <Radio key="a" value={true}>使用社团引力</Radio>
                <Radio key="b" value={false}>不使用社团引力</Radio>
              </RadioGroup>
            </div>
            <div className="right-config-open-item">
              <span>社团中心数量:</span>
              <Input
                value={this.state.config.clubNumber}
                placeholder="默认4"
                onChange={this.changeConfig.bind(this, 'clubNumber')}
              />
            </div>
            <div className="right-config-open-item">
              <span>社团引力系数:</span>
              <Input
                value={this.state.config.g}
                placeholder="默认0.81"
                onChange={this.changeConfig.bind(this, 'g')}
              />
            </div>
            <div className="right-config-open-item tip">
              (图中程点为社团引力中心点，鼠标移至社团引力中心点上可看到节点从属社团关系)
            </div>
            <div className="right-config-open-item">
              <span>社团中心斥力系数:</span>
              <Input
                value={this.state.config.gc}
                placeholder="默认4"
                onChange={this.changeConfig.bind(this, 'gc')}
              />
            </div>
            <Button
              type="primary"
              onClick={() => {
                this.props.updateForceChartConfig(this.state.config);
              }}
            >
              提交配置并重新渲染
            </Button>
          </div>
        ) : (
          <div className="right-config-close">
            <i
              className="icon icon-pull-left"
              onClick={() => { this.setState({ isConfigOpen: true }); }}
            />
          </div>
        )}
      </div>
    );
  }
}

export default ForceChart;

