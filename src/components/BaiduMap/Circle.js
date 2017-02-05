import _ from 'lodash';

import { randomColor } from 'utils/utils';

import { Modal } from 'antd';


let pointOverlay;

function clearCircle(map) {
  if (pointOverlay) map.removeOverlay(pointOverlay);
}


function circlePointSearch(map, nodes, kSelectedNodeFn) {
  const drawingPointManager = new BMapLib.DrawingManager(map, {
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

  drawingPointManager.addEventListener('circlecomplete', function(e, overlay) {
    pointOverlay = overlay;
    drawingPointManager.close();

    const radius = parseInt(e.getRadius());
    const { lat: centerY, lng: centerX } = e.getCenter();

    const circle = new BMap.Circle(new BMap.Point(centerX, centerY), radius);

    nodes.forEach((node, i) => {
      const { x, y } = node;
      const point = new BMap.Point(x, y);
      if (BMapLib.GeoUtils.isPointInCircle(point, circle)) {
        const id = Number(node.id);
        kSelectedNodeFn(id);
      }
    });

    map.removeOverlay(pointOverlay);
  });

  drawingPointManager.addEventListener('polygoncomplete', function(e, overlay) {
    pointOverlay = overlay;
    drawingPointManager.close();

    // array <Point>
    const polygonPointList = e.getPath();

    const polygon = new BMap.Polygon(polygonPointList);

    nodes.forEach((node, i) => {
      const { x, y } = node;
      const point = new BMap.Point(x, y);
      if (BMapLib.GeoUtils.isPointInPolygon(point, polygon)) {
        const id = Number(node.id);
        kSelectedNodeFn(id);
      }
    });

    map.removeOverlay(pointOverlay);
  });
}

function circleAreaSearch(map, nodes, updateClusters, handleShowCluster, getkAreaResult) {
  const drawingManager = new BMapLib.DrawingManager(map, {
    isOpen: false, //是否开启绘制模式
    enableDrawingTool: true, //是否显示工具栏
    drawingToolOptions: {
      anchor: BMAP_ANCHOR_TOP_RIGHT, //位置
      offset: new BMap.Size(5, 5), //偏离值
      scale: 0.8, //工具栏缩放比例
      drawingModes: [
        BMAP_DRAWING_POLYGON,
      ]
    }
  });

  drawingManager.addEventListener('polygoncomplete', function(e, overlay) {
    pointOverlay = overlay;

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

      map.removeOverlay(pointOverlay);
      return;
    }
    Modal.error({
      title: '提醒',
      content: '当前K-means聚类未执行或无效',
    });
  });
}

export {
  circlePointSearch,
  circleAreaSearch,
  clearPointCircle,
  clearCircle,
}

