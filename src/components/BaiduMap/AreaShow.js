/*
单块区域节点与关联显示
*/

import ch from 'convexhull-js';

import _ from 'lodash';

let _link = null;
let _label = null;

// 复杂的自定义覆盖物
function ComplexCustomOverlay(map, point, text){
  this._map = map;
  this._point = point;
  this._text = text;
}
ComplexCustomOverlay.prototype = new BMap.Overlay();
ComplexCustomOverlay.prototype.initialize = function(){
  const div = this._div = document.createElement("div");
  div.style.position = "absolute";
  div.style.zIndex = BMap.Overlay.getZIndex(this._point.lat);
  div.style.backgroundColor = "#EE5D5B";
  div.style.border = "1px solid #BC3B3A";
  div.style.color = "white";
  div.style.height = "18px";
  div.style.padding = "2px";
  div.style.lineHeight = "18px";
  div.style.whiteSpace = "nowrap";
  div.style.MozUserSelect = "none";
  div.style.fontSize = "12px"
  const span = this._span = document.createElement("span");
  div.appendChild(span);
  span.appendChild(document.createTextNode(this._text));
  const that = this;

  const arrow = this._arrow = document.createElement("div");
  arrow.style.background = "url(http://map.baidu.com/fwmap/upload/r/map/fwmap/static/house/images/label.png) no-repeat";
  arrow.style.position = "absolute";
  arrow.style.width = "11px";
  arrow.style.height = "10px";
  arrow.style.top = "22px";
  arrow.style.left = "10px";
  arrow.style.overflow = "hidden";
  div.appendChild(arrow);

  this._map.getPanes().labelPane.appendChild(div);

  return div;
}
ComplexCustomOverlay.prototype.draw = function(){
  const pixel = this._map.pointToOverlayPixel(this._point);
  this._div.style.left = pixel.x - parseInt(this._arrow.style.left) + "px";
  this._div.style.top  = pixel.y - 30 + "px";
}

// 区域范围，渲染点
function showArea(map, cluster, kSelectedNodeFn) {
  const { color } = cluster;

  const markers = [];

  let averageX = 0;
  let averageY = 0;
  const count = cluster.nodeList.length;

  const nodeList = cluster.nodeList.map((e) => {
    const myCompOverlay = new ComplexCustomOverlay(
      map,
      new BMap.Point(e.x, e.y),
      `${e.id}`,
    );

    averageX = averageX + (e.x / count);
    averageY = averageY + (e.y / count);

    markers.push(myCompOverlay);

    map.addOverlay(myCompOverlay);

    return {
      x: e.x,
      y: e.y,
    };
  });

  const hullPoints = ch(nodeList).map((point) => {
    const Point = new BMap.Point(point.x, point.y);
    return Point;
  });

  const polygon = new BMap.Polygon(hullPoints,
    {
      strokeColor: color,
      strokeWeight: 2,
      strokeStyle: 'dashed',
      fillOpacity: 0,
    });

  map.addOverlay(polygon);

  map.centerAndZoom(new BMap.Point(averageX, averageY), 17);

  return {
    polygon,
    markers,
  }
}

function clearArea(map, selectedHandler) {
  if (selectedHandler) {
    const { polygon, markers } = selectedHandler;

    if (polygon) map.removeOverlay(polygon);
    if (markers && markers.length) {
      markers.forEach((marker) => {
        map.removeOverlay(marker);
      });
    }
  }
}

function showLink(map, source, target) {
  clearLink(map);

  const pointA = new BMap.Point(source.bx, source.by);
  const pointB = new BMap.Point(target.bx, target.by);

  const polyline = new BMap.Polyline([pointA, pointB],
    { strokeColor: "blue", strokeWeight: 6, strokeOpacity: 0.5 }
  );

  const opts = {
    // 指定文本标注所在的地理位置
    position: pointA,
    // 设置文本偏移量
    offset: new BMap.Size(5, 5)
  }

  // 创建文本标注对象
  let label = new BMap.Label(
    `实际地理直线距离为${map.getDistance(pointA, pointB).toFixed(2)}米`,
    opts
  );

  label.setStyle({
    color : "blue",
    fontSize : "12px",
    height : "20px",
    lineHeight : "20px",
    fontFamily:"微软雅黑",
    zIndex: 10,
  });

  _link = polyline;
  _label = label;

  map.addOverlay(label);
  map.addOverlay(polyline);
}

function clearLink(map) {
  if (_link) {
    map.removeOverlay(_link);
    _link = null;
  }
  if (_label) {
    map.removeOverlay(_label);
    _label = null;
  }
}

function showAreaLink(map, relations, allNodesList) {
  return relations.map((relation) => {
    const { source, target, value } = relation;

    const sourceItem = _.find(allNodesList, { id: Number(source) });
    const targetitem = _.find(allNodesList, { id: Number(target) });

    const pointA = new BMap.Point(sourceItem.x, sourceItem.y);
    const pointB = new BMap.Point(targetitem.x, targetitem.y);

    const polyline = new BMap.Polyline([pointA, pointB],
      { strokeColor: "blue", strokeWeight: value / 2, strokeOpacity: 0.5 }
    );

    map.addOverlay(polyline);

    return polyline;
  });
}

function clearAreaLink(map, handler) {
  if (handler && handler.length) {
    handler.forEach((item) => {
      map.removeOverlay(item);
    })
  }
}

function showNodes(map, node) {
  const { x, y } = node;

  const marker = new BMap.Marker(new BMap.Point(x, y));

  map.addOverlay(marker);

  return marker;
}

function clearNodes(map, nodes) {
  if (nodes && nodes.length) {
    nodes.forEach((node) => {
      if (node.handler) {
        map.removeOverlay(node.handler);
      }
    });
  }
}

function clearNode(map, nodes, id) {
  const node = _.find(nodes, { id, });
  if (node.handler) {
    map.removeOverlay(node.handler);
  }
}

export {
  showArea,
  clearArea,
  showLink,
  clearLink,
  showAreaLink,
  clearAreaLink,
  showNodes,
  clearNodes,
  clearNode,
}

