/*
单块区域节点与关联显示
*/

import ch from 'convexhull-js';

import _ from 'lodash';

const groupColorList = ['#00C49F', '#FFBB28', '#FF8441', '#EE3B61',
  '#FF6590', '#9575DE', '#513AB7'];

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
function showArea(map, cluster, isShowNodes = true, index) {
  const { color } = cluster;

  const markers = [];

  let averageX = 0;
  let averageY = 0;
  const count = cluster.nodeList.length;
  const fillColor = cluster.color;
  const points = [];

  const nodeList = cluster.nodeList.map((e) => {
    /*
    const myCompOverlay = new ComplexCustomOverlay(
      map,
      new BMap.Point(e.x, e.y),
      `${e.id}`,
    );
    */

    averageX = averageX + (e.x / count);
    averageY = averageY + (e.y / count);

    if (isShowNodes) {
      points.push({
        ...new BMap.Point(e.x, e.y),
        ...e,
      });
    }

    return {
      x: e.x,
      y: e.y,
    };
  });

  let pointCollection = null;
  if (isShowNodes) {
    const options = {
      size: BMAP_POINT_SIZE_SMALL,
      shape: BMAP_POINT_SHAPE_CIRCLE,
      color: fillColor,
    }
    pointCollection = new BMap.PointCollection(points, options);

    pointCollection.addEventListener('click', function(e) {
      const { id, x, y, name } = e.point;

      const content = `
        <div class="info-window">
          <div class="BMap_bubble_title">
            <p class="title-name" title="${name}">
                ${name}
            </p>
          </div>
          <div class="BMap_bubble_content">
            <table class="content-table" cellspacing="0">
              <tbody>
                <tr>
                  <td class="table-address">地址：&nbsp;</td>
                  <td style="line-height:16px">${id}-${name}&nbsp;</td>
                </tr>
                <tr>
                  <td class="table-address">坐标：&nbsp;</td>
                  <td style="line-height:16px">(${x}, ${y})&nbsp;</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;

      const infowindow = new BMap.InfoWindow(content);

      map.openInfoWindow(infowindow, new BMap.Point(x, y));
    });

    map.addOverlay(pointCollection);
  }

  const hullPoints = ch(nodeList).map((point) => {
    const Point = new BMap.Point(point.x, point.y);
    return Point;
  });

  let polygon;
  if (isShowNodes) {
    polygon = new BMap.Polygon(hullPoints,
      {
        strokeColor: color,
        strokeWeight: 2,
        strokeStyle: 'dashed',
        fillOpacity: 0,
      });
  } else {
    polygon = new BMap.Polygon(hullPoints,
      {
        strokeColor: groupColorList[index],
        strokeWeight: 2,
        strokeStyle: 'soild',
        fillOpacity: 0,
        fillColor: groupColorList[index],
      });
  }

  map.addOverlay(polygon);

  map.centerAndZoom(new BMap.Point(averageX, averageY), map.getZoom());
  // map.setCenter(new BMap.Point(averageX, averageY));

  return {
    polygon,
    markers: pointCollection,
  }
}

function clearArea(map, selectedHandler) {
  if (selectedHandler) {
    const { polygon, markers } = selectedHandler;

    if (polygon) map.removeOverlay(polygon);
    if (markers) map.removeOverlay(markers);
  }
}

function showLink(map, source, target) {
  clearLink(map);

  const pointA = new BMap.Point(source.bx, source.by);
  const pointB = new BMap.Point(target.bx, target.by);

  const polyline = new BMap.Polyline([pointA, pointB],
    { strokeColor: "red", strokeWeight: 6, strokeOpacity: 0.5 }
  );

  const opts = {
    // 指定文本标注所在的地理位置
    position: pointA,
    // 设置文本偏移量
    offset: new BMap.Size(5, 5)
  }

  // 创建文本标注对象
  /*
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
  */

  _link = polyline;
  // _label = label;

  // map.addOverlay(label);
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
  // 归一化
  let max = -1;
  let min = Number.MAX_SAFE_INTEGER;
  relations.forEach((relation, i) => {
    const { value } = relation;
    if (max < Number(value)) { max = Number(value); }
    if (min > Number(value)) { min = Number(value); }
  });

  return relations.map((relation) => {
    const { source, target, value } = relation;

    const strokeOpacity = ((value - min) / (max - min)) + 0.05;
    const strokeWeight = strokeOpacity * 5;

    const sourceItem = _.find(allNodesList, { id: Number(source) });
    const targetItem = _.find(allNodesList, { id: Number(target) });

    const pointA = new BMap.Point(sourceItem.x, sourceItem.y);
    const pointB = new BMap.Point(targetItem.x, targetItem.y);

    const midX = ((Number(sourceItem.x) + Number(targetItem.x)) / 2).toFixed(6);
    const midY = ((Number(sourceItem.y) + Number(targetItem.y)) / 2).toFixed(6);

    const middlePoint = new BMap.Point()

    const polyline = new BMap.Polyline([pointA, pointB],
      { strokeColor: "blue", strokeWeight, strokeOpacity, }
    );

    polyline.addEventListener('mouseover', function(e) {
      const content = `
        <div class="info-window">
          <div class="BMap_bubble_title">
            <p class="title-name" title="${name}">
              ${sourceItem.name}(${sourceItem.id}) - ${targetItem.name}(${targetItem.id}) [${value}]
            </p>
          </div>
        </div>
      `;

      const infowindow = new BMap.InfoWindow(content);

      // map.openInfoWindow(infowindow, new BMap.Point(midX, midY));
      map.openInfoWindow(infowindow, e.point);
    });

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

function showForceMapNode(map, nodes, num) {
  const pointsList = [];
  for(let i = 0; i < num; i++) {
    pointsList.push(new Array());
  }

  nodes.forEach((node) => {
    const { realGroup } = node;
    pointsList[realGroup].push(node);
  });

  return pointsList.map((points, i) => {
    const pointss = points.map((point) => {
      const { bx, by, id, name } = point;

      const pt = new BMap.Point(bx, by);

      return {
        ...pt,
        bx,
        by,
        id,
        name,
      }
    });

    const options = {
      size: BMAP_POINT_SIZE_BIG,
      shape: BMAP_POINT_SHAPE_CIRCLE,
      color: groupColorList[i],
    }

    const pointCollection = new BMap.PointCollection(pointss, options);

    pointCollection.addEventListener('click', function(e) {
      const { id, bx, by, name } = e.point;

      const content = `
        <div class="info-window">
          <div class="BMap_bubble_title">
            <p class="title-name" title="${name}">
                ${name}
            </p>
          </div>
          <div class="BMap_bubble_content">
            <table class="content-table" cellspacing="0">
              <tbody>
                <tr>
                  <td class="table-address">地址：&nbsp;</td>
                  <td style="line-height:16px">${id}-${name}&nbsp;</td>
                </tr>
                <tr>
                  <td class="table-address">坐标：&nbsp;</td>
                  <td style="line-height:16px">(${bx}, ${by})&nbsp;</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;

      const infowindow = new BMap.InfoWindow(content);

      map.openInfoWindow(infowindow, new BMap.Point(bx, by));
    });

    map.addOverlay(pointCollection);

    return pointCollection;
  });
}

function clearForceMapNode(map, nodes) {
  if (nodes && nodes.length) {
    nodes.forEach((node) => {
      map.removeOverlay(node);
    });
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
  showForceMapNode,
  clearForceMapNode,
}

