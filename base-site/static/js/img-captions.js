(function($) {

    $.fn.makeCaption = function(options) {

        var animationType = {
            moveBelow: {
                on: "moveUpStart",
                off: "moveUpEnd",
                finish: "finalStateMoveUp",
                basic: "basicStateMoveUp"
            },

            moveAbove: {
                on: "moveDownStart",
                off: "moveDownEnd",
                finish: "finalStateMoveDown",
                basic: "basicStateMoveDown"
            },

            fadeInBelow: {
                on: "fadeInStart",
                off: "fadeInEnd",
                finish: "finalStateFadeIn",
                basic: "basicStateFadeInBelow",
            },

            fadeInAbove: {
                on: "fadeInStart",
                off: "fadeInEnd",
                finish: "finalStateFadeIn",
                basic: "basicStateFadeInAbove",
            },

            scaleInAbove: {
                on: "scaleInStart",
                off: "scaleInEnd",
                finish: "finalStateScaleIn",
                basic: "basicStateScaleInAbove",
            },

            scaleInBelow: {
                on: "scaleInStart",
                off: "scaleInEnd",
                finish: "finalStateScaleIn",
                basic: "basicStateScaleInBelow",
            },

            rotateAbove: {
                on: "rotateStart",
                off: "rotateEnd",
                finish: "finalStateRotate",
                basic: "basicStateRotateAbove",
            },

            rotateBelow: {
                on: "rotateStart",
                off: "rotateEnd",
                finish: "finalStateRotate",
                basic: "basicStateRotateBelow",
            },

            pushBelow: {
                on: "pushStart",
                off: "pushEnd",
                finish: "finalStatePush",
                basic: "basicStatePushBelow",
                imageBasic: "basicPushImageBelow",
                imageOn: "pushImageStart",
                imageOff: "pushImageEnd",
                imageFinish: "pushImageFinish",
            },

            pushAbove: {
                on: "pushStart",
                off: "pushEnd",
                finish: "finalStatePush",
                basic: "basicStatePushAbove",
                imageBasic: "basicPushImageAbove",
                imageOn: "pushImageStart",
                imageOff: "pushImageEnd",
                imageFinish: "pushImageFinish",
            }
        }

        var ANIMATION_END_EVENTS = 'webkitAnimationEnd oanimationend msAnimationEnd animationend';

        var settings = $.extend({
            animation: "move",
            position: "Below"
        }, options);

        var animationName = settings.animation + settings.position;

        return this.each(function() {

            var caption = $(this).find('div.caption');
            var image = $(this).find('img');

            // Hide the caption
            caption.addClass(animationType[animationName].basic);
            caption.hide();

            if (animationType[animationName].imageBasic != undefined) {
                image.addClass(animationType[animationName].imageBasic);
            }

            $(this)
                .mouseenter(function() {
                    // On Mouse over show the caption
                    caption.show();
                    caption.addClass(animationType[animationName].on);

                    caption.one(ANIMATION_END_EVENTS, function() {
                        caption.removeClass(animationType[animationName].on);
                        caption.addClass(animationType[animationName].finish);
                    });

                    if (animationType[animationName].imageOn != undefined) {
                        image.addClass(animationType[animationName].imageOn);

                        image.one(ANIMATION_END_EVENTS, function() {
                            image.removeClass(animationType[animationName].imageOn);

                            if (animationType[animationName].imageFinish != undefined)
                                image.addClass(animationType[animationName].imageFinish);
                        });
                    }
                })
                .mouseleave(function() {
                    // On Mouse out show the caption
                    caption.removeClass(animationType[animationName].finish);
                    caption.addClass(animationType[animationName].off);

                    caption.one(ANIMATION_END_EVENTS, function() {
                        caption.hide();
                        caption.removeClass(animationType[animationName].off);
                    });

                    if (animationType[animationName].imageOff != undefined) {
                        image.addClass(animationType[animationName].imageOff);

                        image.one(ANIMATION_END_EVENTS, function() {
                            image.removeClass(animationType[animationName].imageOff);

                            if (animationType[animationName].imageFinish != undefined)
                                image.removeClass(animationType[animationName].imageFinish);
                        });
                    }
                });
        });
    };

}(jQuery));
