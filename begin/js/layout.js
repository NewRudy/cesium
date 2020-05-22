/**
 * 基本布局
 */
//鼠标进入显示nav
$(document).on('mousemove', function (event) {
    var nav = $('#nav');
    if (parseInt(event.clientY) <= nav.height() && parseInt(event.clientX) <= nav.width())
        $('#nav').fadeIn(500);
})
//鼠标离开隐藏nav
$('#nav').on('mouseleave', function (event) {
    $('#nav').fadeOut(500);
})
$('.close_headfun_win').on('click', function (event) {
    $('.functionWin').hide();
})
//等高线事件
$('#line-tab').click(function(){
    $('#contour').show();
})
$('.toolbar_close').click(function(){
    $('#contour').hide();
})
//实体事件
$('.entity_close').click(function(){
    $('#entity').hide();
})
$('.edit_close').click(function(){
    $('#edit_map').hide();
})
//可视域
$('.viewshed_close').click(function(){
    $('#viewshed_map').hide();
})
var viewer = wutian.initEarth('cesiumContainer', {
    globalImagery: '谷歌',
    geocoder: true,
    homeButton: true,
    sceneModePicker: true,
    baseLayerPicker: true,
    navigationHelpButton: true,
    animation: true,
    timeline: true,
    creditContainer: "creditContainer",  
    fullscreenButton: true,
    vrButton: true
});
//添加罗盘
wutian.coordinate(viewer);
viewer.extend(Cesium.viewerCesiumNavigationMixin, {});