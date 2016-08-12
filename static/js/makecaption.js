
$(document).ready(function(){
	$(function() {
        device = (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase()));
        if(!device) {
    		$('div#brother').makeCaption({
    		animation: 'fadeIn', // move, slide, fadeIn, scaleIn, rotate, or push
    		position: 'Below' // Below or Above
    		});
        } else {
            $('div#brother .caption').hide()
        }
	});
});
