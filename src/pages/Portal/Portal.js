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
import { showArea, clearArea,
  showLink, showAreaLink, clearAreaLink,
  showNodes, clearNodes, clearNode } from 'components/BaiduMap/AreaShow';

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
    updateAreaLineConfig: PropTypes.func,
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

      // 飞线
      startSelectedDate: '2014-03-23',
      startSelectedHour: '06',
      endSelectedDate: '2014-03-23',
      endSelectedHour: '22',
    };
  }

  initMap(nodes) {
    const { updateClusters, kSelectedNodeFn, allStaMethod } = this.props;
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
    if (allStaMethod === 'cluster') {
      this.markersCluster = markersCluster(this.map, nodes, kSelectedNodeFn);
    } else {
      this.pointCollection = pointsCluster(this.map, nodes, kSelectedNodeFn);
    }

    // 初始化地图圈画
    circleLocalSearch(this.map, nodes, updateClusters);

    this.props.closeLoading();

    this.selectedNodes = [];
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
    // K-means显示
    this.areaPolygon = null;
    // 区域间研究时区域显示
    this.researchArea = null;
    this.researchAreaLink = null;
    // 节点选择时
    this.selectedNodes = null;
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

    this.props.changeSelectKeys(key);
  }

  renderPortalInfo() {
    const { selectedKeys, kSelectedNode, nodes, allNodesList } = this.props;
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

      const sourceNode = _.find(allNodesList, { id: Number(source) });
      const targetNode = _.find(allNodesList, { id: Number(target) });

      return (
        <div className="link-info">
          <div>
            <strong>{`${sourceNode.name}(${source}) 与 ${targetNode.name}(${target}) 间`}</strong>(<span>{` 车流量( ${value} )`}</span>)
          </div>
          <div>
            {relationItems}
          </div>
        </div>
      );
    }

    const { id, x, y, name, rx, ry, address, servicetime } = kSelectedNode;

    const disabled = !(_.find(nodes, { id, }) === undefined);

    return (<div className="station-info">
      <Button
        className="station-info-add"
        type="primary"
        disabled={disabled}
        onClick={() => {
          this.props.addSelectedNode(kSelectedNode);

          // 映射到地图上
          this.selectedNodes.push({
            id,
            handler: showNodes(this.map, kSelectedNode),
          });
        }}
      >选择</Button>
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
      selectedHandler: showArea(this.map, cluster),
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
            size="small"
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

  renderPortalNodes() {
    const { nodes } = this.props;

    if (nodes && nodes.length) {
      return nodes.map((node, i) => {
        const { id } = node;

        return (
          <Button
            size="small"
            type="primary"
            className="portal-node-item"
            key={i}
          >
            <i className="icon icon-delete"
              onClick={(e) => {
                e.stopPropagation();

                const self = this;
                confirm({
                  title: '提醒',
                  content: '是否删除当前节点?',
                  onOk() {
                    self.props.deleteSelectedNode(id);

                    clearNode(self.map, self.selectedNodes, id);
                  },
                  onCancel() {},
                });
              }}></i>
            {`节点 ${id}`}
          </Button>
        );
      });
    }
    return <span className="cluster-empty">暂无选择节点</span>;
  }

  renderPortalControl() {
    const { selectedKeys, clusterCount, clusterStatus,
      selectedDate, selectedHour, allStaMethod,
      isShowKResult, kAreaResult,
      tabModelKey, clusters, isShowtexts, forceUpdate } = this.props;

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
      selectedOptions.push(
        <Option value={String(i)} key={i}>{`区域${id}`}</Option>
      );
    });

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
      return (
        <div className="portal-control-force">
          <Tabs defaultActiveKey={tabModelKey} onChange={(key) => {
            this.props.changeForceTab(key);
          }}>
            <TabPane tab="区域内关系" key="1">
              <div>
                <Select
                  showSearch
                  style={{ width: '140px' }}
                  placeholder="带有搜索功能, 可直接搜索"
                  optionFilterProp="children"
                  onChange={(value) => {
                    this.setState({
                      cluster: Number(value),
                    });
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
                    this.setState({
                      isShowPanel: true,
                    })
                    if (tabModelKey === "1" && this.state.cluster !== null) {
                      setTimeout(() => {
                        this.props.selectedClusterFn(this.state.cluster);
                      }, 0);
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
              <div>
                <Button
                  style={{
                    display: 'inline-block',
                    marginLeft: '4px',
                  }}
                  type="primary"
                  size="small"
                  onClick={() => {
                    // 未执行K-means提醒

                    if(kAreaResult && kAreaResult.length > 2) {
                      this.setState({
                        isShowPanel: true,
                      })

                      setTimeout(() => {
                        this.props.getResearchClusters(kAreaResult, 'k');
                      }, 0);
                      return;
                    }

                    Modal.error({
                      title: '提醒',
                      content: '当前K-means聚类未执行或无效',
                    });
                  }}
                >所有K聚类区域</Button>
                <Button
                  style={{
                    display: 'inline-block',
                    marginLeft: '4px',
                  }}
                  type="primary"
                  size="small"
                  onClick={() => {
                    // 未点亮2个以上区域提醒，
                    const nodeMap = {};
                    const selectedClusters = [];
                    let isCoincide = false;
                    clusters.forEach((cluster) => {
                      const { color, nodeList, id, selected } = cluster;

                      if (selected && !isCoincide) {
                        nodeList.forEach((node) => {
                          const { id } = node;

                          if (nodeMap[id]) {
                            isCoincide = true;
                          } else {
                            nodeMap[id] = true;
                          }
                        });

                        if (!isCoincide) {
                          selectedClusters.push(cluster);
                        }
                      }
                    });

                    if (isCoincide) {
                      Modal.error({
                        title: '提醒',
                        content: '当前区域间有站点重叠',
                      });
                      return;
                    }

                    if (selectedClusters.length < 2) {
                      Modal.error({
                        title: '提醒',
                        content: '当前区域点亮数不足两个',
                      });
                      return;
                    }

                    this.setState({
                      isShowPanel: true,
                    });
                    setTimeout(() => {
                      this.props.getResearchClusters(selectedClusters, 'p');
                    }, 0);
                  }}
                >上方点亮区域</Button>
                <Button
                  style={{
                    display: 'inline-block',
                    marginLeft: '4px',
                  }}
                  onClick={() => {
                    this.clearKSelectedArea();
                  }}
                  size="small"
                  type="primary"
                >清除</Button>
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
          </Tabs>
        </div>
      );
    }

    if (selectedKeys[0] === 'areaLine') {
      const { startSelectedDate, startSelectedHour,
        endSelectedDate, endSelectedHour, cluster } = this.state;

      return (
        <div className="portal-control-line">
          <div className="portal-control-line-item">
            <Select
              showSearch
              style={{ width: '100%' }}
              placeholder="带有搜索功能, 可直接搜索区域"
              optionFilterProp="children"
              onChange={(value) => {
                this.setState({
                  cluster: Number(value),
                });
              }}
              notFoundContent="不存在该区域"
            >
              {selectedOptions}
            </Select>
          </div>
          <div>
            <span>开始日期:</span>
            <DatePicker
              style={{ width: 120 }}
              allowClear={false}
              value={moment(startSelectedDate, 'YYYY-MM-DD')}
              onChange={(date, dateString) => {
                this.setState({
                  startSelectedDate: dateString,
                });
              }}
            />
            <Select
              value={startSelectedHour}
              style={{ width: 50 }}
              onChange={(value) => {
                this.setState({
                  startSelectedHour: value,
                });
              }}
            >
              {options.slice(1)}
            </Select>
          </div>
          <div className="portal-control-line-item">
            <span>结束日期:</span>
            <DatePicker
              style={{ width: 120 }}
              allowClear={false}
              value={moment(endSelectedDate, 'YYYY-MM-DD')}
              onChange={(date, dateString) => {
                this.setState({
                  endSelectedDate: dateString,
                });
              }}
            />
            <Select
              value={endSelectedHour}
              style={{ width: 50 }}
              onChange={(value) => {
                this.setState({
                  endSelectedHour: value,
                });
              }}
            >
              {options.slice(1)}
            </Select>
          </div>
          <div className="portal-control-line-item">
            <Button
              style={{
                display: 'inline-block',
                marginLeft: '4px',
              }}
              type="primary"
              onClick={() => {
                this.setState({
                  isShowPanel: true,
                });

                if (cluster == null) {
                  Modal.error({
                    title: '提醒',
                    content: '请选择区域！',
                  });
                  return;
                }

                if (moment(endSelectedDate).diff(moment(startSelectedDate)) < 0
                  || (moment(endSelectedDate).diff(moment(startSelectedDate)) === 0
                    && Number(endSelectedHour) < Number(startSelectedHour))) {
                  Modal.error({
                    title: '提醒',
                    content: '结束时间早于开始时间!',
                  });
                  return;
                }

                setTimeout(() => {
                  this.props.updateAreaLineConfig({
                    clusterIndex: cluster,
                    startSelectedDate,
                    endSelectedDate,
                    startSelectedHour,
                    endSelectedHour,
                    forceUpdate: !forceUpdate,
                  });
                }, 0);
              }}
            >开始</Button>
            <Button
              style={{
                display: 'inline-block',
                marginLeft: '4px',
              }}
              type="primary"
              onClick={() => {
                this.props.changeTextsShow(!isShowtexts);
              }}
            >{isShowtexts ? '隐藏站点信息' : '显示站点信息'}</Button>
          </div>
      </div>);
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

  kSelectedArea(id, i) {
    const { researchModel, kAreaResult, clusters } = this.props;

    /*
    if (this.researchArea) {
      clearArea(this.map, this.researchArea);
      this.researchArea = null;
    }
    */

    if (researchModel === 'k') {
      this.researchArea = showArea(this.map, kAreaResult[id], false, i);
    }

    if (researchModel === 'p') {
      const selectedArea = _.find(clusters, { id, });
      this.researchArea = showArea(this.map, selectedArea, false, i);
    }
  }

  kSelectedAreaLink(relations) {
    const { allNodesList } = this.props;

    const count = relations.length;

    if (this.researchAreaLink) {
      clearAreaLink(this.map, this.researchAreaLink);
      this.researchAreaLink = null;
    }

    const self = this;
    if (count > 3000) {
      confirm({
        title: '提醒',
        content: `区域间关联边数为${count}, 边数过多, 直接渲染在地图上较慢且可能引起浏览器崩溃，可以分时段/分区域研究，是否继续执行?`,
        onOk() {
          self.researchAreaLink = showAreaLink(self.map, relations, allNodesList);
        },
        onCancel() {},
      });

      return;
    }

    self.researchAreaLink = showAreaLink(self.map, relations, allNodesList);
  }

  // 清除地理映射
  clearKSelectedArea() {
    if (this.researchArea) {
      clearArea(this.map, this.researchArea);
      this.researchArea = null;
    }
    if (this.researchAreaLink) {
      clearAreaLink(this.map, this.researchAreaLink);
      this.researchAreaLink = null;
    }
  }

  render() {
    const { height, isShowPanel } = this.state;

    const { selectedKeys, isLoadingAllNodes, isLoadingMap,
      clusterCount, allNodesList, clusterStatus, isClusterZoom,
      changeIsZoom, kSelectedNode,
      selectedDate, selectedHour, nodeLinkData, selectedCluster,
      loadingTip, tabModelKey, researchClusters,
      startSelectedDate, endSelectedDate,
      startSelectedHour, endSelectedHour,
      areaLineCluster, isShowtexts, forceUpdate,
      isInputCombo, clubNumber,
    } = this.props;

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
            <div className="portal-cluster-main">
              <div className="portal-cluster">
                {this.renderPortalCluster()}
              </div>
              <i className="icon icon-delete"
                onClick={(e) => {
                  const { clusters } = this.props;

                  console.log(clusters);

                  e.stopPropagation();
                  const self = this;

                  if (clusters && clusters.length > 0) {
                    confirm({
                      title: '提醒',
                      content: '是否删除所有区域?',
                      onOk() {
                        clusters.forEach((cluster) => {
                          clearArea(self.map, cluster.selectedHandler);
                        });
                        self.props.deleteClusters();
                      },
                      onCancel() {},
                    });
                  }
                }}></i>
            </div>
            <div className="portal-nodes-main">
              <div className="portal-nodes">
                {this.renderPortalNodes()}
              </div>
              <i className="icon icon-join"
                onClick={(e) => {
                  const { nodes } = this.props;
                  e.stopPropagation();

                  const self = this;

                  if (nodes && nodes.length) {
                    confirm({
                      title: '提醒',
                      content: '是否合并当前节点成为一个区域?',
                      onOk() {
                        self.props.joinSelectNodes();

                        clearNodes(self.map, self.selectedNodes);
                      },
                      onCancel() {},
                    });
                  }
                }}
              ></i>
              <i className="icon icon-delete"
                onClick={(e) => {
                  const { nodes } = this.props;
                  e.stopPropagation();

                  const self = this;
                  if (nodes && nodes.length) {
                    confirm({
                      title: '提醒',
                      content: '是否删除所有节点?',
                      onOk() {
                        self.props.deleteSelectedNodes();

                        clearNodes(self.map, self.selectedNodes);
                      },
                      onCancel() {},
                    });
                  }
                }}></i>
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
              tabModelKey={tabModelKey}
              // 研究对象, 切换时清空
              cluster={tabModelKey === "1" ? selectedCluster : researchClusters}
              // 数据请求方法
              requestData={tabModelKey === "1" ? this.props.getNodeLinkData : this.props.calClustersDis}
              isRender={selectedKeys[0] === 'force' && isShowPanel}
              kSelectedNodeFn={this.props.kSelectedNodeFn}
              updateSelectedLink={this.props.updateSelectedLink}
              changeMapLink={::this.changeMapLink}
              updateClusters={this.props.updateClusters}
              // 区域间选择显示区域
              kSelectedArea={::this.kSelectedArea}
              kSelectedAreaLink={::this.kSelectedAreaLink}
              isInputCombo={isInputCombo}
              comboUpdate={this.props.comboUpdate}
              clubNumber={this.props.clubNumber}
            />
            <AreaLine
              width={900}
              height={600}
              cluster={areaLineCluster}
              isRender={selectedKeys[0] === 'areaLine' && isShowPanel}
              startSelectedDate={startSelectedDate}
              startSelectedHour={startSelectedHour}
              endSelectedDate={endSelectedDate}
              endSelectedHour={endSelectedHour}
              isShowtexts={isShowtexts}
              forceUpdate={forceUpdate}
            />
          </div>
        </div>
      </Spin>
    )
  }
}

export default Portal;
