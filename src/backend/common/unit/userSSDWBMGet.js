       
  module.exports = {     
       getUserMixValue:function(userLevel){
           var levelmaxvalue=0;
             switch(userLevel){
            case "1": levelmaxvalue = 3377699720527872;
            break;
            case "2": levelmaxvalue = 4499201580859392;
            break;
            case "3": levelmaxvalue = 4503582447501312;
            break;
            case "4": levelmaxvalue = 4503599560261632;
            break;
            case "5": levelmaxvalue = 4503599626846208;
            break;
            case "6": levelmaxvalue = 4503599627366400;
            break;
            case "7": levelmaxvalue = 4503599627370432;
            break;
            case "8": levelmaxvalue = 4503599627370495;
            break;
        }
        return levelmaxvalue;
       }  
    }