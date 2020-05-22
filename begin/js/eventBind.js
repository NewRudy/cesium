//绑定事件
$(document).ready(
    function () {
        //显示设置事件
        $('#edit-tab').click(function () {
            eventModel.dispalySetting();
        });
        //地图编辑事件
        $('#load-tab').click(function () {
            $('#edit_map').show();
        });
        //剖面分析事件
        $('#section-tab').click(function () {
            eventModel.sectionSetting();
        });
        //通视分析事件
        $('#visible-tab').click(function () {
            $('#entity').show();
        });
        //可视域分析事件
        $('#viewshed-tab').click(function(){
            eventModel.viewedSetting();
        });
        //添加模型事件
        $('#add-tab').click(function(){
            eventModel.tileSetting();
        })
    }
)
//调用事件
var eventModel = {
    //显示设置
    dispalySetting: function () {
        $('#displaySettingWin1').css('display', 'block');
        $("input[type='checkbox']", $('#displaySettingWin1')).click(function () {
            switch ($(this).val()) {
                case 'ces_toolbar':
                    if ($(this).is(':checked'))
                        $('.cesium-viewer-toolbar').css('display', 'block');
                    else
                        $('.cesium-viewer-toolbar').css('display', 'none');
                    break;
                case 'mapShadows':
                    if ($(this).is(':checked')) {
                        viewer.shadows = true;
                        viewer.terrainShadows = Cesium.ShadowMode.ENABLED;
                    } else {
                        viewer.shadows = false;
                        viewer.terrainShadows = Cesium.ShadowMode.DISABLED;
                    }
                    break;
                case 'frame-number':
                    if ($(this).is(':checked'))
                        viewer.scene.debugShowFramesPerSecond = true;
                    else
                        viewer.scene.debugShowFramesPerSecond = false;
                    break;
                case 'VRButton':
                    if ($(this).is(':checked')) {
                        $('.cesium-viewer-vrContainer').css('display', 'block');
                    } else {
                        $('.cesium-viewer-vrContainer').css('display', 'none');
                    }
                    break;
                case 'mousePosition':
                    if ($(this).is(':checked'))
                        $('#mousePosition').css('visibility', 'visible');
                    else
                        $('#mousePosition').css('visibility', 'hidden');
                    break;
                case 'compass':
                    if ($(this).is(':checked')) {
                        $('.compass').css('display', 'block');
                    } else {
                        $('.compass').css('display', 'none');
                    }
                    break;
                case 'navigation-controls':
                    if ($(this).is(':checked')) {
                        $('.navigation-controls').css('display', 'block');
                    } else {
                        $('.navigation-controls').css('display', 'none');
                    }
                    break;
                case 'distance-legend':
                    if ($(this).is(':checked')) {
                        $('.distance-legend').css('display', 'block');
                    } else {
                        $('.distance-legend').css('display', 'none');
                    }
                    break;
                case 'time-controls':
                    if ($(this).is(':checked'))
                        $('.cesium-viewer-animationContainer').css('display', 'block');
                    else
                        $('.cesium-viewer-animationContainer').css('display', 'none');
                    break;
                case 'fullscreen-controls':
                    if ($(this).is(':checked'))
                        $('.cesium-viewer-fullscreenContainer').css('display', 'block');
                    else
                        $('.cesium-viewer-fullscreenContainer').css('display', 'none');
                    break;
                default:
                    break;
            }
        })
    },
    //3dtile设置
    tileSetting: function () {
        wutian.load3dTile();
    },
    //剖面分析
    sectionSetting: function () {
        //显示容器
        if ($('#section').css('display') == 'none')
            $('#section').css('display','block');
        else
            $('#section').css('display','none');
        //开始剖面分析
        $('#sectionAnalysis').click(function () {
            wutian.sectionAnalysis();
        })
        //结束剖面分析
        $('#sectionAnalysisEnd').click(function () {
            $('#mainChart').hide();
            viewer.entities.removeAll();
        })
    },
    //可视域分析
    viewedSetting:function(){
        $('#viewshed_map').show();
    }
}