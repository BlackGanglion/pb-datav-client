export default function circleLocalSearch(map) {
  const options = {
    pageCapacity: 100,
    renderOptions: {
      map: map
    },
    onSearchComplete: function(results) {
      const num = results.getCurrentNumPois();
      console.log(num);
      /*
      const num = results.getCurrentNumPois();
      let res;
      for(let i = 0; i < num; i++) {
        const item = results.getPoi(i);
        const name = item.title || '';
        const no = item.address.split('-')[0];
        res = res ? `${res}&${no}=${name}` : `?${no}=${name}`;
      }
      console.log(res);
      renderForceChart(res);
      */
    },
  };

  var localSearch = new BMap.LocalSearch(map, options);

  var drawingManager = new BMapLib.DrawingManager(map, {
    isOpen: false, //是否开启绘制模式
    enableDrawingTool: true, //是否显示工具栏
    drawingToolOptions: {
      anchor: BMAP_ANCHOR_TOP_RIGHT, //位置
      offset: new BMap.Size(5, 5), //偏离值
      scale: 0.8, //工具栏缩放比例
      drawingModes: [
        BMAP_DRAWING_CIRCLE
      ]
    }
  });
  var circle = null;
  drawingManager.addEventListener('circlecomplete', function(e, overlay) {
    map.clearOverlays();
    circle = e;
    map.addOverlay(overlay);
    var radius = parseInt(e.getRadius());
    var center = e.getCenter();
    drawingManager.close();
    localSearch.searchNearby(' ', center, radius, {
      customData: {
        geotableId: 154106,
      }
    });
  });
}

