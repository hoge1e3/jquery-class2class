/*
  jquery-class2class
 Copyright hoge1e3 all rights reseved.
 Licensed under the MIT license.
*/

/**
 * <Function>.bindCSS  
 *   Bind this Function(as Javascript-class) into a CSS-class
 *   When a JS-class(J) is bounded a CSS-class(C):
 *    - A new instance of J is created when Class2class.get(element), where the element's CSS-class is C.
 *      constructor is called with one argument, the jquery object of the element.
 *      the field "jq" stores the jquery object, after the constructer is called.
 *    - Helper methods are added. See below for details
 *    - Accesor methods are added. There method are shortcut to access subParts
 *      "subParts" are elements which are contained in <tag class=cssName> ... </tag>
 *      They should have CSS-class names staring with "cssName-", following their own names.
 *       ex. When CSS-class name is "foo" and subParts' names are "bar" and "baz",
 *           CSS-class names of the subParts should be "foo-bar" and "foo-baz".
 *           The Javascrit-class will have accessor bar() and baz(), 
 *           which gets the subparts having CSS-class of "foo-bar" and "foo-baz" respectively.
 *    - Event handlers of C are added, if J defines methods with name onXXXX, XXXX is an event type.
 *    - Event handlers of subParts are added, if J defines methods with name onYYYYXXXX,
 *       YYYY is subPart's name. XXXX is an event type (any cases are accepted)
 *                     
 * @param {String} cssName   the CSS-class name to which bounded to this class
 * @param {String} subParts  the comma-separated names which indicates subParts' name
 */
Function.prototype.bindCSS=function (cssName, subParts) {
   var obj=Class2class.get;
   var klass=this;
   klass.cssBounded=true;
   if (cssName==null && klass.prototype.cssName) cssName=klass.prototype.cssName();
   if (cssName==null) throw "cssName is null!";
   if (klass.prototype.cssName==null) klass.prototype.cssName=function (){return cssName;};
   if (subParts==null && klass.prototype.subPartsNames) subParts=klass.prototype.subPartsNames();
   if (typeof subParts=="string") subParts=subParts.split(/,/);
   if (subParts==null) {      
      subParts=[];
   }
   Class2class.boundedCSS[cssName]=this;   
   for (var k in this.prototype) {
      if (k.match(/^on/)) {
         parseEventHandler(RegExp.rightContext);
      }
   }
   function parseEventHandler(k) {
     var max=0,subPartName;
      for (var i=0 ; i<subParts.length ; i++) {
           var l=subParts[i].length;
         if (l>max && startsWith(k,subParts[i])){
             max=l;
            subPartName=subParts[i];
         }          
      }  
      var methodName="on"+k;
      if (subPartName) {
          // Handler of subpart
        var type=k.substring(max);
        type=type.toLowerCase();
        //alert("Handler of "+subPartName+" - "+type+" "+methodName);
        $("."+cssName+"-"+subPartName).live(type,function () {
            var t=klass.closestFrom(this);
            t[methodName].apply(t,arguments);
        });
      } else {
          // Handler of this object itself
        var type=k;
        type=type.toLowerCase();
        //alert("Handler of this object - "+type);
        $("."+cssName).live(type,function () {
           var t=obj(this);
           t[methodName].apply(t,arguments);
        });
      }
   }
   function startsWith(str, head) {
         return str.substring(0,head.length).toLowerCase()==head.toLowerCase();
   }
   // subParts accessor methods
   for (var i in subParts) {
       (function(p){
               klass.prototype[p] = function(f){
                   return this.jq.find("."+cssName+"-"+p);
               };
       })(subParts[i]);
   }
   // helper methods
   /**
    * closestFrom is a class method which find the object of this class bounded to the closest parent element from f.
    * @param {Object} f
    */
   klass.closestFrom=function (f) {
      if (!f.closest) f=$(f);
      return obj(f.closest("."+cssName));
   };
   /**
    * findFrom is a class method which find the object of this class bounded to the closest child element from f.
    * @param {Object} f
    */
   klass.findFrom=function (f) {
      if (!f.find) f=$(f);
      return obj(f.find("."+cssName));
   };
   /**
    * find is a instance method shortcuts jq.find(n), when n is a CSS-bounded class, returns object of class n, bounded to the found element
    * @param {Object} n
    */
   klass.prototype.find=function (n) {
      if (n.cssBounded) return n.findFrom(this.jq);
      return this.jq.find(n);
   };
   /**
    * closest is a instance method shortcuts jq.closest(n), when n is a CSS-bounded class, returns object of class n, bounded to the found element
    * @param {Object} n
    */
   klass.prototype.closest=function (n) {
      if (n.cssBounded) return n.closestFrom(this.jq);
      return this.jq.closest(n);
   };

};
Class2class={};
Class2class.boundedCSS={};
Class2class.get=function (jq) {
     jq=$(jq);
     if (jq[0]==null) return null;
     var res=$.data(jq[0],"obj");
     if (res) return res;
     (function () {
        var k=Class2class.boundedCSS[jq.attr("class")];
        if (typeof k=="function") res=new k(jq);
        res.jq=jq;
     })();
     if (res) $.data(jq[0],"obj",res);
     return res;
};
