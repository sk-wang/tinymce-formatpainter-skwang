/**
 * A free formatpainter plugin for tinymce
 * @author:sk-wang
 * @page:https://github.com/sk-wang
 * @email:skvdhsh@gmail.com
 */
tinymce.PluginManager.add("formatpainter", function (editor, url) {
    var pluginName='格式刷(Beta)';
    var currentBlockStyle = "";
    var currentNodeStyle = "";
    var currentStrong = false;
    var currentEm = false;
    var toggleState = false;
    var strip_tags = function (string) {
        return string.replace(/(<([^>]+)>)/gi, "");
    }
    editor.ui.registry.addIcon('brushes', '<svg t="1614665382680" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1129" width="19" height="19"><path d="M960 448H512v192h32v320a64 64 0 1 1-128 0V640h32v-192a64 64 0 0 1 64-64h448V192h-64V128h64a64 64 0 0 1 64 64v192a64 64 0 0 1-64 64zM64 192H32a32 32 0 1 1 0-64h32V0h832v320H64V192z m64 64h704V64H128v192z" p-id="1130"></path></svg>');
    function _onAction() {
        var dom = editor.dom;
        //这里主要为了获取样式
        if(toggleState === false) {
            var currentContainer = editor.selection.getRng().startContainer;
            currentBlockStyle = "";
            currentNodeStyle = "";
            currentStrong = false;
            currentEm = false;
            while(true) {
                currentContainer = currentContainer.parentNode
                if ("P" === currentContainer.nodeName) {
                    currentBlockStyle = dom.getAttrib(currentContainer, 'style');
                    break;
                }
                if ("SPAN" === currentContainer.nodeName) {
                    currentNodeStyle = dom.getAttrib(currentContainer, 'style');
                }
                if ("EM" === currentContainer.nodeName) {
                    currentEm = true;
                }
                if ("STRONG" === currentContainer.nodeName) {
                    currentStrong = true;
                }
            }
        }
        toggleState = !toggleState;
    }
    // Define the Toolbar button
    editor.ui.registry.addButton('formatpainter', {
        icon: 'brushes',
        onAction: _onAction
    });
    editor.ui.registry.addToggleButton('formatpainter', {
        icon: 'brushes',
        tooltip: pluginName,
        onAction: _onAction,
        onSetup: function (api) {
            var selectionchange = function () {
                console.log(currentBlockStyle,currentNodeStyle,currentEm,currentStrong)
                console.log(editor.selection.getRng());
                var range = editor.selection.getRng();
                var setStyle = function (text) {
                    //粗体
                    if (currentStrong) {
                        text = "<strong>" + text + "</stong>"
                    }
                    //斜体
                    if (currentEm) {
                        text = "<em>" + text + "</em>"
                    }
                    if (currentNodeStyle) {
                        text = "<span style='" + currentNodeStyle + "'>" + text + "</span>"
                    }
                    return text
                }
                if(toggleState === true) {
                    //应用样式到选中的range中
                    var blocks = editor.selection.getSelectedBlocks()
                    for (var i = 0 ; i < blocks.length ; i++) {
                        //先应用段落的样式
                        editor.dom.setAttrib(blocks[i], "style", currentBlockStyle);
                        //如果是第一个
                        if(0 === i) {
                            //如果同一个container
                            if(range.startContainer === range.endContainer) {
                                var text = editor.selection.getContent({format:"text"})
                                editor.selection.setContent(setStyle(text));
                            } else {
                                //否则构造一个select让其选中当前block的最后一个
                                var currentRange = range.cloneRange();
                                var lastNode = range.startContainer;
                                while (true) {
                                    var nextNode = editor.dom.getNext(lastNode,function (node) { return true });
                                    console.log(nextNode)
                                    if(editor.dom.isChildOf(nextNode,blocks[i])) {
                                        lastNode = nextNode;
                                    } else {
                                        break;
                                    }
                                }
                                currentRange.setEnd(lastNode,lastNode.length);
                                console.log(currentRange);
                                editor.selection.setRng(currentRange)
                                var text = editor.selection.getContent({format:"text"})
                                editor.selection.setContent(setStyle(text));
                                //把范围设置回去
                                editor.selection.setRng(range)
                            }
                        } else if (blocks.length - 1 === i && blocks.length > 1) {
                            //否则构造一个select让其选中当前block的最开始那个
                            var currentRange = range.cloneRange();
                            var startNode = range.endContainer;
                            while (true) {
                                var prevNode = editor.dom.getPrev(startNode,function (node) { return true });
                                if(editor.dom.isChildOf(prevNode,blocks[i])) {
                                    startNode = prevNode;
                                } else {
                                    break;
                                }
                            }
                            currentRange.setStart(startNode,0);
                            editor.selection.setRng(currentRange)
                            var text = editor.selection.getContent({format:"text"})
                            editor.selection.setContent(setStyle(text));
                            //把范围设置回去
                            editor.selection.setRng(range)
                        } else {
                            //如果是夹在中间的则所有文字应用样式
                            var text = strip_tags(blocks[i].innerHTML);
                            blocks[i].innerHTML = setStyle(text);
                            //如果已经有span标签了
                            //如果是最后一个,且不是只选中了一个
                        }
                    }
                    toggleState = false;
                    currentBlockStyle = "";
                    currentNodeStyle = "";
                    currentStrong = false;
                    currentEm = false;
                }
            };
            api.setActive(toggleState);
            editor.on("mouseup",selectionchange);
            return function() {
                editor.off("mouseup",selectionchange);
            };
        }
    });
    // Return details to be displayed in TinyMCE's "Help" plugin, if you use it
    // This is optional.
    return {
        getMetadata: function () {
            return {
                name: "formatpainter",
            };
        }
    };
});
