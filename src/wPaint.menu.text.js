// setup menu
$.fn.wPaint.menus.text = {
  img: '/img/icons-menu-text.png',
  items: {
    bold: {title:'Bold', icon:'toggle', index:0, callback:function(toggle){ this.setFontBold(toggle); }},
    italic: {title:'Italic', icon:'toggle', index:1, callback:function(toggle){ this.setFontItalic(toggle); }},
    underline: {title:'Undelrine', icon:'toggle', index:2, callback:function(toggle){ this.setFontUnderline(toggle); }},
    fontSize: {title:'Font Size', icon:'select', value:12, range:[8,9,10,12,14,16,20,24,30], callback:function(size){ this.setFontSize(size); }},
    fontFamily: {title:'Font Family', icon:'select', useRange:true, value:'Arial', range:['Arial', 'Courier', 'Times', 'Verdana'], callback:function(family){ this.setFontFamily(family); }}
  }
};

// add icon to main menu
$.fn.wPaint.menus.main.items.text = {title:'Text', icon:'menu', after:'pencil', index:7, callback:function(){ this.setMode('text'); }};

// extend defaults
$.extend($.fn.wPaint.defaults, {
  fontSize       : '12',        // current font size for text input
  fontFamily     : 'Arial',       // active font family for text input
  fontBold       : false,       // text input bold enable/disable
  fontItalic     : false,       // text input italic enable/disable
  fontUnderline  : false       // text input italic enable/disable
});

// extend functions
$.fn.wPaint.extend({
  generate: function() {
    this.$textCalc = $('<div></div>').hide();
    this.$textInput = $('<textarea class="_wPaint_textInput" spellcheck="false"></textarea>')
    .mousedown(this._stopPropagation) // make sure clicking on the textInput doesn't trigger another textInput
    .css({position:'absolute'})
    .hide();
    
    $('body').append(this.$textCalc);
    this.$el.append(this.$textInput);

    this.menus.all.text = this._createMenu('text');
  },

  _init: function() {
    var _this = this;

    // in case we click on another element while typing - just auto set the text
    for (var i in this.menus.all) {
      this.menus.all[i].$menu
      .click(inputClick)
      .mousedown(this._stopPropagation);
    }

    // same idea here for clicking outside of the canvas area
    $(document).mousedown(inputClick);

    function inputClick() {
      _this._drawTextIfNotEmpty();
      _this.$textInput.hide();
      _this.$canvasTemp.hide();
    };
  },

  /****************************************
   * setters
   ****************************************/
  setFillStyle: function(fillStyle) {
    this.$textInput.css('color', fillStyle);
  },

  setFontSize: function(size) {
    this.options.fontSize = parseInt(size, 10);
    this._setFont({fontSize:size+'px', lineHeight:size+'px'});
    this.menus.all.text._setSelectValue('fontSize', size);
  },

  setFontFamily: function(family) {
    this.options.fontFamily = family;
    this._setFont({fontFamily:family});
    this.menus.all.text._setSelectValue('fontFamily', family);
  },

  setFontBold: function(bold) {
    this.options.fontBold = bold;
    this._setFont({fontWeight:(bold ? 'bold' :'')});
  },

  setFontItalic: function(italic) {
    this.options.fontItalic = italic;
    this._setFont({fontStyle:(italic ? 'italic' :'')});
  },

  setFontUnderline: function(underline) {
    this.options.fontUnderline = underline;
    this._setFont({fontWeight:(underline ? 'underline' :'')});
  },

  _setFont: function(css) {
    this.$textInput.css(css);
    this.$textCalc.css(css);
  },

  /****************************************
   * Text
   ****************************************/
  _drawTextDown: function(e) {
    this._drawTextIfNotEmpty();
    this._drawShapeDown(e, 1);

    this.$textInput
    .css({left:e.pageX-1, top:e.pageY-1, width:0, height:0})
    .show().focus();
  },
  
  _drawTextMove: function(e) {
    this._drawShapeMove(e, 1);

    this.$textInput.css({left:e.left-1, top:e.top-1, width:e.width, height:e.height});
  },

  _drawTextIfNotEmpty: function() {
    if (this.$textInput.val() !== '') { this._drawText(); }
  },

  // just draw text - don't want to trigger up here since we are just copying text from input box here
  _drawText: function() {
    var fontString = '',
        lines = this.$textInput.val().split('\n'),
        linesNew = [],
        textInputWidth = this.$textInput.width() - 2,
        width = 0,
        lastj = 0,
        offset = this.$textInput.position(),
        left = offset.left+1,
        top = offset.top+1,
        underlineOffset = 0;

    if (this.options.fontItalic) { fontString += 'italic '; }
    //if(this.settings.fontUnderline) { fontString += 'underline '; }
    if (this.options.fontBold) { fontString += 'bold '; }
    
    fontString += this.options.fontSize + 'px ' + this.options.fontFamily;
    
    for (var i=0, ii=lines.length; i<ii; i++) {
      this.$textCalc.html('');
      lastj = 0;
      
      for (var j=0, jj=lines[0].length; j<jj; j++) {
        width = this.$textCalc.append(lines[i][j]).width();
        
        if (width > textInputWidth) {
          linesNew.push(lines[i].substring(lastj,j));
          lastj = j;
          this.$textCalc.html(lines[i][j]);
        }
      }
      
      if (lastj != j) linesNew.push(lines[i].substring(lastj,j));
    }
    
    lines = this.$textInput.val(linesNew.join('\n')).val().split('\n');

    for (var i=0, ii=lines.length; i<ii; i++) {
      this.ctx.fillStyle = this.options.fillStyle;
      this.ctx.textBaseline = 'top';
      this.ctx.font = fontString;
      this.ctx.fillText(lines[i], left, top);
      
      top += this.options.fontSize;
      
      /*if(lines[i] !== '' && this.options.fontTypeUnderline) {
        width = this.$textCalc.html(lines[i]).width();
        
        //manually set pixels for underline since to avoid antialiasing 1px issue, and lack of support for underline in canvas
        var imgData = this.ctx.getImageData(0, top+underlineOffset, width, 1);
        
        for (j=0; j<imgData.width*imgData.height*4; j+=4) {
          imgData.data[j] = parseInt(this.options.fillStyle.substring(1,3), 16);
          imgData.data[j+1] = parseInt(this.options.fillStyle.substring(3,5), 16);
          imgData.data[j+2] = parseInt(this.options.fillStyle.substring(5,7), 16);
          imgData.data[j+3] = 255;
        }
        
        this.ctx.putImageData(imgData, left, top+underlineOffset);
      }*/
    }

    this.$textInput.val('');
    this._addUndo();
  }
});