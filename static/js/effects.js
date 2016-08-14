$(document).ready(function(){
	$("#crest").animate({
		opacity:1,
		marginTop:"+=20"
	},1500);
	$("#title-h1").delay(600).animate({
			opacity:1,
			marginLeft:"+=25"
	},1500);
	$("#title-h2").delay(600).animate({
			opacity:1,
			marginRight:"+=20"
	},1500);
	$('#arrow1r').delay(500).animate({
		opacity:.3
	})

	$('img#arrow1r').click(function(e){
		e.preventDefault();
		$(document).scrollTo($('#about'),500)
	})
	$('img#arrow2l').click(function(e){
		e.preventDefault();
		$(document).scrollTo($('#index'),500)
	})
	$('img#arrow2r').click(function(e){
		e.preventDefault();
		$(document).scrollTo($('#rush'),500)
	})
	$('img#arrow3l').click(function(e){
		e.preventDefault();
		$(document).scrollTo($('#about'),500)
	})
	$('img#arrow3r').click(function(e){
		e.preventDefault();
		$(document).scrollTo($('#contact'),500)
	})
	$('img#arrow4l').click(function(e){
		e.preventDefault();
		$(document).scrollTo($('#rush'),500)
	})


	$(function(){
		var state=true;
		$('.box .learnmore').hover(function(){
			if (state) {
				$(this).animate({
					backgroundColor:'rgba(255,255,255,.3)',
				},100)
			} else {
				$(this).animate({
					backgroundColor:'rgba(255,255,255,0)',
				},100)
			}
			state = !state;
		})
	})


});


