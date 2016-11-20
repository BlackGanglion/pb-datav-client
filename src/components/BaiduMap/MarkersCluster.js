export default function(map, nodes, kSelectedNodeFn) {
  const markers = [];
  nodes.forEach((e) => {
    const { x, y } = e;

    const pt = new BMap.Point(x, y);

    const myIcon = new BMap.Icon(
      "https://img.alicdn.com/tps/TB10jXNOpXXXXc9XVXXXXXXXXXX-32-32.png",
      new BMap.Size(32, 32)
    );

    const marker = new BMap.Marker(pt, {icon: myIcon});

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
      kSelectedNodeFn(e.id);
      this.openInfoWindow(infowindow);
    });

    markers.push(marker);
  });

  // 最简单的用法，生成一个marker数组，然后调用markerClusterer类即可。
  var markerClusterer = new BMapLib.MarkerClusterer(map, {
    markers,
  });
}
