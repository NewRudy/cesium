//绘制工具初始化
var drawTool = new DrawTool({
    viewer: viewer,
    hasEdit: true
});
//绘制矩形
$("#drawRectangle").click(function () {
    if (!drawTool) return;
    drawTool.startDraw({
        type: "rectangle",
        style: {
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        },
        success: function (evt) {}
    });
});
//绘制线
$("#drawPolyline").click(function () {
    if (!drawTool) return;
    drawTool.startDraw({
        type: "polyline",
        style: {
            material: Cesium.Color.YELLOW,
            clampToGround: true
        },
        success: function (evt) {}
    });
});
//绘制多边形
$("#drawPolygon").click(function () {
    if (!drawTool) return;
    drawTool.startDraw({
        type: "polygon",
        style: {
            clampToGround: true,
            material: Cesium.Color.YELLOW,
        },
        success: function (evt) {}
    });
});
//添加图片
$("#drawBillboard").click(function () {
    if (!drawTool) return;
    drawTool.startDraw({
        type: "billboard",
        style: {
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            image:'../img/close.png'
        },
        success: function (evt) {}
    });
});
//绘制圆
$("#drawCircle").click(function () {
    if (!drawTool) return;
    drawTool.startDraw({
        type: "circle",
        style: {
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        },
        success: function (evt) {}
    });
});
//清空图形
$("#clearAll").click(function () {
    if (drawTool) {
        drawTool.destroy();
    }
});