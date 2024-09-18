

(function(){
	//data vars
	var affiliationDim = ['name', 'Affiliation at the time of award'];
	var dimensionsArray = ['Title','Publication Year','Publication Venue', 'Paired Device', 'Role', 'Context'];
	var dimensions = {};
	var documents;

	//d3 vars
	var elasticList,
		xAxis,
		x,
		margin,
		cols,
		tooltip,
		header_height = 25,
		dimensionHeaderHeight = 40;

	//
	var trimmerAt = 35,
		heightEmpty = "4px",
		sortValues = false;

	tooltip = d3.select("#mytooltip")
        .style("visibility", "hidden")
        .style("background-color", "#333333");

	//populate main object to hold all data
	dimensionsArray.forEach(function(dim)
	{
		dimensions[dim] = {};
		dimensions[dim].values = {};	
		dimensions[dim].filters = {};
		dimensions[dim].filters = d3.set();
	});

	
	var onDataLoaded = function(error, csv) {
		console.log("csv:", csv);
		if (error) throw error;
	
		console.log(csv.length + " documents");
		documents = csv;
	
		if (Array.isArray(documents)) {
			documents.forEach(function(d) {
				d.__filtered__ = true;
	
				dimensionsArray.forEach(function(dim) {
					if (d[dim] != "") {
						var values = d[dim].split('&').map(function(value) { return value.trim(); });
						values.forEach(function(value) {
							if (value in dimensions[dim].values) {
								dimensions[dim].values[value]++;
							} else {
								dimensions[dim].values[value] = 1;
							}
						});
					}
				});
			});
	
			draw();
		} else {
			console.error("Invalid data format. Expected an array.");
		}
	};
	

	var updateFilters = function(dim, item) {
		// 处理 & 分隔的情况，将 item 分割成多个单独的项
		var items = item.split('&').map(function(value) { return value.trim(); });
		items.forEach(function(singleItem) {
			if (dimensions[dim].filters.has(singleItem)) {
				dimensions[dim].filters.remove(singleItem);
			} else {
				dimensions[dim].filters.add(singleItem);
			}
		});
	
		// 更新筛选状态的显示
		if (!existFilters()) {
			d3.select(".elastic-list-filters").select("p")//.text("No filters applied");
		} else {
			var values = [];
			for (var i = 0; i < dimensionsArray.length; i++) {
				values = values.concat(Array.from(dimensions[dimensionsArray[i]].filters));
			}
			d3.select(".elastic-list-filters").select("p")//.text("Filtering by: " + values.join(', '));
		}
	
		// 调用更新数据显示的函数
		updateData();
	};



	var existFilters = function()
	{
		var exist = false;
		for(var i=0; i<dimensionsArray.length && exist == false; i++)
			exist = exist || !dimensions[dimensionsArray[i]].filters.empty();
		return exist;
	}



	var updateData = function() {
		// 重置所有计数器
		dimensionsArray.forEach(function(dim) {
			d3.keys(dimensions[dim].values).forEach(function(key) {
				dimensions[dim].values[key] = 0;
			});
		});
	
		// 如果没有激活的筛选器，所有文档都视为通过筛选条件
		if (!existFilters()) {
			documents.forEach(function(d) {
				d.__filtered__ = true;
				dimensionsArray.forEach(function(dim) {
					d[dim].split('&').map(function(value) { return value.trim(); }).forEach(function(value) {
						if (value) { // 确保值不为空
							dimensions[dim].values[value] = (dimensions[dim].values[value] || 0) + 1;
						}
					});
				});
			});
		} else {
			// 否则，遍历文档以查看哪些文档通过筛选条件
			documents.forEach(function(d) {
				// 文档通过筛选的初始假设为true
				d.__filtered__ = true;
				dimensionsArray.forEach(function(dim) {
					if (!dimensions[dim].filters.empty()) {
						// 处理可能包含 '&' 的字段
						var fieldValues = d[dim].split('&').map(function(value) { return value.trim(); });
						// 检查分割后的值中至少有一个在筛选集合中
						var filterPass = fieldValues.some(value => dimensions[dim].filters.has(value));
						// 更新文档的筛选状态
						d.__filtered__ = d.__filtered__ && filterPass;
					}
				});
	
				// 如果文档通过了筛选
				if (d.__filtered__) {
					dimensionsArray.forEach(function(dim) {
						d[dim].split('&').forEach(function(value) {
							value = value.trim();
							if (value) { // 确保值不为空
								dimensions[dim].values[value] = (dimensions[dim].values[value] || 0) + 1;
							}
						});
					});
				}
			});
		}
	
		// 重新绘制图表或更新界面
		redraw();
	}




	var draw = function()
	{
		margin = {top: 20, right: 20, bottom: 30, left: 40},
	    	width = 1170 - margin.left - margin.right,
    		height = 400 - margin.top - margin.bottom + dimensionHeaderHeight,
    		value_cell_padding = 1,
    		value_cell_height = 45;
	
		x = d3.scale.ordinal()
			.domain(dimensionsArray)
			.rangeRoundBands([0, width]);

		xAxis = d3.svg.axis()
			.scale(x)
			.orient("bottom");

		elasticList = d3.select("#elastic-list")
			.attr("class", "elastic-list")
			.style("width", width + "px")
		    .style("height", height + "px");

		//dimension headers
		elasticList.append("div")
			.attr("class", "elastic-list-dimension-headers")
			.selectAll(".elastic-list-dimension-header")
			.data(dimensionsArray)
			.enter()
			.append("div")
				.attr("class", "elastic-list-dimension-header")
				.style("width", x.rangeBand() + "px")
				.style("height", dimensionHeaderHeight + "px")
				.text(function(d) { return (d == affiliationDim[0])?	affiliationDim[1].capitalize() : d.capitalize();});

		//header with the active filters
		d3.select("#filtering").append("div")
			.attr("class", "elastic-list-filters")
			.style("height", header_height)
			.append("p")
				//.text("No filters applied");

		d3.select("#results")
			.style("width", width + "px")
			.style("height", 500 + "px");

		redraw();
	}



	var setHeightCell = function(dimNode, d)
	{
		var minValue = dimNode.attributes["__minvalue__"].value;
		return (d.value == 0)? heightEmpty : (value_cell_height + (0*d.value/minValue)) + "px";
	}

	var redraw = function()
	{
		var transitionTime = 1000;
		var getMinValueDimension = function(dimension, i)
		{
			//how to estimate the height of an item:
			//minimum height for an item is 20px, from here take the minimum value from
			//all items data, this value will be the base to calculate the factor to apply to
			//the rest of values to get a new height from the 20px minimum height
			return d3.min(
					d3.values(dimension.value.values).filter(function(value)
					{
						return value >0;
					})
				);
		}
		var getValuesDimension = function(dimension, i)
		{
			if(!sortValues)
				return d3.entries(dimension.value.values);
			else
				return d3.entries(dimension.value.values)
					.sort(function(a, b)
					{
						return (a.value > b.value)?	-1:(a.value < b.value)? 1 : 0;
					})
					.filter(function(obj)
					{
						return obj.key != "";
					});
		}

		//join new data with old elements, if any
		cols = elasticList
			.selectAll(".elastic-list-dimension")
			.data(d3.entries(dimensions));

		cols.attr("__minvalue__", getMinValueDimension);

		//COL UPDATE SELECTION
		cols.selectAll(".elastic-list-dimension-item")
			.data(getValuesDimension)
			.classed("filter", function(d)
				{
					return dimensions[this.parentNode.__data__.key].filters.has(d.key);
				})
			.transition()
			.duration(transitionTime)
				.style("height", function(d)
				{
					return setHeightCell(this.parentNode, d);
				});	


		//COLS ENTER SELECTION, create new elements as needed 
		var items_in_new_cols = cols.enter()
			.append("div")
			.attr("class", "elastic-list-dimension")
			.style("width", x.rangeBand() + "px")
			.style("height", (height - dimensionHeaderHeight) + "px")
			.attr("__minvalue__", getMinValueDimension)
			.selectAll(".elastic-list-dimension-item")
			.data(getValuesDimension);

		items_in_new_cols.enter()
			.append("div")
			.attr("class", "elastic-list-dimension-item")
			.style("height", function(d)
			{
				return setHeightCell(this.parentNode, d);
			})
			.style("width", x.rangeBand() + "px")
			.style("left", 0)
			.on("mouseover", function(d)
			{
				if(d.value == 0)
				{
					tooltip
	                  .html(d.key + ": no matchings")
	                  .style("visibility", "visible");          
				}
				else if(d3.select(this).text().indexOf("...") > -1)
				{
					tooltip
	                  .html(d.key + ": " + d.value)
	                  .style("visibility", "visible");          	
				}              	

				d3.select(this).classed("elastic-list-dimension-item-hover", true);
			})
			.on("mousemove", function(d)
			{
				if(d.value == 0 || d3.select(this).text().indexOf("...") > -1)
					tooltip.style("top", (d3.event.pageY - 20)+"px").style("left",(d3.event.pageX + 5)+"px");  
			})
			.on("mouseout", function(d)
			{
				tooltip.style("visibility", "hidden");
				d3.select(this).classed("elastic-list-dimension-item-hover", false);
			})
			.on("click", function(d)
			{
				tooltip.style("visibility", "hidden");

				//send filter to add and its dimension
				updateFilters(this.parentNode.__data__.key, d.key);

				d3.select(this).classed("elastic-list-dimension-item-hover", false);
				d3.select(this).classed("filter", function(d)
				{
					return dimensions[this.parentNode.__data__.key].filters.has(d.key);
				});
			});			
		
		//update text data for each item
		items = elasticList.selectAll(".elastic-list-dimension-item");
		items.each(function(d, i)
		{	
			//remove all <p>. If this terms has occurrences based on the filter criteria, add <p> again
			d3.select(this).selectAll("p").remove();
			if(d.value >0)
			{
				d3.select(this).append("p")
					.html((d.key.length > trimmerAt)?	d.key.substring(0,trimmerAt) + "...":d.key)
					.style("opacity", 0)
					.attr('class', 'key')
					.transition()
					.duration(transitionTime)
					.delay(200)
					.style("opacity", 1);

				d3.select(this).append("p")
					.html("<b>" + d.value + "</b>")
					.style("opacity", 0)
					.attr('class', 'value')
					.transition()
					.duration(transitionTime)
					.delay(200)
					.style("opacity", 1);		
			}			
		});

		var html = "";
		documents.forEach(function(d)
		{
			if(d.__filtered__ )
				//html += "<p>" + d.Title + " , "  + d.PublicationYear + " , "  + d.PublicationVenue + d.
				html += "<p>" + d.Title 
			//+ " - " + "<b>" + d.value + " " + d.Array + ". </b>" //+ d.category.capitalize() + ", " + d.country + "<span class='price-motivation'> " + d.motivation+ "</span></p>"
		});		
		d3.select("#results").html(html);
		d3.select("#results-count").html("Found " + d3.select("#results").selectAll("p")[0].length);		
	}

	String.prototype.capitalize = function() 
	{
    	return this.charAt(0).toUpperCase() + this.slice(1);
	}

	d3.csv("Tab.csv", onDataLoaded);
}());