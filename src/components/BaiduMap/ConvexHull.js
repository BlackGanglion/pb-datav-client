/*
利用凸包渲染区域
*/

// import ConvexHullGrahamScan from 'graham_scan';

import ch from 'convexhull-js';

import { Modal, Button } from 'antd';
const confirm = Modal.confirm;

let markers = [];

function clearAreaPolygon(map, areaPolygon) {
  if (areaPolygon && areaPolygon.length) {
    areaPolygon.forEach((area) => {
      map.removeOverlay(area);
    });
  }
  if (markers && markers.length) {
    markers.forEach((marker) => {
      map.removeOverlay(marker);
    });
    markers = [];
  }
}

function convexHullNodes(map, areaPolygon, clusters) {
  return clusters.map((cluster, i) => {
    const { color, nodeList } = cluster;

    const points = [];

    nodeList.forEach((node) => {
      points.push(new BMap.Point(node.x, node.y));
    });

    const options = {
      size: BMAP_POINT_SIZE_SMALL,
      shape: BMAP_POINT_SHAPE_CIRCLE,
      color,
    }
    const pointCollection = new BMap.PointCollection(points, options);

    map.addOverlay(pointCollection);

    return pointCollection;
  });
}

function clearAreaPolygonNodes(map, areaPolygonNodes) {
  if (areaPolygonNodes && areaPolygonNodes.length) {
    areaPolygonNodes.forEach((area) => {
      map.removeOverlay(area);
    });
  }
}

export {
  convexHullNodes,
  clearAreaPolygon,
  clearAreaPolygonNodes,
}

export default function (map, areaPolygon, clusters, updateClusters) {
  // 清空原有多边形
  clearAreaPolygon(map, areaPolygon);

  const newAreaPolygon = [];

  // 利用凸包算法，完成区域渲染计算, 并映射
  clusters.forEach((cluster, i) => {
    /*
    const convexHull = new ConvexHullGrahamScan();

    cluster.nodeList.forEach(({ x, y }) => {
      convexHull.addPoint(x, y);
    });

    const hullPoints = convexHull.getHull().map((point) => {
      const Point = new BMap.Point(point.x, point.y);
      return Point;
    });
    */

    const { color, centroid } = cluster;

    const nodeList = cluster.nodeList.map(({ x, y }) => {
      return {x, y};
    });

    const hullPoints = ch(nodeList).map((point) => {
      const Point = new BMap.Point(point.x, point.y);
      return Point;
    });

    const polygon = new BMap.Polygon(hullPoints,
      {
        strokeColor: color,
        strokeWeight: 4,
      });

    /*
    const pt = new BMap.Point(centroid.x, centroid.y);

    const marker = new BMap.Marker(pt, {icon: new BMap.Icon(
      "https://img.alicdn.com/tps/TB1UmXtOFXXXXXNXVXXXXXXXXXX-48-48.png",
      new BMap.Size(48, 48)
    )});

    marker.addEventListener("click", function(){
      confirm({
        title: '提醒',
        content: '是否添加该区域到区域栏',
        onOk() { updateClusters([cluster]); },
        onCancel() {},
      });
    });
    */

    const hLine = new BMap.Polyline([
        new BMap.Point(centroid.x - 0.001, centroid.y),
        new BMap.Point(centroid.x + 0.001, centroid.y),
      ],
      { strokeColor: "red", strokeWeight: 10, strokeOpacity: 0.5, cursor: 'pointer' }
    );

    const sLine = new BMap.Polyline([
        new BMap.Point(centroid.x, centroid.y - 0.001),
        new BMap.Point(centroid.x, centroid.y + 0.001),
      ],
      { strokeColor: "red", strokeWeight: 10, strokeOpacity: 0.5, cursor: 'pointer' }
    );

    hLine.addEventListener("click", function(){
      confirm({
        title: '提醒',
        content: '是否添加该区域到区域栏',
        onOk() { updateClusters([cluster]); },
        onCancel() {},
      });
    });

    sLine.addEventListener("click", function(){
      confirm({
        title: '提醒',
        content: '是否添加该区域到区域栏',
        onOk() { updateClusters([cluster]); },
        onCancel() {},
      });
    });

    markers.push(hLine);
    markers.push(sLine);

    // map.addOverlay(marker);
    map.addOverlay(polygon);
    map.addOverlay(sLine);
    map.addOverlay(hLine);

    newAreaPolygon.push(polygon);
  });

  return newAreaPolygon;
}
