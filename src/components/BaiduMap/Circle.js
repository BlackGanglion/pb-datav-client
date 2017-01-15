import _ from 'lodash';

import { randomColor } from 'utils/utils';

import { Modal } from 'antd';

let storeOverlay = null;
let localSearch = {
  clearResults: () => {},
}

function clearCircle(map) {
  if (storeOverlay) map.removeOverlay(storeOverlay);
  if (localSearch) localSearch.clearResults();
}

export {
  clearCircle,
}

export default function circleLocalSearch(map, nodes, updateClusters, handleShowCluster, getkAreaResult) {
  const options = {
    pageCapacity: 100,
    renderOptions: {
      map: map
    },
    onSearchComplete: function(results) {
      const num = results.getCurrentNumPois();
      const nodeList = [];
      for(let i = 0; i < num; i++) {
        const item = results.getPoi(i);
        const id = Number(item.address.split('-')[0]);

        const selectNode = _.find(nodes, { id });

        nodeList.push(selectNode);
      }

      console.log(nodeList);

      const res = [{
        nodeList,
        color: randomColor(),
      }];

      updateClusters(res);

      setTimeout(() => {
        handleShowCluster(-1);
      }, 0);
    },
  };

  localSearch = new BMap.LocalSearch(map, options);

  const drawingManager = new BMapLib.DrawingManager(map, {
    isOpen: false, //是否开启绘制模式
    enableDrawingTool: true, //是否显示工具栏
    drawingToolOptions: {
      anchor: BMAP_ANCHOR_TOP_RIGHT, //位置
      offset: new BMap.Size(5, 5), //偏离值
      scale: 0.8, //工具栏缩放比例
      drawingModes: [
        BMAP_DRAWING_CIRCLE,
        BMAP_DRAWING_POLYGON,
      ]
    }
  });

  drawingManager.addEventListener('circlecomplete', function(e, overlay) {
    if (storeOverlay) map.removeOverlay(storeOverlay);

    storeOverlay = overlay;

    map.addOverlay(overlay);

    const radius = parseInt(e.getRadius());
    const center = e.getCenter();
    drawingManager.close();
    localSearch.searchNearby(' ', center, radius, {
      customData: {
        geotableId: 154106,
      }
    });
  });

  drawingManager.addEventListener('polygoncomplete', function(e, overlay) {
    if (storeOverlay) map.removeOverlay(storeOverlay);

    storeOverlay = overlay;

    const kAreaResult = getkAreaResult();
    // array <Point>
    const polygonPointList = e.getPath();

    const polygon = new BMap.Polygon(polygonPointList);

    if (kAreaResult && kAreaResult.length > 1) {
      // 多边形点阵
      kAreaResult.forEach((area, i) => {
        const { centroid } = area;
        const { x, y } = centroid;

        const centroidPoint = new BMap.Point(x, y);

        const isInclude = BMapLib.GeoUtils.isPointInPolygon(centroidPoint, polygon);

        if (isInclude && !area.selected) {
          updateClusters([area], i);

          setTimeout(() => {
            handleShowCluster(-1, area);
          }, 0);
        }
      });

      return;
    }
    Modal.error({
      title: '提醒',
      content: '当前K-means聚类未执行或无效',
    });
  });
}
