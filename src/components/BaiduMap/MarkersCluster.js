export default function(map, nodes) {
  const markers = [];
  nodes.forEach((e) => {
    const { x, y } = e;

    const pt = new BMap.Point(x, y);

    const marker = new BMap.Marker(pt);

    const content = `
      <div class="info-window">
        <div class="BMap_bubble_title">
          <p class="title-name" title="${e.name}">
              ${e.name}
          </p>
        </div>
        <div class="BMap_bubble_content">
          <table class="content-table" cellspacing="0">
            <tbody>
              <tr>
                <td class="table-address">地址：&nbsp;</td>
                <td style="line-height:16px">${e.id}-${e.name}&nbsp;</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    var infowindow = new BMap.InfoWindow(content);
    marker.addEventListener("click", function(){
      this.openInfoWindow(infowindow);
    });

    markers.push(marker);
  });

  // 最简单的用法，生成一个marker数组，然后调用markerClusterer类即可。
  var markerClusterer = new BMapLib.MarkerClusterer(map, {
    markers,
  });
}
