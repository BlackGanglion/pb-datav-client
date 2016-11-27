export default function(map, nodes, kSelectedNodeFn) {
  map.clearOverlays();

  const points = [];
  nodes.forEach((e) => {
    const { x, y } = e;

    const pt = new BMap.Point(x, y);

    points.push({
      ...pt,
      ...e,
    });
  });

  const pointCollection = new BMap.PointCollection(points, {
    size: BMAP_POINT_SIZE_SMALL,
    shape: BMAP_POINT_SHAPE_WATERDROP,
    color: '#d340c3'
  });

  pointCollection.addEventListener('click', function(e) {
    const { id, x, y, name } = e.point;
    kSelectedNodeFn(id);

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
            </tbody>
          </table>
        </div>
      </div>
    `;

    const infowindow = new BMap.InfoWindow(content);

    map.openInfoWindow(infowindow, new BMap.Point(x, y));
  });

  map.addOverlay(pointCollection);

  return pointCollection;
}
