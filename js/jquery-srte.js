/*
* jQuery SRTE plugin 0.5.2 - create a simple rich text form for Mozilla, Opera, Safari and Internet Explorer
*
* Copyright (c) 2013
* Distributed under the GPL Licenses.
* Distributed under the MIT License.
*/


// define the srte light plugin
'use strict';
;(function($,window, document, undefined) {

    $.fn.srte = function(options){

    // build main options before element iteration
    var options = $.extend({},$.fn.srte.options, options);

    // iterate and construct the SRTEs
    return this.each( function() {
        var textarea = $(this);
        var iframe;
        var element_id = textarea.attr("id");

        // enable design mode
        function enableDesignMode() {

            var content = textarea.val();

            // Mozilla needs this to display caret
            if($.trim(content)=='') {
                content = '<br />';
            }

            // already created? show/hide
            if(iframe) {
                textarea.hide();
                $(iframe).contents().find("body").html(content);
                $(iframe).show();
                $("#toolbar-" + element_id).remove();
                textarea.before(toolbar());
                return true;
            }

            // for compatibility reasons, need to be created this way
            iframe = document.createElement("iframe");
            iframe.frameBorder=0;
            iframe.frameMargin=0;
            iframe.framePadding=0;
            iframe.height=options.iframe_height;
            if(textarea.attr('class'))
                iframe.className = textarea.attr('class');
            if(textarea.attr('name'))
                iframe.title = textarea.attr('name');

            textarea.after(iframe);

            var css = "";
            if(options.content_css_url) {
                css = "<link type='text/css' rel='stylesheet' href='" + options.content_css_url + "' />";
            }

            var doc = "<html><head>"+css+"</head><body class='frameBody'>"+content+"</body></html>";
            tryEnableDesignMode(doc, function() {
                $("#toolbar-" + element_id).remove();
                textarea.before(toolbar());
                // hide textarea
                textarea.hide();

            });

        }

        function tryEnableDesignMode(doc, callback) {
            if(!iframe) { return false; }

            try {
                iframe.contentWindow.document.open();
                iframe.contentWindow.document.write(doc);
                iframe.contentWindow.document.close();
            } catch(error) {
                //console.log(error);
            }
            if (document.contentEditable) {
                iframe.contentWindow.document.designMode = "On";
                callback();
                return true;
            }
            else if (document.designMode != null) {
                try {
                    iframe.contentWindow.document.designMode = "on";
                    callback();
                    return true;
                } catch (error) {
                    //console.log(error);
                }
            }
            setTimeout(function(){tryEnableDesignMode(doc, callback)}, 500);
            return false;
        }

        function disableDesignMode(submit) {
            var content = $(iframe).contents().find("body").html();

            if($(iframe).is(":visible")) {
                textarea.val(content);
            }

            if(submit !== true) {
                textarea.show();
                $(iframe).hide();
            }
        }

        // create toolbar and bind events to it's elements
        function toolbar() {
            var tb = $("<div class='srte-toolbar' id='toolbar-"+ element_id +"'><div>\
                <p>\
                    <select>\
                        <option value=''>Block style</option>\
                        <option value='p'>Paragraph</option>\
                        <option value='h3'>Title</option>\
                        <option value='address'>Address</option>\
                    </select>\
                </p>\
                <p>\
                    <a href='#' class='bold'><img src='"+options.media_url+"bold.gif' alt='bold' /></a>\
                    <a href='#' class='italic'><img src='"+options.media_url+"italic.gif' alt='italic' /></a>\
                </p>\
                <p>\
                    <a href='#' class='unorderedlist'><img src='"+options.media_url+"unordered.gif' alt='unordered list' /></a>\
                    <a href='#' class='link'><img src='"+options.media_url+"link.png' alt='link' /></a>\
                    <a href='#' class='image'><img src='"+options.media_url+"image.png' alt='image' /></a>\
                    <a href='#' class='disable'><img src='"+options.media_url+"close.gif' alt='close rte' /></a>\
                </p></div></div>");

            $('select', tb).change(function(){
                var index = this.selectedIndex;
                if( index!=0 ) {
                    var selected = this.options[index].value;
                    formatText("formatblock", '<'+selected+'>');
                }
            });
            $('.bold', tb).click(function(){ formatText('bold');return false; });
            $('.italic', tb).click(function(){ formatText('italic');return false; });
            $('.unorderedlist', tb).click(function(){ formatText('insertunorderedlist');return false; });
            $('.link', tb).click(function(){
                var p=prompt("URL:");
                if(p)
                    formatText('CreateLink', p);
                return false; });

            $('.image', tb).click(function(){
                var p=prompt("image URL:");
                if(p)
                    formatText('InsertImage', p);
                return false; });

            $('.disable', tb).click(function() {
                disableDesignMode();
                var edm = $('<a class="srte-edm" href="#">Enable design mode</a>');
                tb.empty().append(edm);
                edm.click(function(e){
                    e.preventDefault();
                    enableDesignMode();
                    // remove, for good measure
                    $(this).remove();
                });
                return false;
            });

            $(iframe).parents('form').submit(function(){
                disableDesignMode(true);
            });

            var iframeDoc = $(iframe.contentWindow.document);

            var select = $('select', tb)[0];
            iframeDoc.mouseup(function(){
                setSelectedType(getSelectionElement(), select);
                return true;
            });

            iframeDoc.keyup(function() {
                setSelectedType(getSelectionElement(), select);
                var body = $('body', iframeDoc);
                if(body.scrollTop() > 0) {
                    var iframe_height = parseInt(iframe.style['height'])
                    if(isNaN(iframe_height))
                        iframe_height = 0;
                    var h = Math.min(options.max_height, iframe_height+body.scrollTop()) + 'px';
                    iframe.style['height'] = h;
                }
                return true;
            });

            return tb;
        };

        function formatText(command, option) {
            iframe.contentWindow.focus();
            try{
                iframe.contentWindow.document.execCommand(command, false, option);
            }catch(e){
                //console.log(e)
            }
            iframe.contentWindow.focus();
        };

        function setSelectedType(node, select) {
            while(node.parentNode) {
                var nName = node.nodeName.toLowerCase();
                for(var i=0;i<select.options.length;i++) {
                    if(nName==select.options[i].value){
                        select.selectedIndex=i;
                        return true;
                    }
                }
                node = node.parentNode;
            }
            select.selectedIndex=0;
            return true;
        };

        function getSelectionElement() {
            if (iframe.contentWindow.document.selection) {
                // IE selections
                selection = iframe.contentWindow.document.selection;
                range = selection.createRange();
                try {
                    node = range.parentElement();
                }
                catch (e) {
                    return false;
                }
            } else {
                // Mozilla selections
                try {
                    selection = iframe.contentWindow.getSelection();
                    range = selection.getRangeAt(0);
                }
                catch(e){
                    return false;
                }
                node = range.commonAncestorContainer;
            }
            return node;
        };
        
        // enable design mode now
        enableDesignMode();

    }); //return this.each    
    
    }; // rte

    // defautl options
    $.fn.srte.options = {
        media_url: "images/",
        content_css_url: "rte.css",        
        max_height: 350,
        iframe_height : 150
    }

})(jQuery,window, document);