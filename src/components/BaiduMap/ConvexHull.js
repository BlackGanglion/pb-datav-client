/*
利用凸包渲染区域
*/

// import ConvexHullGrahamScan from 'graham_scan';

import ch from 'convexhull-js';

import { Modal, Button } from 'antd';
const confirm = Modal.confirm;

let markers = [];

const groupColorList = ['#00C49F', '#FFBB28', '#FF8441', '#EE3B61',
  '#FF6590', '#9575DE', '#513AB7'];

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

function getIcon(selected, realGroup) {
  if (selected) return "https://img.alicdn.com/tfs/TB1f7a5QFXXXXXsXFXXXXXXXXXX-10-10.jpg";

  if (realGroup == 0) return "https://img.alicdn.com/tfs/TB15_CRQFXXXXaNXVXXXXXXXXXX-10-10.jpg";
  if (realGroup == 1) return "https://img.alicdn.com/tfs/TB19H5BQFXXXXbGaXXXXXXXXXXX-10-10.jpg";
  if (realGroup == 2) return "https://img.alicdn.com/tfs/TB1o6O8QFXXXXc1XpXXXXXXXXXX-10-10.jpg";
  if (realGroup == 3) return "https://img.alicdn.com/tfs/TB16LyLQFXXXXc9XVXXXXXXXXXX-10-10.jpg";
  if (realGroup == 4) return "https://img.alicdn.com/tfs/TB1h7mTQFXXXXXtXVXXXXXXXXXX-10-10.jpg";
  if (realGroup == 5) return "https://img.alicdn.com/tfs/TB11riTQFXXXXXFXVXXXXXXXXXX-10-10.jpg";
  if (realGroup == 6) return "https://img.alicdn.com/tfs/TB1hP98QFXXXXcSXpXXXXXXXXXX-10-10.jpg";

  return "https://img.alicdn.com/tfs/TB17ayzQFXXXXaiaXXXXXXXXXXX-10-10.jpg";
}

// k-means
export default function (map, areaPolygon, clusters, updateClusters, handleShowCluster) {
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

    const { color, centroid, selected, realGroup } = cluster;

    const nodeList = cluster.nodeList.map(({ x, y }) => {
      return { x, y };
    });

    const hullPoints = ch(nodeList).map((point) => {
      const Point = new BMap.Point(point.x, point.y);
      return Point;
    });

    const polygon = new BMap.Polygon(hullPoints,
      {
        strokeColor: selected ? 'grey' : color,
        strokeWeight: 4,
        strokeOpacity: selected ? 0.1 : 1,
      }
    );

    const pt = new BMap.Point(centroid.x, centroid.y);

    const marker = new BMap.Marker(pt, {
      icon: new BMap.Icon(
        getIcon(selected, realGroup),
        new BMap.Size(10, 10)
      )
    });

    marker.addEventListener("click", function(){
      if (!selected) {
        confirm({
          title: '提醒',
          content: '是否添加该区域到区域栏',
          onOk() {
            updateClusters([cluster], i);
            setTimeout(() => {
              handleShowCluster(-1, cluster);
            }, 0);
          },
          onCancel() {},
        });
      }
    });


    /*
    const hLine = new BMap.Polyline([
        new BMap.Point(centroid.x - 0.001, centroid.y),
        new BMap.Point(centroid.x + 0.001, centroid.y),
      ],
      { strokeColor: selected ? 'grey' : color, strokeWeight: 6,
        strokeOpacity: selected ? 0.1 : 0.8, cursor: 'pointer' }
    );

    const sLine = new BMap.Polyline([
        new BMap.Point(centroid.x, centroid.y - 0.001),
        new BMap.Point(centroid.x, centroid.y + 0.001),
      ],
      { strokeColor: selected ? 'grey' : color, strokeWeight: 6,
        strokeOpacity: selected ? 0.1 : 0.8, cursor: 'pointer' }
    );
    */

    /*
    hLine.addEventListener("click", function() {
      confirm({
        title: '提醒',
        content: '是否添加该区域到区域栏',
        onOk() {
          if (!selected) {
            updateClusters([cluster], i);

            setTimeout(() => {
              handleShowCluster(-1, cluster);
            }, 0);
          }
        },
        onCancel() {},
      });
    });

    sLine.addEventListener("click", function(){
      confirm({
        title: '提醒',
        content: '是否添加该区域到区域栏',
        onOk() {
          if (!selected) {
            updateClusters([cluster], i);

            setTimeout(() => {
              handleShowCluster(-1, cluster);
            }, 0);
          }
        },
        onCancel() {},
      });
    });

    markers.push(hLine);
    markers.push(sLine);
    markers.push(label);
    */

    map.addOverlay(marker);
    markers.push(marker);
    // map.addOverlay(polygon);
    // map.addOverlay(sLine);
    // map.addOverlay(hLine);

    newAreaPolygon.push(polygon);
  });

  return newAreaPolygon;
}
