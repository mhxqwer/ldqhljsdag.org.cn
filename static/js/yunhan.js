var YH = {
    isDebug: true,
    /**
     * 
     * @param {string}      url         地址，不可为空
     * @param {string}      type        "GET"或"POST"，可不传，默认为"GET"
     * @param {object}      data        传递的参数，可不传，默认为{}
     * @param {function}    success     成功回调函数，可不传，方法参数为(data)，内容为服务器返回原始值的data.data
     * @param {function}    error       错误回调函数，可不传，方法参数为(textStatus, errorThrown)，分别为状态码和异常信息
     * @param {string}      dataType    返回结果数据类型，可不传，默认为"json"
     */
    ajax: function(url, type, data, success, error, dataType) {
        var that = this;
        if (url) {
            $.ajax(url, {
                cache: false,
                data: data || {},
                dataType: dataType || "json",
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    if (that.isDebug) {
                        throw new Error("调用返回错误，代码：" + textStatus + "，信息：" + errorThrown);
                    }
                    if (error) {
                        error(textStatus, errorThrown);
                    }
                },
                success: function(data, textStatus, jqXHR) {
                    if (data.code === 1) {
                        if (success) {
                            success(data.data);
                        }
                    } else {
                        if (that.isDebug) {
                            throw new Error("调用返回错误，代码：500，信息：" + data.msg);
                        }
                        if (error) {
                            error(500, data.msg);
                        }
                    }
                },
                timeout: 60000,
                type: type || "GET"
            });
        } else {
            if (that.isDebug) {
                throw new Error("url不可为空");
            }
        }
    },
    createPageMod: function(div, nowPage, count, total, goFunc, goFuncMobile) {
        var that = this;

        var pages = Math.ceil(total / count);
        nowPage = Math.max(Math.min(pages, nowPage), 1);

        var btns = []; // 需要展示的页码按键
        btns[1] = true;
        btns[pages] = true;
        btns[nowPage] = true;
        var checkNum = function(num) {
            if (num >= 1 && num <= pages) {
                btns[num] = true;
            }
        };
        checkNum(nowPage + 1);
        checkNum(nowPage + 2);
        checkNum(nowPage - 1);
        checkNum(nowPage - 2);
        if (nowPage > 4) {
            btns[2] = ".";
        }
        if (nowPage < pages - 3) {
            btns[pages - 1] = "."
        }
        if (nowPage > 1) {
            btns[0] = true;
        }
        if (nowPage < pages) {
            btns[pages + 1] = true;
        }
        
        var ul = $('<ul class="page-box p-show clear"></ul>');
        div.empty().append(ul);
        var getGoPage = function(num) {
            if (num === 0) {
                return nowPage - 1;
            } else if (num === pages + 1) {
                return nowPage + 1;
            } else {
                return num;
            }
        };
        var getBtnText = function(num) {
            if (num === 0) {
                return "";
            } else if (num === pages + 1) {
                return ""
            } else {
                return num;
            }
        };
        var newPage = nowPage;
        // 调用方的回调函数goFunc再被调用结束后，应主动再次回调refreshCallback，以刷新分页控件
        // 如果在刷新前总数发生变化（如文件有新增或删除），在回调时应传入新的总数
        var refreshCallback = function(newTotal) {
            newTotal = newTotal || total;
            YH.createPageMod(div, newPage, count, newTotal, goFunc, goFuncMobile);
        };
        var goPage = function(isMobile) {
            newPage = Math.max(Math.min(pages, newPage), 1);
            if (nowPage !== newPage) {
                if (that.isDebug) {
                    console.log("跳转页码：" + newPage);
                }
                if (isMobile) {
                    goFuncMobile(newPage, refreshCallback);
                } else {
                    goFunc(newPage, refreshCallback);
                }
            }
        };
        for(var i=0; i<pages+2; i++) {
            var btn = btns[i];
            if (btn) {
                if (btn === ".") {
                    ul.append('<li class="page-item"></li>');
                } else {
                    var a = $(
                        '<a href="javascript:void(0)" class="link-box" data-thispage="' + getGoPage(i) + '">' +
                            '<div class="d1"></div><div class="d2"></div><div class="c"><div class="t">' + getBtnText(i) + '</div></div>' +
                        '</a>'
                    );
                    var li = $('<li class="page-item"></li>');
                    ul.append(li)
                    li.append(a);
                    if (i === nowPage) {
                        a.addClass("cur");
                    }
                    a.click(function() {
                        newPage = parseInt($(this).data("thispage"));
                        goPage();
                    });
                }
            }
        }

        ul.append(
            '<li class="page-item jump">' +
                '<a class="link-box">' +
                    '<div class="d1"></div>' +
                    '<div class="d2"></div>' +
                    '<div class="c">' +
                        '<div class="t">' +
                            '<div class="page-input">' +
                                '<input type="text" id="text_se1">' +
                            '</div>' +
                            '<button type="button" class="page-btn" id="btn_new">GO</button>' +
                        '</div>' +
                    '</div>' +
                '</a>' +
            '</li>'
        );
        var text_se1 = ul.find("#text_se1");
        var btn_new = ul.find("#btn_new");
        text_se1.keyup(function(e) {
            if (e.keyCode == 13) {
                btn_new.click();
                return false;
            }
        });
        btn_new.click(function () {
            newPage = text_se1.val();
            if (newPage !== '') {
                newPage = parseInt(newPage);
                newPage = isNaN(newPage) ? 1 : newPage;
                goPage();
            }
        });
        
        // 移动设备的加载更多按钮
        var loadMore = $(
            '<a href="javascript:void(0)" id="more_id" class="page-more m-show link-box">' +
                '<div class="d1"></div>' +
                '<div class="d2"></div>' +
                '<div class="c">' +
                    '<div class="t">查看更多</div>' +
                '</div>' +
            '</a>'
        );
        div.append(loadMore);
        loadMore.click(function() {
            newPage = nowPage + 1;
            goPage(true);
        });
    }
}