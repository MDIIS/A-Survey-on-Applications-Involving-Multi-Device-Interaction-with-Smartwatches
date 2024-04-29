(function() {
    // 数据和可视化的配置变量
    var dimensionsArray = ['Title', 'Publication_Year', 'Publication_Venue'];
    var dimensions = {
        'Title': { values: {} },
        'Publication_Year': { values: {} },
        'Publication_Venue': { values: {} }
    };
    var documents;

    // d3 变量，用于绘制和交互
    var tooltip;

    // 加载数据
    d3.csv("Tab1.csv", onDataLoaded);

    // 数据加载后的回调函数
    function onDataLoaded(error, csv) {
        if (error) throw error;
        
        console.log("csv:", csv);
        console.log(csv.length + " documents");
        documents = csv;

        if (Array.isArray(documents)) {
            documents.forEach(function(d) {
                d.__filtered__ = true;

                dimensionsArray.forEach(function(dim) {
                    if (d[dim] !== "") {
                        // 处理包含多年份的情况
                        if (dim === 'Publication_Year' && d[dim].includes('&')) {
                            var years = d[dim].split('&').map(year => year.trim()); // 分割并清理年份数据
                            years.forEach(function(year) {
                                updateDimensionValue(dim, year, d);
                            });
                        } else {
                            // 处理单个年份或其他维度
                            updateDimensionValue(dim, d[dim], d);
                        }
                    }
                });
            });

            draw();
        } else {
            console.error("Invalid data format. Expected an array.");
        }
    }

    // 更新维度值的统一函数，避免代码重复
    function updateDimensionValue(dimension, value, document) {
        if (value in dimensions[dimension].values) {
            dimensions[dimension].values[value]++;
        } else {
            dimensions[dimension].values[value] = 1;
        }

        // 确保其他维度也更新为相应的文档值
        if (dimension === 'Publication_Year') {
            ['Title', 'Publication_Venue'].forEach(function(dim) {
                if (!(value in dimensions[dim].values)) {
                    dimensions[dim].values[value] = [];
                }
                dimensions[dim].values[value].push(document[dim]);
            });
        }
    }

    // 假设绘制函数简单处理数据并触发视图更新
    function draw() {
        console.log("Drawing or updating the visualization");
        // 具体绘制逻辑会根据 dimensions 的内容动态生成可视化组件
    }

    // String.prototype.capitalize 用于美化输出
    String.prototype.capitalize = function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    }
}());
