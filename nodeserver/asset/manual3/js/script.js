$(function(){
    var mySwiper = new Swiper('.swiper-container',{
        paginationClickable: true,
        slidesPerView: 1, 
        direction: 'vertical',
        onTouchEnd:function(){
        	$('.arrow').css('display', 'block');
        },
        onReachEnd: function(){
     			 $('.arrow').css('display', 'none');
    		}
    })
})