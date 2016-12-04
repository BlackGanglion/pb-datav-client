import React, { Component, PropTypes } from 'react';
import { actions } from './PortalRedux';
import { connect } from 'react-redux';
import _ from 'lodash';
import Events from 'oui-dom-events';
import moment from 'moment';

import { Menu, Icon, Spin, Input,
  Button, Progress, Modal, DatePicker, Select,
  message, Tabs } from 'antd';
const Option = Select.Option;
const TabPane = Tabs.TabPane;
const confirm = Modal.confirm;

import './Portal.scss';

const DEFAULT_X = 120.159040411661;
const DEFAULT_Y = 30.2428426084585;

import markersCluster from 'components/BaiduMap/MarkersCluster';
import pointsCluster from 'components/BaiduMap/PointsCluster';
import circleLocalSearch, { clearCircle } from 'components/BaiduMap/Circle';
import convexHull, { clearAreaPolygon } from 'components/BaiduMap/ConvexHull'
import Kcluster from 'components/Kcluster/Kcluster';
import ForceChart from 'components/ForceChart/ForceChart';
import AreaLine from 'components/AreaLine/AreaLine';
import { showArea, clearArea, showLink } from 'components/BaiduMap/AreaShow';

@connect((state, ownProps) => {
  return {
    ...state.portal.page,
  };
}, {
  ...actions,
})
class Portal extends Component {
  static propTypes = {
    // store state
    getAllNodesList: PropTypes.func,
    allNodesList: PropTypes.array,
    isLoadingAllNodes: PropTypes.bool,
    isLoadingMap: PropTypes.bool,
    selectedKeys: PropTypes.array,
    clusterCount: PropTypes.number,
    clusterStatus: PropTypes.string,
    isClusterZoom: PropTypes.bool,
    kSelectedNode: PropTypes.object,
    clusters: PropTypes.array,
    selectedDate: PropTypes.string,
    selectedHour: PropTypes.string,
    nodeLinkData: PropTypes.object,
    selectedCluster: PropTypes.object,
    allStaMethod: PropTypes.string,
    loadingTip: PropTypes.string,

    // actions
    openLoading: PropTypes.func,
    closeLoading: PropTypes.func,
    changeSelectKeys: PropTypes.func,
    changeClusterCount: PropTypes.func,
    changeClusterStatus: PropTypes.func,
    changeIsZoom: PropTypes.func,
    kSelectedNodeFn: PropTypes.func,
    updateClusters: PropTypes.func,
    updateSelectedDate: PropTypes.func,
    updateSelectedHour: PropTypes.func,
    getNodeLinkData: PropTypes.func,
    selectedClusterFn: PropTypes.func,
    calClustersDis: PropTypes.func,
    changeAllStaMethod: PropTypes.func,
    updateCluster: PropTypes.func,
    deleteCluster: PropTypes.func,
  };

  constructor(props) {
    super(props);

    this.state = {
      height: document.documentElement.clientHeight,
      percent: 0,
      // 是否显示面板
      isShowPanel: true,
      // id
      cluster: null,
      // id列表
      // clusters: 0,
    };
  }

  initMap(nodes) {
    const { updateClusters, kSelectedNodeFn } = this.props;
    // 创建地图实例
    this.map = new BMap.Map("allmap");
    // 创建点坐标
    const point = new BMap.Point(DEFAULT_X, DEFAULT_Y);

    // 初始化地图，设置中心点坐标和地图级别
    this.map.centerAndZoom(point, 12);
    this.map.enableScrollWheelZoom();

    // 添加默认缩放平移控件
    this.map.addControl(new BMap.NavigationControl());

    // 百度地图原生聚类
    this.markersCluster = markersCluster(this.map, nodes, kSelectedNodeFn);

    // 初始化地图圈画
    circleLocalSearch(this.map, nodes, updateClusters);

    this.props.closeLoading();
  }

  handleReheight() {
    const height = document.documentElement.clientHeight;

    this.setState({
      height,
    });
  }

  componentDidMount() {
    // 请求所有站点
    this.props.getAllNodesList();

    // 调整Map高度
    this.handleReheightFn = _.throttle(this.handleReheight.bind(this), 120);
    Events.on(window, 'resize', this.handleReheightFn);
  }

  componentWillUnmount() {
    Events.off(window, 'resize', this.handleReheightFn);
    this.handleReheightFn = null;
    this.map = null;
    this.pointCollection = null;
    this.markersCluster = null;
    this.areaPolygon = null;
  }

  reInitMap(props) {
    const { allNodesList, allStaMethod, kSelectedNodeFn } = props;
    if (allStaMethod === 'scatter' && this.map) {
      if (this.markersCluster) this.markersCluster.clearMarkers();
      this.pointCollection = pointsCluster(this.map, allNodesList, kSelectedNodeFn);
    }

    if (allStaMethod === 'cluster' && this.map) {
      if (this.pointCollection) this.pointCollection.clear();
      this.markersCluster = markersCluster(this.map, allNodesList, kSelectedNodeFn);
    }

    if (allStaMethod === 'noMethod' && this.map) {
      if (this.markersCluster) this.markersCluster.clearMarkers();
      if (this.pointCollection) this.pointCollection.clear();
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!this.props.allNodesList.length && nextProps.allNodesList.length) {
      // 初始化地图
      this.initMap(nextProps.allNodesList);
    }

    if (this.props.allStaMethod !== nextProps.allStaMethod) {
      this.reInitMap(nextProps);
    }
  }

  handleMeunClick(e) {
    const { key } = e;

    if (key === 'force' || key === 'areaLine') {
      message.info('请选择区域与时间', 5);
    }

    this.props.changeSelectKeys(key);
  }

  renderPortalInfo() {
    const { selectedKeys, kSelectedNode } = this.props;
    if (_.isEmpty(kSelectedNode)) return null;

    if (_.isObject(kSelectedNode) && kSelectedNode.relations) {
      const { relations, source, target, value } = kSelectedNode;

      relations.sort((a, b) => {
        return Number(a.hour) - Number(b.hour);
      });

      const relationItems = relations.map((relation, i) => {
        const { hour, source, target, value } = relation;
        return <div key={i}>{`${hour}时 ${source}->${target} 流量:${value}`}</div>
      });

      return (
        <div className="link-info">
          <div>
            <strong>{`${source} 与 ${target} 间`}</strong>(<span>{` 车流量( ${value} )`}</span>)
          </div>
          <div>
            {relationItems}
          </div>
        </div>
      );
    }

    const { id, x, y, name, rx, ry, address, servicetime } = kSelectedNode;

    return (<div className="station-info">
      <div className="im">
        <strong>{`${id}: ${name}`}</strong>
      </div>
      <div>
        <strong>实际地理坐标:</strong>
      </div>
      <div>{`(${rx}, ${ry})`}</div>
      <div>
        <strong>百度地理坐标</strong>
      </div>
      <div>{`(${x}, ${y})`}</div>
      <div>
        <strong>地址:</strong> {`${address}`}
      </div>
      <div>
        <strong>服务时间:</strong>{`${servicetime}`}
      </div>
    </div>);
  }

  changePercent(delay) {
    const { percent } = this.state;
    const newPercent = Math.floor((percent + 100 / delay * 100) * 100) / 100;
    this.setState({
      percent: newPercent >= 100 ? 100 : newPercent,
    });
    if (newPercent < 100) {
      setTimeout(this.changePercent.bind(this, delay), 100);
    }
  }

  setProgress(delay) {
    setTimeout(this.changePercent.bind(this, delay), 100);
  }

  /*
  handleClusterInfo(index) {
    const cluster = this.props.clusters[index].nodeList;

    const items = cluster.map((e, i) => {
      const { name, id } = e;
      return (<p key={i}>{`${id}: ${name}`}</p>);
    });

    Modal.info({
      title: `当前区域 ${index} 节点信息(共 ${cluster.length} 个节点)`,
      content: (
        <div className="cluster-info-model">{items}</div>
      ),
      onOk() {},
    });
  }
  */

  handleShowCluster(index) {
    // 将区域映射到地图上
    const { clusters, kSelectedNodeFn } = this.props;
    const cluster = clusters[index];

    this.props.updateCluster(index, {
      ...cluster,
      selected: true,
      selectedHandler: showArea(this.map, cluster, kSelectedNodeFn),
    });
  }

  handleNoShowCluster(index) {
    const { clusters } = this.props;
    const cluster = clusters[index];

    clearArea(this.map, cluster.selectedHandler);

    this.props.updateCluster(index, {
      ...cluster,
      selected: false,
      selectedHandler: null,
    });
  }

  renderPortalCluster() {
    const { clusters, selectedKeys, selectedClusterFn } = this.props;

    if (clusters && clusters.length > 0) {
      return clusters.map((cluster, i) => {
        const { color, nodeList, id, selected, selectedHandler } = cluster;

        return (
          <Button
            className="portal-cluster-item"
            style={{
              backgroundColor: color,
              opacity: !selected ? 0.4 : 1,
            }}
            key={i}
            onClick={
              () => {
                if (selected) {
                  this.handleNoShowCluster(i);
                } else {
                  this.handleShowCluster(i);
                }
              }
            }
          >
            <i className="icon icon-delete"
              onClick={(e) => {
                e.stopPropagation();

                const self = this;
                confirm({
                  title: '提醒',
                  content: '是否删除当前区域?',
                  onOk() {
                    if(selectedHandler) {
                      clearArea(self.map, cluster.selectedHandler);
                    }

                    self.props.deleteCluster(i);
                  },
                  onCancel() {},
                });
              }}></i>
            {`区域${id} (${nodeList.length})`}
          </Button>
        );
      });
    }

    return <span className="cluster-empty">暂无生成区域</span>;
  }

  renderPortalControl() {
    const { selectedKeys, clusterCount, clusterStatus,
      selectedDate, selectedHour, allStaMethod,
      isShowKResult, kAreaResult,
      tabModelKey, clusters } = this.props;
    if (selectedKeys[0] === 'map') {
      return (
        <div className="portal-control-map">
          <div className="portal-control-map-item">
            <Button
              type="primary"
              disabled={allStaMethod === 'scatter'}
              onClick={() => {
                this.props.changeAllStaMethod('scatter');
                setTimeout(() => {
                  this.props.closeLoading();
                }, 0);
              }}
            >散点模式</Button>
          </div>
          <div className="portal-control-map-item">
            <Button
              type="primary"
              disabled={allStaMethod === 'cluster'}
              onClick={() => {
                this.props.changeAllStaMethod('cluster');
                setTimeout(() => {
                  this.props.closeLoading();
                }, 0);
              }}
            >聚类模式</Button>
          </div>
          <div className="portal-control-map-item">
            <Button
              type="primary"
              disabled={allStaMethod === 'noMethod'}
              onClick={() => {
                this.props.changeAllStaMethod('noMethod');
                setTimeout(() => {
                  this.props.closeLoading();
                }, 0);
              }}
            >无模式</Button>
          </div>
          <div className="portal-control-map-item">
            {kAreaResult && kAreaResult.length ? <Button
              type="primary"
              onClick={() => {
                if (isShowKResult) {
                  clearAreaPolygon(this.map, this.areaPolygon);
                  this.areaPolygon = null;
                  return this.props.changeIsShowKResult(false);
                }
                this.areaPolygon = convexHull(
                  this.map,
                  this.areaPolygon,
                  kAreaResult,
                  this.props.updateClusters,
                );
                return this.props.changeIsShowKResult(true);
              }}
            >{!isShowKResult ? '显示K-means划分结果' : '隐藏K-means划分结果'}</Button> : null}
          </div>
          <div className="portal-control-map-item">
            <Button
              type="primary"
              onClick={() => {
                clearCircle(this.map);
              }}
            >清除当前圈画</Button>
          </div>
        </div>
      );
    }
    if (selectedKeys[0] === 'kCluster') {
      return (
        <div className="portal-control-cluster">
          <Input
            placeholder="请输入区域个数"
            value={clusterCount}
            disabled={clusterStatus === 'loading'}
            onChange={(e) => {
              this.props.changeClusterCount(e.target.value);
            }}
          />
          <Button
            type="primary"
            loading={clusterStatus === 'loading'}
            onClick={() => {
              this.setState({ percent: 0 });
              this.props.changeClusterStatus('loading');
            }}
          >
            {clusterStatus === 'loading' ? '聚类中...' : '开始聚类'}
          </Button>
          <Button
            type="primary"
            onClick={() => { this.props.changeIsZoom(false); }}
          >放大复原</Button>
        </div>
      );
    }
    if (selectedKeys[0] === 'force') {
      const options = [];
      options.push(
        <Option value="-1" key="-1">全天</Option>
      );
      for(let i = 0; i <= 23; i++) {
        if (i >= 10) {
          options.push(
            <Option value={String(i)} key={i}>{i}</Option>
          );
        } else {
          options.push(
            <Option value={`0${i}`} key={i}>{`0${i}`}</Option>
          );
        }
      }

      const selectedOptions = [];

      clusters.forEach((cluster, i) => {
        const { selected, id } = cluster;
        if (selected) {
          selectedOptions.push(
            <Option value={String(i)} key={i}>{`区域${id}`}</Option>
          );
        }
      });

      return (
        <div className="portal-control-force">
          <Tabs defaultActiveKey={tabModelKey} onChange={(key) => {
            this.props.changeForceTab(key);
          }}>
            <TabPane tab="区域内关系" key="1">
              <div>
                <Select
                  multiple={tabModelKey === "2"}
                  showSearch={tabModelKey === "1"}
                  style={{ width: '140px' }}
                  placeholder="带有搜索功能, 可直接搜索"
                  optionFilterProp="children"
                  onChange={(value) => {
                    if (tabModelKey === "1") {
                      this.setState({
                        cluster: Number(value),
                      });
                    }
                    if (tabModelKey === "2") {

                    }
                  }}
                  notFoundContent="不存在该区域"
                >
                  {selectedOptions}
                </Select>
                <Button
                  style={{
                    display: 'inline-block',
                    marginLeft: '4px',
                  }}
                  type="primary"
                  onClick={() => {
                    if (tabModelKey === "1" && this.state.cluster !== null) {
                      this.props.selectedClusterFn(this.state.cluster);
                    }
                    if (tabModelKey === "2") {

                    }
                  }}
                >确定</Button>
              </div>
              <div>
                <span>日期:</span>
                <DatePicker
                  allowClear={false}
                  value={moment(selectedDate, 'YYYY-MM-DD')}
                  onChange={(date, dateString) => { this.props.updateSelectedDate(dateString); }}
                />
              </div>
              <div className="force-date-tip">时间范围是 2014.03.01 - 2014.06.23</div>
              <div>
                <span>小时:</span>
                <Select
                  value={selectedHour}
                  style={{ width: 160 }}
                  onChange={(value) => { this.props.updateSelectedHour(value); }}
                >
                  {options}
                </Select>
              </div>

            </TabPane>
            <TabPane tab="区域间关系" key="2">
              <span>直接</span>
              <span>区域选择</span>
            </TabPane>
          </Tabs>
        </div>
      );
    }

    return null;
  }

  handleUpdateConvexHull(clusters) {
    this.areaPolygon = convexHull(
      this.map,
      this.areaPolygon,
      clusters,
      this.props.updateClusters,
    );
  }

  changeMapLink({ sourceNode, targetNode }) {
    showLink(this.map, sourceNode, targetNode);
  }

  render() {
    const { height, isShowPanel } = this.state;

    const { selectedKeys, isLoadingAllNodes, isLoadingMap,
      clusterCount, allNodesList, clusterStatus, isClusterZoom,
      changeIsZoom, kSelectedNode,
      selectedDate, selectedHour, nodeLinkData, selectedCluster,
      loadingTip } = this.props;

    return (
      <Spin
        tip={loadingTip}
        spinning={isLoadingAllNodes || isLoadingMap}
      >
        <div className="portal-main" style={{ height }}>
          <div className="portal-map" id="allmap"></div>
          <div className="portal-left-list">
            <div className="portal-meun">
              <Menu
                mode="inline"
                selectedKeys={selectedKeys}
                style={{ width: 240 }}
                onClick={::this.handleMeunClick}
              >
                <Menu.Item key="map">
                  <i className="icon icon-map"/>全局 - 站点底图
                </Menu.Item>
                <Menu.Item key="kCluster">
                  <i className="icon icon-k"/>全局 - 站点K-means区域
                </Menu.Item>
                <Menu.Item key="force">
                  <i className="icon icon-force"/>区域 - 力引导布局
                </Menu.Item>
                <Menu.Item key="areaLine">
                  <i className="icon icon-line"/>区域 - 区域动态飞线
                </Menu.Item>
              </Menu>
            </div>
            <div className="portal-control">
              <div className="small-title">操作面板</div>
              {this.renderPortalControl()}
            </div>
            <div className="portal-info">
              <div className="small-title">信息面板</div>
              {this.renderPortalInfo()}
            </div>
          </div>
          <div className="portal-main-list">
            <div className="portal-cluster">
              {this.renderPortalCluster()}
            </div>
            <Button
              type="primary"
              onClick={() => {
                this.setState({
                  isShowPanel: !isShowPanel,
                })
              }}
              className="portal-main-list-control"
            >{isShowPanel ? '隐藏面板' : '显示面板'}</Button>
            <Kcluster
              data={allNodesList}
              count={clusterCount}
              status={clusterStatus}
              changeStatus={this.props.changeClusterStatus}
              isZoom={isClusterZoom}
              changeIsZoom={this.props.changeIsZoom}
              kSelectedNode={kSelectedNode}
              kSelectedNodeFn={this.props.kSelectedNodeFn}
              updateClusters={this.props.updateClusters}
              calClustersDis={this.props.calClustersDis}
              setProgress={this.setProgress.bind(this)}
              isRender={selectedKeys[0] === 'kCluster' && isShowPanel}
              updateConvexHull={::this.handleUpdateConvexHull}
              updateKAreaResult={this.props.updateKAreaResult}
            >
             <Progress
               type="circle"
               percent={this.state.percent}
               width={80}
             />
            </Kcluster>
            <ForceChart
              data={nodeLinkData}
              date={selectedDate}
              hour={selectedHour}
              cluster={selectedCluster}
              requestData={this.props.getNodeLinkData}
              isRender={selectedKeys[0] === 'force' && isShowPanel}
              kSelectedNodeFn={this.props.kSelectedNodeFn}
              updateClusters={this.props.updateClusters}
              updateSelectedLink={this.props.updateSelectedLink}
              changeMapLink={::this.changeMapLink}
            />
            <AreaLine
              width={800}
              height={600}
              cluster={selectedCluster}
              isRender={selectedKeys[0] === 'areaLine' && isShowPanel}
            />
          </div>
        </div>
      </Spin>
    )
  }
}

export default Portal;
